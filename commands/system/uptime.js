'use strict';

function fmtUptime(sec) {
    sec = Math.floor(sec);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return { d, h, m, s, text: `${d}d ${h}h ${m}m ${s}s` };
}

function buildUptimeHtml({ text, d, h, m, s, mem, version }) {
    // crude session health bar — caps at ~7 days visual
    const totalMin = d * 1440 + h * 60 + m;
    const pct = Math.min(100, Math.max(8, (totalMin / (7 * 1440)) * 100)).toFixed(1);

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MADARA X-MD · Uptime</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{min-height:100vh;background:#0a0a0c;display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;padding:16px}
  .card{
    width:100%;max-width:640px;padding:16px 22px 18px;border-radius:24px;color:#fff;
    background:linear-gradient(90deg,#0a121a,#0d0d10 55%,#0a1018);
    border:1px solid rgba(255,255,255,.08);
    box-shadow:0 20px 60px rgba(0,0,0,.7);
    position:relative;overflow:hidden
  }
  .card::before{content:"";position:absolute;inset:0;background:radial-gradient(300px 140px at 100% -10%,rgba(56,189,248,.28),transparent 60%);pointer-events:none}
  .top{display:flex;align-items:center;gap:10px;position:relative}
  .logo{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#38bdf8,#0369a1);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 8px 20px rgba(56,189,248,.4)}
  .top h1{font-size:17px}
  .top p{font-size:11px;color:#999;margin-top:1px}
  .live{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;background:#12281a;border:1px solid #2a5a3a;color:#6dff8a;padding:6px 11px;border-radius:100px}
  .live i{width:7px;height:7px;background:#2aff7a;border-radius:50%;display:block;box-shadow:0 0 10px #2aff7a;animation:blink 1s infinite}
  @keyframes blink{50%{opacity:.3}}
  .main{display:flex;gap:14px;margin-top:14px;position:relative}
  .left{flex:1.4;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:14px 16px}
  .left small{font-size:10px;letter-spacing:2px;color:#888}
  .big{font-size:34px;font-weight:800;margin:6px 0 2px;line-height:1.05}
  .big span{font-size:14px;color:#7dd3fc}
  .hint{font-size:12px;color:#aaa}
  .bar{height:7px;background:#222;border-radius:20px;overflow:hidden;margin-top:12px}
  .bar i{display:block;height:100%;width:${pct}%;border-radius:20px;background:linear-gradient(90deg,#38bdf8,#7dd3fc);box-shadow:0 0 12px rgba(56,189,248,.55)}
  .bar-labels{display:flex;justify-content:space-between;font-size:10px;color:#666;margin-top:5px}
  .right{flex:1;display:flex;flex-direction:column;gap:10px}
  .mini{display:flex;justify-content:space-between;align-items:center;flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:10px 14px}
  .mini small{font-size:10px;color:#888;letter-spacing:1px}
  .mini b{font-size:14px}
  .foot{margin-top:14px;text-align:center;font-size:10px;color:#666;position:relative}
</style>
</head>
<body>
  <div class="card">
    <div class="top">
      <div class="logo">⏱</div>
      <div><h1>MADARA X-MD</h1><p>Uptime Monitor</p></div>
      <div class="live"><i></i> RUNNING</div>
    </div>

    <div class="main">
      <div class="left">
        <small>SESSION UPTIME</small>
        <div class="big">${text}</div>
        <div class="hint">Continuous runtime since last restart</div>
        <div class="bar"><i></i></div>
        <div class="bar-labels"><span>0</span><span>Session</span><span>~7d</span></div>
      </div>

      <div class="right">
        <div class="mini"><small>DAYS</small><b>${d}</b></div>
        <div class="mini"><small>HOURS</small><b>${h}</b></div>
        <div class="mini"><small>MIN</small><b>${m}</b></div>
        <div class="mini"><small>SEC</small><b>${s}</b></div>
        <div class="mini"><small>MEM</small><b>${mem} MB</b></div>
        <div class="mini"><small>VER</small><b>v${version}</b></div>
      </div>
    </div>

    <div class="foot">© MADARA INCORPORATION · UPTIME</div>
  </div>
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
        console.log('[uptime] html fail:', e.message);
    }
    return ctx.reply(fallbackText);
}

module.exports = {
    name: 'uptime',
    aliases: ['up', 'runtime2'],
    category: 'system',
    desc: 'Show bot uptime (rich)',
    usage: '.uptime',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings || {};
        const u = fmtUptime(process.uptime());
        const mem = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
        const html = buildUptimeHtml({
            ...u,
            mem,
            version: s.version || '1.x',
        });
        const fallback = `⏱️ *ᴜᴘᴛɪᴍᴇ:* *${u.text}*${s.FOOTER || ''}`;
        return sendRich(sock, msg, ctx, html, fallback);
    },
};
