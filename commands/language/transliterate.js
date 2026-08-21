const axios = require('axios');
module.exports = { name: 'transliterate', aliases: ['translit','phonetic','pronounce'], category: 'language', desc: 'Transliterate text to phonetic pronunciation', usage: '†transliterate [text] [language?]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const text=args.join(' '); if(!text) return ctx.reply(`❌ Usage: \`${s.prefix}transliterate こんにちは\`${s.FOOTER}`);
        await ctx.react('🔤');
        try { const res=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Provide phonetic transliteration and pronunciation guide for: "${text}". Show how to pronounce it in English letters.`)}`); ctx.reply(`🔤 *Transliteration:*\n\n${res.data?.data||'Could not transliterate.'}${s.FOOTER}`); }
        catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
