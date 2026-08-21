const db = require('../../lib/db');
const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'setwelcome',
    aliases: ['welcomemsg', 'setwelcomemsg'],
    category: 'group',
    desc: 'Set advanced welcome message with variables: {name}, {group}, {count}, {mention}',
    usage: '†setwelcome Welcome {name} to {group}! We now have {count} members.',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const text = ctx.text;
        if (!text) return ctx.reply(`❌ Provide a welcome message.\nVariables: {name}, {group}, {count}, {mention}\n\nExample:\n\`${s.prefix}setwelcome 👋 Welcome *{name}* to *{group}*!\`${s.FOOTER}`);
        // Was db.set('welcome', ctx.from, {...}) — a generic key/value table
        // the actual welcome sender (madaraFeatures.js) never reads. That
        // sender uses db.getGroupSetting(id, 'welcome'/'welcomeMsg') — same
        // storage the .welcome on/off toggle uses. Writing there is what
        // makes this command's custom message actually get used.
        db.setGroupSetting(ctx.from, 'welcomeMsg', text);
        db.setGroupSetting(ctx.from, 'welcome', true);
        ctx.reply(menuBox('✅', 'ᴡᴇʟᴄᴏᴍᴇ ᴍᴇssᴀɢᴇ sᴇᴛ', [
            `_Preview:_`,
            text.replace(/{name}/g,'John').replace(/{group}/g,'Test Group').replace(/{count}/g,'100').replace(/{mention}/g,'@John'),
        ]) + s.FOOTER);
    }
};
