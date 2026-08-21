const axios = require('axios');
module.exports = { name: 'avatar', aliases: ['generateavatar','randomavatar'], category: 'misc', desc: 'Generate a random avatar image', usage: '†avatar [seed?]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const seed=args.join('')||Math.random().toString(36).slice(2); await ctx.react('🖼️');
        const styles=['adventurer','avataaars','bottts','fun-emoji','pixel-art'];
        const style=styles[Math.floor(Math.random()*styles.length)];
        try { const res=await axios.get(`https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(seed)}&size=256`,{responseType:'arraybuffer'}); await sock.sendMessage(ctx.from,{image:Buffer.from(res.data),caption:`🎭 *Avatar* — Style: ${style}${s.FOOTER}`},{quoted:msg}); }
        catch(e){ctx.reply(`❌ Avatar failed: ${e.message}${s.FOOTER}`);}
    }
};
