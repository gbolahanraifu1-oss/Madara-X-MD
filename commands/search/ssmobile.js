const axios = require('axios');
module.exports = { name: 'ssmobile', aliases: ['screenshotmobile','mobiless'], category: 'search', desc: 'Mobile screenshot of a website', usage: '†ssmobile [url]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const url=args[0]; if(!url) return ctx.reply(`❌ Usage: \`${s.prefix}ssmobile [url]\`${s.FOOTER}`);
        await ctx.react('📱');
        try {
            const res=await axios.get(`https://api.screenshotmachine.com/?key=demo&url=${encodeURIComponent(url)}&device=phone&cacheLimit=0`,{responseType:'arraybuffer',timeout:15000});
            await sock.sendMessage(ctx.from,{image:Buffer.from(res.data),caption:`📱 Mobile: ${url}${s.FOOTER}`},{quoted:msg});
        } catch(e){ctx.reply(`❌ Screenshot failed: ${e.message}${s.FOOTER}`);}
    }
};
