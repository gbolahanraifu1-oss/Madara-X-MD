const axios = require('axios');
module.exports = { name: 'scriptconvert', aliases: ['script','convertscript','writingsystem'], category: 'language', desc: 'Convert text between writing systems', usage: '†scriptconvert [target_script] [text]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const script=args[0]; const text=args.slice(1).join(' ');
        if(!script||!text) return ctx.reply(`❌ Usage: \`${s.prefix}scriptconvert Hindi Hello world\`${s.FOOTER}`);
        await ctx.react('✍️');
        try {
            const res=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Convert this text to the ${script} writing system: "${text}"`)}`);
            ctx.reply(`✍️ *→ ${script}:*\n\n${res.data?.data||'Could not convert.'}${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
