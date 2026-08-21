const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'words',
    aliases: ['wordcount', 'charcount', 'countwords'],
    category: 'utility',
    desc: 'Count words and characters in text',
    usage: '†words [text] or reply to message',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const text = ctx.text || ctx.getQuotedText();
        if (!text) return ctx.reply(`❌ Provide text or reply to a message.${s.FOOTER}`);
        const words    = text.trim().split(/\s+/).filter(Boolean).length;
        const chars    = text.length;
        const noSpaces = text.replace(/\s/g, '').length;
        const lines    = text.split('\n').length;
        const sentences = text.split(/[.!?]+/).filter(Boolean).length;
        ctx.reply(
            menuBox('📊', 'ᴛᴇxᴛ ᴀɴᴀʟʏsɪs', [
                `*Words:* ${words}`,
                `*Characters:* ${chars}`,
                `*Chars (no spaces):* ${noSpaces}`,
                `*Lines:* ${lines}`,
                `*Sentences:* ${sentences}`,
            ]) + s.FOOTER
        );
    }
};
