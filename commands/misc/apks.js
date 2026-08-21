'use strict';
const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');

module.exports = {
    name: 'apk', aliases: ['apkdl', 'apkdownload'],
    category: 'misc', desc: 'ᴅᴏᴡɴʟᴏᴀᴅ ᴀᴘᴋ',
    usage: '†apk <app name>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ');
        if (!q) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}apk WhatsApp${s.FOOTER}`);

        await ctx.react('📦');

        let res;
        try {
            res = await axios.get(
                `https://api.dreaded.site/api/apk?name=${encodeURIComponent(q)}`,
                { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }
            );
        } catch (e) {
            return ctx.reply(
                `❌ APK search failed — the search service didn't respond in time or is down.\n_${e.message}_${s.FOOTER}`
            );
        }

        // API shape has shifted before (result vs data vs top-level) — accept any of them
        const data = res.data?.result || res.data?.data || (res.data?.name ? res.data : null);
        if (!data || !data.link) {
            return ctx.reply(`❌ ɴᴏ ʀᴇsᴜʟᴛs ғᴏʀ *${q}*.${s.FOOTER}`);
        }

        const lines = [
            `*Version:* ${data.version || 'N/A'}`,
            `*Size:* ${data.size || 'N/A'}`,
            `*Rating:* ${data.rating || 'N/A'}`,
            `*Link:* ${data.link}`,
        ];
        const caption = menuBox('📦', data.name || q, lines) + s.FOOTER;

        // Only attach an icon if it's actually a usable http(s) URL — an
        // empty/invalid icon field used to crash the whole send.
        const hasIcon = typeof data.icon === 'string' && /^https?:\/\//.test(data.icon);

        try {
            if (hasIcon) {
                await sock.sendMessage(ctx.from, { image: { url: data.icon }, caption }, { quoted: msg });
            } else {
                await ctx.reply(caption);
            }
        } catch (e) {
            // Icon URL was bad/unreachable — fall back to text so the user still gets the result
            await ctx.reply(caption);
        }
    }
};
