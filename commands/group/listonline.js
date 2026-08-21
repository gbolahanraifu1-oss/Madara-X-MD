const { menuBox } = require('../../lib/menuBox');

module.exports = {
    name: 'listonline',
    aliases: ['onlinelist', 'whoonline', 'activemembers'],
    category: 'group',
    desc: 'List members who recently sent messages (active)',
    usage: '†listonline',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const db   = require('../../lib/db');
        const key  = `msgcount_${ctx.from}`;
        const data = db.get('topmembers', key, {});
        const now  = Date.now();

        // Get recent senders (sent message in last 24h via topmembers tracker)
        // We use message count data + group participant list
        let meta;
        try { meta = await sock.groupMetadata(ctx.from); } catch {
            return ctx.reply(`❌ Could not fetch group info.${s.FOOTER}`);
        }

        const participants = meta.participants || [];
        // Consider "online/active" = has at least 1 tracked message
        const active = participants.filter(p => {
            const num = p.id.split('@')[0].split(':')[0];
            return (data[num] || 0) > 0;
        });
        const inactive = participants.filter(p => {
            const num = p.id.split('@')[0].split(':')[0];
            return (data[num] || 0) === 0;
        });

        if (!active.length) return ctx.reply(`📊 No active members tracked yet.\n_Messages are tracked as members chat._${s.FOOTER}`);

        const sorted = active.sort((a, b) => {
            const an = a.id.split('@')[0].split(':')[0];
            const bn = b.id.split('@')[0].split(':')[0];
            return (data[bn] || 0) - (data[an] || 0);
        });

        const mentions = sorted.map(p => p.id);
        const lines = sorted.slice(0, 25).map((p, i) => {
            const num  = p.id.split('@')[0].split(':')[0];
            const msgs = data[num] || 0;
            const role = p.admin ? '👑' : '👤';
            return `*${i+1}.* ${role} @${num} — *${msgs}* msgs`;
        });
        if (sorted.length > 25) lines.push(`_...and ${sorted.length - 25} more_`);
        lines.push(`*Inactive:* ${inactive.length} members`);
        lines.push(``, `_Active = sent at least 1 message since bot joined_`);

        const text = menuBox('🟢', `ᴀᴄᴛɪᴠᴇ (${active.length}/${participants.length})`, lines) + s.FOOTER;
        await sock.sendMessage(ctx.from, { text, mentions }, { quoted: msg });
    }
};
