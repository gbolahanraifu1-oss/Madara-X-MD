// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  ANTI LINK  (per session)
// Detects ANY link posted in the group (not just WhatsApp group invites).
// Modes: warn | delete | kick
// Setting is isolated per paired bot session + group JID.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

'use strict';

const db = require('../../lib/db');

const linkRegex  = /(https?:\/\/|www\.)\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i;
const emailRegex = /\S+@\S+\.\S+/gi;
const waInviteRegex = /chat\.whatsapp\.com\/(?:invite\/)?([0-9A-Za-z_-]{8,40})/i;

const MODES = ['warn', 'delete', 'kick'];

function resolveSessionPhone(sock, ctx) {
    return String(
        ctx?.sessionPhone
        || sock?._sessionPhone
        || sock?.user?.id
        || ''
    )
        .split(':')[0]
        .split('@')[0]
        .replace(/\D/g, '');
}

function getAntiLinkMode(phone, groupJid) {
    // Prefer per-session; fall back to legacy global group key
    return db.getSessionGroupSetting(phone, groupJid, 'antiLink', null);
}

function setAntiLinkMode(phone, groupJid, mode) {
    db.setSessionGroupSetting(phone, groupJid, 'antiLink', mode);
}

// ── Auto-handler called from handler.js ──────────────────
async function isAntilink(sock, from, sender, msg, ctx) {
    try {
        if (!from?.endsWith('@g.us')) return false;

        const phone = resolveSessionPhone(sock, ctx);
        const mode = getAntiLinkMode(phone, from);
        if (!mode) return false; // disabled for this session+group
        if (msg.key.fromMe) return false;

        const body = ctx?.body || msg.message?.conversation
            || msg.message?.extendedTextMessage?.text || '';
        const bodyNoEmails = body.replace(emailRegex, ' ');
        const hasLink = linkRegex.test(bodyNoEmails);
        if (!hasLink) return false;

        const isSenderAdmin = ctx?.isSenderAdmin ?? false;
        if (isSenderAdmin) return false;

        const isBotAdmin = ctx?.isBotAdmin ?? false;
        const s = ctx?.settings;

        // Allow this group's own invite link
        if (waInviteRegex.test(body)) {
            try {
                const code = await sock.groupInviteCode(from);
                if (code && body.includes(`https://chat.whatsapp.com/${code}`)) return false;
            } catch {}
        }

        let deleted = false;
        let kicked = false;

        if (mode === 'delete' || mode === 'kick') {
            try { await sock.sendMessage(from, { delete: msg.key }); deleted = true; } catch {}
        }
        if (mode === 'kick') {
            try { await sock.groupParticipantsUpdate(from, [sender], 'remove'); kicked = true; } catch {}
        }

        const senderNum = String(sender || '').split('@')[0].split(':')[0];
        let line;
        if (mode === 'kick') {
            line = kicked
                ? `*@${senderNum}* was removed — links aren't allowed here.`
                : `*@${senderNum}* posted a link. I couldn't remove them — make me admin to enforce kicks.`;
        } else if (mode === 'delete') {
            line = deleted
                ? `*@${senderNum}*'s message was deleted — links aren't allowed here.`
                : `*@${senderNum}* posted a link, but I couldn't delete it — make me admin.`;
        } else {
            line = `*@${senderNum}*, links aren't allowed in this group.`;
        }

        await sock.sendMessage(
            from,
            { text: `*≡ Link Detected*\n\n${line}`, mentions: [sender] },
            { quoted: msg }
        ).catch(() => {});

        return true;
    } catch (err) {
        console.error('[antilink] error:', err.message);
        return false;
    }
}

// ── Command plugin ────────────────────────────────────────
module.exports = {
    name: 'antilink',
    aliases: ['antigrouplink'],
    category: 'group',
    desc: 'Detect any link in the group — warn, delete, or kick (per session)',
    usage: '.antilink on|off|warn|delete|kick',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const sub = (args[0] || '').toLowerCase();
        const phone = resolveSessionPhone(sock, ctx);

        if (!phone) {
            return ctx.reply('❌ Could not resolve this bot session.' + s.FOOTER);
        }

        if (sub === 'off') {
            setAntiLinkMode(phone, ctx.from, null);
            return ctx.reply(
                '❌ *Anti-Link disabled* for this session (`' + phone + '`) in this group.' + s.FOOTER
            );
        }

        if (sub === 'on' || sub === 'kick') {
            setAntiLinkMode(phone, ctx.from, 'kick');
            return ctx.reply(
                '✅ *Anti-Link ON — mode: KICK*\n' +
                'Session: `' + phone + '`\n' +
                'Invite/links → delete + remove sender.\n' +
                '_Make sure I\'m admin._' + s.FOOTER
            );
        }
        if (sub === 'delete') {
            setAntiLinkMode(phone, ctx.from, 'delete');
            return ctx.reply(
                '✅ *Anti-Link ON — mode: DELETE*\n' +
                'Session: `' + phone + '`\n' +
                'Link messages get deleted; sender stays.' + s.FOOTER
            );
        }
        if (sub === 'warn') {
            setAntiLinkMode(phone, ctx.from, 'warn');
            return ctx.reply(
                '✅ *Anti-Link ON — mode: WARN*\n' +
                'Session: `' + phone + '`\n' +
                'Sender is warned only.' + s.FOOTER
            );
        }

        const cur = getAntiLinkMode(phone, ctx.from);
        return ctx.reply(
            '⚙️ *Anti-Link* (session `' + phone + '`)\n' +
            'Status: ' + (cur ? '✅ On — mode: ' + String(cur).toUpperCase() : '❌ Off') + '\n\n' +
            'Usage:\n' +
            '`' + s.prefix + 'antilink warn`\n' +
            '`' + s.prefix + 'antilink delete`\n' +
            '`' + s.prefix + 'antilink kick`\n' +
            '`' + s.prefix + 'antilink off`' +
            s.FOOTER
        );
    },
};

module.exports.isAntilink = isAntilink;
module.exports.resolveSessionPhone = resolveSessionPhone;
