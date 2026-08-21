const db = require('../../lib/db');
module.exports = { name: 'export', aliases: ['exportchat','chatexport','savechat'], category: 'misc', desc: 'Export recent chat history to text file', usage: '†export [count?]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const count=Math.min(parseInt(args[0])||50,200); await ctx.react('📤');
        const history=db.get('chatlog',ctx.from,[]);
        const recent=history.slice(-count); if(!recent.length) return ctx.reply(`❌ No chat history stored.\n_Chat logging must be enabled._${s.FOOTER}`);
        const fs=require('fs'),path=require('path'); const tmp=path.join(process.cwd(),'temp'); if(!fs.existsSync(tmp))fs.mkdirSync(tmp,{recursive:true});
        const fname=`chat_export_${Date.now()}.txt`; const fpath=path.join(tmp,fname);
        fs.writeFileSync(fpath,recent.map(m=>`[${new Date(m.ts).toISOString()}] ${m.sender}: ${m.text}`).join('\n'),'utf8');
        await sock.sendMessage(ctx.from,{document:fs.readFileSync(fpath),mimetype:'text/plain',fileName:fname,caption:`📤 Chat export (${recent.length} msgs)${s.FOOTER}`},{quoted:msg});
        try{fs.unlinkSync(fpath);}catch{}
    }
};
