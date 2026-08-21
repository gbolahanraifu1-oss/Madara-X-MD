const axios = require('axios');
module.exports = { name: 'githubroast', aliases: ['ghroast','roastgithub'], category: 'misc', desc: 'Fun roast of a GitHub profile', usage: '†githubroast [username]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const user=args[0]; if(!user) return ctx.reply(`❌ Usage: \`${s.prefix}githubroast [username]\`${s.FOOTER}`);
        await ctx.react('🔥');
        try {
            const gh=await axios.get(`https://api.github.com/users/${user}`); const d=gh.data;
            const res=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Funny roast for GitHub profile: ${d.login}, Repos: ${d.public_repos}, Followers: ${d.followers}, Bio: ${d.bio||'No bio'}. 2-3 sentences.`)}`);
            ctx.reply(`🔥 *GitHub Roast: @${user}*\n\n${res.data?.data||`${user} has ${d.public_repos} repos and ${d.followers} followers. Still waiting for that viral project... 😅`}${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Could not roast @${user}: ${e.message}${s.FOOTER}`);}
    }
};
