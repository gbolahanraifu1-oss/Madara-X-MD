const db = require('../../lib/db');
module.exports = {
    name: 'teach',
    aliases: ['learn', 'addresponse'],
    category: 'ai',
    desc: 'Teach bot a custom auto-response trigger',
    usage: '†teach [trigger] | [response]',
    ownerOnly: true,
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s     = ctx.settings;
        const parts = ctx.text?.split('|').map(p => p.trim());
        if (!parts || parts.length < 2) return ctx.reply(`❌ Usage: \`${s.prefix}teach hello | Hi there! How can I help?\`${s.FOOTER}`);
        const [trigger, response] = parts;
        const all = db.get('taught', 'responses', {});
        all[trigger.toLowerCase()] = response;
        db.set('taught', 'responses', all);
        ctx.reply(`✅ Taught!\n\n*Trigger:* _${trigger}_\n*Response:* _${response}_\n\n_Total responses: ${Object.keys(all).length}_${s.FOOTER}`);
    }
};
