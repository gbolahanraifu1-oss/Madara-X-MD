const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = { name: 'memegenerator', aliases: ['makememe','custommeme','memegen'], category: 'fun', desc: 'Create meme with top/bottom text', usage: '†memegenerator [TOP] | [BOTTOM] (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const parts=ctx.text.split('|').map(p=>p.trim());
        const top=(parts[0]||'TOP TEXT').toUpperCase(); const bottom=(parts[1]||'BOTTOM TEXT').toUpperCase();
        const ctxInfo=msg.message?.extendedTextMessage?.contextInfo;
        let target=msg; if(ctxInfo?.quotedMessage) target={key:{remoteJid:ctx.from,id:ctxInfo.stanzaId,participant:ctxInfo.participant},message:ctxInfo.quotedMessage};
        if(!target.message?.imageMessage) return ctx.reply(`❌ Reply to an image. \`${s.prefix}memegenerator TOP | BOTTOM\`${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf=await downloadMediaMessage(target,'buffer',{},{logger:undefined,reuploadRequest:sock.updateMediaMessage});
            const id=Date.now(); const inf=path.join(tmp,`${id}.jpg`); const out=path.join(tmp,`${id}_meme.jpg`);
            fs.writeFileSync(inf,buf);
            const st=t=>t.replace(/'/g,"'\\''" ).replace(/:/g,'\\:');
            await new Promise((res,rej)=>exec(`ffmpeg -y -i "${inf}" -vf "drawtext=text='${st(top)}':fontcolor=white:fontsize=56:borderw=3:bordercolor=black:x=(w-text_w)/2:y=20,drawtext=text='${st(bottom)}':fontcolor=white:fontsize=56:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-th-20" "${out}"`,e=>e?rej(e):res()));
            await sock.sendMessage(ctx.from,{image:fs.readFileSync(out),caption:`😂 Meme!${s.FOOTER}`},{quoted:msg});
            try{fs.unlinkSync(inf);fs.unlinkSync(out);}catch{}
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
