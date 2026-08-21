const crypto = require('crypto');
module.exports = {
    name: 'decrypt', aliases: ['aesdecrypt','decryptaes'], category: 'utility',
    desc: 'AES-256-CBC decryption', usage: '†decrypt [key] [encrypted_base64]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings; const key = args[0]; const enc = args.slice(1).join(' ');
        if (!key || !enc) return ctx.reply(`❌ Usage: \`${s.prefix}decrypt mykey [base64]\`${s.FOOTER}`);
        try {
            const k = crypto.createHash('sha256').update(key).digest();
            const buf = Buffer.from(enc, 'base64'); const iv = buf.slice(0, 16);
            const dec = crypto.createDecipheriv('aes-256-cbc', k, iv);
            const out = Buffer.concat([dec.update(buf.slice(16)), dec.final()]).toString('utf8');
            ctx.reply(`🔓 *Decrypted:*\n${out}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Decryption failed: ${e.message}${s.FOOTER}`); }
    }
};
