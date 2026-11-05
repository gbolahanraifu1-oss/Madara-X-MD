// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Auto-View / Auto-Like Status        ║
// ║   Per-session toggles. Randomized delays so the bot ║
// ║   doesn't view+react instantly every single time —  ║
// ║   that pattern is exactly what gets accounts flagged║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const db = require('./db');

const DEFAULT_EMOJI = '❤️';

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Dedupe status events (same status can arrive more than once)
const _seen = new Set();
const _SEEN_MAX = 800;

function _remember(id) {
    if (!id) return false;
    if (_seen.has(id)) return true;
    _seen.add(id);
    if (_seen.size > _SEEN_MAX) {
        // drop oldest ~25%
        const drop = Math.floor(_SEEN_MAX * 0.25);
        let i = 0;
        for (const k of _seen) {
            _seen.delete(k);
            if (++i >= drop) break;
        }
    }
    return false;
}

function getConfig(phone) {
    return {
        autoView: db.getSession(phone, 'config', 'autoView', false) === true,
        autoLike: db.getSession(phone, 'config', 'autoLike', false) === true,
        likeEmoji: db.getSession(phone, 'config', 'likeEmoji', DEFAULT_EMOJI) || DEFAULT_EMOJI,
    };
}

function setAutoView(phone, value) {
    db.setSession(phone, 'config', 'autoView', value === true);
    db.flushDirty?.().catch?.(() => {});
}

function setAutoLike(phone, value) {
    db.setSession(phone, 'config', 'autoLike', value === true);
    db.flushDirty?.().catch?.(() => {});
}

function setLikeEmoji(phone, emoji) {
    const e = String(emoji || '').trim() || DEFAULT_EMOJI;
    db.setSession(phone, 'config', 'likeEmoji', e);
    db.flushDirty?.().catch?.(() => {});
}

/** Normalize a jid/lid to something usable in statusJidList */
function normalizeJid(jid) {
    if (!jid || typeof jid !== 'string') return null;
    if (jid === 'status@broadcast') return null;
    // Already a full jid
    if (jid.includes('@')) return jid;
    const digits = jid.replace(/[^0-9]/g, '');
    return digits ? `${digits}@s.whatsapp.net` : null;
}

function statusParticipant(msg) {
    // Prefer participant (status author). remoteJid is usually status@broadcast.
    return (
        normalizeJid(msg?.key?.participant) ||
        normalizeJid(msg?.participant) ||
        normalizeJid(msg?.key?.participantAlt) ||
        null
    );
}

/**
 * Called from pairManager.js for every status@broadcast message.
 * Fire-and-forget — never blocks the main message loop.
 */
function handleStatusUpdate(sock, msg, phone) {
    if (!msg?.key || msg.key.fromMe) return;

    const cfg = getConfig(phone);
    if (!cfg.autoView && !cfg.autoLike) return;

    const id = msg.key.id;
    if (_remember(id)) return; // already handled this status id

    (async () => {
        try {
            await sleep(rand(1_500, 4_500));

            if (cfg.autoView) {
                try {
                    await sock.readMessages([msg.key]);
                } catch (e) {
                    console.error(`[StatusManager:${phone}] auto-view failed:`, e.message);
                }
            }

            if (cfg.autoLike) {
                await sleep(rand(2_000, 6_000));

                const posterJid = statusParticipant(msg);
                if (!posterJid) {
                    console.error(`[StatusManager:${phone}] auto-like skipped: no status author jid`);
                    return;
                }

                const myJid = normalizeJid(sock.user?.id) || normalizeJid(sock.user?.lid);
                const statusJidList = [posterJid, myJid].filter(Boolean);

                const reactKey = {
                    remoteJid: 'status@broadcast',
                    id: msg.key.id,
                    fromMe: false,
                    participant: posterJid,
                };

                try {
                    await sock.sendMessage(
                        'status@broadcast',
                        { react: { text: cfg.likeEmoji || DEFAULT_EMOJI, key: reactKey } },
                        { statusJidList }
                    );
                } catch (e) {
                    // Fallback: try with original key if structured key fails
                    try {
                        await sock.sendMessage(
                            'status@broadcast',
                            { react: { text: cfg.likeEmoji || DEFAULT_EMOJI, key: msg.key } },
                            { statusJidList }
                        );
                    } catch (e2) {
                        console.error(`[StatusManager:${phone}] auto-like react failed:`, e2.message || e.message);
                    }
                }
            }
        } catch (e) {
            console.error(`[StatusManager:${phone}] error:`, e.message);
        }
    })();
}

module.exports = {
    handleStatusUpdate,
    getConfig,
    setAutoView,
    setAutoLike,
    setLikeEmoji,
    DEFAULT_EMOJI,
};
