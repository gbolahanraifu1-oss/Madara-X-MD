// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Kick Amount (kickamt)               ║
// ║   .kickamt 50 → removes up to 50 regular (non-admin)  ║
// ║   members from the group in one batch, newest-joined   ║
// ║   first. Bot, group owner, and all admins are always   ║
// ║   protected and never counted toward the amount.       ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const MAX_PER_RUN = 100; // hard ceiling — bulk-kicking is destructive/irreversible

module.exports = {
    name:           'kickamt',
    aliases:        ['kickamount', 'mkick'],
    category:       'group',
    desc:           'Remove up to N regular (non-admin) members from the group in one batch',
    usage:          '.kickamt <number>  e.g. .kickamt 50',
    groupOnly:      true,
    adminOnly:      true,
    botAdminNeeded: true,

    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const amt = parseInt(args[0], 10);

        if (!amt || amt <= 0) {
            return ctx.reply(
                `❌ *Kick Amount*\n\n` +
                `Give a number of members to remove.\n` +
                `_Usage: ${s.prefix}kickamt 50_\n\n` +
                `Admins, the group owner, and the bot itself are always protected — only regular members are counted.` +
                s.FOOTER
            );
        }

        let meta;
        try {
            meta = await sock.groupMetadata(ctx.from);
        } catch (e) {
            return ctx.reply(`❌ Could not fetch group info: ${e.message}${s.FOOTER}`);
        }

        // Same "safe" JID logic as demoteall.js — bot + real owner protected
        const botRaw    = (sock.user?.id  || '').split(':')[0].split('@')[0].replace(/^0+/, '');
        const botLidRaw = (sock.user?.lid || '').split('@')[0].replace(/^0+/, '');
        const ownerRaw  = (s.ownerNumber  || '').replace(/[^0-9]/g, '').replace(/^0+/, '');

        const isSafe = (p) => {
            const raw    = (p.id  || '').split('@')[0].replace(/^0+/, '');
            const lidRaw = (p.lid || '').split('@')[0].replace(/^0+/, '');
            return raw === botRaw || lidRaw === botLidRaw || raw === ownerRaw
                || p.admin === 'admin' || p.admin === 'superadmin';
        };

        // Newest-joined members are appended last by WhatsApp — take from
        // the end of the list so kickamt targets recent joiners first,
        // which is the common "clear out spam/raid accounts" use case.
        const kickable = meta.participants
            .filter(p => !isSafe(p))
            .reverse();

        if (!kickable.length)
            return ctx.reply(`✅ No regular members left to kick — everyone left is an admin or protected.${s.FOOTER}`);

        const target = Math.min(amt, MAX_PER_RUN, kickable.length);
        const batch  = kickable.slice(0, target).map(p => p.id);

        await ctx.react('⏳');

        let kicked = 0, failed = 0;
        const CHUNK = 5; // matches demoteall.js pacing to stay safely under rate limits
        for (let i = 0; i < batch.length; i += CHUNK) {
            const chunk = batch.slice(i, i + CHUNK);
            try {
                await sock.groupParticipantsUpdate(ctx.from, chunk, 'remove');
                kicked += chunk.length;
            } catch (e) {
                failed += chunk.length;
                console.error('[kickamt] chunk kick failed:', e.message);
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        await ctx.react('✅');
        return ctx.reply(
            `✅ *Kick Amount Complete*\n\n` +
            `📥 Requested: *${amt}*${amt > target ? ` (capped to ${target})` : ''}\n` +
            `👥 Kicked: *${kicked}*\n` +
            `${failed > 0 ? `❌ Failed: *${failed}*\n` : ''}` +
            `🛡️ Admins, owner, and bot were never touched.` +
            s.FOOTER
        );
    },
};
