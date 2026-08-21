const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'imageprompt',
    aliases: ['promptimprove', 'betterPrompt'],
    category: 'ai',
    desc: 'Improve image prompts',
    usage: '†imageprompt [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}imageprompt [input]\`${s.FOOTER}`);
        await ctx.react('✨');
        try {
            const result = await aiQuery('Improve this AI image prompt for Stable Diffusion:\n\n' + input);
            ctx.reply(`✨ *Improve image prompts:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};
