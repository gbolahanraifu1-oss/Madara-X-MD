'use strict';
const { menuBox } = require('../../lib/menuBox');

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
        const isGroupAdmin = ctx.isSenderAdmin;
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
            return ctx.reply(menuBox('⚔️', 'ʙᴀɴɪsʜ', [
                `${s.prefix}banish @user — ʙᴀɴɪsʜ ᴜsᴇʀ`,
                `${s.prefix}banish number — ʙᴀɴɪsʜ ʙʏ ɴᴜᴍʙᴇʀ`,
                'ᴘᴇʀᴍᴀɴᴇɴᴛʟʏ ʀᴇᴍᴏᴠᴇs ᴛʜᴇ ᴜsᴇʀ ғʀᴏᴍ ᴛʜᴇ ɢʀᴏᴜᴘ',
                'ʙᴀɴɪsʜ — ɴᴏ ᴄᴏᴍɪɴɢ ʙᴀᴄᴋ',
            ]) + s.FOOTER);
        }

        try {
            await sock.groupParticipantsUpdate(
                msg.key.remoteJid,
                [target],
                'remove'
            );
            
            return ctx.reply({
                text: menuBox('⚔️', 'ʙᴀɴɪsʜ', [
                    `🚫 @${target.split('@')[0]} ᴘᴇʀᴍᴀɴᴇɴᴛʟʏ ʙᴀɴɪsʜᴇᴅ`,
                    'ɴᴏ ᴄᴏᴍɪɴɢ ʙᴀᴄᴋ',
                ]) + s.FOOTER,
                mentions: [target],
            });
        } catch (e) {
            return ctx.reply(menuBox('❌', 'ʙᴀɴɪsʜ', [`ғᴀɪʟᴇᴅ: ${e.message}`]) + s.FOOTER);
        }
    }
};
