'use strict';
/*
 * VV.JS — View-once reveal | MADARA X-MD
 *
 * HOW IT WORKS (two-part system):
 *
 *   PART 1 — Auto-capture (in pairManager.js messages.upsert, runs for every message):
 *     When a view-once message arrives, it is downloaded IMMEDIATELY and stored in the
 *     global vvCache Map keyed by message ID. This is the only window where the media
 *     keys are still valid — WA invalidates them once the message is "opened".
 *
 *   PART 2 — Command (.vv / .viewonce):
 *     Looks up the stanzaId of the replied message in vvCache and forwards the buffer.
 *     If the cache misses (message arrived before bot restart), it falls back to
 *     requestPlaceholderResend with a 25s wait.
 *
 * Place this file at: commands/utility/vv.js
 * No separate lib/vv-store.js needed — cache lives here as a module-level Map.
 */

const { downloadContentFromMessage, downloadMediaMessage } = require('@itsliaaa/baileys');
const pino = require('pino');

const silentLogger = pino({ level: 'silent' });

// ── Global cache ──────────────────────────────────────────────────────────────
// Keyed by message ID → { type, buf, mimetype, ptt }
// Shared across requires because Node caches modules.
if (!global.__vvCache) global.__vvCache = new Map();
const vvCache = global.__vvCache;
const VV_CACHE_LIMIT = 200;

// ── Auto-capture (call this from pairManager messages.upsert BEFORE handler) ─

function extractViewOnce(message) {
    if (!message) return null;
    // Unwrap wrappers
    let cur = message;
    for (let i = 0; i < 8 && cur; i++) {
        const vo = cur.viewOnceMessageV2 || cur.viewOnceMessage || cur.viewOnceMessageV2Extension;
        if (vo?.message) { cur = vo.message; break; }
        const wrap = cur.ephemeralMessage || cur.documentWithCaptionMessage || cur.editedMessage || cur.deviceSentMessage;
        if (wrap?.message) { cur = wrap.message; continue; }
        break;
    }
    // Also check flat viewOnce flag
    const imgMsg = cur?.imageMessage;
    const vidMsg = cur?.videoMessage;
    const audMsg = cur?.audioMessage;
    if (imgMsg && (imgMsg.viewOnce || message.viewOnceMessage || message.viewOnceMessageV2)) {
        return { type: 'image', media: imgMsg, cur };
    }
    if (vidMsg && (vidMsg.viewOnce || message.viewOnceMessage || message.viewOnceMessageV2)) {
        return { type: 'video', media: vidMsg, cur };
    }
    if (audMsg && (audMsg.viewOnce || message.viewOnceMessage || message.viewOnceMessageV2)) {
        return { type: 'audio', media: audMsg, cur };
    }
    // Deeper check: viewOnceMessageV2 inner
    const voMsg = message.viewOnceMessageV2?.message || message.viewOnceMessage?.message || message.viewOnceMessageV2Extension?.message;
    if (voMsg?.imageMessage) return { type: 'image', media: voMsg.imageMessage, cur: voMsg };
    if (voMsg?.videoMessage) return { type: 'video', media: voMsg.videoMessage, cur: voMsg };
    if (voMsg?.audioMessage) return { type: 'audio', media: voMsg.audioMessage, cur: voMsg };
    return null;
}

async function captureViewOnce(sock, msg) {
    try {
        const id = msg?.key?.id;
        if (!id || msg.key.fromMe) return;
        if (vvCache.has(id)) return; // already captured

        const vo = extractViewOnce(msg.message);
        if (!vo) return;
        if (!vo.media?.mediaKey) return; // empty shell, nothing to download

        // Download immediately
        let buf;
        try {
            buf = await downloadMediaMessage(
                { key: msg.key, message: { [`${vo.type}Message`]: vo.media } },
                'buffer', {},
                { logger: silentLogger, reuploadRequest: m => sock.updateMediaMessage(m) }
            );
        } catch (_) {
            const stream = await downloadContentFromMessage(vo.media, vo.type);
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            buf = Buffer.concat(chunks);
        }

        if (!Buffer.isBuffer(buf) || !buf.length) return;

        // Store
        if (vvCache.size >= VV_CACHE_LIMIT) {
            vvCache.delete(vvCache.keys().next().value);
        }
        vvCache.set(id, {
            type    : vo.type,
            buf,
            mimetype: vo.media.mimetype || (vo.type === 'image' ? 'image/jpeg' : vo.type === 'video' ? 'video/mp4' : 'audio/ogg; codecs=opus'),
            ptt     : !!vo.media.ptt,
            sender  : msg.key.participant || msg.key.remoteJid,
        });
        console.log(`[VV-CACHE] stored ${vo.type} | id=${id} | size=${buf.length}`);
    } catch (e) {
        // Silent — never crash the main handler
        console.error('[VV-CACHE] capture failed:', e?.message);
    }
}

// ── Fallback: request phone resend ────────────────────────────────────────────

function askPhone(sock, key) {
    return new Promise((resolve) => {
        if (typeof sock.requestPlaceholderResend !== 'function') return resolve(null);
        let timer;
        const done = (v) => { clearTimeout(timer); sock.ev.off('messages.upsert', on); resolve(v); };
        const on = ({ messages }) => {
            for (const m of messages || []) {
                if (m.key?.id !== key.id) continue;
                const vo = extractViewOnce(m.message);
                if (vo?.media?.mediaKey) return done({ vo, msg: m });
            }
        };
        timer = setTimeout(() => done(null), 25000);
        sock.ev.on('messages.upsert', on);
        Promise.resolve(
            sock.requestPlaceholderResend({
                remoteJid : key.remoteJid,
                id        : key.id,
                fromMe    : false,
                ...(key.participant ? { participant: key.participant } : {}),
            })
        ).catch(() => done(null));
    });
}

// ── Command ───────────────────────────────────────────────────────────────────

module.exports = {
    name    : 'vv',
    aliases : ['viewonce', 'vo', 'rvo'],
    category: 'utility',
    desc    : 'Reveal a view-once photo, video or voice note',
    usage   : '.vv (reply to a view-once message)',
    ownerOnly: true,

    // Expose captureViewOnce so pairManager can import and call it
    captureViewOnce,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;

        const ctxInfo = Object.values(msg.message || {})
            .find(v => v && typeof v === 'object' && v.contextInfo?.stanzaId)?.contextInfo;

        if (!ctxInfo?.stanzaId) {
            return ctx.reply(`❌ Reply to a *view-once* photo, video or voice note to reveal it.${s.FOOTER}`);
        }

        await ctx.react('👁️');

        const stanzaId = ctxInfo.stanzaId;
        const key = {
            remoteJid : msg.key.remoteJid || ctx.from,
            id        : stanzaId,
            ...(ctxInfo.participant ? { participant: ctxInfo.participant } : {}),
        };

        // ── Attempt 1: cache hit ─────────────────────────────────────────────
        let cached = vvCache.get(stanzaId);
        if (cached) {
            console.log('[VV] cache hit for', stanzaId);
        }

        // ── Attempt 2: phone resend ──────────────────────────────────────────
        if (!cached) {
            await ctx.reply(`⏳ Not in cache — requesting from sender's phone, please wait…${s.FOOTER}`);
            const back = await askPhone(sock, key);
            if (back) {
                // Download the resent message
                try {
                    const { vo, msg: resentMsg } = back;
                    let buf;
                    try {
                        buf = await downloadMediaMessage(
                            { key: resentMsg.key, message: { [`${vo.type}Message`]: vo.media } },
                            'buffer', {},
                            { logger: silentLogger, reuploadRequest: m => sock.updateMediaMessage(m) }
                        );
                    } catch (_) {
                        const stream = await downloadContentFromMessage(vo.media, vo.type);
                        const chunks = [];
                        for await (const chunk of stream) chunks.push(chunk);
                        buf = Buffer.concat(chunks);
                    }
                    if (Buffer.isBuffer(buf) && buf.length) {
                        cached = {
                            type    : vo.type,
                            buf,
                            mimetype: vo.media.mimetype,
                            ptt     : !!vo.media.ptt,
                            sender  : key.participant || key.remoteJid,
                        };
                        console.log('[VV] phone resent — downloaded', vo.type, buf.length, 'bytes');
                    }
                } catch (e) {
                    console.error('[VV] resent download failed:', e?.message);
                }
            }
        }

        if (!cached) {
            await ctx.react('❌');
            return ctx.reply(
                `⊘ *Could not retrieve the view-once media.*\n\n` +
                `_The bot must see the view-once message arrive live to cache it. ` +
                `Ask them to send it again — the bot will capture it instantly and you can run \`.vv\` right after._${s.FOOTER}`
            );
        }

        // ── Send ─────────────────────────────────────────────────────────────
        try {
            const senderNum = String(cached.sender || ctxInfo.participant || '').split('@')[0].split(':')[0];
            const caption   = `👁️ *View-Once Unveiled*\n*From:* @${senderNum}${s.FOOTER}`;

            if (cached.type === 'image') {
                await sock.sendMessage(ctx.from, { image: cached.buf, caption, mimetype: cached.mimetype || 'image/jpeg' }, { quoted: msg });
            } else if (cached.type === 'video') {
                await sock.sendMessage(ctx.from, { video: cached.buf, caption, mimetype: cached.mimetype || 'video/mp4' }, { quoted: msg });
            } else {
                await sock.sendMessage(ctx.from, { audio: cached.buf, mimetype: cached.mimetype || 'audio/ogg; codecs=opus', ptt: !!cached.ptt }, { quoted: msg });
            }

            vvCache.delete(stanzaId); // consumed
            await ctx.react('✅');
            console.log('[VV] revealed to', ctx.from, '| type:', cached.type);
        } catch (err) {
            await ctx.react('❌');
            ctx.reply(`❌ Failed to forward view-once: ${err?.message || err}${s.FOOTER}`);
        }
    },
};
