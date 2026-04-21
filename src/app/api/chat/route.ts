import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { chatStream } from "@/lib/ai";
import { classifyMessage, cleanAIResponse } from "@/lib/classifier";
import { triggerEscalation } from "@/lib/escalation";
import type { AIProvider, ChatStyle, KnowledgeEntry, Message, Conversation } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { api_key, conversation_id, visitor_id, message, locale } =
      await req.json();

    if (!api_key || !message) {
      return Response.json({ error: "Missing api_key or message" }, { status: 400 });
    }

    const sql = getDb();

    // 1. Validate site by api_key
    const sites = await sql`
      SELECT * FROM sites WHERE api_key = ${api_key}
    `;

    if (sites.length === 0) {
      return Response.json({ error: "Invalid API key" }, { status: 401 });
    }

    const site = sites[0];
    const settings = site.settings as {
      ai_provider: AIProvider;
      chat_style: ChatStyle;
      escalation_email: string;
      max_messages_per_hour: number;
    };

    // 2. Get or create conversation
    let convId = conversation_id;
    if (!convId) {
      const rows = await sql`
        INSERT INTO conversations (site_id, visitor_id, status)
        VALUES (${site.id}, ${visitor_id || `anon-${Date.now()}`}, 'open')
        RETURNING id
      `;
      convId = rows[0]?.id;
    }

    if (!convId) {
      return Response.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    // 3. Save user message
    await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${convId}, 'user', ${message})
    `;

    // 4. Fetch conversation history (last 20 messages)
    const history = await sql`
      SELECT role, content FROM messages
      WHERE conversation_id = ${convId}
      ORDER BY created_at ASC
      LIMIT 20
    `;

    const chatMessages = history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content as string,
      }));

    // 5. Fetch relevant knowledge entries
    const knowledge = await sql`
      SELECT * FROM knowledge_entries
      WHERE site_id = ${site.id} AND enabled = true
      LIMIT 20
    `;

    // 6. Fetch latest knowledge document (evolving MD)
    const kdocs = await sql`
      SELECT content FROM knowledge_documents
      WHERE site_id = ${site.id}
      ORDER BY version DESC LIMIT 1
    `;
    const knowledgeDoc = kdocs.length > 0 ? (kdocs[0].content as string) : undefined;

    // 7. Stream AI response
    const result = await chatStream({
      provider: settings.ai_provider || "deepseek",
      chatStyle: settings.chat_style || "product",
      siteName: site.name as string,
      knowledgeEntries: knowledge as unknown as KnowledgeEntry[],
      knowledgeDoc,
      messages: chatMessages,
      locale,
    });

    // Create a TransformStream to capture full response for classification
    let fullResponse = "";
    const encoder = new TextEncoder();
    const transformStream = new TransformStream<string, Uint8Array>({
      transform(chunk, controller) {
        fullResponse += chunk;
        // Output in AI SDK data stream format: 0:"chunk"\n
        controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
      },
      async flush() {
        const cleaned = cleanAIResponse(fullResponse);
        const classification = classifyMessage(message, fullResponse);

        // Save AI message
        await sql`
          INSERT INTO messages (conversation_id, role, content, classification)
          VALUES (${convId}, 'assistant', ${cleaned}, ${JSON.stringify(classification)})
        `;

        // Save interaction log
        await sql`
          INSERT INTO interaction_logs (site_id, conversation_id, user_message, ai_response, classification, was_escalated)
          VALUES (${site.id}, ${convId}, ${message}, ${cleaned}, ${JSON.stringify(classification)}, ${classification.needs_human})
        `;

        // Trigger escalation if needed
        if (classification.needs_human) {
          const priority = classification.reason?.includes("high") ? "high" : "normal";
          const convRows = await sql`
            UPDATE conversations
            SET needs_human = true, status = 'waiting_human',
                category = ${classification.category}, priority = ${priority}
            WHERE id = ${convId}
            RETURNING *
          `;

          const recentRows = await sql`
            SELECT * FROM messages
            WHERE conversation_id = ${convId}
            ORDER BY created_at DESC
            LIMIT 5
          `;

          if (convRows.length > 0) {
            await triggerEscalation({
              conversation: convRows[0] as unknown as Conversation,
              recentMessages: recentRows as unknown as Message[],
              classification,
              escalationEmail: settings.escalation_email,
              siteName: site.name as string,
            });
          }
        }
      },
    });

    const stream = result.textStream;
    const pipedStream = stream.pipeThrough(transformStream);

    return new Response(pipedStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Conversation-Id": convId,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "X-Conversation-Id",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
