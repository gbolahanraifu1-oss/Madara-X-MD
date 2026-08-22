// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — †pair command                       ║
// ║   Group-locked: only works in your designated group  ║
// ╚══════════════════════════════════════════════════════╝

'use strict';

const path = require('path');
const fs   = require('fs');
const { menuBox } = require('../../lib/menuBox');

const _pending = new Map();

module.exports = {
    name:      'pair',
    aliases:   ['addbot', 'linkbot', 'pairbot'],
    category:  'system',
    desc:      'Pair your WhatsApp number to MADARA X-MD',
    usage:     '.pair <phone>  e.g. .pair 2348012345678',
    waitReact: false,

    async execute(sock, msg, args, ctx) {
        const { startSession, clearSession, getPairingCode, activeSessions, SESSIONS_ROOT } = require('../../lib/pairManager');
        const s = ctx.settings;

        // ── Channel "View channel" context ────────────────────────────────
        const channelCtx = s.newsletterJid ? {
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid:   s.newsletterJid,
                    newsletterName:  s.channelName || s.botName,
                    serverMessageId: -1
                }
            }
        } : {};

        // ── 0. Group lock ─────────────────────────────────────────────────
        const allowedGroup = (s.pairGroupJid || '').trim();
        if (allowedGroup) {
            const inCorrectGroup = ctx.isGroup && ctx.from === allowedGroup;
            if (!inCorrectGroup) {
                return ctx.reply(
                    menuBox('💣', s.botName, [
                        `❌ This command can only be used inside the *official group*.`,
                        ``,
                        `📌 *Join the group first, then run the command there:*`,
                        ...(s.channelLink ? [s.channelLink] : []),
                        ``,
                        `Once inside, send: \`${s.prefix}pair <your number>\``,
                    ]) + s.FOOTER
                );
            }
        }

        // ── 0.5. Global maintenance mode (owner can still pair through it) ──
        const maintenance = require('../../lib/maintenance');
        if (maintenance.isOn() && !ctx.isOwner) {
            const reason = maintenance.reason();
            return ctx.reply(
                menuBox('🚧', s.botName, [
                    `Pairing is temporarily disabled for maintenance.`,
                    ...(reason ? [`*Reason:* ${reason}`] : []),
                    `Please try again shortly.`,
                ]) + s.FOOTER
            );
        }

        // ── 1. Auto-read sender's number from their JID ───────────────────
        // In WhatsApp, the sender's JID is usually their phone number
        // @s.whatsapp.net — but on modern multi-device clients with phone-number
        // privacy on, the JID can be a @lid pseudo-number instead of the real
        // phone number. Requesting a pairing code for a LID pseudo-number
        // produces a code WhatsApp will always reject as "wrong code", so we
        // resolve LID → real phone number first (same cache context.js uses).
        const { resolveLid } = require('../../lib/context');
        const participantJid = msg.key.participant || '';
        const rawSenderNum   = ctx.sender ? ctx.sender.split('@')[0].replace(/[^0-9]/g, '') : '';
        const senderNumber   = resolveLid(rawSenderNum);
        const argNumber      = (args[0] || '').replace(/[^0-9]/g, '');

        // If this is a @lid identity and we couldn't resolve it to a real
        // phone number yet (no cached mapping), don't attempt auto-pairing
        // with the fake LID number — ask for the real number explicitly.
        if (!argNumber && participantJid.endsWith('@lid') && senderNumber === rawSenderNum) {
            return ctx.reply(
                '❌ *Could not detect your real phone number* (your WhatsApp identity is hidden/LID-protected in this group).\n' +
                '📌 Please pair manually: `' + s.prefix + 'pair 2348012345678`' + s.FOOTER
            );
        }

        // Prefer auto-detected sender number; allow manual override via arg
        // (useful if someone wants to pair a different number they own).
        const raw = argNumber || senderNumber;

        if (!raw || raw.length < 7 || raw.length > 15) {
            return ctx.reply(
                '❌ *Could not detect your number.*\n' +
                '📌 Try manually: `' + s.prefix + 'pair 2348012345678`\n\n' +
                '> Use international format without + or spaces' + s.FOOTER
            );
        }

        // ── 2. Check if already connected ─────────────────────────────────
        const existing = activeSessions.get(raw);
        if (existing && existing.sock && existing.sock.ws && existing.sock.ws.readyState === 1) {
            const num = existing.sock.user && existing.sock.user.id
                ? existing.sock.user.id.split(':')[0] : raw;
            return ctx.reply(
                '✅ *+' + num + '* is already paired and connected!\n\n' +
                'To re-pair, first use: `' + s.prefix + 'unpair ' + raw + '`' +
                s.FOOTER
            );
        }

        // ── 3. Prevent duplicate requests ─────────────────────────────────
        if (_pending.has(raw)) {
            return ctx.reply(
                '⏳ Already generating a code for *+' + raw + '*...\n' +
                'Please wait a moment.' + s.FOOTER
            );
        }

        // ── 4. Start pairing ──────────────────────────────────────────────
        _pending.set(raw, true);
        await ctx.react('⏳');

        const sessionDir = path.join(SESSIONS_ROOT, raw);
        const credsFile  = path.join(sessionDir, 'creds.json');
        if (fs.existsSync(sessionDir) && !fs.existsSync(credsFile)) {
            await clearSession(raw).catch(() => {});
        }

        let timeoutHandle;
        try {
            const newSock = await startSession(raw, null);
            if (!newSock) throw new Error('Could not start session for this number.');

            const code = await Promise.race([
                getPairingCode(newSock, raw),
                new Promise((_, rej) => {
                    timeoutHandle = setTimeout(() =>
                        rej(new Error('Timed out waiting for WhatsApp. Try again.')), 70_000);
                }),
            ]);

            clearTimeout(timeoutHandle);
            _pending.delete(raw);
            await ctx.react('✅');

            const senderJid = ctx.sender;
            const codeMsg   = '*' + s.botName + ' PAIRING CODE*\n\n' +
                              'Your pairing code is: *' + code + '*';
            // Send the code again alone so it can be copied directly.
            const codeOnlyMsg = code;

            // PRIMARY: reply in group and @tag the requester
            let groupSent = false;
            try {
                await sock.sendMessage(ctx.from, {
                    text:     '@' + senderJid.split('@')[0] + '\n\n' + codeMsg,
                    mentions: [senderJid],
                    ...channelCtx
                }, { quoted: msg });
                await sock.sendMessage(ctx.from, { text: codeOnlyMsg });
                groupSent = true;
            } catch (_e) {}

            // BACKUP: DM if group reply failed
            if (!groupSent) {
                try {
                    await sock.sendMessage(senderJid, {
                        text: codeMsg,
                        ...channelCtx
                    });
                    await sock.sendMessage(senderJid, { text: codeOnlyMsg });
                } catch (_e) {}
            }

        } catch (err) {
            clearTimeout(timeoutHandle);
            _pending.delete(raw);
            await ctx.react('❌');

            const errMsg  = err && err.message ? err.message : String(err);
            const isStale = errMsg.includes('already connected') || errMsg.includes('already paired');

            return ctx.reply(
                '❌ *Pairing failed for +' + raw + '*\n' +
                '📋 Reason: ' + errMsg.slice(0, 120) + '\n\n' +
                (isStale
                    ? '💡 Run `' + s.prefix + 'unpair ' + raw + '` then try again.'
                    : '💡 Check the number is correct and try again in 30 seconds.') +
                s.FOOTER
            );
        }
    }
};
