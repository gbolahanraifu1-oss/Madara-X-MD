const db = require('../../lib/db');
module.exports = {
    name: 'warnlist',
    aliases: ['warnings', 'warncount'],
    category: 'group',
    desc: 'Show warning counts for all members',
    usage: '†warnlist',
    groupOnly: true, adminOnly: true,
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const all  = db.read('warnings');
        const prefix = `${ctx.from}:`;
        const entries = Object.entries(all).filter(([k]) => k.startsWith(prefix) && all[k] > 0);
        if (!entries.length) return ctx.reply(`✅ No warnings in this group.${s.FOOTER}`);
        const list = entries.map(([k, v]) => `• @${k.replace(prefix,'').split('@')[0]} — ${v}/3 warnings`).join('\n');
        await sock.sendMessage(ctx.from, {
            text: `⚠️ *Group Warnings:*\n\n${list}${s.FOOTER}`,
            mentions: entries.map(([k]) => k.replace(prefix,''))
        }, { quoted: msg });
    }
};
