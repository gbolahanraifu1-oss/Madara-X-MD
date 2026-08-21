const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = { name: 'stickertext', aliases: ['texttoSticker','txt2sticker','stxt'], category: 'sticker', desc: 'Create a text-based sticker', usage: '†stickertext [your text]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const text=args.join(' '); if(!text) return ctx.reply(`❌ Usage: \`${s.prefix}stickertext Hello World!\`${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const id=Date.now(); const out=path.join(tmp,`${id}_stkrtxt.webp`);
            const safe=text.slice(0,40).replace(/'/g,"\\'").replace(/:/g,'\\:');
            await new Promise((res,rej)=>exec(`ffmpeg -y -f lavfi -i color=c=0x25D366:size=512x512:duration=1 -vf "drawtext=text='${safe}':fontcolor=white:fontsize=${text.length>20?32:48}:x=(w-text_w)/2:y=(h-text_h)/2:borderw=3:bordercolor=black" -frames:v 1 "${out}"`,e=>e?rej(e):res()));
            await sock.sendMessage(ctx.from,{sticker:fs.readFileSync(out)},{quoted:msg});
            try{fs.unlinkSync(out);}catch{}
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
