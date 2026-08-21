const crypto = require('crypto');
module.exports = {
    name: 'hash',
    aliases: ['md5', 'sha256', 'sha512', 'bcrypt', 'ripemd'],
    category: 'utility',
    desc: 'Hash text using MD5, SHA256, SHA512',
    usage: '†hash [md5|sha256|sha512] [text]',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const algo = (args[0]||'sha256').toLowerCase();
        const text = args.slice(1).join(' ');
        if (!text) return ctx.reply(`❌ Usage: \`${s.prefix}hash sha256 mytext\`${s.FOOTER}`);
        const supported = ['md5','sha1','sha256','sha512','sha384'];
        if (!supported.includes(algo)) return ctx.reply(`❌ Supported: ${supported.join(', ')}${s.FOOTER}`);
        const result = crypto.createHash(algo).update(text).digest('hex');
        ctx.reply(`🔒 *${algo.toUpperCase()} Hash:*\n\n_Input:_ \`${text}\`\n\n\`\`\`${result}\`\`\`${s.FOOTER}`);
    }
};
