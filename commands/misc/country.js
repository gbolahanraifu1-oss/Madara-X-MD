const axios = require('axios');
module.exports = { name: 'country', aliases: ['countryinfo','nation','flaginfo'], category: 'misc', desc: 'Get info about a country', usage: '†country [country name]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const name=args.join(' '); if(!name) return ctx.reply(`❌ Usage: \`${s.prefix}country Nigeria\`${s.FOOTER}`);
        await ctx.react('🌍');
        try { const res=await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}`); const d=res.data[0]; const lang=Object.values(d.languages||{})[0]||'N/A'; const curr=Object.values(d.currencies||{})[0]?.name||'N/A'; ctx.reply(`🌍 *${d.name.common}* ${d.flag}\n*╭──────────────────⊷*\n*┋ 🏛️ Capital:* ${d.capital?.[0]||'N/A'}\n*┋ 👥 Population:* ${d.population?.toLocaleString()}\n*┋ 🗣️ Language:* ${lang}\n*┋ 💰 Currency:* ${curr}\n*╰──────────────────⊷*${s.FOOTER}`); }
        catch{ctx.reply(`❌ Country *${name}* not found.${s.FOOTER}`);}
    }
};
