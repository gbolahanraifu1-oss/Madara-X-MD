const crypto = require('crypto');
module.exports = { name: 'camellia', aliases: ['camelliacrypt','camelliaenc'], category: 'misc', desc: 'Camellia-256 encryption/decryption', usage: '†camellia enc [key] [text] | †camellia dec [key] [encrypted]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const sub=args[0]?.toLowerCase(); const key=args[1]; const txt=args.slice(2).join(' ');
        if(!sub||!key||!txt) return ctx.reply(`❌ Usage: \`${s.prefix}camellia enc mykey hello\` or \`${s.prefix}camellia dec mykey [encrypted]\`${s.FOOTER}`);
        try {
            const k=crypto.createHash('sha256').update(key).digest();
            if (sub==='enc') { const iv=crypto.randomBytes(16); const c=crypto.createCipheriv('camellia-256-cbc',k,iv); const enc=Buffer.concat([iv,c.update(txt,'utf8'),c.final()]).toString('base64'); ctx.reply(`🔐 *Camellia Encrypted:*\n\`${enc}\`${s.FOOTER}`); }
            else if (sub==='dec') { const buf=Buffer.from(txt,'base64'); const iv=buf.slice(0,16); const d=crypto.createDecipheriv('camellia-256-cbc',k,iv); const plain=Buffer.concat([d.update(buf.slice(16)),d.final()]).toString('utf8'); ctx.reply(`🔓 *Decrypted:*\n${plain}${s.FOOTER}`); }
            else ctx.reply(`❌ Use \`enc\` or \`dec\`${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Camellia error: ${e.message}${s.FOOTER}`);}
    }
};
