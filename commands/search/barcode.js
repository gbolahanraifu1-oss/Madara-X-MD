const axios = require('axios');
module.exports = {
    name: 'barcode',
    aliases: ['genbarcode', 'ean'],
    category: 'search',
    desc: 'Generate a barcode from text/number',
    usage: '†barcode [text or number]',
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const text = ctx.text;
        if (!text) return ctx.reply(`❌ Provide text or a number.\n_Usage: ${s.prefix}barcode 1234567890_${s.FOOTER}`);
        await ctx.react('🔲');
        try {
            const res = await axios.get(
                `https://barcodeapi.org/api/auto/${encodeURIComponent(text)}`,
                { responseType: 'arraybuffer', timeout: 10000 }
            );
            await sock.sendMessage(ctx.from, {
                image: Buffer.from(res.data),
                caption: `🔲 *Barcode:* \`${text}\`${s.FOOTER}`
            }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};
