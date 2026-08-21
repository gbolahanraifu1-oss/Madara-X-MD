const axios = require('axios');
module.exports = {
    name: 'emojipack',
    aliases: ['emojisticker', 'makeemoji', 'emojitosticker'],
    category: 'sticker',
    desc: 'Create sticker from emoji or multiple emojis',
    usage: '†emojipack [emoji or emojis]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const emojis = args.join(' ');
        if (!emojis) return ctx.reply(`❌ Usage: \`${s.prefix}emojipack 😂🔥\`${s.FOOTER}`);
        await ctx.react('🎭');
        try {
            // Use emoji API to get image
            const code = [...emojis].map(c => c.codePointAt(0).toString(16)).join('-');
            const url  = `https://emojicdn.elk.sh/${encodeURIComponent(emojis[0])}?style=twitter`;
            const res  = await axios.get(url, { responseType: 'arraybuffer' });
            const { exec } = require('child_process');
            const fs   = require('fs'), path = require('path');
            const tmp  = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
            const id   = Date.now();
            const inf  = path.join(tmp,`${id}.png`), out = path.join(tmp,`${id}_emoji.webp`);
            fs.writeFileSync(inf, Buffer.from(res.data));
            await new Promise((res2, rej) => exec(`ffmpeg -y -i "${inf}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2" "${out}"`, e => e ? rej(e) : res2()));
            await sock.sendMessage(ctx.from, { sticker: fs.readFileSync(out) }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(out); } catch {}
        } catch (e) { ctx.reply(`❌ Emoji sticker failed: ${e.message}${s.FOOTER}`); }
    }
};
