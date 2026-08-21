const db = require('../../lib/db');
module.exports = { name: 'clearnotes', aliases: ['clearallnotes','deleteallnotes','wipnotes'], category: 'utility', desc: 'Clear all saved notes', usage: '†clearnotes',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const key=`notes_${ctx.sender.split('@')[0]}`;
        db.set('notes',key,{}); ctx.reply(`🗑️ All notes cleared.${s.FOOTER}`);
    }
};
