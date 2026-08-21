module.exports = {
    name: 'banish',
    aliases: ['permban'],
    category: 'system',
    desc: 'Permanently kick user from group',
    usage: '†banish @user or †banish [number]',
    ownerOnly: false,
    isGroup: true,
    
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const isGroupAdmin = ctx.isGroupAdmin?.();
        const mentions = ctx.getMentions?.() || [];
        let target = mentions[0];
        
        if (!ctx.isGroup) {
            return ctx.reply(`❌ Group command only${s.FOOTER}`);
        }
        
        if (!isGroupAdmin && !ctx.isOwner) {
            return ctx.reply(`❌ Admin only${s.FOOTER}`);
        }

        if (!target && args[0]) {
            target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }
        
        if (!target) {
            return ctx.reply(`
╔═══════════════════════════════╗
║  ⚔️ BANISH SYSTEM             ║
╚═══════════════════════════════╝

${s.PREFIX}banish @user     - Ban user
${s.PREFIX}banish [number]  - Ban by number

Permanently bans from group.
Even if re-added, bot auto-kicks.

"Banish - no coming back"

${s.FOOTER}`);
        }

        try {
            await sock.groupParticipantsUpdate(
                msg.key.remoteJid,
                [target],
                'remove'
            );
            
            ctx.reply(`⚔️ *BANISHED*\n\n🚫 @${target.split('@')[0]} permanently banned.\n\n"No coming back"${s.FOOTER}`, { 
                mentions: [target] 
            });
        } catch (e) {
            ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);
        }
    }
};
