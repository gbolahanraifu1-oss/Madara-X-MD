module.exports = {
    name: 'base64',
    aliases: ['b64', 'encode', 'decode'],
    category: 'utility',
    desc: 'Base64 encode or decode text',
    usage: '†base64 encode [text] or †base64 decode [text]',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s      = ctx.settings;
        const action = (args[0]||'encode').toLowerCase();
        const text   = args.slice(1).join(' ');
        if (!text) return ctx.reply(`❌ Usage: \`${s.prefix}base64 encode Hello World\`${s.FOOTER}`);
        try {
            const result = action === 'decode'
                ? Buffer.from(text, 'base64').toString('utf8')
                : Buffer.from(text).toString('base64');
            ctx.reply(`🔡 *Base64 ${action}:*\n\n\`\`\`${result}\`\`\`${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};
