const axios = require('axios');
module.exports = { name: 'codegen', aliases: ['generatecode','writecode','aicode'], category: 'ai', desc: 'Generate code from a description', usage: '†codegen [description]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const desc=args.join(' '); if(!desc) return ctx.reply(`❌ Usage: \`${s.prefix}codegen a Python function to sort a list\`${s.FOOTER}`);
        await ctx.react('💻');
        try { const res=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Write clean, well-commented code for: ${desc}. Include brief usage example.`)}`); ctx.reply(`💻 *Code Generator:*\n\n${res.data?.data||'Could not generate code.'}${s.FOOTER}`); }
        catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
