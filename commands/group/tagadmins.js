const { menuBox } = require('../../lib/menuBox');

module.exports = {
    name: 'tagadmins',
    aliases: ['tagadmin', 'admins', 'pingadmins'],
    category: 'group',
    desc: 'Mention only group admins',
    usage: '†tagadmins [message]',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        try {
            const meta     = await sock.groupMetadata(ctx.from);
            const admins   = (meta.participants || []).filter(p => p.admin);
            if (!admins.length) return ctx.reply(`❌ No admins found.${s.FOOTER}`);
            const mentions = admins.map(p => p.id || p.lid).filter(Boolean);
            const text  = ctx.text || '📢 Admin attention needed!';
            const lines = admins.map(p => `👑 @${(p.id || p.lid).split('@')[0]}`);
            lines.push(``, `💬 ${text}`);
            await sock.sendMessage(ctx.from, {
                text: menuBox('👑', `ᴀᴅᴍɪɴ ᴛᴀɢ (${admins.length})`, lines) + s.FOOTER,
                mentions
            }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};
