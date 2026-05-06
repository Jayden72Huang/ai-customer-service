import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export const maxDuration = 120;

// POST — weekly cron: auto-analyze interactions and generate Q&A for premium sites
// Secured via CRON_SECRET header. Can also be triggered manually from dashboard.
export async function POST(req: NextRequest) {
  // Auth: either CRON_SECRET or session
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Fall back to session auth for manual trigger
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const sql = getDb();

  // Get all premium sites
  const premiumSites = await sql`
    SELECT s.id, s.name, s.settings
    FROM sites s
    JOIN users u ON u.id = s.owner_id
    WHERE u.membership = 'premium'
  `;

  if (premiumSites.length === 0) {
    return Response.json({ message: "No premium sites found", processed: 0 });
  }

  const aiProvider = process.env.DEEPSEEK_API_KEY ? "deepseek" : "anthropic";
  const aiUrl = aiProvider === "deepseek"
    ? "https://api.deepseek.com/chat/completions"
    : "https://api.anthropic.com/v1/messages";
  const apiKey = aiProvider === "deepseek" ? process.env.DEEPSEEK_API_KEY : process.env.ANTHROPIC_API_KEY;

  const results: { site: string; qa_added: number; error?: string }[] = [];

  for (const site of premiumSites) {
    try {
      // Fetch last 7 days of interactions
      const logs = await sql`
        SELECT user_message, ai_response, classification, was_escalated
        FROM interaction_logs
        WHERE site_id = ${site.id}
          AND created_at > now() - interval '7 days'
        ORDER BY created_at DESC
        LIMIT 150
      `;

      if (logs.length < 3) {
        results.push({ site: site.name as string, qa_added: 0, error: "Too few interactions" });
        continue;
      }

      const interactionSummary = logs
        .map((log, i) => {
          const esc = log.was_escalated ? " [ESCALATED]" : "";
          const cat = (log.classification as { category?: string })?.category || "unknown";
          return `[${cat}]${esc} Q: ${(log.user_message as string).slice(0, 200)} A: ${(log.ai_response as string).slice(0, 200)}`;
        })
        .join("\n");

      // Fetch existing Q&A to avoid duplicates
      const existingQA = await sql`
        SELECT question FROM knowledge_entries
        WHERE site_id = ${site.id} AND enabled = true
        LIMIT 50
      `;
      const existingQuestions = existingQA.map((q) => q.question).join("\n");

      const prompt = `Analyze these ${logs.length} customer service interactions from the past week and generate NEW Q&A entries for the knowledge base.

## Existing Q&A (DO NOT duplicate these):
${existingQuestions.slice(0, 2000)}

## This Week's Interactions:
${interactionSummary.slice(0, 5000)}

## Task:
1. Identify frequently asked questions that are NOT already in the existing Q&A
2. Identify questions where the AI gave inadequate answers or had to escalate
3. Generate 3-8 new Q&A pairs that would improve future responses

Output ONLY a JSON array:
[{"question": "...", "answer": "...", "category": "..."}]

Rules:
- Each answer should be 1-3 sentences, concise and helpful
- Categories: general, billing, technical, feature_request, account
- Only generate entries for genuinely new topics
- If no new entries are needed, return an empty array []

Output ONLY valid JSON array, no markdown fences.`;

      let newEntries: { question: string; answer: string; category: string }[] = [];

      if (aiProvider === "deepseek") {
        const aiRes = await fetch(aiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: 2000 }),
        });
        if (aiRes.ok) {
          const data = await aiRes.json();
          const raw = data.choices?.[0]?.message?.content || "";
          const arrMatch = raw.match(/\[[\s\S]*\]/);
          if (arrMatch) newEntries = JSON.parse(arrMatch[0]);
        }
      } else {
        const aiRes = await fetch(aiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey || "", "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
        });
        if (aiRes.ok) {
          const data = await aiRes.json();
          const raw = data.content?.[0]?.text || "";
          const arrMatch = raw.match(/\[[\s\S]*\]/);
          if (arrMatch) newEntries = JSON.parse(arrMatch[0]);
        }
      }

      // Insert new entries
      let added = 0;
      for (const entry of newEntries) {
        if (entry.question && entry.answer) {
          await sql`
            INSERT INTO knowledge_entries (site_id, question, answer, category, source)
            VALUES (${site.id}, ${entry.question}, ${entry.answer}, ${entry.category || "general"}, 'auto_learned')
          `;
          added++;
        }
      }

      // Log the run
      await sql`
        INSERT INTO weekly_report_logs (site_id, report_data, qa_entries_added, period_start, period_end)
        VALUES (${site.id}, ${JSON.stringify({ entries: newEntries, interactions_count: logs.length })}, ${added}, now() - interval '7 days', now())
      `;

      results.push({ site: site.name as string, qa_added: added });
    } catch (error) {
      results.push({ site: site.name as string, qa_added: 0, error: String(error) });
    }
  }

  return Response.json({ processed: results.length, results });
}
