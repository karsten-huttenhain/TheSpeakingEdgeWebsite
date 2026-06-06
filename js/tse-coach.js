/* ═══════════════════════════════════════════════════════════════
   TSE AI Coach — floating coaching panel for guide and course pages
   Self-contained: injects its own HTML and CSS.
   Usage: include this script, then call tseInitCoach({ chapter: '...' })
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var sessionId = sessionStorage.getItem('tse-coach-session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('tse-coach-session', sessionId);
  }

  var OFFLINE_RESPONSES = [
    "That sounds like a moment worth preparing for carefully. What does your opening line look like right now?",
    "The pause before you speak carries more weight than most people realise. What do you usually do in that moment?",
    "Quiet authority often comes from knowing exactly what you want the room to walk away with. What's the one thing you need them to remember?",
    "Notice what happens in your body before you speak — that's useful information, not an obstacle. What are you feeling?",
    "Deep preparation is a form of presence. The room can feel when you know your material and when you're performing knowing it. What's the difference for you?",
  ];

  var coachContext  = {};
  var messages      = [];
  var userApiKey    = null;
  var isOpen        = false;
  var welcomed      = false;
  var offlineIndex  = 0;
  var sending       = false;

  /* ── Styles ── */
  var style = document.createElement('style');
  style.textContent = [
    '#tse-coach-btn{position:fixed;bottom:24px;right:24px;background:#C8392B;color:#fff;border:none;border-radius:50px;padding:11px 18px;font-family:"Source Sans Pro",Arial,sans-serif;font-size:13.5px;font-weight:700;cursor:pointer;z-index:780;box-shadow:0 4px 20px rgba(0,0,0,0.35);transition:transform 0.2s,background 0.2s;display:flex;align-items:center;gap:7px;}',
    '#tse-coach-btn:hover{background:#a82d24;transform:translateY(-2px);}',
    '#tse-coach-panel{position:fixed;bottom:78px;right:24px;width:360px;max-height:500px;background:#12121f;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,0.55);display:flex;flex-direction:column;z-index:780;overflow:hidden;transition:opacity 0.22s,transform 0.22s;font-family:"Source Sans Pro",Arial,sans-serif;}',
    '#tse-coach-panel.tse-coach-hidden{opacity:0;transform:translateY(10px);pointer-events:none;}',
    '#tse-coach-hdr{background:#C8392B;padding:13px 16px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;}',
    '#tse-coach-hdr h4{margin:0;color:#fff;font-size:14.5px;font-weight:700;letter-spacing:0.01em;}',
    '#tse-coach-x{background:none;border:none;color:rgba(255,255,255,0.8);font-size:22px;cursor:pointer;padding:0 2px;line-height:1;transition:color 0.15s;}',
    '#tse-coach-x:hover{color:#fff;}',
    '#tse-coach-msgs{flex:1;overflow-y:auto;padding:14px 14px 8px;display:flex;flex-direction:column;gap:9px;min-height:120px;}',
    '.tse-m{max-width:88%;padding:9px 13px;border-radius:10px;font-size:13.5px;line-height:1.55;word-break:break-word;}',
    '.tse-m-coach{background:rgba(255,255,255,0.07);color:#dde0e8;align-self:flex-start;border-radius:10px 10px 10px 2px;}',
    '.tse-m-user{background:#C8392B;color:#fff;align-self:flex-end;border-radius:10px 10px 2px 10px;}',
    '.tse-m-sys{background:rgba(232,160,32,0.12);color:#E8A020;align-self:center;font-size:12px;text-align:center;padding:6px 12px;border-radius:20px;max-width:100%;}',
    '#tse-coach-typing{color:#666;font-size:12px;padding:0 14px 6px;min-height:20px;}',
    '#tse-coach-foot{padding:10px 12px;border-top:1px solid rgba(255,255,255,0.07);display:flex;gap:8px;flex-shrink:0;}',
    '#tse-coach-inp{flex:1;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.13);border-radius:8px;padding:8px 11px;color:#fff;font-family:"Source Sans Pro",Arial,sans-serif;font-size:13.5px;resize:none;outline:none;line-height:1.4;}',
    '#tse-coach-inp::placeholder{color:#555;}',
    '#tse-coach-inp:focus{border-color:rgba(200,57,43,0.5);}',
    '#tse-coach-send{background:#C8392B;border:none;color:#fff;border-radius:8px;padding:8px 13px;cursor:pointer;font-size:17px;transition:background 0.18s;flex-shrink:0;}',
    '#tse-coach-send:hover:not(:disabled){background:#a82d24;}',
    '#tse-coach-send:disabled{opacity:0.5;cursor:default;}',
    '#tse-coach-keyrow{padding:0 12px 10px;}',
    '#tse-coach-key{width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(232,160,32,0.35);border-radius:7px;padding:7px 11px;color:#E8A020;font-size:12px;font-family:monospace;outline:none;}',
    '#tse-coach-key::placeholder{color:#555;}',
    '@media(max-width:420px){#tse-coach-panel{right:8px;left:8px;width:auto;bottom:72px;}#tse-coach-btn{right:14px;bottom:14px;}}',
  ].join('');
  document.head.appendChild(style);

  /* ── DOM ── */
  var panel = document.createElement('div');
  panel.id = 'tse-coach-panel';
  panel.className = 'tse-coach-hidden';
  panel.setAttribute('aria-label', 'Speaking coach');
  panel.innerHTML =
    '<div id="tse-coach-hdr"><h4>&#x1F3A7;&nbsp;Speaking Coach</h4><button id="tse-coach-x" aria-label="Close coach">&times;</button></div>' +
    '<div id="tse-coach-msgs"></div>' +
    '<div id="tse-coach-typing"></div>' +
    '<div id="tse-coach-foot"><textarea id="tse-coach-inp" placeholder="Ask your coach…" rows="1"></textarea><button id="tse-coach-send" aria-label="Send">&#x2191;</button></div>' +
    '<div id="tse-coach-keyrow" style="display:none"><input id="tse-coach-key" type="password" placeholder="Your Anthropic API key (optional — unlimited use)" /></div>';

  var btn = document.createElement('button');
  btn.id  = 'tse-coach-btn';
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '&#x1F3A7;&nbsp;Ask your coach';

  document.body.appendChild(panel);
  document.body.appendChild(btn);

  /* ── Events ── */
  btn.addEventListener('click', togglePanel);
  document.getElementById('tse-coach-x').addEventListener('click', togglePanel);
  document.getElementById('tse-coach-send').addEventListener('click', send);
  document.getElementById('tse-coach-inp').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  document.getElementById('tse-coach-key').addEventListener('change', function () {
    userApiKey = this.value.trim() || null;
  });

  /* ── Helpers ── */
  function togglePanel() {
    isOpen = !isOpen;
    panel.classList.toggle('tse-coach-hidden', !isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    if (isOpen && !welcomed) {
      welcomed = true;
      addMsg('coach', 'Hi — I\'m your speaking coach. Ask me anything about what you\'re working on, or describe a situation you\'re preparing for.');
    }
    if (isOpen) document.getElementById('tse-coach-inp').focus();
  }

  function addMsg(role, text) {
    var msgs = document.getElementById('tse-coach-msgs');
    var div  = document.createElement('div');
    div.className = 'tse-m tse-m-' + role;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function setTyping(on) {
    document.getElementById('tse-coach-typing').textContent = on ? 'Coach is thinking…' : '';
    document.getElementById('tse-coach-send').disabled = on;
  }

  /* ── Send ── */
  async function send() {
    if (sending) return;
    var inp  = document.getElementById('tse-coach-inp');
    var text = inp.value.trim();
    if (!text) return;

    inp.value = '';
    addMsg('user', text);
    messages.push({ role: 'user', content: text });

    if (!navigator.onLine) {
      var offline = OFFLINE_RESPONSES[offlineIndex++ % OFFLINE_RESPONSES.length];
      addMsg('coach', offline);
      messages.push({ role: 'assistant', content: offline });
      return;
    }

    sending = true;
    setTyping(true);

    try {
      var res = await fetch('/.netlify/functions/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:       messages.slice(-10),
          chapterContext: coachContext.chapter || '',
          sessionId:      sessionId,
          apiKey:         userApiKey || undefined,
        }),
      });

      setTyping(false);
      sending = false;

      if (res.status === 429) {
        var err = await res.json();
        var sys = document.createElement('div');
        sys.className = 'tse-m tse-m-sys';
        sys.textContent = err.message || 'Daily limit reached. Come back tomorrow.';
        document.getElementById('tse-coach-msgs').appendChild(sys);
        document.getElementById('tse-coach-msgs').scrollTop = document.getElementById('tse-coach-msgs').scrollHeight;
        document.getElementById('tse-coach-keyrow').style.display = 'block';
        return;
      }

      if (!res.ok) {
        addMsg('sys', 'Something went wrong — please try again.');
        return;
      }

      var data  = await res.json();
      var reply = data.reply || '';
      addMsg('coach', reply);
      messages.push({ role: 'assistant', content: reply });

    } catch (e) {
      setTyping(false);
      sending = false;
      var errDiv = document.createElement('div');
      errDiv.className = 'tse-m tse-m-sys';
      errDiv.textContent = 'Connection error — please try again.';
      document.getElementById('tse-coach-msgs').appendChild(errDiv);
      document.getElementById('tse-coach-msgs').scrollTop = document.getElementById('tse-coach-msgs').scrollHeight;
    }
  }

  /* ── Public init ── */
  window.tseInitCoach = function (context) {
    coachContext = context || {};
  };

}());
