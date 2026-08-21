const axios = require('axios');
module.exports = {
    name: 'aiart', aliases: ['art','imagine','txt2img','stablediff'], category: 'ai',
    desc: 'Generate AI art from text prompt', usage: '†aiart [description]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prompt = args.join(' ');
        if (!prompt) return ctx.reply(`❌ Usage: \`${s.prefix}aiart futuristic city at sunset\`${s.FOOTER}`);
        await ctx.react('🎨');
        try {
            const res = await axios.post('https://api.deepai.org/api/stable-diffusion',
                { text: prompt }, { headers: { 'api-key': s.deepaiKey || 'quickstart-QUdJIGlzIHRoZSBmdXR1cmU=' } });
            const url = res.data?.output_url;
            if (!url) throw new Error('No image URL returned');
            const img = await axios.get(url, { responseType: 'arraybuffer' });
            await sock.sendMessage(ctx.from, { image: Buffer.from(img.data), caption: `🎨 *AI Art:* ${prompt}${s.FOOTER}` }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Art generation failed: ${e.message}${s.FOOTER}`); }
    }
};
