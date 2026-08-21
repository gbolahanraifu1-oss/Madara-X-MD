module.exports = {
    name: 'antidelete',
    aliases: ['adel', 'restore'],
    category: 'system',
    desc: 'Restore deleted messages (group only)',
    usage: '†antidelete on/off',
    ownerOnly: false,
    isGroup: true,
    
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const isGroupAdmin = ctx.isGroupAdmin?.();
        
        if (!ctx.isGroup) {
            return ctx.reply(`❌ Group command only${s.FOOTER}`);
        }
        
        if (!isGroupAdmin && !ctx.isOwner) {
            return ctx.reply(`❌ Admin only${s.FOOTER}`);
        }

        const mode = args[0]?.toLowerCase();
        
        if (!mode || !['on', 'off'].includes(mode)) {
            return ctx.reply(`
╔═══════════════════════════════╗
║  ⚡ ANTIDELETE SYSTEM         ║
╚═══════════════════════════════╝

${s.PREFIX}antidelete on   - Activate
${s.PREFIX}antidelete off  - Deactivate

When ON: Deleted messages restored 
automatically with sender tag

${s.FOOTER}`);
        }

        if (mode === 'on') {
            ctx.reply(`✓ *Antidelete activated*\n\n🔙 Deleted messages will be restored${s.FOOTER}`);
        } else {
            ctx.reply(`✓ *Antidelete deactivated*${s.FOOTER}`);
        }
    }
};
