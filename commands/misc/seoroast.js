const axios = require('axios');
module.exports = { name: 'seoroast', aliases: ['roastseo','websiteroast'], category: 'misc', desc: 'Funny SEO roast of a website', usage: '†seoroast [domain]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const domain=(args[0]||'').replace(/https?:\/\//,'').split('/')[0];
        if (!domain) return ctx.reply(`❌ Usage: \`${s.prefix}seoroast example.com\`${s.FOOTER}`);
        await ctx.react('🔥');
        try { const res=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Funny light-hearted SEO roast for ${domain}. Point out typical SEO issues humorously. 3-4 sentences.`)}`); ctx.reply(`🔥 *SEO Roast: ${domain}*\n\n${res.data?.data||`${domain}'s SEO is so bad, Google needs glasses to index it. 😅`}${s.FOOTER}`); }
        catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
