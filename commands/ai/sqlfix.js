const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'sqlfix',
    aliases: ['fixsql', 'sqlrepair'],
    category: 'ai',
    desc: 'Fix SQL queries',
    usage: '†sqlfix [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}sqlfix [input]\`${s.FOOTER}`);
        await ctx.react('🔧');
        try {
            const result = await aiQuery('Fix this SQL query and explain corrections:\n\n' + input);
            ctx.reply(`🔧 *Fix SQL queries:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};
