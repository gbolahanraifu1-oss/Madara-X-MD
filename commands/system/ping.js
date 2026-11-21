'use strict';

function madaraStatusHtml({ title, kicker, rows, accent, meter }) {
    const items = rows.map((r) => `
      <div class="row">
        <div class="label">${r.label}</div>
        <div class="value">${r.value}</div>
      </div>`).join('');
    const width = Math.max(6, Math.min(100, meter || 40));

    return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>MADARA · ${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;min-height:100%;background:#05070c;color:#f1e9ff;
font-family:Arial Black,Arial,sans-serif}
body{padding:14px;background:
 radial-gradient(circle at 80% 0%,#0f2a24 0%,transparent 40%),
 radial-gradient(circle at 10% 30%,#1a0830 0%,#05070c 55%)}
.card{max-width:400px;margin:0 auto;border:1px solid ${accent}88;border-radius:18px;
background:linear-gradient(160deg,#0a1a16 0%,#080410 100%);
box-shadow:0 0 28px ${accent}33;overflow:hidden}
.head{padding:16px 16px 10px;text-align:center;border-bottom:1px solid #ffffff12}
.kicker{color:${accent};font:10px monospace;letter-spacing:3px;margin-bottom:6px}
.h1{font:900 22px Arial Black,sans-serif;letter-spacing:1px;color:#fff;
text-shadow:0 0 14px ${accent}}
.sub{margin-top:4px;color:#94a3b8;font:10px monospace}
.bigms{margin:14px 0 4px;font:900 36px Arial Black,sans-serif;color:#fff;
text-shadow:0 0 20px ${accent}}
.body{padding:8px 16px 8px}
.row{display:flex;justify-content:space-between;align-items:center;
padding:10px 0;border-bottom:1px solid #ffffff0d}
.row:last-child{border-bottom:none}
.label{color:#94a3b8;font:11px monospace;letter-spacing:.5px}
.value{color:#f8fafc;font:bold 13px Arial,sans-serif}
.barwrap{margin:12px 16px 4px;height:10px;border-radius:99px;background:#10201c;overflow:hidden}
.bar{height:100%;width:${width}%;border-radius:99px;
background:linear-gradient(90deg,${accent},#4ade80,#fff3);
box-shadow:0 0 12px ${accent}}
.foot{padding:12px 16px 16px;text-align:center;color:#64748b;font:9px monospace}
</style></head><body>
<div class="card">
  <div class="head">
    <div class="kicker">MADARA X-MD // LATENCY</div>
    <div class="h1">${title}</div>
    <div class="sub">${kicker}</div>
    <div class="bigms">${rows[0] ? rows[0].value : '—'}</div>
  </div>
  <div class="body">${items.slice(1).join('') || items}</div>
  <div class="barwrap"><div class="bar"></div></div>
  <div class="foot">© MADARA INCORPORATION · SPEED CHECK</div>
</div>
</body></html>`;
}

function speedLabel(ms) {
    if (ms < 150) return 'BLAZING';
    if (ms < 350) return 'FAST';
    if (ms < 700) return 'OK';
    return 'SLOW';
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
        // measure actual send RTT
        const t0 = Date.now();
        const rttMsg = Math.max(0, t0 - start);
        const local = Date.now() - t0;
        const ms = rttMsg || local || 1;
        const grade = speedLabel(ms);
        const accent = ms < 350 ? '#22c55e' : ms < 700 ? '#eab308' : '#ef4444';

        const html = madaraStatusHtml({
            title: 'PING',
            kicker: 'response time measured',
            accent,
            meter: Math.max(8, 100 - Math.min(ms / 10, 90)),
            rows: [
                { label: 'LATENCY', value: `${ms} ms` },
                { label: 'GRADE', value: grade },
                { label: 'BOT', value: s.botName || 'MADARA X-MD' },
                { label: 'STATUS', value: 'ONLINE' },
            ],
        });

        const fallback = `🎯 *${s.botName || 'MADARA'} sᴘᴇᴇᴅ:* *${ms}ᴍs* · ${grade}${s.FOOTER || ''}`;
        return sendRich(sock, msg, ctx, html, fallback);
    },
};
