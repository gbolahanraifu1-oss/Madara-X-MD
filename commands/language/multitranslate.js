const axios = require('axios');
module.exports = { name: 'multitranslate', aliases: ['batchtranslate','multilang','translateall'], category: 'language', desc: 'Translate text into 5 languages at once', usage: '†multitranslate [text]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const text=args.join(' '); if(!text) return ctx.reply(`❌ Usage: \`${s.prefix}multitranslate Hello world\`${s.FOOTER}`);
        await ctx.react('🌍');
        const langs=[{code:'es',name:'Spanish 🇪🇸'},{code:'fr',name:'French 🇫🇷'},{code:'de',name:'German 🇩🇪'},{code:'ja',name:'Japanese 🇯🇵'},{code:'ar',name:'Arabic 🇸🇦'}];
        try { const results=await Promise.all(langs.map(async l=>{const res=await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${l.code}`);return `*${l.name}:* ${res.data?.responseData?.translatedText||'Error'}`;})); ctx.reply(`🌍 *Multi-Translate: "${text.slice(0,40)}"*\n\n${results.join('\n')}${s.FOOTER}`); }
        catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
