import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { AIProvider, ChatStyle, KnowledgeEntry } from "./types";

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

const STYLE_PROMPTS: Record<ChatStyle, string> = {
  professional: `STYLE: Professional Consultant
- Tone: Authoritative yet approachable, like a senior consultant.
- Use structured answers with clear logic. Cite specifics when possible.
- First reply: 2-3 concise sentences with the key takeaway.
- Follow-ups: progressively add detail, use bullet points for complex info.
- Avoid slang, emoji, or casual filler. Stay polished.`,

  product: `STYLE: Product Buddy
- Tone: Enthusiastic and knowledgeable, like a product manager friend.
- Show genuine excitement about features. Use relatable analogies.
- First reply: 1-2 warm sentences that directly address the question.
- Follow-ups: share tips, use cases, and "pro tips" naturally.
- Light use of emoji is OK (1-2 per message max). Keep it human.`,

  minimal: `STYLE: Minimal & Efficient
- Tone: Direct and precise, like a senior engineer.
- Give the answer first, explanation second (only if needed).
- First reply: 1 sentence if possible. Never exceed 2.
- Follow-ups: stay brief. Use code snippets or bullet points.
- No greetings, no filler, no emoji. Respect the user's time.`,

  warm: `STYLE: Warm & Caring
- Tone: Patient, empathetic, and reassuring — like a helpful teacher.
- Acknowledge the user's situation before answering.
- First reply: 2-3 sentences, starting with empathy ("I understand...").
- Follow-ups: guide step by step, check if they need more help.
- Use gentle encouragement. Light emoji OK (😊👍).`,

  playful: `STYLE: Playful & Fun
- Tone: Casual, witty, and energetic — like chatting with a fun coworker.
- Use conversational language, humor where appropriate.
- First reply: 1-2 snappy sentences. Keep it light.
- Follow-ups: stay entertaining but always helpful. Memes OK, fluff not.
- Emoji encouraged (2-3 per message). Keep the vibe young and fresh 🚀`,

  brand: `STYLE: Brand Ambassador
- Tone: On-brand and memorable, like a mascot with real knowledge.
- Weave in the brand name and values naturally.
- First reply: 2 sentences that feel distinctly "us", not generic.
- Follow-ups: maintain brand voice consistency. Reference product by name.
- Create memorable moments. Make users feel part of the community.`,
};

function buildSystemPrompt(
  siteName: string,
  chatStyle: ChatStyle,
  knowledgeEntries: KnowledgeEntry[],
  knowledgeDoc?: string,
  locale?: string
) {
  let kbSection = "";

  if (knowledgeDoc) {
    kbSection = `\n\n## Knowledge Document:\n${knowledgeDoc.slice(0, 6000)}`;
  }

  if (knowledgeEntries.length > 0) {
    kbSection += `\n\n## FAQ Entries:\n${knowledgeEntries
      .map((e) => `Q: ${e.question}\nA: ${e.answer}`)
      .join("\n\n")}`;
  }

  const styleBlock = STYLE_PROMPTS[chatStyle] || STYLE_PROMPTS.product;

  return `You are the AI customer service assistant for "${siteName}".

${styleBlock}

CORE RULES:
- Only elaborate when the user asks follow-up questions (progressive depth).
- Never dump a wall of text. Keep paragraphs short.
- Never list your own capabilities unless explicitly asked.
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
  chatStyle?: ChatStyle;
  siteName: string;
  knowledgeEntries: KnowledgeEntry[];
  knowledgeDoc?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  locale?: string;
}) {
  const model = getModel(opts.provider);
  const systemPrompt = buildSystemPrompt(
    opts.siteName,
    opts.chatStyle || "product",
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
