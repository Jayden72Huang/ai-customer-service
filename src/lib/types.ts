// ============================================================
// AI Customer Service SaaS — Core Types
// ============================================================

// --- Enums ---
export type ConversationStatus = "open" | "waiting_human" | "resolved" | "closed";
export type Priority = "low" | "normal" | "high" | "urgent";
export type MessageRole = "user" | "assistant" | "admin";
export type KnowledgeSource = "manual" | "csv_import" | "auto_learned";
export type AIProvider = "anthropic" | "deepseek";

// --- Site (Tenant) ---
export interface Site {
  id: string;
  name: string;
  domain: string;
  api_key: string;
  owner_id: string;
  settings: SiteSettings;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  ai_provider: AIProvider;
  widget_color: string;
  widget_position: "bottom-right" | "bottom-left";
  welcome_message: string;
  escalation_email: string;
  escalation_phone?: string;
  auto_detect_language: boolean;
  max_messages_per_hour: number;
}

// --- Conversation ---
export interface Conversation {
  id: string;
  site_id: string;
  visitor_id: string;
  visitor_email?: string;
  status: ConversationStatus;
  category?: string;
  priority: Priority;
  needs_human: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// --- Message ---
export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  classification?: Classification;
  created_at: string;
}

export interface Classification {
  category: string;
  confidence: number;
  needs_human: boolean;
  reason?: string;
}

// --- Knowledge Entry ---
export interface KnowledgeEntry {
  id: string;
  site_id: string;
  question: string;
  answer: string;
  category: string;
  source: KnowledgeSource;
  usage_count: number;
  quality_score: number | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// --- Interaction Log (for self-learning) ---
export interface InteractionLog {
  id: string;
  site_id: string;
  conversation_id: string;
  user_message: string;
  ai_response: string;
  classification: Classification | null;
  was_escalated: boolean;
  user_satisfaction: number | null;
  created_at: string;
}

// --- Learning Suggestion ---
export interface LearningSuggestion {
  id: string;
  site_id: string;
  suggested_question: string;
  suggested_answer: string;
  source_log_ids: string[];
  frequency: number;
  status: "pending" | "approved" | "rejected";
  reviewed_at: string | null;
  created_at: string;
}

// --- Escalation ---
export interface Escalation {
  id: string;
  conversation_id: string;
  reason: string;
  priority: Priority;
  notified_via: string;
  notified_at: string;
  resolved_at: string | null;
}

// --- API Request/Response ---
export interface ChatRequest {
  site_id: string;
  conversation_id?: string;
  visitor_id: string;
  message: string;
  locale?: string;
}

export interface WidgetConfig {
  site_id: string;
  color: string;
  position: "bottom-right" | "bottom-left";
  welcome_message: string;
  auto_detect_language: boolean;
}
