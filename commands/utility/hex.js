module.exports = {
    name: 'hex',
    aliases: ['tohex', 'fromhex', 'hexconvert'],
    category: 'utility',
    desc: 'Convert text to hex or hex to text',
    usage: '†hex encode [text] or †hex decode [hex]',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s      = ctx.settings;
        const action = (args[0] || 'encode').toLowerCase();
        const input  = args.slice(1).join(' ');
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}hex encode Hello\`${s.FOOTER}`);
        let result;
        if (action === 'decode') {
            result = Buffer.from(input.replace(/\s/g, ''), 'hex').toString('utf8');
        } else {
            result = Buffer.from(input).toString('hex').match(/../g)?.join(' ') || '';
        }
        ctx.reply(`🔢 *Hex ${action}:*\n\n\`\`\`${result.slice(0, 500)}\`\`\`${s.FOOTER}`);
    }
};
