/**
 * AI Customer Service Widget
 * Web Component + Shadow DOM — paste one <script> tag to embed
 *
 * Usage:
 * <script src="https://your-domain.com/widget.js" data-api-key="xxx"></script>
 */

interface WidgetConfig {
  site_id: string;
  name: string;
  color: string;
  position: "bottom-right" | "bottom-left";
  welcome_message: string;
  auto_detect_language: boolean;
}

interface ChatMessage {
  role: "user" | "assistant" | "admin";
  content: string;
  time: string;
}

class AIChatWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private config: WidgetConfig | null = null;
  private apiKey: string = "";
  private apiBase: string = "";
  private conversationId: string | null = null;
  private visitorId: string = "";
  private messages: ChatMessage[] = [];
  private isOpen = false;
  private isLoading = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.visitorId = this.getOrCreateVisitorId();
  }

  async connectedCallback() {
    const script = document.querySelector(
      'script[data-api-key][src*="widget"]'
    ) as HTMLScriptElement | null;

    this.apiKey = this.getAttribute("data-api-key") || script?.getAttribute("data-api-key") || "";
    this.apiBase = this.getAttribute("data-api-base") || script?.src.replace(/\/widget\.js.*$/, "") || window.location.origin;

    if (!this.apiKey) {
      console.error("[AI CS Widget] Missing data-api-key attribute");
      return;
    }

    await this.fetchConfig();
    this.render();
  }

  private getOrCreateVisitorId(): string {
    const key = "ai_cs_visitor_id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  }

  private async fetchConfig() {
    try {
      const res = await fetch(`${this.apiBase}/api/widget?api_key=${this.apiKey}`);
      if (res.ok) {
        this.config = await res.json();
      }
    } catch (e) {
      console.error("[AI CS Widget] Failed to fetch config:", e);
    }

    if (!this.config) {
      this.config = {
        site_id: "",
        name: "Support",
        color: "#2563eb",
        position: "bottom-right",
        welcome_message: "Hi! How can I help you today?",
        auto_detect_language: true,
      };
    }
  }

  private getLocale(): string {
    if (this.config?.auto_detect_language) {
      return navigator.language || "en";
    }
    return "en";
  }

  private render() {
    const color = this.config?.color || "#2563eb";
    const pos = this.config?.position || "bottom-right";
    const posCSS =
      pos === "bottom-left" ? "left: 20px;" : "right: 20px;";

    this.shadow.innerHTML = `
      <style>
        :host {
          --primary: ${color};
          --bg: #09090b;
          --card: #18181b;
          --border: #27272a;
          --text: #fafafa;
          --muted: #a1a1aa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
        }

        .trigger {
          position: fixed;
          bottom: 20px;
          ${posCSS}
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 99999;
          transition: transform 0.2s;
        }
        .trigger:hover { transform: scale(1.1); }
        .trigger svg { width: 24px; height: 24px; }

        .chat-window {
          position: fixed;
          bottom: 88px;
          ${posCSS}
          width: 380px;
          height: 520px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          display: none;
          flex-direction: column;
          overflow: hidden;
          z-index: 99999;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .chat-window.open { display: flex; }

        .chat-header {
          padding: 16px;
          background: var(--card);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .chat-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
        }
        .chat-header .close {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .msg {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.5;
          word-wrap: break-word;
        }
        .msg strong { font-weight: 600; }
        .msg p { margin: 0 0 6px 0; }
        .msg p:last-child { margin-bottom: 0; }
        .msg ul, .msg ol { margin: 4px 0; padding-left: 18px; }
        .msg li { margin: 2px 0; }
        .msg code {
          background: rgba(255,255,255,0.1);
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 12px;
        }
        .msg.user {
          align-self: flex-end;
          background: var(--primary);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .msg.assistant {
          align-self: flex-start;
          background: var(--card);
          color: var(--text);
          border: 1px solid var(--border);
          border-bottom-left-radius: 4px;
        }
        .msg.admin {
          align-self: flex-start;
          background: rgba(34, 197, 94, 0.15);
          color: var(--text);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-bottom-left-radius: 4px;
        }
        .msg.admin::before {
          content: 'Support Team';
          display: block;
          font-size: 11px;
          color: #22c55e;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .msg-time {
          font-size: 10px;
          color: var(--muted);
          margin-top: 4px;
          opacity: 0.7;
        }

        .typing {
          align-self: flex-start;
          padding: 10px 14px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          border-bottom-left-radius: 4px;
          display: none;
        }
        .typing.show { display: block; }
        .typing span {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: var(--muted);
          border-radius: 50%;
          margin: 0 2px;
          animation: bounce 1.4s infinite ease-in-out;
        }
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .chat-input {
          padding: 12px 16px;
          border-top: 1px solid var(--border);
          display: flex;
          gap: 8px;
          background: var(--card);
        }
        .chat-input input {
          flex: 1;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 12px;
          color: var(--text);
          font-size: 13px;
          outline: none;
        }
        .chat-input input::placeholder { color: var(--muted); }
        .chat-input input:focus { border-color: var(--primary); }
        .chat-input button {
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        }
        .chat-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .welcome {
          text-align: center;
          padding: 24px;
          color: var(--muted);
          font-size: 13px;
        }

        .satisfaction {
          display: flex;
          gap: 4px;
          justify-content: center;
          padding: 8px;
        }
        .satisfaction button {
          background: none;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 4px 8px;
          color: var(--muted);
          cursor: pointer;
          font-size: 12px;
        }
        .satisfaction button:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        @media (max-width: 480px) {
          .chat-window {
            width: calc(100vw - 16px);
            height: calc(100vh - 100px);
            bottom: 80px;
            left: 8px;
            right: 8px;
          }
        }
      </style>

      <button class="trigger" id="trigger">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      <div class="chat-window" id="chatWindow">
        <div class="chat-header">
          <h3>${this.config?.name || "Support"}</h3>
          <button class="close" id="closeBtn">✕</button>
        </div>
        <div class="chat-messages" id="chatMessages">
          <div class="welcome">${this.config?.welcome_message || "Hi! How can I help?"}</div>
        </div>
        <div class="typing" id="typing">
          <span></span><span></span><span></span>
        </div>
        <div class="chat-input">
          <input type="text" id="msgInput" placeholder="Type a message..." />
          <button id="sendBtn">Send</button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents() {
    const trigger = this.shadow.getElementById("trigger")!;
    const closeBtn = this.shadow.getElementById("closeBtn")!;
    const sendBtn = this.shadow.getElementById("sendBtn")!;
    const input = this.shadow.getElementById("msgInput") as HTMLInputElement;
    const chatWindow = this.shadow.getElementById("chatWindow")!;

    trigger.addEventListener("click", () => {
      this.isOpen = !this.isOpen;
      chatWindow.classList.toggle("open", this.isOpen);
      if (this.isOpen) input.focus();
    });

    closeBtn.addEventListener("click", () => {
      this.isOpen = false;
      chatWindow.classList.remove("open");
    });

    sendBtn.addEventListener("click", () => this.sendMessage());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  private async sendMessage() {
    const input = this.shadow.getElementById("msgInput") as HTMLInputElement;
    const text = input.value.trim();
    if (!text || this.isLoading) return;

    input.value = "";
    this.addMessage("user", text);
    this.isLoading = true;
    this.showTyping(true);

    try {
      const res = await fetch(`${this.apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: this.apiKey,
          conversation_id: this.conversationId,
          visitor_id: this.visitorId,
          message: text,
          locale: this.getLocale(),
        }),
      });

      // Get conversation ID from header
      const cid = res.headers.get("X-Conversation-Id");
      if (cid) this.conversationId = cid;

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      // Read the stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        this.showTyping(false);
        const msgEl = this.addMessage("assistant", "");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Parse AI SDK data stream format
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("0:")) {
              // Text delta
              try {
                const text = JSON.parse(line.slice(2));
                fullResponse += text;
                if (msgEl) {
                  msgEl.textContent = fullResponse;
                  this.scrollToBottom();
                }
              } catch {
                // skip non-JSON lines
              }
            }
          }
        }

        // Render final response with markdown
        if (msgEl) {
          const cleaned = fullResponse
            .replace(/\[NEEDS_HUMAN:(HIGH|NORMAL)\]/g, "")
            .trim();
          // Preserve the time element, re-render with markdown
          const timeEl = msgEl.querySelector(".msg-time");
          msgEl.innerHTML = this.renderMarkdown(cleaned);
          if (timeEl) msgEl.appendChild(timeEl);
        }
      }
    } catch (error) {
      this.showTyping(false);
      this.addMessage(
        "assistant",
        "Sorry, I'm having trouble connecting. Please try again."
      );
    }

    this.isLoading = false;
    this.showTyping(false);
  }

  private addMessage(role: ChatMessage["role"], content: string): HTMLElement | null {
    const container = this.shadow.getElementById("chatMessages")!;

    // Remove welcome message on first message
    const welcome = container.querySelector(".welcome");
    if (welcome) welcome.remove();

    const div = document.createElement("div");
    div.className = `msg ${role}`;
    div.textContent = content;

    const time = document.createElement("div");
    time.className = "msg-time";
    time.textContent = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    div.appendChild(time);

    container.appendChild(div);
    this.scrollToBottom();

    this.messages.push({
      role,
      content,
      time: new Date().toISOString(),
    });

    return div;
  }

  private showTyping(show: boolean) {
    const el = this.shadow.getElementById("typing");
    if (el) el.classList.toggle("show", show);
  }

  private scrollToBottom() {
    const container = this.shadow.getElementById("chatMessages");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  private renderMarkdown(text: string): string {
    // Sanitize HTML entities first
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Unordered lists
    html = html.replace(/^[-•] (.+)$/gm, "<li>$1</li>");
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");
    // Paragraphs (double newline)
    html = html.replace(/\n\n/g, "</p><p>");
    html = `<p>${html}</p>`;
    // Single newlines to <br>
    html = html.replace(/\n/g, "<br>");
    // Clean empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, "");
    return html;
  }
}

// Register the custom element
if (!customElements.get("ai-chat-widget")) {
  customElements.define("ai-chat-widget", AIChatWidget);
}

// Auto-mount when loaded via script tag
(function () {
  const existing = document.querySelector("ai-chat-widget");
  if (existing) return;

  const script = document.currentScript as HTMLScriptElement;
  const apiKey = script?.getAttribute("data-api-key");

  if (apiKey) {
    const widget = document.createElement("ai-chat-widget");
    widget.setAttribute("data-api-key", apiKey);
    document.body.appendChild(widget);
  }
})();
