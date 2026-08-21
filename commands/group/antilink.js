// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  ANTI LINK
// Detects ANY link posted in the group (not just WhatsApp group invites).
// Modes: warn (default) | delete | kick
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const db = require('../../lib/db');

// Matches any link, not just WhatsApp group invites — http(s)://, www.,
// or a bare domain.tld followed by a path/space/end. WhatsApp's own
// group invite link is still explicitly exempted below so the group
// doesn't end up deleting its own invite when an admin shares it.
const linkRegex  = /(https?:\/\/|www\.)\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i;
const emailRegex = /\S+@\S+\.\S+/gi;
const waInviteRegex = /chat\.whatsapp\.com\/(?:invite\/)?([0-9A-Za-z_-]{8,40})/i;

const MODES = ['warn', 'delete', 'kick'];

// ── Auto-handler called from handler.js ──────────────────
async function isAntilink(sock, from, sender, msg, ctx) {
    try {
        if (!from?.endsWith('@g.us')) return false;
        const mode = db.getGroupSetting(from, 'antiLink', null);
        if (!mode) return false; // disabled
        if (msg.key.fromMe) return false;

        const body = ctx?.body || msg.message?.conversation
            || msg.message?.extendedTextMessage?.text || '';
        // Sharing a bare contact email isn't "posting a link" — strip
        // email-looking tokens before checking for actual links.
        const bodyNoEmails = body.replace(emailRegex, ' ');
        const hasLink = linkRegex.test(bodyNoEmails);
        if (!hasLink) return false;

        // Skip admins
        const isSenderAdmin = ctx?.isSenderAdmin ?? false;
        if (isSenderAdmin) return false;

        const isBotAdmin = ctx?.isBotAdmin ?? false;
        const s = ctx?.settings;

        // Exemptions — never treat these as violations:
        //  • this group's own WhatsApp invite link
        //  • the bot's own channel/newsletter link, if configured
        if (waInviteRegex.test(body) && isBotAdmin) {
            try {
                const code = await sock.groupInviteCode(from);
                if (body.includes(`https://chat.whatsapp.com/${code}`)) return false;
            } catch {}
        }
        if (s?.channelLink && body.includes(s.channelLink)) return false;
        if (s?.newsletterJid && body.includes(s.newsletterJid)) return false;

        const senderNum = sender.split('@')[0];
        let deleted = false, kicked = false;

        if ((mode === 'delete' || mode === 'kick') && isBotAdmin) {
            try { await sock.sendMessage(from, { delete: msg.key }); deleted = true; } catch {}
        }
        if (mode === 'kick' && isBotAdmin) {
            try { await sock.groupParticipantsUpdate(from, [sender], 'remove'); kicked = true; } catch {}
        }

        // Build a message that reflects what ACTUALLY happened — never
        // claim an action that didn't go through.
        let line;
        if (mode === 'kick') {
            line = kicked
                ? `*@${senderNum}* was removed for posting a link.`
                : `*@${senderNum}* posted a link${deleted ? ' (deleted)' : ''}, but I couldn\u2019t remove them — make me admin to enforce kicks.`;
        } else if (mode === 'delete') {
            line = deleted
                ? `*@${senderNum}*'s message was deleted — links aren\u2019t allowed here.`
                : `*@${senderNum}* posted a link, but I couldn\u2019t delete it — make me admin.`;
        } else {
            line = `*@${senderNum}*, links aren\u2019t allowed in this group.`;
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
    desc: 'Detect any link posted in the group — warn, delete, or kick',
    usage: '†antilink on|off|warn|delete|kick',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'off') {
            db.setGroupSetting(ctx.from, 'antiLink', null);
            return ctx.reply(`❌ *Anti-Link disabled.*${s.FOOTER}`);
        }

        if (sub === 'on' || sub === 'kick') {
            db.setGroupSetting(ctx.from, 'antiLink', 'kick');
            return ctx.reply(`✅ *Anti-Link enabled — mode: KICK.* Invite links get deleted and the sender removed.\n_Make sure I\u2019m admin, or kicks will silently fail._${s.FOOTER}`);
        }
        if (sub === 'delete') {
            db.setGroupSetting(ctx.from, 'antiLink', 'delete');
            return ctx.reply(`✅ *Anti-Link enabled — mode: DELETE.* Invite link messages get deleted, sender stays.${s.FOOTER}`);
        }
        if (sub === 'warn') {
            db.setGroupSetting(ctx.from, 'antiLink', 'warn');
            return ctx.reply(`✅ *Anti-Link enabled — mode: WARN.* Sender gets called out, nothing is deleted or removed.${s.FOOTER}`);
        }

        const cur = db.getGroupSetting(ctx.from, 'antiLink', null);
        ctx.reply(
            `⚙️ *Anti-Link:* ${cur ? `✅ On — mode: ${cur.toUpperCase()}` : '❌ Off'}\n\n` +
            `Usage:\n\`${s.prefix}antilink warn\`\n\`${s.prefix}antilink delete\`\n\`${s.prefix}antilink kick\`\n\`${s.prefix}antilink off\`${s.FOOTER}`
        );
    }
};
module.exports.isAntilink = isAntilink;
