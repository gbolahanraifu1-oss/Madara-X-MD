const axios = require('axios');
module.exports = { name: 'exchange', aliases: ['exchangerates','allrates','currencylist'], category: 'finance', desc: 'Get exchange rates for a base currency', usage: '†exchange [currency code?]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const base=(args[0]||'USD').toUpperCase(); await ctx.react('💱');
        try { const res=await axios.get(`https://api.exchangerate-api.com/v4/latest/${base}`); const rates=res.data.rates; const top=['NGN','GBP','EUR','JPY','GHS','KES','ZAR','CAD'].map(c=>`${c}: ${rates[c]?.toFixed(2)||'N/A'}`).join('\n'); ctx.reply(`💱 *Exchange Rates (1 ${base}):*\n\n${top}\n\n_${new Date().toLocaleDateString()}_${s.FOOTER}`); }
        catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
