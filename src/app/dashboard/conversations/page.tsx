"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Send,
  X,
} from "lucide-react";
import { useSite } from "@/components/site-context";

interface Conversation {
  id: string;
  visitor_id: string;
  visitor_email?: string;
  status: string;
  category?: string;
  priority: string;
  needs_human: boolean;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

function getStatusConfig(t: (key: string) => string) {
  return {
    open: { color: "text-success", icon: MessageSquare, label: t("conv.open") },
    waiting_human: { color: "text-warning", icon: AlertTriangle, label: t("conv.needs_human") },
    resolved: { color: "text-muted-foreground", icon: CheckCircle, label: t("conv.resolved") },
    closed: { color: "text-muted-foreground", icon: X, label: t("conv.closed") },
  } as Record<string, { color: string; icon: React.ElementType; label: string }>;
}

const filterKeys: Record<string, string> = {
  all: "conv.all",
  needs_human: "conv.needs_human",
  open: "conv.open",
  resolved: "conv.resolved",
};

export default function ConversationsPage() {
  const { t, siteId: contextSiteId } = useSite();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const statusConfig = getStatusConfig(t);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    const siteId = contextSiteId || (typeof window !== "undefined" ? localStorage.getItem("current_site_id") : null);
    const params = new URLSearchParams();
    if (siteId) params.set("site_id", siteId);
    if (filter === "needs_human") params.set("needs_human", "true");
    else if (filter !== "all") params.set("status", filter);

    const res = await fetch(`/api/conversations?${params}`);
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations || []);
    }
    setLoading(false);
  }, [filter, contextSiteId]);

  useEffect(() => {
    fetchConversations();
    setSelected(null);
  }, [fetchConversations]);

  async function selectConversation(conv: Conversation) {
    setSelected(conv);
    setMessages(conv.messages || []);
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return;

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: selected.id,
        content: reply,
      }),
    });

    if (res.ok) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "admin",
          content: reply,
          created_at: new Date().toISOString(),
        },
      ]);
      setReply("");
    }
  }

  async function resolveConversation() {
    if (!selected) return;
    await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: selected.id,
        content: "This conversation has been resolved. Thank you!",
        resolve: true,
      }),
    });
    fetchConversations();
    setSelected(null);
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Conversation List */}
      <div className="w-96 flex flex-col">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground mb-4">{t("conv.title")}</h2>
          <div className="flex gap-2">
            {["all", "needs_human", "open", "resolved"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(filterKeys[f])}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto space-y-2">
          {loading ? (
            <p className="text-muted-foreground text-sm p-4">{t("conv.loading")}</p>
          ) : conversations.length === 0 ? (
            <p className="text-muted-foreground text-sm p-4">{t("conv.no_conversations")}</p>
          ) : (
            conversations.map((conv) => {
              const cfg = statusConfig[conv.status] || statusConfig.open;
              const Icon = cfg.icon;
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selected?.id === conv.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground truncate">
                      {conv.visitor_email || conv.visitor_id.slice(0, 12)}
                    </span>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{cfg.label}</span>
                    {conv.category && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{conv.category.replace(/_/g, " ")}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(conv.updated_at).toLocaleString()}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Detail */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-xl">
        {selected ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">
                  {selected.visitor_email || selected.visitor_id}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selected.category?.replace(/_/g, " ")} · {selected.priority} {t("conv.priority")}
                </p>
              </div>
              <div className="flex gap-2">
                {selected.status === "waiting_human" && (
                  <button
                    onClick={resolveConversation}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-success/20 text-success rounded-lg text-xs font-medium hover:bg-success/30 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t("conv.resolve")}
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : msg.role === "admin"
                        ? "bg-success/20 text-foreground border border-success/30"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.role === "admin" && (
                      <span className="text-xs text-success font-medium block mb-1">
                        {t("conv.admin")}
                      </span>
                    )}
                    {msg.content}
                    <p className="text-[10px] opacity-60 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Box */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  placeholder={t("conv.reply_placeholder")}
                  className="flex-1 bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={sendReply}
                  disabled={!reply.trim()}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>{t("conv.select")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
