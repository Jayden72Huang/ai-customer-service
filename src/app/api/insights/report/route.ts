import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

export const maxDuration = 60;

// POST — generate daily analysis report based on interaction logs
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { site_id, days = 1 } = await req.json();

  if (!site_id) {
    return Response.json({ error: "Missing site_id" }, { status: 400 });
  }

  const sql = getDb();

  // Verify ownership
  const check = await sql`SELECT id, name, settings FROM sites WHERE id = ${site_id} AND owner_id = ${session.user.id}`;
  if (check.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const siteName = check[0].name as string;
  const intervalStr = `${days} days`;

  // Fetch interaction logs
  const logs = await sql`
    SELECT user_message, ai_response, classification, was_escalated, created_at
    FROM interaction_logs
    WHERE site_id = ${site_id}
      AND created_at > now() - ${intervalStr}::interval
    ORDER BY created_at DESC
    LIMIT 200
  `;

  if (logs.length === 0) {
    return Response.json({
      report: null,
      message: `No interactions in the last ${days} day(s). Nothing to report.`,
    });
  }

  // Fetch stats for the period
  const periodStats = await sql`
    SELECT
      COUNT(DISTINCT c.id)::int AS total_conversations,
      COUNT(DISTINCT CASE WHEN c.needs_human THEN c.id END)::int AS escalated_conversations,
      COUNT(*)::int AS total_messages
    FROM interaction_logs il
    JOIN conversations c ON c.id = il.conversation_id
    WHERE il.site_id = ${site_id}
      AND il.created_at > now() - ${intervalStr}::interval
  `;

  // Category breakdown for the period
  const categories = await sql`
    SELECT classification->>'category' AS category, COUNT(*)::int AS count
    FROM interaction_logs
    WHERE site_id = ${site_id}
      AND created_at > now() - ${intervalStr}::interval
      AND classification IS NOT NULL
    GROUP BY classification->>'category'
    ORDER BY count DESC
  `;

  // Escalated conversations details
  const escalated = await sql`
    SELECT user_message, ai_response, classification
    FROM interaction_logs
    WHERE site_id = ${site_id}
      AND created_at > now() - ${intervalStr}::interval
      AND was_escalated = true
    ORDER BY created_at DESC
    LIMIT 20
  `;

  // Build the prompt for AI analysis
  const interactionSummary = logs
    .slice(0, 100)
    .map((log, i) => {
      const esc = log.was_escalated ? " [ESCALATED]" : "";
      const cat = (log.classification as { category?: string })?.category || "unknown";
      return `[${cat}]${esc} User: ${(log.user_message as string).slice(0, 200)} | AI: ${(log.ai_response as string).slice(0, 200)}`;
    })
    .join("\n");

  const escalatedSummary = escalated
    .map((log) => `User: ${(log.user_message as string).slice(0, 300)}`)
    .join("\n");

  const categoryList = categories
    .map((c) => `${c.category}: ${c.count}`)
    .join(", ");

  const stats = periodStats[0] || { total_conversations: 0, escalated_conversations: 0, total_messages: 0 };

  const analysisPrompt = `You are a customer service analytics expert. Generate a detailed daily report based on the data below.

## Site: ${siteName}
## Period: Last ${days} day(s)
## Stats:
- Total conversations: ${stats.total_conversations}
- Escalated: ${stats.escalated_conversations}
- Total messages: ${stats.total_messages}
- AI Resolution Rate: ${stats.total_conversations > 0 ? (((stats.total_conversations as number) - (stats.escalated_conversations as number)) / (stats.total_conversations as number) * 100).toFixed(1) : 0}%
- Categories: ${categoryList}

## Interactions (${logs.length} samples):
${interactionSummary.slice(0, 5000)}

## Escalated Issues (${escalated.length}):
${escalatedSummary.slice(0, 2000)}

## Generate a JSON report with these fields:
{
  "summary": "2-3 sentence executive summary of the day",
  "top_questions": [{"question": "...", "count": N, "well_answered": true/false}],
  "category_analysis": [{"category": "...", "count": N, "trend": "up/stable/down", "insight": "..."}],
  "escalation_analysis": {"total": N, "common_reasons": ["..."], "recommendation": "..."},
  "knowledge_gaps": [{"topic": "...", "description": "...", "priority": "high/medium/low"}],
  "improvement_suggestions": [{"title": "...", "description": "...", "impact": "high/medium/low"}],
  "sentiment_overview": {"positive": N, "neutral": N, "negative": N, "note": "..."},
  "auto_suggestions": [{"question": "...", "answer": "...", "reason": "..."}]
}

- top_questions: the 10 most frequently asked questions, estimate counts from the data
- knowledge_gaps: topics where the AI struggled or escalated
- auto_suggestions: new Q&A pairs that should be added to the knowledge base
- Be specific and actionable, not generic

Output ONLY valid JSON, no markdown fences.`;

  // Call AI
  const aiProvider = process.env.DEEPSEEK_API_KEY ? "deepseek" : "anthropic";
  const aiUrl = aiProvider === "deepseek"
    ? "https://api.deepseek.com/chat/completions"
    : "https://api.anthropic.com/v1/messages";
  const apiKey = aiProvider === "deepseek" ? process.env.DEEPSEEK_API_KEY : process.env.ANTHROPIC_API_KEY;

  let report = null;

  try {
    if (aiProvider === "deepseek") {
      const aiRes = await fetch(aiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: analysisPrompt }],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (aiRes.ok) {
        const data = await aiRes.json();
        const raw = data.choices?.[0]?.message?.content || "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          report = JSON.parse(jsonMatch[0]);
        }
      }
    } else {
      const aiRes = await fetch(aiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: analysisPrompt }],
        }),
      });

      if (aiRes.ok) {
        const data = await aiRes.json();
        const raw = data.content?.[0]?.text || "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          report = JSON.parse(jsonMatch[0]);
        }
      }
    }
  } catch (error) {
    console.error("Report AI error:", error);
    return Response.json({ error: "AI analysis failed" }, { status: 500 });
  }

  if (!report) {
    return Response.json({ error: "Failed to generate report" }, { status: 500 });
  }

  // Auto-insert suggestions from report into learning_suggestions
  if (report.auto_suggestions && Array.isArray(report.auto_suggestions)) {
    for (const s of report.auto_suggestions) {
      if (s.question && s.answer) {
        await sql`
          INSERT INTO learning_suggestions (site_id, suggested_question, suggested_answer, frequency, status)
          VALUES (${site_id}, ${s.question}, ${s.answer}, 1, 'pending')
          ON CONFLICT DO NOTHING
        `;
      }
    }
  }

  return Response.json({
    report,
    meta: {
      site: siteName,
      period_days: days,
      interactions_analyzed: logs.length,
      generated_at: new Date().toISOString(),
    },
  });
}
