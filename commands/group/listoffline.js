const { menuBox } = require('../../lib/menuBox');

module.exports = {
    name: 'listoffline',
    aliases: ['offlinelist', 'inactivemembers', 'ghostlist', 'lurkers'],
    category: 'group',
    desc: 'List inactive members who have never sent a message (ghosts/lurkers)',
    usage: '†listoffline',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const db   = require('../../lib/db');
        const key  = `msgcount_${ctx.from}`;
        const data = db.get('topmembers', key, {});

        let meta;
        try { meta = await sock.groupMetadata(ctx.from); } catch {
            return ctx.reply(`❌ Could not fetch group info.${s.FOOTER}`);
        }

        const participants = meta.participants || [];
        const inactive = participants.filter(p => {
            const num = p.id.split('@')[0].split(':')[0];
            return !p.admin && (data[num] || 0) === 0;
        });

        if (!inactive.length) return ctx.reply(`✅ No inactive members found — everyone has sent at least one message!${s.FOOTER}`);

        const mentions = inactive.map(p => p.id);
        const lines = inactive.slice(0, 30).map((p, i) => `*${i+1}.* 👻 @${p.id.split('@')[0].split(':')[0]}`);
        if (inactive.length > 30) lines.push(`_...and ${inactive.length - 30} more_`);
        lines.push(`*Total inactive:* ${inactive.length}/${participants.length}`);
        lines.push(``, `_These members have not sent any messages since tracking began._`, `_Use \`${s.prefix}kick @user\` to remove ghosts._`);

        const text = menuBox('🔴', `ɪɴᴀᴄᴛɪᴠᴇ (${inactive.length})`, lines) + s.FOOTER;
        await sock.sendMessage(ctx.from, { text, mentions }, { quoted: msg });
    }
};
