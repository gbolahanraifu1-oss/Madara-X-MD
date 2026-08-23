const db = require('../../lib/db');
const { menuBox } = require('../../lib/menuBox');
const theme = require('../../lib/sessionTheme');
module.exports = {
    name: 'sudo',
    aliases: ['addadmin', 'grantaccess', 'trusted'],
    category: 'system',
    desc: 'Grant/revoke sudo (elevated) access to a user — they can use owner-level commands',
    usage: '†sudo add @user | †sudo remove @user | †sudo list',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const themed = key => theme.string(ctx.sessionPhone, key, '');
        const sub = (args[0] || 'list').toLowerCase();
        const m   = ctx.getMentions?.() || [];
        let target = m[0];
        if (!target && args[1]) target = args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';

        const sudoList = db.get('system', 'sudo', []);

        if (sub === 'add') {
            if (!target) return ctx.reply(`❌ Tag a user to grant sudo.\n\`${s.prefix}sudo add @user\`${s.FOOTER}`);
            if (sudoList.includes(target)) return ctx.reply(`⚠️ @${target.split('@')[0]} already has sudo access.${s.FOOTER}`, { mentions: [target] });
            sudoList.push(target);
            db.set('system', 'sudo', sudoList);
            return ctx.reply(`✅ *${themed('sudo') || 'Sudo access granted.'}*\n@${target.split('@')[0]} can now use elevated commands.${s.FOOTER}`, { mentions: [target] });
        }

        if (sub === 'remove' || sub === 'revoke') {
            if (!target) return ctx.reply(`❌ Tag a user to revoke sudo.\n\`${s.prefix}sudo remove @user\`${s.FOOTER}`);
            const idx = sudoList.indexOf(target);
            if (idx === -1) return ctx.reply(`❌ @${target.split('@')[0]} doesn't have sudo access.${s.FOOTER}`, { mentions: [target] });
            sudoList.splice(idx, 1);
            db.set('system', 'sudo', sudoList);
            return ctx.reply(`✅ *${themed('sudo') || 'Sudo access revoked.'}*\n@${target.split('@')[0]} no longer has elevated access.${s.FOOTER}`, { mentions: [target] });
        }

        if (sub === 'list') {
            if (!sudoList.length) return ctx.reply(`📋 *Sudo Users:* None\n\nGrant access: \`${s.prefix}sudo add @user\`${s.FOOTER}`);
            const list = sudoList.map((j, i) => `${i+1}. @${j.split('@')[0]}`).join('\n');
            return ctx.reply(`👑 *Sudo Users (${sudoList.length}):*\n\n${list}${s.FOOTER}`, { mentions: sudoList });
        }

        ctx.reply(
            menuBox('👑', 'sᴜᴅᴏ', [
                `\`${s.prefix}sudo add @user\` — Grant access`,
                `\`${s.prefix}sudo remove @user\` — Revoke access`,
                `\`${s.prefix}sudo list\` — Show sudo users`,
            ]) + s.FOOTER
        );
    }
};
