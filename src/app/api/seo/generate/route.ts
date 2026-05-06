import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isPremiumUser } from "@/lib/premium";

export const maxDuration = 60;

// POST — generate SEO article from customer interaction data (premium only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const premium = await isPremiumUser(session.user.id);
  if (!premium) {
    return Response.json({ error: "Premium feature. Upgrade to generate SEO articles." }, { status: 403 });
  }

  const { site_id, days = 7 } = await req.json();

  if (!site_id) {
    return Response.json({ error: "Missing site_id" }, { status: 400 });
  }

  const sql = getDb();

  // Verify ownership
  const check = await sql`SELECT id, name FROM sites WHERE id = ${site_id} AND owner_id = ${session.user.id}`;
  if (check.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const siteName = check[0].name as string;
  const intervalStr = `${days} days`;

  // Fetch interactions
  const logs = await sql`
    SELECT user_message, ai_response, classification, was_escalated
    FROM interaction_logs
    WHERE site_id = ${site_id}
      AND created_at > now() - ${intervalStr}::interval
    ORDER BY created_at DESC
    LIMIT 200
  `;

  if (logs.length < 5) {
    return Response.json({ error: "Not enough interaction data. Need at least 5 conversations." }, { status: 400 });
  }

  // Fetch existing knowledge for context
  const knowledge = await sql`
    SELECT question, answer FROM knowledge_entries
    WHERE site_id = ${site_id} AND enabled = true
    LIMIT 30
  `;

  const interactionSummary = logs
    .map((log) => {
      const cat = (log.classification as { category?: string })?.category || "unknown";
      return `[${cat}] Q: ${(log.user_message as string).slice(0, 200)}`;
    })
    .join("\n");

  const knowledgeContext = knowledge
    .map((k) => `Q: ${k.question}\nA: ${k.answer}`)
    .join("\n\n");

  const prompt = `You are an expert SEO content writer. Based on real customer questions and the product knowledge base below, generate a comprehensive, SEO-optimized blog article.

## Product: ${siteName}
## Customer Questions from the past ${days} days (${logs.length} interactions):
${interactionSummary.slice(0, 4000)}

## Product Knowledge Base:
${knowledgeContext.slice(0, 3000)}

## Task:
Generate a blog article that:
1. Identifies the 3-5 most popular customer topics/questions
2. Turns them into a comprehensive, well-structured guide
3. Uses natural SEO keywords throughout (no keyword stuffing)
4. Includes a clear title, introduction, sections with headers, and conclusion
5. Is 1000-1500 words
6. Uses a helpful, authoritative tone

## Output Format (JSON):
{
  "title": "SEO-friendly title (50-60 chars)",
  "slug": "url-friendly-slug",
  "content": "Full article in Markdown format",
  "topics": ["topic1", "topic2", ...],
  "meta_description": "SEO meta description (150-160 chars)"
}

Output ONLY valid JSON, no markdown fences.`;

  const aiProvider = process.env.DEEPSEEK_API_KEY ? "deepseek" : "anthropic";
  const aiUrl = aiProvider === "deepseek"
    ? "https://api.deepseek.com/chat/completions"
    : "https://api.anthropic.com/v1/messages";
  const apiKey = aiProvider === "deepseek" ? process.env.DEEPSEEK_API_KEY : process.env.ANTHROPIC_API_KEY;

  let article = null;

  try {
    if (aiProvider === "deepseek") {
      const aiRes = await fetch(aiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.5, max_tokens: 4000 }),
      });
      if (aiRes.ok) {
        const data = await aiRes.json();
        const raw = data.choices?.[0]?.message?.content || "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) article = JSON.parse(jsonMatch[0]);
      }
    } else {
      const aiRes = await fetch(aiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey || "", "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
      });
      if (aiRes.ok) {
        const data = await aiRes.json();
        const raw = data.content?.[0]?.text || "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) article = JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.error("SEO generation error:", error);
    return Response.json({ error: "AI generation failed" }, { status: 500 });
  }

  if (!article || !article.content) {
    return Response.json({ error: "Failed to generate article" }, { status: 500 });
  }

  // Save to database
  const wordCount = article.content.split(/\s+/).length;
  const rows = await sql`
    INSERT INTO seo_articles (site_id, title, slug, content, topics, word_count, generated_from)
    VALUES (
      ${site_id},
      ${article.title},
      ${article.slug},
      ${article.content},
      ${article.topics || []},
      ${wordCount},
      ${JSON.stringify({ days, interactions: logs.length, generated_at: new Date().toISOString() })}
    )
    RETURNING id, title, slug, word_count, created_at
  `;

  return Response.json({
    article: {
      ...rows[0],
      content: article.content,
      topics: article.topics,
      meta_description: article.meta_description,
    },
  });
}
