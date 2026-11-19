'use strict';

/**
 * Reveal a view-once photo/video/audio by reply.
 *
 * WA often strips mediaKey/directPath from quotedMessage.
 * Working bots (Whiskey + forks) either:
 *  1) load the original message from store, or
 *  2) call updateMediaMessage before download.
 */

const { downloadMediaMessage } = require('@itsliaaa/baileys');

function unwrapMessage(node) {
    let cur = node;
    for (let i = 0; i < 8 && cur; i++) {
        if (cur.ephemeralMessage?.message) {
            cur = cur.ephemeralMessage.message;
            continue;
        }
        if (cur.viewOnceMessage?.message) {
            cur = cur.viewOnceMessage.message;
            continue;
        }
        if (cur.viewOnceMessageV2?.message) {
            cur = cur.viewOnceMessageV2.message;
            continue;
        }
        if (cur.viewOnceMessageV2Extension?.message) {
            cur = cur.viewOnceMessageV2Extension.message;
            continue;
        }
        if (cur.documentWithCaptionMessage?.message) {
            cur = cur.documentWithCaptionMessage.message;
            continue;
        }
        if (cur.editedMessage?.message) {
            cur = cur.editedMessage.message;
            continue;
        }
        break;
    }
    return cur || node;
}

function pickMedia(node) {
    const n = unwrapMessage(node);
    if (n?.imageMessage) return { type: 'imageMessage', msg: n.imageMessage, kind: 'image' };
    if (n?.videoMessage) return { type: 'videoMessage', msg: n.videoMessage, kind: 'video' };
    if (n?.audioMessage) return { type: 'audioMessage', msg: n.audioMessage, kind: 'audio' };
    return null;
}

function hasMediaKey(mediaMsg) {
    const k = mediaMsg?.mediaKey;
    if (!k) return false;
    if (Buffer.isBuffer(k)) return k.length > 0;
    if (k instanceof Uint8Array) return k.length > 0;
    if (typeof k === 'string') return k.length > 0;
    return true;
}

async function loadFromStore(sock, key) {
    try {
        if (typeof sock.loadMessage === 'function') {
            const m = await sock.loadMessage(key.remoteJid, key.id);
            if (m?.message) return m;
        }
    } catch (_) {}
    try {
        // common store patterns used by many bots
        const store = sock.store || global.store;
        if (store?.loadMessage) {
            const m = await store.loadMessage(key.remoteJid, key.id);
            if (m?.message) return m;
        }
        if (store?.messages?.[key.remoteJid]?.get) {
            const m = store.messages[key.remoteJid].get(key.id);
            if (m?.message) return m;
        }
    } catch (_) {}
    return null;
}

module.exports = {
    name: 'viewonce',
    aliases: ['antiviewonce', 'openonce', 'saveviewonce', 'unviewonce', 'vonce', 'vv'],
    category: 'system',
    desc: 'Save/reveal a view-once photo or video (reply to it)',
    usage: '.viewonce (reply to a view-once message)',

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings || {};
        const footer = s.FOOTER || '';

        const ctxInfo =
            msg.message?.extendedTextMessage?.contextInfo ||
            msg.message?.imageMessage?.contextInfo ||
            msg.message?.videoMessage?.contextInfo ||
            msg.message?.buttonsResponseMessage?.contextInfo ||
            msg.message?.listResponseMessage?.contextInfo ||
            msg.message?.interactiveResponseMessage?.contextInfo;

        if (!ctxInfo?.quotedMessage && !ctxInfo?.stanzaId) {
            return ctx.reply(`❌ Reply to a *view-once* photo or video to reveal it.${footer}`);
        }

        const key = {
            remoteJid: ctx.from,
            id: ctxInfo.stanzaId,
            participant: ctxInfo.participant || undefined,
            fromMe: false
        };

        // Prefer original message from store (still has mediaKey)
        let targetMsg = await loadFromStore(sock, key);
        if (!targetMsg) {
            targetMsg = {
                key,
                message: ctxInfo.quotedMessage
            };
        }

        let picked = pickMedia(targetMsg.message);
        if (!picked) {
            return ctx.reply(`❌ No media found in that message.${footer}`);
        }

        // If quoted stripped mediaKey, ask phone for a re-upload / refresh
        if (!hasMediaKey(picked.msg)) {
            try {
                const refreshed = await sock.updateMediaMessage({
                    key: targetMsg.key || key,
                    message: targetMsg.message
                });
                if (refreshed?.message) {
                    targetMsg = refreshed;
                    picked = pickMedia(refreshed.message) || picked;
                }
            } catch (e) {
                console.error('[viewonce] updateMediaMessage:', e.message);
            }
        }

        if (!hasMediaKey(picked.msg)) {
            return ctx.reply(
                `❌ *No media key* on that view-once.\n` +
                `WA stripped keys from the quote, and refresh failed.\n` +
                `_Tip: enable a message store so the bot keeps the original mediaKey._` +
                footer
            );
        }

        try { await ctx.react('👁️'); } catch (_) {}

        try {
            const cleanTarget = {
                key: targetMsg.key || key,
                message: { [picked.type]: picked.msg }
            };

            const buf = await downloadMediaMessage(
                cleanTarget,
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage.bind(sock)
                }
            );

            if (!buf || !buf.length) throw new Error('Empty media buffer');

            if (picked.kind === 'image') {
                await sock.sendMessage(ctx.from, {
                    image: buf,
                    caption: `👁️ *View-once revealed!*${footer}`
                }, { quoted: msg });
            } else if (picked.kind === 'video') {
                await sock.sendMessage(ctx.from, {
                    video: buf,
                    caption: `👁️ *View-once video revealed!*${footer}`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(ctx.from, {
                    audio: buf,
                    mimetype: picked.msg.mimetype || 'audio/ogg; codecs=opus',
                    ptt: !!picked.msg.ptt
                }, { quoted: msg });
                await ctx.reply(`👁️ *View-once audio revealed!*${footer}`);
            }
        } catch (e) {
            console.error('[viewonce]', e);
            return ctx.reply(`❌ Could not reveal: ${e.message}${footer}`);
        }
    }
};
