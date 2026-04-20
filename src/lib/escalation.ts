import { Resend } from "resend";
import type { Conversation, Message, Classification } from "./types";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "");
}

interface EscalationContext {
  conversation: Conversation;
  recentMessages: Message[];
  classification: Classification;
  escalationEmail: string;
  siteName: string;
}

export async function triggerEscalation(ctx: EscalationContext) {
  const { conversation, recentMessages, classification, escalationEmail, siteName } = ctx;

  if (!escalationEmail) {
    console.warn("No escalation email configured for site:", siteName);
    return null;
  }

  const priorityEmoji = classification.needs_human
    ? (classification.reason?.includes("high") ? "🔴" : "🟡")
    : "🟢";

  const messageHistory = recentMessages
    .slice(-5)
    .map((m) => `[${m.role}]: ${m.content.slice(0, 200)}`)
    .join("\n");

  const subject = `${priorityEmoji} [${siteName}] Customer needs help — ${classification.category}`;
  const body = `
A customer conversation requires human attention.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Category: ${classification.category}
Priority: ${classification.reason || "Normal"}
Visitor: ${conversation.visitor_id}
${conversation.visitor_email ? `Email: ${conversation.visitor_email}` : ""}
Conversation ID: ${conversation.id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recent messages:
${messageHistory}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply to this customer in your dashboard:
${process.env.NEXT_PUBLIC_APP_URL}/dashboard/conversations?id=${conversation.id}
`.trim();

  try {
    const result = await getResend().emails.send({
      from: `${siteName} Support <notifications@${process.env.RESEND_DOMAIN || "resend.dev"}>`,
      to: escalationEmail,
      subject,
      text: body,
    });
    return result;
  } catch (error) {
    console.error("Failed to send escalation email:", error);
    return null;
  }
}
