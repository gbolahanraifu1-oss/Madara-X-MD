const crypto = require('crypto');
module.exports = { name: 'ripemd', aliases: ['ripemd160','ripemdHash'], category: 'misc', desc: 'Generate RIPEMD-160 hash', usage: '†ripemd [text]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const text=args.join(' '); if(!text) return ctx.reply(`❌ Usage: \`${s.prefix}ripemd [text]\`${s.FOOTER}`);
        try { const hash=crypto.createHash('ripemd160').update(text).digest('hex'); ctx.reply(`🔑 *RIPEMD-160:*\n\`${hash}\`${s.FOOTER}`); }
        catch(e){ctx.reply(`❌ RIPEMD not supported: ${e.message}${s.FOOTER}`);}
    }
};
