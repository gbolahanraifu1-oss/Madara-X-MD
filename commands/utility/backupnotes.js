const db = require('../../lib/db');
module.exports = { name: 'backupnotes', aliases: ['exportnotes','savenotes'], category: 'utility', desc: 'Backup/export all notes as text file', usage: '†backupnotes',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const key=`notes_${ctx.sender.split('@')[0]}`; const notes=db.get('notes',key,{});
        const list=Object.entries(notes); if(!list.length) return ctx.reply(`❌ No notes to backup.${s.FOOTER}`);
        const content=list.map(([t,v],i)=>`${i+1}. ${t}\n${v}`).join('\n\n---\n\n');
        const fs=require('fs'); const path=require('path'); const tmp=path.join(process.cwd(),'temp');
        if(!fs.existsSync(tmp))fs.mkdirSync(tmp,{recursive:true});
        const fname=`notes_backup_${Date.now()}.txt`; const fpath=path.join(tmp,fname);
        fs.writeFileSync(fpath,content,'utf8');
        await sock.sendMessage(ctx.from,{document:fs.readFileSync(fpath),mimetype:'text/plain',fileName:fname,caption:`📄 Notes backup (${list.length} notes)${s.FOOTER}`},{quoted:msg});
        try{fs.unlinkSync(fpath);}catch{}
    }
};
