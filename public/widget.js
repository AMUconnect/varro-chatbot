(function () {
  const VARRO_API = "https://varro-chatbot-p263.vercel.app/api/chat";
  const varroHistory = [];
  let varroWelcomeShown = false;

  const style = document.createElement("style");
  style.textContent = `
    #varro-chat-bubble{position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;background:#b08968;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25);z-index:999999;font-size:28px;transition:transform .2s}
    #varro-chat-bubble:hover{transform:scale(1.08)}
    #varro-chat-window{position:fixed;bottom:100px;right:24px;width:360px;height:520px;max-width:calc(100vw - 48px);background:#1a1a1a;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.4);display:none;flex-direction:column;z-index:999999;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,sans-serif;border:1px solid #333;opacity:0;transform:translateY(20px);transition:opacity .35s ease,transform .35s ease}
    #varro-chat-window.open{display:flex}
    #varro-chat-window.visible{opacity:1;transform:translateY(0)}
    #varro-chat-header{background:#0f0f0f;color:#f5f0e6;padding:16px 20px;font-size:16px;font-weight:600;border-bottom:1px solid #2a2a2a}
    #varro-chat-header span{color:#b08968}
    #varro-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}
    .varro-msg{padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.45;max-width:80%;word-wrap:break-word}
    .varro-msg.user{background:#b08968;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
    .varro-msg.bot{background:#2a2a2a;color:#f5f0e6;align-self:flex-start;border-bottom-left-radius:4px}
    .varro-msg.typing{font-style:italic;opacity:.7}
    #varro-chat-input-wrap{display:flex;padding:12px;gap:8px;border-top:1px solid #2a2a2a;background:#0f0f0f}
    #varro-chat-input{flex:1;padding:10px 14px;border-radius:20px;border:1px solid #333;background:#1a1a1a;color:#f5f0e6;font-size:14px;outline:none}
    #varro-chat-input::placeholder{color:#666}
    #varro-chat-send{padding:10px 18px;border-radius:20px;background:#b08968;color:#fff;border:none;cursor:pointer;font-weight:600;font-size:14px}
    #varro-chat-send:disabled{opacity:.5;cursor:not-allowed}
  `;
  document.head.appendChild(style);

  const bubble = document.createElement("div");
  bubble.id = "varro-chat-bubble";
  bubble.textContent = "💬";
  document.body.appendChild(bubble);

  const win = document.createElement("div");
  win.id = "varro-chat-window";
  win.innerHTML = `
    <div id="varro-chat-header">Hi, ik ben de <span>Varro</span> host</div>
    <div id="varro-chat-messages"></div>
    <div id="varro-chat-input-wrap">
      <input id="varro-chat-input" placeholder="Stel je vraag..." />
      <button id="varro-chat-send">Stuur</button>
    </div>`;
  document.body.appendChild(win);

  const input = document.getElementById("varro-chat-input");
  const sendBtn = document.getElementById("varro-chat-send");
  const messages = document.getElementById("varro-chat-messages");

  function addMsg(role, text) {
    const d = document.createElement("div");
    d.className = "varro-msg " + (role === "user" ? "user" : "bot");
    d.textContent = text;
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
  }

  bubble.addEventListener("click", function () {
    if (win.classList.contains("open")) {
      win.classList.remove("visible");
      setTimeout(function () { win.classList.remove("open"); }, 350);
    } else {
      varroOpenSmooth();
    }
  });

  async function send() {
    const text = input.value.trim();
    if (!text) return;
    addMsg("user", text);
    varroHistory.push({ role: "user", content: text });
    input.value = "";
    sendBtn.disabled = true;

    const typingEl = document.createElement("div");
    typingEl.className = "varro-msg bot typing";
    typingEl.textContent = "...";
    messages.appendChild(typingEl);
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await fetch(VARRO_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: varroHistory })
      });
      const data = await res.json();
      typingEl.remove();
      const reply = data.reply || "Sorry, er ging iets mis.";
      addMsg("bot", reply);
      varroHistory.push({ role: "assistant", content: reply });
    } catch (e) {
      typingEl.remove();
      addMsg("bot", "Sorry, ik kan even niet antwoorden. Probeer het zo nog eens.");
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") send();
  });

  // Auto-open the chat shortly after the page loads
  // Open smoothly the first time the user scrolls
  let varroOpenedOnScroll = false;
  function varroOpenSmooth() {
    win.classList.add("open");
    // tiny delay so the slide animation runs
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { win.classList.add("visible"); });
    });
    if (!varroWelcomeShown) {
      addMsg("bot", "Welkom bij Varro! 👋 Ik help je graag met vragen over openingstijden, ons menu, reserveringen of de locatie. Waar kan ik mee helpen?");
      varroWelcomeShown = true;
    }
  }

  window.addEventListener("scroll", function () {
    if (!varroOpenedOnScroll && window.scrollY > 300) {
      varroOpenedOnScroll = true;
      varroOpenSmooth();
    }
  }, { passive: true });
