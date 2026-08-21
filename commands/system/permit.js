module.exports = {
    name: 'permit',
    aliases: ['grantperm'],
    category: 'system',
    desc: 'Grant DM permission to blocked user',
    usage: '†permit @user or †permit [number]',
    ownerOnly: true,
    
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const mentions = ctx.getMentions?.() || [];
        let target = mentions[0];
        
        if (!target && args[0]) {
            target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }
        
        if (!target) {
            return ctx.reply(`
╔═══════════════════════════════╗
║  ✅ PERMIT SYSTEM             ║
╚═══════════════════════════════╝

${s.PREFIX}permit @user    - Unblock user
${s.PREFIX}permit [number] - Unblock by number

Grants permission for blocked users

${s.FOOTER}`);
        }

        try {
            await sock.updateBlockStatus(target, 'unblock');
            ctx.reply(`✓ *Permission granted*\n\n✅ @${target.split('@')[0]} can now DM${s.FOOTER}`, { 
                mentions: [target] 
            });
        } catch (e) {
            ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);
        }
    }
};
