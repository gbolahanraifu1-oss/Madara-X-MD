const db = require('../../lib/db');
module.exports = {
    name: 'forget',
    aliases: ['deleteresponse', 'removeteach'],
    category: 'ai',
    desc: 'Remove a taught auto-response',
    usage: '†forget [trigger]  or  †forget all',
    ownerOnly: true,
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s       = ctx.settings;
        const trigger = ctx.text?.toLowerCase();
        if (!trigger) return ctx.reply(`❌ Provide a trigger to forget.\n_Usage: ${s.prefix}forget hello_${s.FOOTER}`);
        const all = db.get('taught', 'responses', {});
        if (trigger === 'all') {
            db.set('taught', 'responses', {});
            return ctx.reply(`🗑️ All ${Object.keys(all).length} taught responses cleared.${s.FOOTER}`);
        }
        if (!all[trigger]) return ctx.reply(`❌ Trigger *${trigger}* not found.${s.FOOTER}`);
        delete all[trigger];
        db.set('taught', 'responses', all);
        ctx.reply(`🗑️ Forgot trigger: _${trigger}_${s.FOOTER}`);
    }
};
