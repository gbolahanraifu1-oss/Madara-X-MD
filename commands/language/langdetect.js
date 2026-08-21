const axios = require('axios');
module.exports = { name: 'langdetect', aliases: ['detectlang','whatlanguage','identifylang'], category: 'language', desc: 'Detect the language of text', usage: '†langdetect [text]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const text=args.join(' '); if(!text) return ctx.reply(`❌ Usage: \`${s.prefix}langdetect [text]\`${s.FOOTER}`);
        await ctx.react('🔍');
        try { const res=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Detect the language of this text and give confidence percentage: "${text}". Format: Language: X | Confidence: Y%`)}`); ctx.reply(`🔍 *Language Detection:*\n\n${res.data?.data||'Could not detect.'}${s.FOOTER}`); }
        catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
