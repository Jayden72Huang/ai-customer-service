import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

export const maxDuration = 60;

// POST — evolve knowledge document based on recent interaction logs
// Can be called manually from dashboard or via daily cron
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { site_id } = await req.json();

  if (!site_id) {
    return Response.json({ error: "Missing site_id" }, { status: 400 });
  }

  const sql = getDb();

  // Verify ownership
  const check = await sql`SELECT id, settings FROM sites WHERE id = ${site_id} AND owner_id = ${session.user.id}`;
  if (check.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Get latest document version
  const docs = await sql`
    SELECT * FROM knowledge_documents
    WHERE site_id = ${site_id}
    ORDER BY version DESC LIMIT 1
  `;

  if (docs.length === 0) {
    return Response.json({ error: "No knowledge document found. Upload one first." }, { status: 400 });
  }

  const currentDoc = docs[0];

  // Get interaction logs from the last 24 hours
  const logs = await sql`
    SELECT user_message, ai_response, classification, was_escalated
    FROM interaction_logs
    WHERE site_id = ${site_id}
      AND created_at > now() - interval '24 hours'
    ORDER BY created_at DESC
    LIMIT 100
  `;

  if (logs.length === 0) {
    return Response.json({
      message: "No new interactions in the last 24 hours. Nothing to evolve.",
      evolved: false,
    });
  }

  // Build the evolution prompt
  const interactionSummary = logs
    .map((log, i) => {
      const escalated = log.was_escalated ? " [ESCALATED]" : "";
      const category = (log.classification as { category?: string })?.category || "unknown";
      return `--- Interaction ${i + 1} (${category})${escalated} ---\nUser: ${(log.user_message as string).slice(0, 300)}\nAI: ${(log.ai_response as string).slice(0, 300)}`;
    })
    .join("\n\n");

  const evolutionPrompt = `You are a knowledge base optimizer. Your job is to improve a knowledge document based on real customer interactions.

## Current Knowledge Document (v${currentDoc.version}):
${(currentDoc.content as string).slice(0, 6000)}

## Today's Customer Interactions (${logs.length} conversations):
${interactionSummary.slice(0, 4000)}

## Your Task:
1. Analyze the interactions to find:
   - Questions the knowledge base couldn't answer well
   - Topics that came up frequently
   - Questions that were escalated to humans (these are gaps)
2. Generate an IMPROVED version of the knowledge document that:
   - Keeps ALL existing content (never remove)
   - Adds new sections/Q&A for gaps found
   - Improves unclear answers based on what customers actually asked
   - Marks new additions with <!-- NEW v${(currentDoc.version as number) + 1} --> comment
3. Also provide a brief changes summary

## Output Format:
Return a JSON object with two fields:
- "content": the full improved markdown document
- "changes_summary": a brief list of what was added/improved (2-5 bullet points)

Output ONLY valid JSON, no markdown fences.`;

  // Call AI to evolve
  const aiProvider = process.env.DEEPSEEK_API_KEY ? "deepseek" : "anthropic";
  const aiUrl = aiProvider === "deepseek"
    ? "https://api.deepseek.com/chat/completions"
    : "https://api.anthropic.com/v1/messages";
  const apiKey = aiProvider === "deepseek" ? process.env.DEEPSEEK_API_KEY : process.env.ANTHROPIC_API_KEY;

  let evolvedContent = "";
  let changesSummary = "";

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
          messages: [{ role: "user", content: evolutionPrompt }],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (aiRes.ok) {
        const data = await aiRes.json();
        const raw = data.choices?.[0]?.message?.content || "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          evolvedContent = parsed.content || "";
          changesSummary = parsed.changes_summary || "";
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
          messages: [{ role: "user", content: evolutionPrompt }],
        }),
      });

      if (aiRes.ok) {
        const data = await aiRes.json();
        const raw = data.content?.[0]?.text || "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          evolvedContent = parsed.content || "";
          changesSummary = parsed.changes_summary || "";
        }
      }
    }
  } catch (error) {
    console.error("Evolution AI error:", error);
    return Response.json({ error: "AI processing failed" }, { status: 500 });
  }

  if (!evolvedContent) {
    return Response.json({ error: "Failed to generate evolved document" }, { status: 500 });
  }

  // Store new version
  const newVersion = (currentDoc.version as number) + 1;
  const rows = await sql`
    INSERT INTO knowledge_documents (site_id, title, content, version, parent_id, changes_summary, source)
    VALUES (${site_id}, ${currentDoc.title}, ${evolvedContent}, ${newVersion}, ${currentDoc.id}, ${changesSummary}, 'auto_evolved')
    RETURNING id, version
  `;

  return Response.json({
    evolved: true,
    document: rows[0],
    version: newVersion,
    changes_summary: changesSummary,
    interactions_analyzed: logs.length,
  });
}
