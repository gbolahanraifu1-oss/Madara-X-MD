const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'apkmirror', aliases: ['getapk', 'downloadapk'], category: 'media',
    desc: 'Search APK info from APKMirror', usage: '†apkmirror [app name]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings; const q = args.join(' ');
        if (!q) return ctx.reply(`❌ Usage: \`${s.prefix}apkmirror [app name]\`${s.FOOTER}`);
        await ctx.react('📱');
        try {
            const res  = await axios.get(`https://www.apkmirror.com/?post_type=app_release&searchtype=apk&s=${encodeURIComponent(q)}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
            const match = res.data.match(/href="(\/apk\/[^"]+)"/);
            const link  = match ? `https://www.apkmirror.com${match[1]}` : null;
            ctx.reply(menuBox('📱', `ᴀᴘᴋ: ${q}`, [
                link ? `🔗 ${link}` : '❌ Not found',
                `_Visit link to download APK._`,
            ]) + s.FOOTER);
        } catch (e) { ctx.reply(`❌ APK search failed: ${e.message}${s.FOOTER}`); }
    }
};
