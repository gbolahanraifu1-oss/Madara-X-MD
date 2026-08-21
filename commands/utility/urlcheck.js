const axios = require('axios');
module.exports = { name: 'urlcheck', aliases: ['checkurl','safebrowse','urlsafe'], category: 'utility', desc: 'Check if a URL is safe or malicious', usage: '†urlcheck [url]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const url=args[0]; if(!url) return ctx.reply(`❌ Usage: \`${s.prefix}urlcheck https://example.com\`${s.FOOTER}`);
        await ctx.react('🔍');
        try {
            const u=new URL(url);
            const suspicious=url.includes('bit.ly')||url.includes('tinyurl')||url.length>200;
            const phishing=/login|signin|account|verify|bank|paypal|password/i.test(url);
            let status=''; let emoji='';
            if (phishing){status='⚠️ *SUSPICIOUS* — Contains phishing keywords';emoji='🔴';}
            else if (suspicious){status='🟡 *CAUTION* — Shortened/suspicious URL';emoji='🟡';}
            else{status='✅ *Looks Safe*';emoji='🟢';}
            ctx.reply(`🔍 *URL Check:*\n\n${emoji} ${status}\n🔗 URL: ${url}\n🌐 Domain: ${u.hostname}${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Invalid URL: ${e.message}${s.FOOTER}`);}
    }
};
