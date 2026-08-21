module.exports = {
    name: 'tagnoadmin',
    aliases: ['tagnotadmin', 'tagmembers', 'nonAdmins', 'pingmembers'],
    category: 'group',
    desc: 'Tag all non-admin members',
    usage: '†tagnoadmin [message]',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        try {
            const meta      = await sock.groupMetadata(ctx.from);
            const nonAdmins = (meta.participants || []).filter(p => !p.admin);
            if (!nonAdmins.length) return ctx.reply(`❌ No members to tag.${s.FOOTER}`);
            const mentions = nonAdmins.map(p => p.id || p.lid).filter(Boolean);
            const text     = ctx.text || '📢 Attention members!';
            // One per line (v2 style)
            let tagText = `🔊 *${text}*\n\n`;
            nonAdmins.forEach(p => { tagText += `@${(p.id || p.lid).split('@')[0]}\n`; });
            tagText += s.FOOTER;
            await sock.sendMessage(ctx.from, { text: tagText, mentions }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};
