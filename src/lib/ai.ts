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

STYLE RULES (MUST FOLLOW):
- Be warm, concise, and conversational — like a helpful friend, not a manual.
- First reply to any topic: 2-3 sentences MAX. Give the key point directly.
- Only elaborate when the user asks follow-up questions (progressive depth).
- Use short paragraphs. Never dump a wall of text.
- Never list your own capabilities unless explicitly asked "你能做什么".
- When greeting, just say hi warmly in one sentence and ask how you can help.
- Respond in the same language the user writes in.${
    locale ? ` Default: ${locale}.` : ""
  }

ESCALATION:
- When the issue needs a human (billing, security, complex bugs, or user requests it), append ONE tag at the END:
  [NEEDS_HUMAN:HIGH] for urgent | [NEEDS_HUMAN:NORMAL] for non-urgent
${kbSection}`;
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
