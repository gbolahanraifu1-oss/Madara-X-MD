const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'sqlexplain',
    aliases: ['explainsql', 'whatsql'],
    category: 'ai',
    desc: 'Explain SQL',
    usage: '†sqlexplain [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}sqlexplain [input]\`${s.FOOTER}`);
        await ctx.react('📖');
        try {
            const result = await aiQuery('Explain this SQL query in plain English step by step:\n\n' + input);
            ctx.reply(`📖 *Explain SQL:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};
