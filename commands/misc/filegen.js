const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = { name: 'filegen', aliases: ['generatefile','createfile','textfile'], category: 'misc', desc: 'Generate a downloadable file from text', usage: '†filegen [txt|md|html] [content]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const ext=args[0]?.toLowerCase()||'txt'; const body=args.slice(1).join(' ');
        if(!body) return ctx.reply(`❌ Usage: \`${s.prefix}filegen txt Hello world\`${s.FOOTER}`);
        if(!['txt','md','html','json','csv'].includes(ext)) return ctx.reply(`❌ Types: txt, md, html, json, csv${s.FOOTER}`);
        await ctx.react('📄');
        const fname=`file_${Date.now()}.${ext}`; const fpath=path.join(tmp,fname);
        const content=ext==='html'?`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><p>${body}</p></body></html>`:body;
        fs.writeFileSync(fpath,content,'utf8');
        await sock.sendMessage(ctx.from,{document:fs.readFileSync(fpath),mimetype:'application/octet-stream',fileName:fname,caption:`📄 ${fname}${s.FOOTER}`},{quoted:msg});
        try{fs.unlinkSync(fpath);}catch{}
    }
};
