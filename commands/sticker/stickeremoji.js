const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

module.exports = {
    name: 'stickeremoji',
    aliases: ['emojisticker', 'emojitosticker'],
    category: 'sticker',
    desc: 'Create a sticker from an emoji (large)',
    usage: '†stickeremoji [emoji]  e.g. †stickeremoji 😂',
    async execute(sock, msg, args, ctx) {
        const s     = ctx.settings;
        const emoji = args[0];
        if (!emoji) return ctx.reply(`❌ Provide an emoji.\n_Usage: ${s.prefix}stickeremoji 😂_${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            // Get emoji codepoint for Twemoji
            const cp  = [...emoji].map(c => c.codePointAt(0).toString(16)).join('-');
            const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${cp}.svg`;
            const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
            const id  = Date.now();
            const svgf = path.join(tmp, `${id}.svg`);
            const outf = path.join(tmp, `${id}.webp`);
            fs.writeFileSync(svgf, Buffer.from(res.data));
            await new Promise((res2, rej) => exec(`ffmpeg -y -i "${svgf}" -vf "scale=512:512" "${outf}"`, e => e ? rej(e) : res2()));
            await sock.sendMessage(ctx.from, { sticker: fs.readFileSync(outf) }, { quoted: msg });
            try { fs.unlinkSync(svgf); fs.unlinkSync(outf); } catch {}
        } catch (e) { ctx.reply(`❌ Failed — emoji may not be supported: ${e.message}${s.FOOTER}`); }
    }
};
