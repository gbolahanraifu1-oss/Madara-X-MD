const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');
module.exports = { name: 'whois', aliases: ['domainwhois','domainlookup'], category: 'search', desc: 'WHOIS lookup for a domain', usage: '†whois [domain]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const domain=(args[0]||'').replace(/https?:\/\//,'').split('/')[0];
        if(!domain) return ctx.reply(`❌ Usage: \`${s.prefix}whois example.com\`${s.FOOTER}`);
        await ctx.react('🔍');
        try {
            const res=await axios.get(`https://api.whoisfreaks.com/v1.0/whois?apiKey=free&whois=live&domainName=${domain}`);
            const d=res.data;
            ctx.reply(menuBox('🌐', `ᴡʜᴏɪs: ${domain}`, [
                `*Created:* ${d.create_date||'N/A'}`,
                `*Expires:* ${d.expiry_date||'N/A'}`,
                `*Registrar:* ${d.domain_registrar?.registrar_name||'N/A'}`,
            ]) + s.FOOTER);
        } catch(e){ctx.reply(`❌ WHOIS failed: ${e.message}${s.FOOTER}`);}
    }
};
