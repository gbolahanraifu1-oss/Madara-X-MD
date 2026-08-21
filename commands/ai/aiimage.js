const axios = require('axios');
module.exports = {
    name: 'aiimage',
    aliases: ['aiart', 'imagine', 'generate'],
    category: 'ai',
    desc: 'Generate image from text prompt',
    usage: '†aiimage [prompt]',
    async execute(sock, msg, args, ctx) {
        const s      = ctx.settings;
        const prompt = ctx.text;
        if (!prompt) return ctx.reply(`❌ Provide a prompt.\nUsage: \`${s.prefix}aiimage a sunset over the ocean\`${s.FOOTER}`);
        await ctx.react('🎨');
        try {
            const res = await axios.get(
                `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`,
                { responseType: 'arraybuffer', timeout: 30000 }
            );
            await sock.sendMessage(ctx.from, {
                image: Buffer.from(res.data),
                caption: `🎨 *${prompt}*${s.FOOTER}`
            }, { quoted: msg });
        } catch (e) {
            ctx.reply(`❌ Image generation failed: ${e.message}${s.FOOTER}`);
        }
    }
};
