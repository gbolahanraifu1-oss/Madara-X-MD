const db = require('../../lib/db');
const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'setgoodbye',
    aliases: ['goodbyemsg', 'setgoodbyemsg', 'setleave'],
    category: 'group',
    desc: 'Set advanced goodbye message with variables: {name}, {group}, {user}',
    usage: '†setgoodbye Goodbye {name}! We\'ll miss you.',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const text = ctx.text;
        if (!text) return ctx.reply(`❌ Provide a goodbye message.\nVariables: {name}, {group}, {user}\n\nExample:\n\`${s.prefix}setgoodbye 👋 Goodbye *{name}*!\`${s.FOOTER}`);
        // Was db.set('goodbye', ctx.from, {...}) — a generic key/value table
        // nothing else in the bot ever reads. groupevents.js (the code that
        // actually sends the goodbye message) reads db.getGroupSetting(id,
        // 'goodbyeMsg'/'goodbye') — same storage goodbye.js uses. Writing
        // there instead is what makes this command's message actually fire.
        db.setGroupSetting(ctx.from, 'goodbyeMsg', text);
        db.setGroupSetting(ctx.from, 'goodbye', true);
        ctx.reply(menuBox('✅', 'ɢᴏᴏᴅʙʏᴇ ᴍᴇssᴀɢᴇ sᴇᴛ', [
            `_Preview:_`,
            text.replace(/{name}/g,'John').replace(/{group}/g,'Test Group').replace(/{user}/g,'John'),
        ]) + s.FOOTER);
    }
};
