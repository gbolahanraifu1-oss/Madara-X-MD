'use strict';

const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { analyzeImage } = require('../../lib/ai');

module.exports = {
    name: 'gptimg',
    aliases: ['gpt4vision', 'visionai', 'gptimage'],
    category: 'ai',
    desc: 'ᴀɴᴀʟʏᴢᴇ ᴀɴ ɪᴍᴀɢᴇ ᴡɪᴛʜ ᴏᴘᴇɴᴀɪ',
    usage: '†gptimg question (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prompt = args.join(' ').trim() || 'Describe this image in detail.';
        const info = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (info?.quotedMessage) {
            target = { key: { remoteJid: ctx.from, id: info.stanzaId, participant: info.participant }, message: info.quotedMessage };
        }
        if (!target.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        await ctx.react('🤖');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const answer = await analyzeImage(buf, target.message.imageMessage.mimetype || 'image/jpeg', prompt);
            return ctx.reply(`🤖 *OpenAI Vision:*\n\n${answer}${s.FOOTER}`);
        } catch (error) {
            return ctx.reply(`❌ ᴠɪsɪᴏɴ ғᴀɪʟᴇᴅ: ${error.message}${s.FOOTER}`);
        }
    },
};