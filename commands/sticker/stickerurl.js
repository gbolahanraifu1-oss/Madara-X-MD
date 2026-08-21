const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = { name: 'stickerurl', aliases: ['urlsticker','imageurlsticker','urltoSticker'], category: 'sticker', desc: 'Create sticker from an image URL', usage: '†stickerurl [image-url]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const url=args[0]; if(!url) return ctx.reply(`❌ Usage: \`${s.prefix}stickerurl https://example.com/image.jpg\`${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const res=await axios.get(url,{responseType:'arraybuffer'});
            const buf=Buffer.from(res.data);
            const id=Date.now(); const inf=path.join(tmp,`${id}.jpg`); const out=path.join(tmp,`${id}.webp`);
            fs.writeFileSync(inf,buf);
            await new Promise((res,rej)=>exec(`ffmpeg -y -i "${inf}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2" "${out}"`,e=>e?rej(e):res()));
            await sock.sendMessage(ctx.from,{sticker:fs.readFileSync(out)},{quoted:msg});
            try{fs.unlinkSync(inf);fs.unlinkSync(out);}catch{}
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
