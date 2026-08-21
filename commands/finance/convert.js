const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');
module.exports = { name: 'convert', aliases: ['currencyconvert','fxconvert'], category: 'finance', desc: 'Convert currencies', usage: '†convert [amount] [FROM] [TO]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const amount=parseFloat(args[0]); const from=args[1]?.toUpperCase(); const to=args[2]?.toUpperCase();
        if (isNaN(amount)||!from||!to) return ctx.reply(`❌ Usage: \`${s.prefix}convert 100 USD NGN\`${s.FOOTER}`);
        await ctx.react('💱');
        try {
            const res=await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`);
            const rate=res.data?.rates?.[to]; if(!rate) return ctx.reply(`❌ Currency *${to}* not found.${s.FOOTER}`);
            const result=(amount*rate).toFixed(2);
            ctx.reply(menuBox('💱', 'ᴄᴜʀʀᴇɴᴄʏ ᴄᴏɴᴠᴇʀᴛ', [
                `*Input:* ${amount.toLocaleString()} ${from}`,
                `*Result:* ${parseFloat(result).toLocaleString()} ${to}`,
                `*Rate:* 1 ${from} = ${rate.toFixed(4)} ${to}`,
            ]) + s.FOOTER);
        } catch(e){ctx.reply(`❌ Conversion failed: ${e.message}${s.FOOTER}`);}
    }
};
