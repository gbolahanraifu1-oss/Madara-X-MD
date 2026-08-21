const axios = require('axios');
module.exports = { name: 'carinfo', aliases: ['car','vehicle','motoinfo'], category: 'search', desc: 'Car/motorcycle info by plate or model', usage: '†carinfo [plate or car name]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const q=args.join(' '); if(!q) return ctx.reply(`❌ Usage: \`${s.prefix}carinfo B1234XYZ\`${s.FOOTER}`);
        await ctx.react('🚗');
        try {
            const res=await axios.get(`https://api.siputzx.my.id/api/s/plat?plat=${encodeURIComponent(q)}`);
            const data=res.data?.data;
            if (data) return ctx.reply(`🚗 *Car Info:*\n*╭──────────────────⊷*\n*┋ 🔢 Plate:* ${q.toUpperCase()}\n*┋ 📍 Region:* ${data.daerah||'N/A'}\n*┋ 🏛️ Province:* ${data.provinsi||'N/A'}\n*╰──────────────────⊷*${s.FOOTER}`);
            const res2=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Brief info about vehicle: ${q}. Include year range, engine specs, features.`)}`);
            ctx.reply(`🚗 *Vehicle Info:*\n\n${res2.data?.data||'No info found.'}${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
