// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Auto-Accept Join Requests          ║
// ║   .autoaccept on  — auto-approve every pending join  ║
// ║                     request                          ║
// ║   .autoaccept off — back to manual admin approval     ║
// ║   (short forms .aa / .acceptall still work too)       ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const db = require('../../lib/db');
const { menuBox } = require('../../lib/menuBox');

module.exports = {
    name:           'autoaccept',
    aliases:        ['aa', 'acceptall', 'joinrequest'],
    category:       'group',
    desc:           'Auto-accept all pending WhatsApp group join requests',
    usage:          '.autoaccept on | off | status',
    groupOnly:      true,
    adminOnly:      true,
    botAdminNeeded: true,

    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on') {
            db.setGroupSetting(ctx.from, 'autoAccept', true);

            // Approve any requests already pending right now too
            let approvedNow = 0;
            try {
                const pending = await sock.groupRequestParticipantsList(ctx.from);
                if (pending?.length) {
                    const jids = pending.map(p => p.jid);
                    await sock.groupRequestParticipantsUpdate(ctx.from, jids, 'approve');
                    approvedNow = jids.length;
                }
            } catch {}

            return ctx.reply(
                menuBox('✅', 'ᴀᴜᴛᴏ-ᴀᴄᴄᴇᴘᴛ: ᴏɴ', [
                    `Every new join request will be approved automatically.`,
                    ...(approvedNow ? [`📥 Approved *${approvedNow}* pending request${approvedNow > 1 ? 's' : ''} right now.`] : []),
                    ``,
                    `Turn off with \`${s.prefix}autoaccept off\` _(short form: \`${s.prefix}aa off\`)_`,
                ]) + s.FOOTER
            );
        }

        if (sub === 'off') {
            db.setGroupSetting(ctx.from, 'autoAccept', false);
            return ctx.reply(
                menuBox('❌', 'ᴀᴜᴛᴏ-ᴀᴄᴄᴇᴘᴛ: ᴏғғ', [
                    `Join requests now need manual admin approval again.`,
                    `Turn on with \`${s.prefix}autoaccept on\` _(short form: \`${s.prefix}aa on\`)_`,
                ]) + s.FOOTER
            );
        }

        const enabled = db.getGroupSetting(ctx.from, 'autoAccept', false);
        return ctx.reply(
            menuBox('📋', 'ᴀᴜᴛᴏ-ᴀᴄᴄᴇᴘᴛ ᴊᴏɪɴ ʀᴇǫᴜᴇsᴛs', [
                `*Status:* ${enabled ? '✅ ON' : '❌ OFF'}`,
                ``,
                `*Commands:*`,
                `\`${s.prefix}autoaccept on\` — auto-approve all join requests`,
                `\`${s.prefix}autoaccept off\` — back to manual approval`,
                ``,
                `_Short form \`${s.prefix}aa\` works the same way._`,
                `_For a one-off batch approve of N pending requests, use \`${s.prefix}acceptamount\` (short: \`${s.prefix}aaamt\`)._`,
            ]) + s.FOOTER
        );
    }
};
