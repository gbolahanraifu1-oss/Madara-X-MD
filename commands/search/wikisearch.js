const axios = require('axios');
module.exports = { name: 'wikisearch', aliases: ['wsearch','wikilookup'], category: 'search', desc: 'Search Wikipedia and list multiple results', usage: '†wikisearch [query]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const q=args.join(' '); if(!q) return ctx.reply(`❌ Usage: \`${s.prefix}wikisearch [query]\`${s.FOOTER}`);
        await ctx.react('🔍');
        try {
            const res=await axios.get(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=5`);
            const list=res.data?.query?.search; if(!list?.length) return ctx.reply(`❌ No results for *${q}*.${s.FOOTER}`);
            const out=list.map((r,i)=>`${i+1}. *${r.title}*\n   ${r.snippet.replace(/<[^>]+>/g,'').slice(0,80)}...`).join('\n\n');
            ctx.reply(`📖 *Wiki: "${q}"*\n\n${out}\n\n\`${s.prefix}wiki [title]\` for full article.${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
