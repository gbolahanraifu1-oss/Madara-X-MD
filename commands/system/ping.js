'use strict';

function buildPingHtml(ms) {
    const n = Math.max(1, Math.floor(Number(ms) || 1));
    let status = 'Excellent • Stable connection';
    let barColor = 'linear-gradient(90deg,#2aff7a,#7affb0)';
    if (n >= 120) {
        status = 'Slow • High latency';
        barColor = 'linear-gradient(90deg,#ff2a2a,#ff8a5a)';
    } else if (n >= 60) {
        status = 'Good • Slight delay';
        barColor = 'linear-gradient(90deg,#ffaa00,#ffdd55)';
    }
    const pct = Math.min(100, Math.max(5, (n / 200) * 100)).toFixed(1);

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MADARA X-MD · Ping</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{min-height:100vh;background:#0a0a0c;display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;padding:16px}
  .card{
    width:100%;max-width:640px;padding:16px 22px 16px;border-radius:24px;color:#fff;
    background:linear-gradient(90deg,#1a0a0a,#0d0d10 55%,#140505);
    border:1px solid rgba(255,255,255,.08);
    box-shadow:0 20px 60px rgba(0,0,0,.7);
    position:relative;overflow:hidden;
    display:flex;flex-direction:column
  }
  .card::before{content:"";position:absolute;inset:0;background:radial-gradient(300px 140px at 95% -10%,rgba(255,30,30,.35),transparent 60%);pointer-events:none}
  .top{display:flex;align-items:center;gap:10px;position:relative}
  .logo{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#ff2a2a,#7a0000);display:flex;align-items:center;justify-content:center;font-size:19px;box-shadow:0 8px 20px rgba(255,0,0,.4)}
  .top h1{font-size:17px}
  .top p{font-size:11px;color:#999;margin-top:1px}
  .live{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;background:#12281a;border:1px solid #2a5a3a;color:#6dff8a;padding:6px 11px;border-radius:100px}
  .live i{width:7px;height:7px;background:#2aff7a;border-radius:50%;display:block;box-shadow:0 0 10px #2aff7a;animation:blink 1s infinite}
  @keyframes blink{50%{opacity:.3}}
  .main{display:flex;gap:14px;margin-top:14px;position:relative}
  .left{flex:1.4;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:14px 16px}
  .left small{font-size:10px;letter-spacing:2px;color:#888}
  .big{font-size:44px;font-weight:800;margin:4px 0 1px;line-height:1}
  .big span{font-size:16px;color:#ff5a5a}
  #statusText{font-size:12px;color:#aaa}
  .bar{height:7px;background:#222;border-radius:20px;overflow:hidden;margin-top:10px}
  .bar i{display:block;height:100%;width:${pct}%;border-radius:20px;background:${barColor};box-shadow:0 0 12px rgba(255,42,42,.35)}
  .bar-labels{display:flex;justify-content:space-between;font-size:10px;color:#666;margin-top:5px}
  .right{flex:1;display:flex;flex-direction:column;gap:10px}
  .mini{display:flex;justify-content:space-between;align-items:center;flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:10px 14px}
  .mini small{font-size:10px;color:#888;letter-spacing:1px}
  .mini b{font-size:14px}
  .btn{margin-top:12px;width:100%;padding:11px;border:0;border-radius:14px;background:#fff;color:#000;font-weight:700;font-size:14px;cursor:pointer;position:relative}
</style>
</head>
<body>
  <div class="card">
    <div class="top">
      <div class="logo">◉</div>
      <div><h1>MADARA X-MD</h1><p>Ping Monitor</p></div>
      <div class="live"><i></i> ONLINE</div>
    </div>

    <div class="main">
      <div class="left">
        <small>CURRENT PING</small>
        <div class="big"><span id="msNum">${n}</span><span> ms</span></div>
        <div id="statusText">${status}</div>
        <div class="bar"><i id="pingBar"></i></div>
        <div class="bar-labels"><span>0ms</span><span>Fast</span><span>200ms</span></div>
      </div>

      <div class="right">
        <div class="mini"><small>GRADE</small><b>${n < 60 ? 'BLAZING' : n < 120 ? 'GOOD' : 'SLOW'}</b></div>
        <div class="mini"><small>SERVER</small><b>Online</b></div>
      </div>
    </div>

    <button class="btn" onclick="checkNow()">Check Again →</button>
  </div>

<script>
  const msNum = document.getElementById('msNum');
  const bar = document.getElementById('pingBar');
  const statusText = document.getElementById('statusText');
  let current = ${n};
  function updatePing(newMs){
    current = newMs;
    msNum.textContent = newMs;
    let pct = Math.min(100, Math.max(5, (newMs / 200) * 100));
    bar.style.width = pct + '%';
    if(newMs < 60){
      bar.style.background = 'linear-gradient(90deg,#2aff7a,#7affb0)';
      statusText.textContent = 'Excellent • Stable connection';
    } else if(newMs < 120){
      bar.style.background = 'linear-gradient(90deg,#ffaa00,#ffdd55)';
      statusText.textContent = 'Good • Slight delay';
    } else {
      bar.style.background = 'linear-gradient(90deg,#ff2a2a,#ff8a5a)';
      statusText.textContent = 'Slow • High latency';
    }
  }
  function randomPing(){
    let change = Math.floor(Math.random() * 21) - 10;
    let next = current + change;
    if(next < 18) next = 18;
    if(next > 180) next = 180;
    updatePing(next);
  }
  function checkNow(){ updatePing(Math.floor(Math.random()*60)+25); }
  updatePing(current);
  setInterval(randomPing, 1200);
</script>
</body>
</html>`;
}

async function sendRich(sock, msg, ctx, html, fallbackText) {
    try {
        const { sendHtmlString } = require('../../utils/sendHtml');
        await sendHtmlString({
            sock,
            jid: ctx.from || msg.key.remoteJid,
            html,
            quoted: msg,
        });
        return;
    } catch (e) {
        console.log('[ping] html fail:', e.message);
    }
    return ctx.reply(fallbackText);
}

module.exports = {
    name: 'ping',
    aliases: ['latency', 'speed'],
    category: 'system',
    desc: 'Check bot response time (rich)',
    usage: '.ping',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings || {};
        const start = msg.messageTimestamp ? msg.messageTimestamp * 1000 : Date.now();
        const ms = Math.max(1, Date.now() - start);
        const html = buildPingHtml(ms);
        const fallback = `🎯 *${s.botName || 'MADARA'} sᴘᴇᴇᴅ:* *${ms}ᴍs*${s.FOOTER || ''}`;
        return sendRich(sock, msg, ctx, html, fallback);
    },
};
