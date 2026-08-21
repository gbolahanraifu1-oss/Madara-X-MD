const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'codeexplain',
    aliases: ['explaincode', 'whatcode'],
    category: 'ai',
    desc: 'Explain code simply',
    usage: '†codeexplain [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}codeexplain [input]\`${s.FOOTER}`);
        await ctx.react('💻');
        try {
            const result = await aiQuery('Explain this code in simple terms a beginner can understand:\n\n' + input);
            ctx.reply(`💻 *Explain code simply:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};
