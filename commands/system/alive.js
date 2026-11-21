'use strict';
const os = require('os');

function fmtUptime(sec) {
    sec = Math.floor(sec);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return { d, h, m, s, text: `${d}d ${h}h ${m}m ${s}s` };
}

function buildAliveHtml({ botName, version, uptime, mem, ram, platform, owner }) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MADARA X-MD · Alive</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{min-height:100vh;background:#0a0a0c;display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;padding:16px}
  .card{
    width:100%;max-width:640px;padding:16px 22px 18px;border-radius:24px;color:#fff;
    background:linear-gradient(115deg,#120818 0%,#0d0d10 50%,#1a0a14 100%);
    border:1px solid rgba(255,255,255,.08);
    box-shadow:0 20px 60px rgba(0,0,0,.7);
    position:relative;overflow:hidden
  }
  .card::before{content:"";position:absolute;inset:0;background:radial-gradient(280px 140px at 0% -10%,rgba(168,85,247,.35),transparent 60%);pointer-events:none}
  .top{display:flex;align-items:center;gap:10px;position:relative}
  .logo{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#4c1d95);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 8px 20px rgba(168,85,247,.45)}
  .top h1{font-size:17px}
  .top p{font-size:11px;color:#999;margin-top:1px}
  .live{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;background:#12281a;border:1px solid #2a5a3a;color:#6dff8a;padding:6px 11px;border-radius:100px}
  .live i{width:7px;height:7px;background:#2aff7a;border-radius:50%;display:block;box-shadow:0 0 10px #2aff7a;animation:blink 1s infinite}
  @keyframes blink{50%{opacity:.3}}
  .hero{margin-top:16px;position:relative;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:16px}
  .hero small{font-size:10px;letter-spacing:2px;color:#888}
  .hero .name{font-size:26px;font-weight:800;margin:4px 0 2px;line-height:1.1}
  .hero .tag{font-size:12px;color:#c4b5fd}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;position:relative}
  .mini{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:12px 14px}
  .mini small{display:block;font-size:10px;color:#888;letter-spacing:1px;margin-bottom:4px}
  .mini b{font-size:14px}
  .foot{margin-top:14px;text-align:center;font-size:10px;color:#666;position:relative}
</style>
</head>
<body>
  <div class="card">
    <div class="top">
      <div class="logo">🩸</div>
      <div><h1>${botName}</h1><p>System Status</p></div>
      <div class="live"><i></i> ALIVE</div>
    </div>

    <div class="hero">
      <small>BOT STATUS</small>
      <div class="name">ONLINE</div>
      <div class="tag">Still standing · Madara core active</div>
    </div>

    <div class="grid">
      <div class="mini"><small>UPTIME</small><b>${uptime}</b></div>
      <div class="mini"><small>VERSION</small><b>v${version}</b></div>
      <div class="mini"><small>MEMORY</small><b>${mem} MB / ${ram} GB</b></div>
      <div class="mini"><small>PLATFORM</small><b>${platform}</b></div>
      <div class="mini"><small>OWNER</small><b>${owner}</b></div>
      <div class="mini"><small>MODE</small><b>Production</b></div>
    </div>

    <div class="foot">© MADARA INCORPORATION · STILL STANDING</div>
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
        console.log('[alive] html fail:', e.message);
    }
    return ctx.reply(fallbackText);
}

module.exports = {
    name: 'alive',
    aliases: ['online', 'active'],
    category: 'system',
    desc: 'Confirm bot is online (rich)',
    usage: '.alive',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings || {};
        const up = fmtUptime(process.uptime());
        const mem = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
        const ram = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
        const botName = s.botName || 'MADARA X-MD';
        const version = s.version || '1.x';
        const owner = s.ownerName || 'Madara';
        const platform = `${os.type()} · ${os.arch()}`;

        const html = buildAliveHtml({
            botName,
            version,
            uptime: up.text,
            mem,
            ram,
            platform,
            owner,
        });

        const fallback =
            `✅ *${botName} is ALIVE*\n` +
            `⏱ ${up.text}\n` +
            `📦 v${version} · ${mem}MB/${ram}GB` +
            (s.FOOTER || '');

        return sendRich(sock, msg, ctx, html, fallback);
    },
};
