const crypto = require('crypto');
module.exports = {
    name: 'password',
    aliases: ['passgen', 'genpass'],
    category: 'utility',
    desc: 'Generate a secure random password',
    usage: '†password [length]',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const len = Math.min(Math.max(parseInt(args[0]) || 16, 8), 64);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}';
        let pass = '';
        const bytes = crypto.randomBytes(len);
        for (let i = 0; i < len; i++) pass += chars[bytes[i] % chars.length];
        ctx.reply(`🔐 *Generated Password (${len} chars):*\n\n\`\`\`${pass}\`\`\`\n\n_Keep this safe! Don't share it._${s.FOOTER}`);
    }
};
