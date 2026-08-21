// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Anti-Delete                        ║
// ╚══════════════════════════════════════════════════╝
'use strict';

const db = require('../../lib/db');

// ── In-memory store (faster than DB for high-freq writes) ─────────────────
// { groupJid → Map<msgId, { body, sender, ts, type, media? }> }
const _store = new Map();
const MAX_PER_GROUP = 300;

function _getStore(from) {
    if (!_store.has(from)) _store.set(from, new Map());
    return _store.get(from);
}

function _extractContent(msg) {
    const m = msg.message || {};
    if (m.conversation)                          return { type: 'text',  body: m.conversation };
    if (m.extendedTextMessage?.text)             return { type: 'text',  body: m.extendedTextMessage.text };
    if (m.imageMessage)                          return { type: 'image', body: m.imageMessage.caption || '', media: true };
    if (m.videoMessage)                          return { type: 'video', body: m.videoMessage.caption || '', media: true };
    if (m.audioMessage)                          return { type: 'audio', body: '',                          media: true };
    if (m.stickerMessage)                        return { type: 'sticker', body: '',                        media: true };
    if (m.documentMessage)                       return { type: 'document', body: m.documentMessage.fileName || '', media: true };
    return null;
}

// ── Hook: store incoming messages ─────────────────────────────────────────
function storeMessage(from, msg) {
    try {
        if (!db.getGroupSetting(from, 'antidelete', false)) return;
        const id      = msg.key?.id;
        const sender  = msg.key?.participant || msg.key?.remoteJid || '';
        if (!id || !sender) return;

        const content = _extractContent(msg);
        if (!content) return;

        const store = _getStore(from);
        store.set(id, { ...content, sender, ts: Date.now() });

        // Prune oldest if over limit
        if (store.size > MAX_PER_GROUP) {
            const oldest = [...store.entries()]
                .sort((a, b) => a[1].ts - b[1].ts)
                .slice(0, store.size - MAX_PER_GROUP);
            oldest.forEach(([k]) => store.delete(k));
        }
    } catch {}
}

// ── Hook: catch deletions ─────────────────────────────────────────────────
async function isAntiDelete(sock, msg) {
    try {
        if (!msg?.message) return false;
        const from  = msg.key?.remoteJid;
        if (!from?.endsWith('@g.us')) return false;

        const proto = msg.message?.protocolMessage;
        if (!proto || proto.type !== 0) return false; // REVOKE = type 0

        if (!db.getGroupSetting(from, 'antidelete', false)) return false;

        const deletedId = proto.key?.id;
        const store     = _getStore(from);
        const saved     = store.get(deletedId);
        if (!saved) return false;

        const deleterNum = (proto.key?.participant || msg.key?.participant || '').split('@')[0];
        const senderNum  = saved.sender.split('@')[0];
        const typeEmoji  = { text:'📝', image:'🖼️', video:'🎥', audio:'🎵', sticker:'🎭', document:'📎' }[saved.type] || '📄';

        let replyText =
            `🗑️ *Deleted Message Caught!*\n` +
            `━━━━━━━━━━━━━━━━\n` +
            `${typeEmoji} *Type:* ${saved.type.toUpperCase()}\n` +
            `👤 *Sender:* @${senderNum}\n` +
            `🗑️ *Deleted by:* @${deleterNum}\n` +
            `━━━━━━━━━━━━━━━━\n`;

        if (saved.body) replyText += `💬 *Content:*\n${saved.body}`;
        else            replyText += `_(${saved.type} — no text content)_`;

        await sock.sendMessage(from, {
            text:     replyText,
            mentions: [saved.sender, proto.key?.participant || ''].filter(Boolean)
        });

        store.delete(deletedId); // free memory after catching
        return true;
    } catch { return false; }
}

// ── Command ───────────────────────────────────────────────────────────────
module.exports = {
    name:      'antidelete',
    aliases:   ['antiDelete', 'savedeleted', 'anti-delete'],
    category:  'group',
    desc:      'Catch and re-send deleted messages (text + media captions)',
    usage:     '.antidelete on | off | status',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on') {
            db.setGroupSetting(ctx.from, 'antidelete', true);
            return ctx.reply(`✅ *Anti-delete enabled!*\nDeleted messages will be re-sent here.${s.FOOTER}`);
        }
        if (sub === 'off') {
            db.setGroupSetting(ctx.from, 'antidelete', false);
            _store.delete(ctx.from); // free memory
            return ctx.reply(`❌ *Anti-delete disabled.*${s.FOOTER}`);
        }

        const st = db.getGroupSetting(ctx.from, 'antidelete', false);
        const cached = _store.get(ctx.from)?.size || 0;
        return ctx.reply(
            `🛡️ *Anti-Delete Status*\n\n` +
            `Status: ${st ? '✅ ON' : '❌ OFF'}\n` +
            `📦 Cached messages: *${cached}*\n\n` +
            `*Commands:*\n` +
            `• \`${s.prefix}antidelete on\`\n` +
            `• \`${s.prefix}antidelete off\`` +
            s.FOOTER
        );
    }
};

module.exports.isAntiDelete  = isAntiDelete;
module.exports.storeMessage  = storeMessage;
