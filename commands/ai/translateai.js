const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'translateai',
    aliases: ['aitranslate', 'smarttranslate'],
    category: 'ai',
    desc: 'AI translation',
    usage: '†translateai [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}translateai [input]\`${s.FOOTER}`);
        await ctx.react('🌍');
        try {
            const result = await aiQuery('Translate this text, preserving idioms and cultural meaning. Target language:\n\n' + input);
            ctx.reply(`🌍 *AI translation:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};
