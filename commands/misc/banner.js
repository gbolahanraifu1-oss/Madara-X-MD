const axios = require('axios');
module.exports = {
    name: 'banner', aliases: ['textbanner','generatebanner','namebanner'], category: 'misc',
    desc: 'Generate a banner image with text', usage: '†banner [text]',
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const text = args.join(' ').slice(0, 20) || 'MADARA X-MD';
        await ctx.react('🖼️');
        try {
            const res = await axios.get(
                `https://api.siputzx.my.id/api/maker/text?text=${encodeURIComponent(text)}&color=red&background=black`,
                { responseType: 'arraybuffer' }
            );
            await sock.sendMessage(ctx.from, { image: Buffer.from(res.data), caption: `🎨 *Banner: ${text}*${s.FOOTER}` }, { quoted: msg });
        } catch {
            const lines = text.toUpperCase().split('').map(c => `[${c}]`).join('');
            ctx.reply(`🎨 *Banner:*\n\`\`\`\n${lines}\n\`\`\`${s.FOOTER}`);
        }
    }
};
