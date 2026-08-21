module.exports = { name: 'bio', aliases: ['setbio','changebio','botbio'], category: 'utility', desc: 'Change bot bio/profile name (owner only)', usage: '†bio [new bio text]',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const text=args.join(' '); if(!text) return ctx.reply(`❌ Usage: \`${s.prefix}bio New bio here\`${s.FOOTER}`);
        try { await sock.updateProfileStatus(text); ctx.reply(`✅ Bot bio updated: _${text}_${s.FOOTER}`); }
        catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
