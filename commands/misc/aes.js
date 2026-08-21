const crypto = require('crypto');
module.exports = { name: 'aes', aliases: ['aesadvanced','aes256','aescrypt'], category: 'misc', desc: 'Advanced AES-256-GCM encryption/decryption', usage: '†aes enc [key] [text] | †aes dec [key] [encrypted]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const sub=args[0]?.toLowerCase(); const key=args[1]; const txt=args.slice(2).join(' ');
        if(!sub||!key||!txt) return ctx.reply(`❌ Usage: \`${s.prefix}aes enc mykey hello\`${s.FOOTER}`);
        try {
            const k=crypto.createHash('sha256').update(key).digest();
            if (sub==='enc') { const iv=crypto.randomBytes(12); const c=crypto.createCipheriv('aes-256-gcm',k,iv); const enc=c.update(txt,'utf8'); const fin=c.final(); const tag=c.getAuthTag(); ctx.reply(`🔐 *AES-256-GCM:*\n\`${Buffer.concat([iv,tag,enc,fin]).toString('base64')}\`${s.FOOTER}`); }
            else if (sub==='dec') { const buf=Buffer.from(txt,'base64'); const iv=buf.slice(0,12),tag=buf.slice(12,28),data=buf.slice(28); const d=crypto.createDecipheriv('aes-256-gcm',k,iv); d.setAuthTag(tag); ctx.reply(`🔓 *Decrypted:*\n${Buffer.concat([d.update(data),d.final()]).toString('utf8')}${s.FOOTER}`); }
            else ctx.reply(`❌ Use \`enc\` or \`dec\`${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ AES error: ${e.message}${s.FOOTER}`);}
    }
};
