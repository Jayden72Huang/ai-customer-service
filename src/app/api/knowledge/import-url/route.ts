import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

export const maxDuration = 30;

// POST — import knowledge from a URL (webpage, Google Doc, Feishu doc)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { site_id, url, text: directText } = await req.json();

  if (!site_id || (!url && !directText)) {
    return Response.json({ error: "Missing site_id, url, or text" }, { status: 400 });
  }

  const sql = getDb();

  // Verify ownership
  const check = await sql`SELECT id FROM sites WHERE id = ${site_id} AND owner_id = ${session.user.id}`;
  if (check.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    let text: string;

    if (directText) {
      // Direct text paste — skip URL fetch
      text = directText;
    } else {
      // Fetch the URL content
      const pageRes = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AICSBot/1.0)",
          "Accept": "text/html,application/xhtml+xml,text/plain,*/*",
        },
      });

      if (!pageRes.ok) {
        return Response.json({ error: `Failed to fetch URL (HTTP ${pageRes.status}). The document may require login. Try using "Paste Text" instead.` }, { status: 400 });
      }

      const contentType = pageRes.headers.get("content-type") || "";
      text = await pageRes.text();

      // Check if we got a login page instead of actual content
      if (text.includes("login") && text.includes("password") && text.length < 5000) {
        return Response.json({ error: "The URL returned a login page. Please make the document public, or copy the content and use \"Paste Text\" instead." }, { status: 400 });
      }

      // Strip HTML tags to get plain text
      if (contentType.includes("html")) {
        text = text
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }
    }

    // Truncate to avoid token limits
    const maxLen = 8000;
    if (text.length > maxLen) {
      text = text.slice(0, maxLen) + "...";
    }

    if (text.length < 50) {
      return Response.json({ error: "Could not extract meaningful content from the URL" }, { status: 400 });
    }

    // Use AI to extract Q&A pairs from the content
    const aiProvider = process.env.DEEPSEEK_API_KEY ? "deepseek" : "anthropic";
    const aiUrl = aiProvider === "deepseek" ? "https://api.deepseek.com/chat/completions" : "https://api.anthropic.com/v1/messages";
    const apiKey = aiProvider === "deepseek" ? process.env.DEEPSEEK_API_KEY : process.env.ANTHROPIC_API_KEY;

    let entries: { question: string; answer: string; category: string }[] = [];

    if (aiProvider === "deepseek") {
      const aiRes = await fetch(aiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You extract FAQ-style question-answer pairs from text content. Output ONLY a valid JSON array. Each item: {"question":"...","answer":"...","category":"..."}. Category should be one of: general, billing, account, technical, feature_request. Extract 5-15 pairs. No markdown, no explanation.`,
            },
            {
              role: "user",
              content: `Extract Q&A pairs from this content:\n\n${text}`,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (aiRes.ok) {
        const data = await aiRes.json();
        const raw = data.choices?.[0]?.message?.content || "[]";
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          entries = JSON.parse(jsonMatch[0]);
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
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: `Extract FAQ-style question-answer pairs from this content. Output ONLY a valid JSON array. Each item: {"question":"...","answer":"...","category":"..."}. Category: general, billing, account, technical, feature_request. Extract 5-15 pairs.\n\nContent:\n${text}`,
            },
          ],
        }),
      });

      if (aiRes.ok) {
        const data = await aiRes.json();
        const raw = data.content?.[0]?.text || "[]";
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          entries = JSON.parse(jsonMatch[0]);
        }
      }
    }

    if (entries.length === 0) {
      return Response.json({ error: "Could not extract Q&A pairs from the content" }, { status: 400 });
    }

    // Insert into database
    let imported = 0;
    for (const e of entries) {
      if (e.question && e.answer) {
        await sql`
          INSERT INTO knowledge_entries (site_id, question, answer, category, source)
          VALUES (${site_id}, ${e.question}, ${e.answer}, ${e.category || "general"}, 'csv_import')
        `;
        imported++;
      }
    }

    return Response.json({
      imported,
      entries: entries.filter((e) => e.question && e.answer),
    });
  } catch (error) {
    console.error("URL import error:", error);
    return Response.json({ error: "Failed to process URL" }, { status: 500 });
  }
}
