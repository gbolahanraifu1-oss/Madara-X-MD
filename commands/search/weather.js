'use strict';
const axios = require('axios');
module.exports = {
    name: 'weather', aliases: ['w', 'climate'],
    category: 'search', desc: 'ɢᴇᴛ ᴡᴇᴀᴛʜᴇʀ ɪɴғᴏ ғᴏʀ ᴀ ʟᴏᴄᴀᴛɪᴏɴ',
    usage: '†weather <city>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const city = args.join(' ');
        if (!city) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}weather London${s.FOOTER}`);
        try {
            const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273`).catch(() => null);
            if (!res?.data) return ctx.reply(`❌ ᴄᴏᴜʟᴅɴ'ᴛ ғᴇᴛᴄʜ ᴡᴇᴀᴛʜᴇʀ ᴅᴀᴛᴀ.${s.FOOTER}`);
            const d = res.data;
            await ctx.reply(
`🌍 *ᴡᴇᴀᴛʜᴇʀ ʀᴇᴘᴏʀᴛ*

「 📍 」ᴘʟᴀᴄᴇ: *${d.name}, ${d.sys.country}*
「 🌤️ 」ᴄᴏɴᴅɪᴛɪᴏɴ: *${d.weather[0].description}*
「 🌡️ 」ᴛᴇᴍᴘ: *${d.main.temp}°C* (ғᴇᴇʟs ${d.main.feels_like}°C)
「 💠 」ᴍɪɴ/ᴍᴀx: *${d.main.temp_min}°C / ${d.main.temp_max}°C*
「 💦 」ʜᴜᴍɪᴅɪᴛʏ: *${d.main.humidity}%*
「 🌬️ 」ᴡɪɴᴅ: *${d.wind.speed} km/h*
「 👁️ 」ᴠɪsɪʙɪʟɪᴛʏ: *${(d.visibility/1000).toFixed(1)} km*${s.FOOTER}`);
        } catch (e) { await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};
