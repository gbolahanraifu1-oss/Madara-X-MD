// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Accept Amount (Batch Approve)       ║
// ║   .acceptamount 50 → approve up to 50 of the          ║
// ║                      CURRENTLY pending join requests, ║
// ║                      right now.                        ║
// ║   (short forms .aaamt / .aamt still work too)          ║
// ║   One-off batch action — NOT a toggle. For an ongoing  ║
// ║   "approve everything forever" mode, use .autoaccept   ║
// ║   on (short: .aa on).                                  ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const { menuBox } = require('../../lib/menuBox');

const MAX_PER_RUN = 200; // hard ceiling so a typo like "acceptamount 99999" can't hammer the group

module.exports = {
    name:           'acceptamount',
    aliases:        ['aaamt', 'aamt', 'acceptamt', 'aacceptamt'],
    category:       'group',
    desc:           'Approve up to N of the currently pending join requests, in one batch',
    usage:          '.acceptamount <number>  e.g. .acceptamount 50',
    groupOnly:      true,
    adminOnly:      true,
    botAdminNeeded: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const amt = parseInt(args[0], 10);

        if (!amt || amt <= 0) {
            return ctx.reply(
                menuBox('❌', 'ᴀᴄᴄᴇᴘᴛ ᴀᴍᴏᴜɴᴛ', [
                    `Give a number of join requests to approve right now.`,
                    `_Usage: ${s.prefix}acceptamount 50_ _(short form: ${s.prefix}aaamt 50)_`,
                    ``,
                    `This is a one-off batch action. For an ongoing "approve everything" mode, use \`${s.prefix}autoaccept on\` (short: \`${s.prefix}aa on\`).`,
                ]) + s.FOOTER
            );
        }

        const target = Math.min(amt, MAX_PER_RUN);

        let pending;
        try {
            pending = await sock.groupRequestParticipantsList(ctx.from);
        } catch (e) {
            return ctx.reply(`❌ Could not fetch pending join requests: ${e.message}${s.FOOTER}`);
        }

        if (!pending?.length)
            return ctx.reply(`📭 No pending join requests right now.${s.FOOTER}`);

        const batch = pending.slice(0, target).map(p => p.jid);

        await ctx.react('⏳');

        let approved = 0, failed = 0;
        // Approve in small chunks — WhatsApp's participants-update endpoint
        // accepts arrays, but large single-shot batches risk partial failure.
        const CHUNK = 20;
        for (let i = 0; i < batch.length; i += CHUNK) {
            const chunk = batch.slice(i, i + CHUNK);
            try {
                await sock.groupRequestParticipantsUpdate(ctx.from, chunk, 'approve');
                approved += chunk.length;
            } catch (e) {
                failed += chunk.length;
                console.error('[acceptamount] chunk approve failed:', e.message);
            }
            if (i + CHUNK < batch.length) await new Promise(r => setTimeout(r, 800));
        }

        await ctx.react('✅');
        return ctx.reply(
            menuBox('✅', 'ᴀᴄᴄᴇᴘᴛ ᴀᴍᴏᴜɴᴛ ᴄᴏᴍᴘʟᴇᴛᴇ', [
                `*Requested:* ${target}${amt > MAX_PER_RUN ? ` (capped from ${amt})` : ''}`,
                `*Pending found:* ${pending.length}`,
                `*Approved:* ${approved}`,
                ...(failed > 0 ? [`*Failed:* ${failed}`] : []),
                ...(pending.length > target ? [``, `_${pending.length - target} request(s) still pending — run again to approve more._`] : []),
            ]) + s.FOOTER
        );
    },
};
