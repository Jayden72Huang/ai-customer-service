import type { Classification } from "./types";

// Keyword-based escalation detection (Layer 2 fallback)
const HIGH_KEYWORDS = [
  "refund", "退款", "hacked", "被盗", "被黑", "account locked", "账号锁",
  "cannot login", "无法登录", "data loss", "数据丢失", "charge", "扣款",
  "unauthorized", "security", "安全", "stolen", "delete account", "注销",
];

const NORMAL_KEYWORDS = [
  "bug", "error", "报错", "crash", "打不开", "不工作", "doesn't work",
  "broken", "human", "人工", "转人工", "客服", "agent", "complaint", "投诉",
  "slow", "很慢", "loading",
];

const CATEGORY_PATTERNS: [RegExp, string][] = [
  [/refund|退款|charge|扣款|payment|付款|billing|账单|price|价格/i, "billing"],
  [/login|登录|password|密码|account|账号|register|注册|sign up/i, "account"],
  [/bug|error|crash|报错|打不开|不工作|doesn't work|broken|fail/i, "technical"],
  [/feature|功能|suggest|建议|hope|希望|wish|想要/i, "feature_request"],
  [/how|怎么|what|什么|where|哪里|when|tutorial|教程/i, "general_inquiry"],
];

export function classifyMessage(
  userMessage: string,
  aiResponse?: string
): Classification {
  const combined = `${userMessage} ${aiResponse || ""}`.toLowerCase();

  // Check AI-tagged escalation (Layer 1)
  let needsHuman = false;
  let priority: "high" | "normal" | "low" = "low";

  if (aiResponse?.includes("[NEEDS_HUMAN:HIGH]")) {
    needsHuman = true;
    priority = "high";
  } else if (aiResponse?.includes("[NEEDS_HUMAN:NORMAL]")) {
    needsHuman = true;
    priority = "normal";
  }

  // Keyword fallback (Layer 2)
  if (!needsHuman) {
    if (HIGH_KEYWORDS.some((kw) => combined.includes(kw))) {
      needsHuman = true;
      priority = "high";
    } else if (NORMAL_KEYWORDS.some((kw) => combined.includes(kw))) {
      needsHuman = true;
      priority = "normal";
    }
  }

  // Category detection
  let category = "general_inquiry";
  for (const [pattern, cat] of CATEGORY_PATTERNS) {
    if (pattern.test(userMessage)) {
      category = cat;
      break;
    }
  }

  return {
    category,
    confidence: needsHuman ? 0.9 : 0.7,
    needs_human: needsHuman,
    reason: needsHuman
      ? `Detected escalation signal (priority: ${priority})`
      : undefined,
  };
}

// Strip escalation tags from AI response before showing to user
export function cleanAIResponse(response: string): string {
  return response
    .replace(/\[NEEDS_HUMAN:(HIGH|NORMAL)\]/g, "")
    .trim();
}
