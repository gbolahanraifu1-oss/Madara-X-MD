const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { menuBox } = require('../../lib/menuBox');
module.exports = { name: 'fileinfo', aliases: ['mediainfo','documentinfo'], category: 'utility', desc: 'Analyze replied file/media properties', usage: '†fileinfo (reply to any file)',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const ctxInfo=msg.message?.extendedTextMessage?.contextInfo;
        let target=msg; if(ctxInfo?.quotedMessage) target={key:{remoteJid:ctx.from,id:ctxInfo.stanzaId,participant:ctxInfo.participant},message:ctxInfo.quotedMessage};
        const tmsg=target.message||{}; const types=['imageMessage','videoMessage','audioMessage','documentMessage','stickerMessage'];
        const found=types.find(t=>tmsg[t]); if(!found) return ctx.reply(`❌ Reply to any file or media.${s.FOOTER}`);
        const info=tmsg[found];
        ctx.reply(menuBox('📄', 'ғɪʟᴇ ɪɴғᴏ', [
            `*Type:* ${found.replace('Message','')}`,
            `*Size:* ${info.fileLength?`${(info.fileLength/1024).toFixed(1)} KB`:'N/A'}`,
            `*Mime:* ${info.mimetype||'N/A'}`,
            `*Dims:* ${info.width||'?'}x${info.height||'?'}`,
            `*Duration:* ${info.seconds?`${info.seconds}s`:'N/A'}`,
        ]) + s.FOOTER);
    }
};
