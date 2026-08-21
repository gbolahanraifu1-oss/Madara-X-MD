module.exports = { name: 'say', aliases: ['ttsvoice','speak'], category: 'fun', desc: 'Text to voice note (TTS)', usage: '†say [text]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const text=args.join(' ');
        if(!text) return ctx.reply(`❌ Usage: \`${s.prefix}say [text]\`${s.FOOTER}`);
        await ctx.react('🔊');
        const {exec}=require('child_process'); const fs=require('fs'),path=require('path');
        const tmp=path.join(process.cwd(),'temp'); if(!fs.existsSync(tmp))fs.mkdirSync(tmp,{recursive:true});
        const id=Date.now(); const wav=`/tmp/${id}.wav`; const ogg=path.join(tmp,`${id}.ogg`);
        try {
            await new Promise((res,rej)=>exec(`espeak -v en -s 150 "${text.replace(/"/g,'\\"').slice(0,200)}" -w "${wav}" && ffmpeg -y -i "${wav}" -ar 16000 -ac 1 -c:a libopus "${ogg}"`,e=>e?rej(e):res()));
            await sock.sendMessage(ctx.from,{audio:fs.readFileSync(ogg),mimetype:'audio/ogg; codecs=opus',ptt:true},{quoted:msg});
            try{fs.unlinkSync(wav);fs.unlinkSync(ogg);}catch{}
        } catch(e){ctx.reply(`❌ TTS failed: ${e.message}\n_Requires espeak + ffmpeg_${s.FOOTER}`);}
    }
};
