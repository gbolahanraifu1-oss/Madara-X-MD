const axios = require('axios');
module.exports = { name: 'staking', aliases: ['stakingapy','cryptoapy','yield'], category: 'finance', desc: 'Staking APY rates for major coins', usage: '†staking [coin?]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const coin=(args[0]||'').toLowerCase();
        await ctx.react('💰');
        const rates=[{coin:'ETH',apy:'3.5-5%',type:'Liquid Staking'},{coin:'BNB',apy:'2-4%',type:'DeFi'},{coin:'SOL',apy:'6-8%',type:'Native'},{coin:'MATIC',apy:'8-12%',type:'Native'},{coin:'ADA',apy:'3-5%',type:'Native'}];
        const found=coin?rates.filter(r=>r.coin.toLowerCase()===coin):rates;
        if (!found.length) return ctx.reply(`❌ Coin *${coin}* not found. Try: eth, bnb, sol, matic, ada${s.FOOTER}`);
        const list=found.map(r=>`*${r.coin}* — APY: ${r.apy} | ${r.type}`).join('\n');
        ctx.reply(`💰 *Staking APY Rates:*\n\n${list}\n\n_Rates are estimates and may vary_${s.FOOTER}`);
    }
};
