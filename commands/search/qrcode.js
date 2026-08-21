const qrcode = require('qrcode');
module.exports = {
    name: 'qrcode',
    aliases: ['qr', 'qrgen'],
    category: 'search',
    desc: 'Generate QR code from text/URL',
    usage: '†qrcode [text or URL]',
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const text = ctx.text;
        if (!text) return ctx.reply(`❌ Provide text or a URL.${s.FOOTER}`);
        await ctx.react('📱');
        const buf = await qrcode.toBuffer(text, { type: 'png', width: 512, margin: 2 });
        await sock.sendMessage(ctx.from, { image: buf, caption: `📱 QR Code for: _${text}_${s.FOOTER}` }, { quoted: msg });
    }
};
