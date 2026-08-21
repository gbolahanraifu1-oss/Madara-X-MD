const axios = require('axios');
module.exports = { name: 'gasprice', aliases: ['ethgas','gas','gasfee'], category: 'finance', desc: 'Ethereum gas prices (fast/standard/slow)', usage: '†gasprice',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; await ctx.react('⛽');
        try {
            const res=await axios.get('https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken');
            const d=res.data?.result;
            ctx.reply(`⛽ *Ethereum Gas Prices:*\n*╭──────────────────⊷*\n*┋ 🐢 Slow:* ${d?.SafeGasPrice||'N/A'} Gwei\n*┋ 🚗 Standard:* ${d?.ProposeGasPrice||'N/A'} Gwei\n*┋ 🚀 Fast:* ${d?.FastGasPrice||'N/A'} Gwei\n*╰──────────────────⊷*${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Gas price failed: ${e.message}${s.FOOTER}`);}
    }
};
