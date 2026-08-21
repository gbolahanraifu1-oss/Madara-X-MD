const axios = require('axios');
module.exports = { name: 'covid', aliases: ['corona','covid19'], category: 'search', desc: 'COVID-19 stats', usage: '†covid [country?]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const country=args.join(' ')||'all'; await ctx.react('😷');
        try {
            const url=(country==='all'||country==='global')?'https://disease.sh/v3/covid-19/all':`https://disease.sh/v3/covid-19/countries/${encodeURIComponent(country)}`;
            const res=await axios.get(url); const d=res.data; const fmt=n=>(n||0).toLocaleString();
            ctx.reply(`😷 *COVID-19: ${d.country||'Global'}*\n*╭──────────────────⊷*\n*┋ 🦠 Cases:* ${fmt(d.cases)}\n*┋ 💉 Recovered:* ${fmt(d.recovered)}\n*┋ 💀 Deaths:* ${fmt(d.deaths)}\n*┋ 📈 Today:* ${fmt(d.todayCases)}\n*╰──────────────────⊷*${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ COVID data failed: ${e.message}${s.FOOTER}`);}
    }
};
