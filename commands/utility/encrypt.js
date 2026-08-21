const crypto = require('crypto');
module.exports = {
    name: 'encrypt', aliases: ['aesencrypt','encryptaes'], category: 'utility',
    desc: 'AES-256-CBC encryption', usage: '†encrypt [key] [text]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings; const key = args[0]; const txt = args.slice(1).join(' ');
        if (!key || !txt) return ctx.reply(`❌ Usage: \`${s.prefix}encrypt mykey Hello world\`${s.FOOTER}`);
        try {
            const k   = crypto.createHash('sha256').update(key).digest();
            const iv  = crypto.randomBytes(16);
            const cip = crypto.createCipheriv('aes-256-cbc', k, iv);
            const enc = Buffer.concat([iv, cip.update(txt,'utf8'), cip.final()]).toString('base64');
            ctx.reply(`🔐 *Encrypted:*\n\`${enc}\`\n\nDecrypt: \`${s.prefix}decrypt ${key} [above]\`${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};
