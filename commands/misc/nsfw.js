const { downloadMediaMessage } = require('@itsliaaa/baileys');
const axios = require('axios');
module.exports = { name: 'nsfw', aliases: ['nsfwcheck','safecontent'], category: 'misc', desc: 'Check NSFW percentage of an image', usage: '†nsfw (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const ctxInfo=msg.message?.extendedTextMessage?.contextInfo;
        let target=msg; if(ctxInfo?.quotedMessage) target={key:{remoteJid:ctx.from,id:ctxInfo.stanzaId,participant:ctxInfo.participant},message:ctxInfo.quotedMessage};
        if (!target.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        await ctx.react('🔍');
        try {
            const buf=await downloadMediaMessage(target,'buffer',{},{logger:undefined,reuploadRequest:sock.updateMediaMessage});
            const res=await axios.post('https://api.deepai.org/api/nsfw-detector',{image:`data:image/jpeg;base64,${buf.toString('base64')}`},{headers:{'api-key':s.deepaiKey||'quickstart-QUdJIGlzIHRoZSBmdXR1cmU='}});
            const score=((res.data?.output?.nsfw_score||0)*100).toFixed(1);
            const label=score>70?'🔴 HIGH NSFW':score>30?'🟡 MODERATE':'🟢 SAFE';
            ctx.reply(`🔍 *NSFW Analysis:*\n\n${label}\n📊 Score: *${score}%*${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Analysis failed: ${e.message}${s.FOOTER}`);}
    }
};
