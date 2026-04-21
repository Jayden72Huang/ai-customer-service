import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { AIProvider, KnowledgeEntry } from "./types";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

function getModel(provider: AIProvider) {
  if (provider === "anthropic") {
    return anthropic("claude-sonnet-4-20250514");
  }
  return deepseek.chat("deepseek-chat");
}

function buildSystemPrompt(
  siteName: string,
  knowledgeEntries: KnowledgeEntry[],
  knowledgeDoc?: string,
  locale?: string
) {
  let kbSection = "";

  // Priority: use the evolving MD document if available
  if (knowledgeDoc) {
    kbSection = `\n\n## Knowledge Document:\n${knowledgeDoc.slice(0, 6000)}`;
  }

  // Also include Q&A entries
  if (knowledgeEntries.length > 0) {
    kbSection += `\n\n## FAQ Entries:\n${knowledgeEntries
      .map((e) => `Q: ${e.question}\nA: ${e.answer}`)
      .join("\n\n")}`;
  }

  return `You are the AI customer service assistant for "${siteName}".

Rules:
1. Be helpful, concise, and friendly. Keep responses under 200 words.
2. Answer based on the knowledge document and FAQ entries when possible.
3. If you cannot answer confidently, say so honestly.
4. When the user's issue requires human intervention (billing disputes, account security, complex technical issues, or explicit request for human agent), include exactly one of these tags at the END of your response:
   - [NEEDS_HUMAN:HIGH] — for urgent issues (billing, security, data loss)
   - [NEEDS_HUMAN:NORMAL] — for non-urgent issues (bugs, feature requests, general complaints)
5. Respond in the same language the user writes in.${
    locale ? `\n6. Default language: ${locale}` : ""
  }${kbSection}`;
}

export async function chatStream(opts: {
  provider: AIProvider;
  siteName: string;
  knowledgeEntries: KnowledgeEntry[];
  knowledgeDoc?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  locale?: string;
}) {
  const model = getModel(opts.provider);
  const systemPrompt = buildSystemPrompt(
    opts.siteName,
    opts.knowledgeEntries,
    opts.knowledgeDoc,
    opts.locale
  );

  return streamText({
    model,
    system: systemPrompt,
    messages: opts.messages,
  });
}
