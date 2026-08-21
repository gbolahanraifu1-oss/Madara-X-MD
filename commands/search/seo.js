const axios = require('axios');
module.exports = { name: 'seo', aliases: ['seocheck','webseo'], category: 'search', desc: 'SEO analysis for a domain/URL', usage: '†seo [domain]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const domain=(args[0]||'').replace(/https?:\/\//,'').split('/')[0];
        if(!domain) return ctx.reply(`❌ Usage: \`${s.prefix}seo example.com\`${s.FOOTER}`);
        await ctx.react('📊');
        try {
            const res=await axios.get(`https://${domain}`,{timeout:8000,headers:{'User-Agent':'Mozilla/5.0'}});
            const html=res.data;
            const title=html.match(/<title>(.*?)<\/title>/i)?.[1]||'Not found';
            const desc=html.match(/name=["']description["'][^>]+content=["']([^"']+)/i)?.[1]||'Not found';
            const h1=html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g,'')||'Not found';
            ctx.reply(`📊 *SEO: ${domain}*\n*╭──────────────────⊷*\n*┋ 📝 Title:* ${title.slice(0,60)}\n*┋ 📄 Desc:* ${desc.slice(0,80)}\n*┋ 🔤 H1:* ${h1.slice(0,60)}\n*┋ 📣 OG Tags:* ${html.includes('og:title')?'✅':'❌'}\n*╰──────────────────⊷*${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ SEO check failed: ${e.message}${s.FOOTER}`);}
    }
};
