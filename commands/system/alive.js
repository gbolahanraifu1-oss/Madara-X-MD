'use strict';
const os = require('os');

function fmtUptime(sec) {
    sec = Math.floor(sec);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
}

function madaraAliveHtml({ botName, version, uptime, mem, ram, platform, owner }) {
    return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>MADARA · ALIVE</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;min-height:100%;background:#05070c;color:#f1e9ff;
font-family:Arial Black,Arial,sans-serif}
body{padding:14px;background:
 radial-gradient(circle at 50% -10%,#3b0764 0%,transparent 45%),
 radial-gradient(circle at 100% 40%,#0f172a 0%,#05070c 50%)}
.card{max-width:400px;margin:0 auto;border:1px solid #a855f788;border-radius:20px;
background:linear-gradient(165deg,#160a28 0%,#07040f 100%);
box-shadow:0 0 32px #a855f744;overflow:hidden}
.banner{height:78px;background:
 linear-gradient(120deg,#4c1d95 0%,#7c3aed 40%,#c084fc 100%);
position:relative}
.banner:after{content:'';position:absolute;inset:0;background:
 radial-gradient(circle at 20% 80%,#ffffff33,transparent 40%)}
.head{padding:0 16px 12px;text-align:center;margin-top:-28px;position:relative}
.badge{width:56px;height:56px;margin:0 auto 8px;border-radius:16px;
background:linear-gradient(145deg,#1e0b36,#0b0614);border:2px solid #c084fc;
display:flex;align-items:center;justify-content:center;font-size:26px;
box-shadow:0 0 18px #a855f788}
.h1{font:900 20px Arial Black,sans-serif;color:#fff;letter-spacing:1px;
text-shadow:0 0 12px #c084fc}
.live{margin-top:6px;display:inline-flex;align-items:center;gap:6px;
padding:4px 10px;border-radius:99px;background:#14532d55;border:1px solid #22c55e88;
color:#86efac;font:bold 10px monospace}
.dot{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e;
animation:p 1.2s infinite}
@keyframes p{0%,100%{opacity:1}50%{opacity:.3}}
.body{padding:6px 16px 10px}
.row{display:flex;justify-content:space-between;align-items:center;
padding:11px 0;border-bottom:1px solid #ffffff0d}
.row:last-child{border-bottom:none}
.label{color:#94a3b8;font:11px monospace}
.value{color:#f8fafc;font:bold 12px Arial,sans-serif;text-align:right;max-width:62%}
.foot{padding:12px 16px 16px;text-align:center;color:#64748b;font:9px monospace}
</style></head><body>
<div class="card">
  <div class="banner"></div>
  <div class="head">
    <div class="badge">🩸</div>
    <div class="h1">${botName}</div>
    <div class="live"><span class="dot"></span> ONLINE · ALIVE</div>
  </div>
  <div class="body">
    <div class="row"><div class="label">UPTIME</div><div class="value">${uptime}</div></div>
    <div class="row"><div class="label">VERSION</div><div class="value">v${version}</div></div>
    <div class="row"><div class="label">MEMORY</div><div class="value">${mem} MB / ${ram} GB</div></div>
    <div class="row"><div class="label">PLATFORM</div><div class="value">${platform}</div></div>
    <div class="row"><div class="label">OWNER</div><div class="value">${owner}</div></div>
  </div>
  <div class="foot">© MADARA INCORPORATION · STILL STANDING</div>
</div>
</body></html>`;
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
        const uptime = fmtUptime(process.uptime());
        const mem = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
        const ram = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
        const botName = s.botName || 'MADARA X-MD';
        const version = s.version || '1.x';
        const owner = s.ownerName || 'Madara';
        const platform = `${os.type()} · ${os.arch()}`;

        const html = madaraAliveHtml({
            botName,
            version,
            uptime,
            mem,
            ram,
            platform,
            owner,
        });

        const fallback =
            `✅ *${botName} is ALIVE*\n` +
            `⏱ ${uptime}\n` +
            `📦 v${version} · ${mem}MB/${ram}GB` +
            (s.FOOTER || '');

        return sendRich(sock, msg, ctx, html, fallback);
    },
};
