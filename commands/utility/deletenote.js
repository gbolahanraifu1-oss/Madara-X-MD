const db = require('../../lib/db');
module.exports = { name: 'deletenote', aliases: ['delnote','removenote'], category: 'utility', desc: 'Delete a specific note by title', usage: '†deletenote [title]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const title=args.join(' '); if(!title) return ctx.reply(`❌ Usage: \`${s.prefix}deletenote [title]\`${s.FOOTER}`);
        const key=`notes_${ctx.sender.split('@')[0]}`; const notes=db.get('notes',key,{});
        if (!notes[title]) return ctx.reply(`❌ Note *"${title}"* not found.${s.FOOTER}`);
        delete notes[title]; db.set('notes',key,notes);
        ctx.reply(`🗑️ Note *"${title}"* deleted.${s.FOOTER}`);
    }
};
