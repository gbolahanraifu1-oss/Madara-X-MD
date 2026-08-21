const db = require('../../lib/db');
module.exports = {
    name: 'note',
    aliases: ['notes', 'savenote', 'deletenote'],
    category: 'utility',
    desc: 'Save and manage personal notes',
    usage: '†note save [title] | [content]  or  †note list  or  †note delete [title]',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0]||'list').toLowerCase();
        const key = `notes_${ctx.sender.split('@')[0]}`;
        const notes = db.get('notes', key, {});

        if (sub === 'list' || sub === 'notes') {
            const list = Object.keys(notes);
            if (!list.length) return ctx.reply(`📝 No notes saved yet.\nUse \`${s.prefix}note save Title | Content\`${s.FOOTER}`);
            ctx.reply(`📝 *Your Notes (${list.length}):*\n\n${list.map((n,i) => `${i+1}. *${n}*`).join('\n')}${s.FOOTER}`);
        } else if (sub === 'save') {
            const full  = ctx.text.slice(4).trim();
            const parts = full.split('|').map(p=>p.trim());
            if (parts.length < 2) return ctx.reply(`❌ Usage: \`${s.prefix}note save Title | Content\`${s.FOOTER}`);
            notes[parts[0]] = parts[1];
            db.set('notes', key, notes);
            ctx.reply(`✅ Note *${parts[0]}* saved!${s.FOOTER}`);
        } else if (sub === 'get' || sub === 'view') {
            const title = args.slice(1).join(' ');
            const n = notes[title];
            if (!n) return ctx.reply(`❌ Note *${title}* not found.${s.FOOTER}`);
            ctx.reply(`📝 *${title}:*\n\n${n}${s.FOOTER}`);
        } else if (sub === 'delete' || sub === 'del') {
            const title = args.slice(1).join(' ');
            if (!notes[title]) return ctx.reply(`❌ Note *${title}* not found.${s.FOOTER}`);
            delete notes[title];
            db.set('notes', key, notes);
            ctx.reply(`🗑️ Note *${title}* deleted.${s.FOOTER}`);
        } else {
            ctx.reply(`📝 *Note Commands:*\n• \`${s.prefix}note list\`\n• \`${s.prefix}note save Title | Content\`\n• \`${s.prefix}note get Title\`\n• \`${s.prefix}note delete Title\`${s.FOOTER}`);
        }
    }
};
