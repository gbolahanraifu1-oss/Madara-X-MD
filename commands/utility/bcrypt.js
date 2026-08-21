module.exports = {
    name: 'bcrypt', aliases: ['bcrypthash','bcrpythash','passwordhash'], category: 'utility',
    desc: 'Generate bcrypt hash of text', usage: '†bcrypt [text] [rounds?]',
    async execute(sock, msg, args, ctx) {
        const s      = ctx.settings;
        const text   = args[0];
        const rounds = Math.min(parseInt(args[1]) || 10, 12);
        if (!text) return ctx.reply(`❌ Usage: \`${s.prefix}bcrypt mypassword\`${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const bcrypt = require('bcryptjs');
            const salt   = await bcrypt.genSalt(rounds);
            const hash   = await bcrypt.hash(text, salt);
            ctx.reply(`🔑 *Bcrypt Hash:*\n\`${hash}\`\n\n⚙️ Rounds: ${rounds}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Bcrypt failed: ${e.message}${s.FOOTER}`); }
    }
};
