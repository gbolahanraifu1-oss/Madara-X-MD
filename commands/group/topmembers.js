// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  TOP MEMBERS
// Tracks message counts per user per group
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const db = require('../../lib/db');
const { menuBox } = require('../../lib/menuBox');

// ── Called from handler.js to count messages ─────────────
function trackMessage(from, sender) {
    try {
        if (!from?.endsWith('@g.us') || !sender) return;
        const rawNum = sender.split('@')[0].split(':')[0];
        if (!rawNum) return;
        // Resolve LID via cache if available
        let num = rawNum;
        try {
            const { resolveLid } = require('./context');
            if (resolveLid) num = resolveLid(rawNum) || rawNum;
        } catch {}
        const key  = `msgcount_${from}`;
        const data = db.get('topmembers', key, {});
        data[num]  = (data[num] || 0) + 1;
        db.set('topmembers', key, data);
    } catch {}
}

module.exports = {
    name: 'topmembers',
    aliases: ['topusers', 'top', 'leaderboard', 'mostactive', 'ranklist'],
    category: 'group',
    desc: 'Show most active members by message count',
    usage: '†topmembers [10|reset]',
    groupOnly: true,
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();

        // ── Reset ──────────────────────────────────────────
        if (sub === 'reset' || sub === 'clear') {
            if (!ctx.isOwner && !ctx.isSenderAdmin)
                return ctx.reply(`❌ Only admins can reset the leaderboard.${s.FOOTER}`);
            db.set('topmembers', `msgcount_${ctx.from}`, {});
            return ctx.reply(`🗑️ Message count reset for this group.${s.FOOTER}`);
        }

        const limit = Math.min(parseInt(args[0]) || 10, 20);
        const key   = `msgcount_${ctx.from}`;
        const data  = db.get('topmembers', key, {});
        const entries = Object.entries(data).sort(([,a],[,b]) => b - a).slice(0, limit);

        if (!entries.length) {
            return ctx.reply(
                `📊 *No messages tracked yet.*\n\n` +
                `_Start chatting! The bot counts messages automatically._${s.FOOTER}`
            );
        }

        const total = Object.values(data).reduce((a, b) => a + b, 0);
        const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟',
                        '1️⃣1️⃣','1️⃣2️⃣','1️⃣3️⃣','1️⃣4️⃣','1️⃣5️⃣','1️⃣6️⃣','1️⃣7️⃣','1️⃣8️⃣','1️⃣9️⃣','2️⃣0️⃣'];

        // Resolve display names from group metadata
        let nameMap = {};
        try {
            const meta = await sock.groupMetadata(ctx.from);
            for (const p of meta.participants || []) {
                const num = p.id.split('@')[0].split(':')[0];
                nameMap[num] = p.pushName || p.notify || `+${num}`;
            }
        } catch {}

        const mentions = entries.map(([num]) => `${num}@s.whatsapp.net`);

        const lines = [];
        entries.forEach(([num, count], i) => {
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            const bar = '▓'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
            lines.push(`${medals[i]} @${num}`);
            lines.push(`   ${bar} *${count}* msgs _(${pct}%)_`);
        });
        lines.push(`*Total messages tracked:* ${total.toLocaleString()}`);
        lines.push(`*Active members:* ${Object.keys(data).length}`);
        lines.push(``, `_Use \`${s.prefix}topmembers reset\` to reset counts_`);

        const text = menuBox('📊', `ᴛᴏᴘ ${limit} ᴍᴇᴍʙᴇʀs`, lines) + s.FOOTER;
        await sock.sendMessage(ctx.from, { text, mentions }, { quoted: msg });
    }
};
module.exports.trackMessage = trackMessage;
