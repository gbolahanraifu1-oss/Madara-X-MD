// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  ANTI STATUS MENTION
// Detects & deletes status shares into groups
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const db = require('../../lib/db');
const { menuBox } = require('../../lib/menuBox');

// ── Detect if a message is a status shared into a group ──
function isStatusMsg(msg) {
    const m = msg?.message;
    if (!m) return false;

    // Type 1 — groupStatusMentionMessage (most common in Baileys v7)
    if (m.groupStatusMentionMessage) return true;

    // Type 2 — protocolMessage type 25 = STATUS_MENTION_MESSAGE
    if (m.protocolMessage?.type === 25) return true;

    // Type 3 — has forwardedNewsletterMessageInfo anywhere (WhatsApp channel share to group)
    const contexts = [
        m.extendedTextMessage?.contextInfo,
        m.imageMessage?.contextInfo,
        m.videoMessage?.contextInfo,
        m.audioMessage?.contextInfo,
        m.documentMessage?.contextInfo,
        m.contextInfo,
    ];
    for (const c of contexts) {
        if (c?.forwardedNewsletterMessageInfo) return true;
    }

    // Type 4 — viewOnceMessage forwarded (status share via view-once)
    if (m.viewOnceMessageV2?.message && m.viewOnceMessageV2?.message !== undefined) {
        const inner = m.viewOnceMessageV2.message;
        if (inner?.imageMessage?.contextInfo?.forwardedNewsletterMessageInfo) return true;
        if (inner?.videoMessage?.contextInfo?.forwardedNewsletterMessageInfo) return true;
    }

    return false;
}

// ── Auto-handler called from handler.js ──────────────────
async function isAntiStatusMention(sock, from, sender, msg) {
    try {
        if (!from?.endsWith('@g.us')) return false;
        if (!db.getGroupSetting(from, 'antistatusmention', false)) return false;
        if (msg.key.fromMe) return false;
        if (!isStatusMsg(msg)) return false;

        // If Anti Group Mention is ALSO enabled, it already handled groupStatusMentionMessage
        // and protocolMessage type 25 — skip to avoid double warning
        const agmEnabled = db.getGroupSetting(from, 'antigroupmention', false);
        if (agmEnabled) {
            const m = msg.message;
            if (m?.groupStatusMentionMessage || m?.protocolMessage?.type === 25) return false;
        }

        // Skip admins
        try {
            const meta    = await sock.groupMetadata(from);
            const parts   = meta.participants || [];
            const sndNum  = (sender || '').split('@')[0].split(':')[0];
            const isAdmin = parts.some(p => {
                const pNum = (p.id || '').split('@')[0].split(':')[0];
                return (pNum === sndNum || p.id === sender) &&
                       (p.admin === 'admin' || p.admin === 'superadmin');
            });
            if (isAdmin) return false;
        } catch {}

        console.log(`[antistatusmention] deleting from ${sender?.split('@')[0]}`);

        // Delete the message
        try {
            await sock.sendMessage(from, { delete: msg.key });
        } catch (e) {
            console.error('[antistatusmention] delete failed:', e.message);
        }

        // Kick if enabled
        if (db.getGroupSetting(from, 'antism_kick', false) && sender) {
            try {
                await sock.groupParticipantsUpdate(from, [sender], 'remove');
            } catch (e) {
                console.error('[antistatusmention] kick failed:', e.message);
            }
        }

        return true;
    } catch (err) {
        console.error('[antistatusmention] error:', err.message);
        return false;
    }
}

// ── Command plugin ────────────────────────────────────────
module.exports = {
    name: 'antistatusmention',
    aliases: ['antism', 'asm', 'antistatusmention'],
    category: 'group',
    desc: 'Delete status shares into the group — admins exempt',
    usage: '†antistatusmention on|off|kick on|kick off|status',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const sub  = (args[0] || '').toLowerCase();
        const sub2 = (args[1] || '').toLowerCase();

        if (sub === 'on') {
            db.setGroupSetting(ctx.from, 'antistatusmention', true);
            return ctx.reply(menuBox('📢', 'ᴀɴᴛɪ sᴛᴀᴛᴜs ᴍᴇɴᴛɪᴏɴ', [
                `*Status:* ✅ ON`,
                `*Action:* ${db.getGroupSetting(ctx.from,'antism_kick',false) ? '🚫 Delete + Kick' : '🗑️ Silent Delete'}`,
                ``,
                `_Status shares will be silently deleted._`,
            ]) + s.FOOTER);
        }
        if (sub === 'off') {
            db.setGroupSetting(ctx.from, 'antistatusmention', false);
            return ctx.reply(`❌ *Anti Status Mention OFF*${s.FOOTER}`);
        }
        if (sub === 'kick') {
            if (sub2 === 'on')  { db.setGroupSetting(ctx.from, 'antism_kick', true);  return ctx.reply(`🚫 Kick mode *ON* — sharers will be removed.${s.FOOTER}`); }
            if (sub2 === 'off') { db.setGroupSetting(ctx.from, 'antism_kick', false); return ctx.reply(`✅ Kick mode *OFF* — silent delete only.${s.FOOTER}`); }
        }

        // Status
        const cur  = db.getGroupSetting(ctx.from, 'antistatusmention', false);
        const kick = db.getGroupSetting(ctx.from, 'antism_kick', false);
        ctx.reply(menuBox('📢', 'ᴀɴᴛɪ sᴛᴀᴛᴜs ᴍᴇɴᴛɪᴏɴ', [
            `*Status:* ${cur ? '✅ ON' : '❌ OFF'}`,
            `*Kick:* ${kick ? '🚫 ON' : '❌ OFF'}`,
            ``,
            `*Usage:*`,
            `\`${s.prefix}antistatusmention on\``,
            `\`${s.prefix}antistatusmention off\``,
            `\`${s.prefix}antistatusmention kick on\``,
            `\`${s.prefix}antistatusmention kick off\``,
        ]) + s.FOOTER);
    }
};
module.exports.isAntiStatusMention = isAntiStatusMention;
