const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'excuse',
    aliases: ['generateexcuse', 'myexcuse'],
    category: 'ai',
    desc: 'Generate excuses',
    usage: '†excuse [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}excuse [input]\`${s.FOOTER}`);
        await ctx.react('😅');
        try {
            const result = await aiQuery('Generate a funny creative excuse for:\n\n' + input);
            ctx.reply(`😅 *Generate excuses:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};
