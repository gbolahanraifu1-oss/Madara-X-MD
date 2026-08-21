const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');
module.exports = { name: 'gasprice', aliases: ['ethgas','gas','gasfee'], category: 'finance', desc: 'Ethereum gas prices (fast/standard/slow)', usage: '†gasprice',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; await ctx.react('⛽');
        try {
            const res=await axios.get('https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken');
            const d=res.data?.result;
            ctx.reply(menuBox('⛽', 'ᴇᴛʜᴇʀᴇᴜᴍ ɢᴀs ᴘʀɪᴄᴇs', [
                `*Slow:* ${d?.SafeGasPrice||'N/A'} Gwei`,
                `*Standard:* ${d?.ProposeGasPrice||'N/A'} Gwei`,
                `*Fast:* ${d?.FastGasPrice||'N/A'} Gwei`,
            ]) + s.FOOTER);
        } catch(e){ctx.reply(`❌ Gas price failed: ${e.message}${s.FOOTER}`);}
    }
};
