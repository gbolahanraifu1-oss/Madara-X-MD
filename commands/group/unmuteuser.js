const db = require('../../lib/db');
module.exports = {
    name: 'unmuteuser',
    aliases: ['unsilence', 'botunmute'],
    category: 'group',
    desc: 'Remove bot-level mute from a user',
    usage: '†unmuteuser @user',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s       = ctx.settings;
        const mention = ctx.getMentions()[0]
            || msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!mention) return ctx.reply(`❌ Tag a user to unmute.\n_Usage: ${s.prefix}unmuteuser @user_${s.FOOTER}`);
        const num = mention.split('@')[0];
        let muteList = db.getGroupSetting(ctx.from, 'muteList', []);
        if (!muteList.includes(mention)) return ctx.reply(`❌ @${num} is not bot-muted.${s.FOOTER}`);
        muteList = muteList.filter(j => j !== mention);
        db.setGroupSetting(ctx.from, 'muteList', muteList);
        await sock.sendMessage(ctx.from, {
            text: `🔊 @${num} has been *unmuted*.\n_They can send messages normally again._${s.FOOTER}`,
            mentions: [mention]
        }, { quoted: msg });
    }
};
