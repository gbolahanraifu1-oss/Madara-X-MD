'use strict';
const axios = require('axios');
module.exports = {
    name: 'reddit', aliases: ['subreddit', 'meme'],
    category: 'misc', desc: 'ɢᴇᴛ ᴀ ʀᴀɴᴅᴏᴍ ᴘᴏsᴛ ғʀᴏᴍ ᴀ sᴜʙʀᴇᴅᴅɪᴛ',
    usage: '†reddit <subreddit>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const sub = args[0] || 'memes';
        try {
            const res = await axios.get(`https://www.reddit.com/r/${sub}/random.json?limit=1`, {
                headers: { 'User-Agent': 'MadaraBot/1.0' }
            });
            const post = Array.isArray(res.data) ? res.data[0]?.data?.children?.[0]?.data : res.data?.data?.children?.[0]?.data;
            if (!post) return ctx.reply(`❌ ɴᴏ ᴘᴏsᴛs ғᴏᴜɴᴅ ɪɴ r/${sub}.${s.FOOTER}`);
            const text = `📌 *${post.title}*\n\n👤 u/${post.author} • ⬆️ ${post.ups} • 💬 ${post.num_comments}\n\n🔗 https://reddit.com${post.permalink}${s.FOOTER}`;
            const url = post.url;
            if (url?.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
                await sock.sendMessage(ctx.from, { image: { url }, caption: text }, { quoted: msg });
            } else await ctx.reply(text);
        } catch (e) { await ctx.reply(`❌ ᴄᴏᴜʟᴅɴ'ᴛ ʀᴇᴀᴄʜ ʀᴇᴅᴅɪᴛ.${s.FOOTER}`); }
    }
};
