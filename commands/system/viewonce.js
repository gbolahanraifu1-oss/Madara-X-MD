// language: JavaScript, file: commands/system/viewonce.js
'use strict';

module.exports = {
    name: 'viewonce',
    aliases: ['antiviewonce', 'openonce', 'saveviewonce', 'unviewonce', 'vonce', 'vv'],
    category: 'system',
    desc: 'Save/reveal a view-once photo or video (reply to it)',
    usage: '.viewonce (reply to a view-once message)',

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings || {};
        const footer = s.FOOTER || '';

        if (!msg.quoted) {
            return ctx.reply(`❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴠɪᴇᴡ ᴏɴᴄᴇ sᴛɪᴄᴋᴇʀ${footer}`);
        }

        try {
            const vvBuf = await msg.quoted.download();
            if (!vvBuf) throw new Error('Empty buffer');

            const isVid = msg.quoted.mtype === 'videoMessage' || msg.quoted?.video;
            const teks = `✞𝐀𝐤𝐚𝐭𝐬𝐮𝐤𝐢'𝐬 𝐄𝐲𝐞\n> ᴠɪᴇᴡ ᴏɴᴄᴇ ʀᴇᴠᴇᴀʟᴇᴅ`;

            if (isVid) {
                await sock.sendMessage(ctx.from, { video: vvBuf, caption: teks }, { quoted: msg });
            } else {
                await sock.sendMessage(ctx.from, { image: vvBuf, caption: teks }, { quoted: msg });
            }
        } catch (error) {
            console.error('[viewonce]', error);
            ctx.reply(`❌ FAILED!\n> ${error.message}${footer}`);
        }
    }
};