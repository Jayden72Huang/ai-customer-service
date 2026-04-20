"use strict";(()=>{var d=class extends HTMLElement{constructor(){super();this.config=null;this.apiKey="";this.apiBase="";this.conversationId=null;this.visitorId="";this.messages=[];this.isOpen=!1;this.isLoading=!1;this.shadow=this.attachShadow({mode:"open"}),this.visitorId=this.getOrCreateVisitorId()}async connectedCallback(){let t=document.querySelector('script[data-api-key][src*="widget"]');if(this.apiKey=this.getAttribute("data-api-key")||t?.getAttribute("data-api-key")||"",this.apiBase=this.getAttribute("data-api-base")||t?.src.replace(/\/widget\.js.*$/,"")||window.location.origin,!this.apiKey){console.error("[AI CS Widget] Missing data-api-key attribute");return}await this.fetchConfig(),this.render()}getOrCreateVisitorId(){let t="ai_cs_visitor_id",e=localStorage.getItem(t);return e||(e="v_"+Math.random().toString(36).slice(2)+Date.now().toString(36),localStorage.setItem(t,e)),e}async fetchConfig(){try{let t=await fetch(`${this.apiBase}/api/widget?api_key=${this.apiKey}`);t.ok&&(this.config=await t.json())}catch(t){console.error("[AI CS Widget] Failed to fetch config:",t)}this.config||(this.config={site_id:"",name:"Support",color:"#2563eb",position:"bottom-right",welcome_message:"Hi! How can I help you today?",auto_detect_language:!0})}getLocale(){return this.config?.auto_detect_language&&navigator.language||"en"}render(){let t=this.config?.color||"#2563eb",i=(this.config?.position||"bottom-right")==="bottom-left"?"left: 20px;":"right: 20px;";this.shadow.innerHTML=`
      <style>
        :host {
          --primary: ${t};
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
          <h3>${this.config?.name||"Support"}</h3>
          <button class="close" id="closeBtn">\u2715</button>
        </div>
        <div class="chat-messages" id="chatMessages">
          <div class="welcome">${this.config?.welcome_message||"Hi! How can I help?"}</div>
        </div>
        <div class="typing" id="typing">
          <span></span><span></span><span></span>
        </div>
        <div class="chat-input">
          <input type="text" id="msgInput" placeholder="Type a message..." />
          <button id="sendBtn">Send</button>
        </div>
      </div>
    `,this.bindEvents()}bindEvents(){let t=this.shadow.getElementById("trigger"),e=this.shadow.getElementById("closeBtn"),i=this.shadow.getElementById("sendBtn"),a=this.shadow.getElementById("msgInput"),o=this.shadow.getElementById("chatWindow");t.addEventListener("click",()=>{this.isOpen=!this.isOpen,o.classList.toggle("open",this.isOpen),this.isOpen&&a.focus()}),e.addEventListener("click",()=>{this.isOpen=!1,o.classList.remove("open")}),i.addEventListener("click",()=>this.sendMessage()),a.addEventListener("keydown",s=>{s.key==="Enter"&&!s.shiftKey&&(s.preventDefault(),this.sendMessage())})}async sendMessage(){let t=this.shadow.getElementById("msgInput"),e=t.value.trim();if(!(!e||this.isLoading)){t.value="",this.addMessage("user",e),this.isLoading=!0,this.showTyping(!0);try{let i=await fetch(`${this.apiBase}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({api_key:this.apiKey,conversation_id:this.conversationId,visitor_id:this.visitorId,message:e,locale:this.getLocale()})}),a=i.headers.get("X-Conversation-Id");if(a&&(this.conversationId=a),!i.ok)throw new Error("Failed to get response");let o=i.body?.getReader(),s=new TextDecoder,r="";if(o){this.showTyping(!1);let n=this.addMessage("assistant","");for(;;){let{done:g,value:h}=await o.read();if(g)break;let u=s.decode(h,{stream:!0}).split(`
`);for(let c of u)if(c.startsWith("0:"))try{let m=JSON.parse(c.slice(2));r+=m,n&&(n.textContent=r,this.scrollToBottom())}catch{}}n&&(n.textContent=r.replace(/\[NEEDS_HUMAN:(HIGH|NORMAL)\]/g,"").trim())}}catch{this.showTyping(!1),this.addMessage("assistant","Sorry, I'm having trouble connecting. Please try again.")}this.isLoading=!1,this.showTyping(!1)}}addMessage(t,e){let i=this.shadow.getElementById("chatMessages"),a=i.querySelector(".welcome");a&&a.remove();let o=document.createElement("div");o.className=`msg ${t}`,o.textContent=e;let s=document.createElement("div");return s.className="msg-time",s.textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),o.appendChild(s),i.appendChild(o),this.scrollToBottom(),this.messages.push({role:t,content:e,time:new Date().toISOString()}),o}showTyping(t){let e=this.shadow.getElementById("typing");e&&e.classList.toggle("show",t)}scrollToBottom(){let t=this.shadow.getElementById("chatMessages");t&&(t.scrollTop=t.scrollHeight)}};customElements.get("ai-chat-widget")||customElements.define("ai-chat-widget",d);(function(){if(document.querySelector("ai-chat-widget"))return;let t=document.currentScript?.getAttribute("data-api-key");if(t){let e=document.createElement("ai-chat-widget");e.setAttribute("data-api-key",t),document.body.appendChild(e)}})();})();
