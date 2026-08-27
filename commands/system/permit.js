'use strict';
const { menuBox } = require('../../lib/menuBox');

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
            return ctx.reply(menuBox('✅', 'ᴘᴇʀᴍɪᴛ', [
                `${s.prefix}permit @user — ᴜɴʙʟᴏᴄᴋ ᴜsᴇʀ`,
                `${s.prefix}permit number — ᴜɴʙʟᴏᴄᴋ ʙʏ ɴᴜᴍʙᴇʀ`,
                'ɢʀᴀɴᴛs ᴘʀɪᴠᴀᴛᴇ ᴍᴇssᴀɢᴇ ᴘᴇʀᴍɪssɪᴏɴ',
            ]) + s.FOOTER);
        }

        try {
            await sock.updateBlockStatus(target, 'unblock');
            const db = require('../../lib/db');
            const allowed = db.get('settings', 'pmAllowlist', []);
            const number = target.split('@')[0].split(':')[0];
            if (!allowed.includes(number)) db.set('settings', 'pmAllowlist', [...allowed, number]);
            return ctx.reply({
                text: menuBox('✅', 'ᴘᴇʀᴍɪᴛ', [
                    `@${target.split('@')[0]} ᴄᴀɴ ɴᴏᴡ ᴅᴍ`,
                    'ᴛʜᴇ ᴜsᴇʀ ᴡᴀs ᴀᴅᴅᴇᴅ ᴛᴏ ᴛʜᴇ ᴀʟʟᴏᴡʟɪsᴛ',
                ]) + s.FOOTER,
                mentions: [target],
            });
        } catch (e) {
            return ctx.reply(menuBox('❌', 'ᴘᴇʀᴍɪᴛ', [`ғᴀɪʟᴇᴅ: ${e.message}`]) + s.FOOTER);
        }
    }
};
