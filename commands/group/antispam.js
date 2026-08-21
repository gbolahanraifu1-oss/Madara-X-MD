'use strict';

const db = require('../../lib/db');

module.exports = {
    name:           'antispam',
    aliases:        ['spamprotect'],
    category:       'group',
    desc:           'Enable/disable spam detection — auto-kicks spammers',
    usage:          '.antispam on [limit] | .antispam off\n  limit = max messages per 5 seconds (default 5)',
    groupOnly:      true,
    adminOnly:      true,
    botAdminNeeded: true,

    async execute(sock, msg, args, ctx) {
        const s      = ctx.settings;
        const sub    = (args[0] || '').toLowerCase();
        const limit  = parseInt(args[1]) || 5;
        const key    = `antispam_${ctx.from}`;

        if (sub === 'off') {
            db.del('antispam', key);
            // Clear in-memory tracker for this group
            try { require('../../lib/antispam').clearTracker(ctx.from); } catch {}
            return ctx.reply(`✅ *Anti-spam disabled* for this group.${s.FOOTER}`);
        }

        if (sub !== 'on') {
            const cfg = db.get('antispam', key);
            const status = cfg?.enabled
                ? `🟢 *Enabled* — limit: *${cfg.limit} msgs / 5s*`
                : `🔴 *Disabled*`;
            return ctx.reply(
                `🛡️ *Anti-Spam Status*\n\n${status}\n\n` +
                `*Usage:*\n• \`${s.prefix}antispam on [limit]\`\n• \`${s.prefix}antispam off\`` +
                s.FOOTER
            );
        }

        if (limit < 2 || limit > 20) {
            return ctx.reply(`❌ Limit must be between *2 and 20*.${s.FOOTER}`);
        }

        db.set('antispam', key, { enabled: true, limit, window: 5000 });

        return ctx.reply(
            `✅ *Anti-spam enabled!*\n\n` +
            `🚨 Limit: *${limit} messages per 5 seconds*\n` +
            `⚡ Action: *Auto-kick*\n\n` +
            `> Make sure I'm admin to enforce kicks.` +
            s.FOOTER
        );
    }
};
