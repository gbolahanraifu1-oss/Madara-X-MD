'use strict';
/*
 * VV.JS — View-once reveal | MADARA X-MD
 *
 * Attempts (in order):
 *   1) stored copy from lib/vv-store (captured when message first arrived)
 *   2) attached copy WhatsApp puts in contextInfo (usability-checked — often empty shell)
 *   3) requestPlaceholderResend to the sender's phone (25s wait)
 *
 * Requires:
 *   lib/vv-store.js  — attachVvStore(sock) called in pairManager after each socket creation
 */

const { downloadContentFromMessage, downloadMediaMessage } = require('@itsliaaa/baileys');
const pino = require('pino');
const { getStoredMessage } = require('../../lib/vv-store');

const silentLogger = pino({ level: 'silent' });
const WAIT_PHONE_MS = 25000;

// ── helpers ──────────────────────────────────────────────────────────────────

function unwrap(message) {
    let cur = message, viewOnce = false;
    for (let i = 0; i < 8 && cur; i++) {
        const vo = cur.viewOnceMessage || cur.viewOnceMessageV2 || cur.viewOnceMessageV2Extension;
        if (vo?.message) { viewOnce = true; cur = vo.message; continue; }
        const wrap = cur.ephemeralMessage || cur.documentWithCaptionMessage || cur.editedMessage;
        if (wrap?.message) { cur = wrap.message; continue; }
        break;
    }
    const type = cur?.imageMessage ? 'image' : cur?.videoMessage ? 'video' : cur?.audioMessage ? 'audio' : null;
    return { cur, type, media: type ? cur[`${type}Message`] : null, viewOnce };
}

const usable = (u) => !!(u?.type && u.media?.mediaKey && (u.media.directPath || u.media.url));

function stored(sock, key) {
    try {
        const m = getStoredMessage(sock, key);
        return m?.message || m || null;
    } catch (e) {
        console.error('[VV] stored copy read failed:', e?.message || e);
        return null;
    }
}

async function downloadBuffer(sock, key, u) {
    try {
        return await downloadMediaMessage({ key, message: u.cur }, 'buffer', {}, {
            logger: silentLogger,
            reuploadRequest: msg => sock.updateMediaMessage(msg),
        });
    } catch (_) {
        const stream = await downloadContentFromMessage(u.media, u.type);
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return Buffer.concat(chunks);
    }
}

function askPhone(sock, key) {
    return new Promise((resolve) => {
        if (typeof sock.requestPlaceholderResend !== 'function') {
            console.error('[VV] requestPlaceholderResend not available on this baileys build');
            return resolve(null);
        }
        let timer;
        const done = (v) => { clearTimeout(timer); sock.ev.off('messages.upsert', on); resolve(v); };
        const on = ({ messages }) => {
            for (const m of messages || []) {
                if (m.key?.id !== key.id) continue;
                const u = unwrap(m.message);
                if (usable(u)) return done({ u, message: m.message });
            }
        };
        timer = setTimeout(() => { console.error('[VV] phone did not resend in time'); done(null); }, WAIT_PHONE_MS);
        sock.ev.on('messages.upsert', on);
        Promise.resolve(
            sock.requestPlaceholderResend({
                remoteJid: key.remoteJid,
                id: key.id,
                fromMe: false,
                ...(key.participant ? { participant: key.participant } : {}),
            })
        ).catch((e) => { console.error('[VV] requestPlaceholderResend error:', e?.message || e); done(null); });
    });
}

// ── command ───────────────────────────────────────────────────────────────────

module.exports = {
    name: 'vv',
    aliases: ['viewonce', 'vo', 'rvo'],
    category: 'utility',
    desc: 'Reveal a view-once photo, video or voice note',
    usage: '.vv (reply to a view-once message)',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;

        const ctxInfo = Object.values(msg.message || {})
            .find(v => v && typeof v === 'object' && v.contextInfo?.stanzaId)?.contextInfo;

        if (!ctxInfo?.stanzaId) {
            return ctx.reply(`❌ Reply to a *view-once* photo, video or voice note to reveal it.${s.FOOTER}`);
        }

        await ctx.react('👁️');

        const key = {
            remoteJid: msg.key.remoteJid || ctx.from,
            id: ctxInfo.stanzaId,
            ...(ctxInfo.participant ? { participant: ctxInfo.participant } : {}),
            ...(msg.key.remoteJidAlt ? { remoteJidAlt: msg.key.remoteJidAlt } : {}),
        };

        const notes = [];
        let found = null;

        // Attempt 1 & 2 — stored copy, then attached (contextInfo) copy
        for (const [label, source] of [
            ['stored copy', stored(sock, key)],
            ['attached copy', ctxInfo.quotedMessage],
        ]) {
            if (!source) { notes.push(`${label}: none`); continue; }
            const u = unwrap(source);
            if (!u.type)    { notes.push(`${label}: no image/video/audio inside`); continue; }
            if (!usable(u)) { notes.push(`${label}: empty shell`); continue; }
            found = u;
            console.log('[VV] using', label);
            break;
        }

        // Attempt 3 — ask the phone to resend
        const quotedHasMedia = !!unwrap(ctxInfo.quotedMessage).type;
        if (!found && (quotedHasMedia || notes.some(n => n.includes('empty')))) {
            await ctx.reply(`⏳ Requesting media from sender's phone, please wait…${s.FOOTER}`);
            const back = await askPhone(sock, key);
            if (back) { found = back.u; console.log('[VV] phone resent it'); }
            else notes.push('phone: did not resend');
        }

        // Download
        let buf = null;
        if (found) {
            try {
                buf = await downloadBuffer(sock, key, found);
                if (!Buffer.isBuffer(buf) || !buf.length) buf = null;
            } catch (e) {
                notes.push(`download error: ${e?.message || e}`);
            }
        }

        if (!buf) {
            console.error('[VV] all attempts failed:', notes.join(' | '));
            await ctx.react('❌');
            return ctx.reply(
                `⊘ *Could not retrieve the view-once media.*\n\n` +
                `_WhatsApp deletes view-once content from its servers quickly after it's opened. ` +
                `Ask them to send it again and reply immediately._\n\n` +
                `> ${notes.join('\n> ')}${s.FOOTER}`
            );
        }

        // Send
        try {
            const senderNum = String(ctx.sender || ctxInfo.participant || '').split('@')[0].split(':')[0];
            const caption = `👁️ *View-Once Unveiled*\n*From:* @${senderNum}${s.FOOTER}`;
            const mimetype = found.media?.mimetype;

            if (found.type === 'image') {
                await sock.sendMessage(ctx.from, { image: buf, caption, mimetype: mimetype || 'image/jpeg' }, { quoted: msg });
            } else if (found.type === 'video') {
                await sock.sendMessage(ctx.from, { video: buf, caption, mimetype: mimetype || 'video/mp4' }, { quoted: msg });
            } else {
                await sock.sendMessage(ctx.from, {
                    audio: buf,
                    mimetype: mimetype || 'audio/ogg; codecs=opus',
                    ptt: !!found.media?.ptt,
                }, { quoted: msg });
            }

            await ctx.react('✅');
            console.log('[VV] revealed to', ctx.from, '| from:', senderNum);
        } catch (err) {
            await ctx.react('❌');
            ctx.reply(`❌ Failed to forward view-once: ${err?.message || err}${s.FOOTER}`);
        }
    },
};
