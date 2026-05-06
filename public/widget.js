"use strict";(()=>{var p=class extends HTMLElement{constructor(){super();this.config=null;this.apiKey="";this.apiBase="";this.conversationId=null;this.visitorId="";this.messages=[];this.isOpen=!1;this.isLoading=!1;this.shadow=this.attachShadow({mode:"open"}),this.visitorId=this.getOrCreateVisitorId()}async connectedCallback(){let e=document.querySelector('script[data-api-key][src*="widget"]');if(this.apiKey=this.getAttribute("data-api-key")||e?.getAttribute("data-api-key")||"",this.apiBase=this.getAttribute("data-api-base")||e?.src.replace(/\/widget\.js.*$/,"")||window.location.origin,!this.apiKey){console.error("[AI CS Widget] Missing data-api-key attribute");return}await this.fetchConfig(),this.render()}getOrCreateVisitorId(){let e="ai_cs_visitor_id",t=localStorage.getItem(e);return t||(t="v_"+Math.random().toString(36).slice(2)+Date.now().toString(36),localStorage.setItem(e,t)),t}async fetchConfig(){try{let e=await fetch(`${this.apiBase}/api/widget?api_key=${this.apiKey}`);e.ok&&(this.config=await e.json())}catch(e){console.error("[AI CS Widget] Failed to fetch config:",e)}this.config||(this.config={site_id:"",name:"Support",color:"#2563eb",position:"bottom-right",welcome_message:"Hi! How can I help you today?",auto_detect_language:!0})}getLocale(){return this.config?.auto_detect_language&&navigator.language||"en"}render(){let e=this.config?.color||"#2563eb",i=(this.config?.position||"bottom-right")==="bottom-left"?"left: 20px;":"right: 20px;";this.shadow.innerHTML=`
      <style>
        :host {
          --primary: ${e};
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
          ${i}
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
          ${i}
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

        .quick-links {
          padding: 8px 16px;
          display: flex;
          gap: 6px;
          overflow-x: auto;
          background: var(--card);
          border-top: 1px solid var(--border);
        }
        .quick-links:empty { display: none; }
        .quick-links::-webkit-scrollbar { display: none; }
        .quick-link {
          flex-shrink: 0;
          padding: 6px 12px;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--bg);
          color: var(--text);
          font-size: 11px;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: border-color 0.2s, background 0.2s, color 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .quick-link:hover {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
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
          <h3>${this.config?.name||"Support"}</h3>
          <button class="close" id="closeBtn">\u2715</button>
        </div>
        <div class="chat-messages" id="chatMessages">
          <div class="welcome">${this.config?.welcome_message||"Hi! How can I help?"}</div>
        </div>
        <div class="typing" id="typing">
          <span></span><span></span><span></span>
        </div>
        <div class="quick-links" id="quickLinks">
          ${(this.config?.quick_links||[]).map(o=>`<a class="quick-link" href="${o.url}" target="_blank" rel="noopener">${o.label} &rarr;</a>`).join("")}
        </div>
        <div class="chat-input">
          <input type="text" id="msgInput" placeholder="Type a message..." />
          <button id="sendBtn">Send</button>
        </div>
      </div>
    `,this.bindEvents()}bindEvents(){let e=this.shadow.getElementById("trigger"),t=this.shadow.getElementById("closeBtn"),i=this.shadow.getElementById("sendBtn"),o=this.shadow.getElementById("msgInput"),a=this.shadow.getElementById("chatWindow");e.addEventListener("click",()=>{this.isOpen=!this.isOpen,a.classList.toggle("open",this.isOpen),this.isOpen&&o.focus()}),t.addEventListener("click",()=>{this.isOpen=!1,a.classList.remove("open")}),i.addEventListener("click",()=>this.sendMessage()),o.addEventListener("keydown",r=>{r.key==="Enter"&&!r.shiftKey&&(r.preventDefault(),this.sendMessage())})}async sendMessage(){let e=this.shadow.getElementById("msgInput"),t=e.value.trim();if(!(!t||this.isLoading)){e.value="",this.addMessage("user",t),this.isLoading=!0,this.showTyping(!0);try{let i=await fetch(`${this.apiBase}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({api_key:this.apiKey,conversation_id:this.conversationId,visitor_id:this.visitorId,message:t,locale:this.getLocale()})}),o=i.headers.get("X-Conversation-Id");if(o&&(this.conversationId=o),!i.ok)throw new Error("Failed to get response");let a=i.body?.getReader(),r=new TextDecoder,d="";if(a){this.showTyping(!1);let s=this.addMessage("assistant","");for(;;){let{done:c,value:n}=await a.read();if(c)break;let u=r.decode(n,{stream:!0}).split(`
`);for(let l of u)if(l.startsWith("0:"))try{let m=JSON.parse(l.slice(2));d+=m,s&&(s.textContent=d,this.scrollToBottom())}catch{}}if(s){let c=d.replace(/\[NEEDS_HUMAN:(HIGH|NORMAL)\]/g,"").trim(),n=s.querySelector(".msg-time");s.innerHTML=this.renderMarkdown(c),n&&s.appendChild(n)}}}catch{this.showTyping(!1),this.addMessage("assistant","Sorry, I'm having trouble connecting. Please try again.")}this.isLoading=!1,this.showTyping(!1)}}addMessage(e,t){let i=this.shadow.getElementById("chatMessages"),o=i.querySelector(".welcome");o&&o.remove();let a=document.createElement("div");a.className=`msg ${e}`,a.textContent=t;let r=document.createElement("div");return r.className="msg-time",r.textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),a.appendChild(r),i.appendChild(a),this.scrollToBottom(),this.messages.push({role:e,content:t,time:new Date().toISOString()}),a}showTyping(e){let t=this.shadow.getElementById("typing");t&&t.classList.toggle("show",e)}scrollToBottom(){let e=this.shadow.getElementById("chatMessages");e&&(e.scrollTop=e.scrollHeight)}renderMarkdown(e){let t=e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return t=t.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),t=t.replace(/`([^`]+)`/g,"<code>$1</code>"),t=t.replace(/^[-•] (.+)$/gm,"<li>$1</li>"),t=t.replace(/((?:<li>.*<\/li>\n?)+)/g,"<ul>$1</ul>"),t=t.replace(/\n\n/g,"</p><p>"),t=`<p>${t}</p>`,t=t.replace(/\n/g,"<br>"),t=t.replace(/<p>\s*<\/p>/g,""),t}};customElements.get("ai-chat-widget")||customElements.define("ai-chat-widget",p);(function(){if(document.querySelector("ai-chat-widget"))return;let e=document.currentScript?.getAttribute("data-api-key");if(e){let t=document.createElement("ai-chat-widget");t.setAttribute("data-api-key",e),document.body.appendChild(t)}})();})();
