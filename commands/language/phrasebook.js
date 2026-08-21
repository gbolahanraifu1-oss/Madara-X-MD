const axios = require('axios');
module.exports = { name: 'phrasebook', aliases: ['phrases','commonphrases','travelphrases'], category: 'language', desc: 'Common travel phrases in a language', usage: '†phrasebook [language]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const lang=args.join(' ')||'Spanish'; await ctx.react('📖');
        try {
            const res=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Give 8 common travel phrases in ${lang} with English translation. Format: Phrase — Translation`)}`);
            ctx.reply(`📖 *Phrases: ${lang}*\n\n${res.data?.data||'Could not load.'}${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
