const db = require('../../lib/db');
module.exports = {
    name: 'todo',
    aliases: ['todolist', 'task', 'tasks'],
    category: 'utility',
    desc: 'Manage your to-do list',
    usage: '†todo add [task] | †todo list | †todo done [num] | †todo clear',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0]||'list').toLowerCase();
        const key = `todo_${ctx.sender.split('@')[0]}`;
        let todos = db.get('todos', key, []);

        if (sub === 'list') {
            if (!todos.length) return ctx.reply(`📋 Your to-do list is empty!\nUse \`${s.prefix}todo add [task]\` to add one.${s.FOOTER}`);
            const list = todos.map((t,i) => `${t.done?'✅':'⬜'} ${i+1}. ${t.text}`).join('\n');
            ctx.reply(`📋 *Your To-Do List:*\n\n${list}${s.FOOTER}`);
        } else if (sub === 'add') {
            const task = args.slice(1).join(' ');
            if (!task) return ctx.reply(`❌ Provide a task.${s.FOOTER}`);
            todos.push({ text: task, done: false, created: Date.now() });
            db.set('todos', key, todos);
            ctx.reply(`✅ Task added: _${task}_${s.FOOTER}`);
        } else if (sub === 'done' || sub === 'check') {
            const idx = parseInt(args[1]) - 1;
            if (isNaN(idx) || !todos[idx]) return ctx.reply(`❌ Invalid task number.${s.FOOTER}`);
            todos[idx].done = true;
            db.set('todos', key, todos);
            ctx.reply(`✅ Task *${todos[idx].text}* marked as done!${s.FOOTER}`);
        } else if (sub === 'remove' || sub === 'delete' || sub === 'del') {
            const idx = parseInt(args[1]) - 1;
            if (isNaN(idx) || !todos[idx]) return ctx.reply(`❌ Invalid task number.${s.FOOTER}`);
            const removed = todos.splice(idx, 1)[0];
            db.set('todos', key, todos);
            ctx.reply(`🗑️ Removed: _${removed.text}_${s.FOOTER}`);
        } else if (sub === 'clear') {
            db.set('todos', key, []);
            ctx.reply(`🗑️ To-do list cleared.${s.FOOTER}`);
        } else {
            ctx.reply(`📋 *To-Do Commands:*\n• \`${s.prefix}todo list\`\n• \`${s.prefix}todo add [task]\`\n• \`${s.prefix}todo done [num]\`\n• \`${s.prefix}todo remove [num]\`\n• \`${s.prefix}todo clear\`${s.FOOTER}`);
        }
    }
};
