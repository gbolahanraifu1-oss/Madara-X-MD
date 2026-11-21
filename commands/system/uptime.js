'use strict';

function fmtUptime(sec) {
    sec = Math.floor(sec);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return { d, h, m, s, text: `${d}d ${h}h ${m}m ${s}s` };
}

function madaraStatusHtml({ title, kicker, rows, accent }) {
    const items = rows.map((r) => `
      <div class="row">
        <div class="label">${r.label}</div>
        <div class="value">${r.value}</div>
      </div>`).join('');

    return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>MADARA · ${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;min-height:100%;background:#05070c;color:#f1e9ff;
font-family:Arial Black,Arial,sans-serif}
body{padding:14px;background:
 radial-gradient(circle at 15% 0%,#2a0f45 0%,transparent 42%),
 radial-gradient(circle at 90% 20%,#1a0830 0%,#05070c 55%)}
.card{max-width:400px;margin:0 auto;border:1px solid ${accent}88;border-radius:18px;
background:linear-gradient(160deg,#140a24 0%,#080410 100%);
box-shadow:0 0 28px ${accent}33;overflow:hidden}
.head{padding:16px 16px 10px;text-align:center;border-bottom:1px solid #ffffff12}
.kicker{color:${accent};font:10px monospace;letter-spacing:3px;margin-bottom:6px}
.h1{font:900 22px Arial Black,sans-serif;letter-spacing:1px;color:#fff;
text-shadow:0 0 14px ${accent}}
.sub{margin-top:4px;color:#94a3b8;font:10px monospace}
.body{padding:14px 16px 8px}
.row{display:flex;justify-content:space-between;align-items:center;
padding:10px 0;border-bottom:1px solid #ffffff0d}
.row:last-child{border-bottom:none}
.label{color:#94a3b8;font:11px monospace;letter-spacing:.5px}
.value{color:#f8fafc;font:bold 13px Arial,sans-serif;text-align:right;max-width:60%}
.barwrap{margin:12px 16px 4px;height:8px;border-radius:99px;background:#1e1030;overflow:hidden}
.bar{height:100%;width:72%;border-radius:99px;
background:linear-gradient(90deg,${accent},${accent}aa,#fff3);
box-shadow:0 0 12px ${accent}}
.foot{padding:12px 16px 16px;text-align:center;color:#64748b;font:9px monospace}
.pulse{display:inline-block;width:8px;height:8px;border-radius:50%;
background:${accent};box-shadow:0 0 10px ${accent};margin-right:6px;
animation:p 1.4s infinite}
@keyframes p{0%,100%{opacity:1}50%{opacity:.35}}
</style></head><body>
<div class="card">
  <div class="head">
    <div class="kicker">MADARA X-MD // STATUS</div>
    <div class="h1"><span class="pulse"></span>${title}</div>
    <div class="sub">${kicker}</div>
  </div>
  <div class="body">${items}</div>
  <div class="barwrap"><div class="bar"></div></div>
  <div class="foot">© MADARA INCORPORATION · LIVE</div>
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
        const html = madaraStatusHtml({
            title: 'UPTIME',
            kicker: 'bot runtime · continuous session',
            accent: '#a855f7',
            rows: [
                { label: 'RUNTIME', value: u.text },
                { label: 'DAYS', value: String(u.d) },
                { label: 'HOURS', value: String(u.h) },
                { label: 'MINUTES', value: String(u.m) },
                { label: 'SECONDS', value: String(u.s) },
                { label: 'MEMORY', value: `${mem} MB` },
                { label: 'VERSION', value: `v${s.version || '1.x'}` },
            ],
        });
        const fallback = `⏱️ *ᴜᴘᴛɪᴍᴇ:* *${u.d}ᴅ ${u.h}ʜ ${u.m}ᴍ ${u.s}s*${s.FOOTER || ''}`;
        return sendRich(sock, msg, ctx, html, fallback);
    },
};
