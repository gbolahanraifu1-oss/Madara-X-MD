const axios = require('axios');
module.exports = {
    name: 'githubdl', aliases: ['ghdl','githubrelease','ghrelease'], category: 'media',
    desc: 'Download latest GitHub release asset', usage: '†githubdl [owner/repo]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings; const repo = args[0];
        if (!repo || !repo.includes('/')) return ctx.reply(`❌ Usage: \`${s.prefix}githubdl torvalds/linux\`${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const res    = await axios.get(`https://api.github.com/repos/${repo}/releases/latest`);
            const latest = res.data; const assets = latest.assets;
            if (!assets?.length) return ctx.reply(`❌ No release assets for *${repo}*.${s.FOOTER}`);
            const list = assets.slice(0,5).map((a,i) => `${i+1}. *${a.name}* — ${(a.size/1024/1024).toFixed(1)}MB\n   🔗 ${a.browser_download_url}`).join('\n\n');
            ctx.reply(`📦 *${repo} — v${latest.tag_name}*\n\n${list}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};
