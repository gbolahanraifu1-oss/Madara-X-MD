const db = require('../../lib/db');
const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'goodbye',
    aliases: ['bye', 'leave'], // 'setgoodbye' removed — that name belongs to setgoodbye.js, was colliding
    category: 'group',
    desc: 'Toggle goodbye messages, optionally with a custom template',
    usage: '†goodbye on | off | [custom message]',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'off') {
            db.setGroupSetting(ctx.from, 'goodbye', false);
            return ctx.reply(menuBox('❌', 'ɢᴏᴏᴅʙʏᴇ: ᴏғғ', [
                `Goodbye messages disabled.`,
            ]) + s.FOOTER);
        }

        // Explicit 'on' with no message → enable using existing/default template.
        // Previously missing: typing ".goodbye on" fell through to the custom-
        // message branch below and set the message text to the literal word "on".
        if (sub === 'on' && args.length === 1) {
            db.setGroupSetting(ctx.from, 'goodbye', true);
            const current = db.getGroupSetting(ctx.from, 'goodbyeMsg', 'Goodbye @{user}! Thanks for being with us 👋');
            return ctx.reply(menuBox('✅', 'ɢᴏᴏᴅʙʏᴇ: ᴏɴ', [
                `Goodbye messages enabled.`,
                `*Current template:* ${current}`,
                `_Set a custom one with \`${s.prefix}goodbye <message>\`_`,
            ]) + s.FOOTER);
        }

        const txt = ctx.text || 'Goodbye {user}! Thanks for being with us 👋';
        db.setGroupSetting(ctx.from, 'goodbye', true);
        db.setGroupSetting(ctx.from, 'goodbyeMsg', txt);
        ctx.reply(menuBox('✅', 'ɢᴏᴏᴅʙʏᴇ ᴍᴇssᴀɢᴇ sᴇᴛ', [
            txt,
            ``,
            `_Use {user} for member name._`,
        ]) + s.FOOTER);
    }
};
