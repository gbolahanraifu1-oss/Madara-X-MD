// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Auto-View / Auto-Like Status        ║
// ║   Per-session toggles. Randomized delays so the bot ║
// ║   doesn't view+react instantly every single time —  ║
// ║   that pattern is exactly what gets accounts flagged║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const db = require('./db');

const DEFAULT_EMOJI = '❤️';

// ── Random delay helpers (ms) ───────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function getConfig(phone) {
    return {
        autoView: db.getSession(phone, 'config', 'autoView', false),
        autoLike: db.getSession(phone, 'config', 'autoLike', false),
        likeEmoji: db.getSession(phone, 'config', 'likeEmoji', DEFAULT_EMOJI),
    };
}

function setAutoView(phone, value) { db.setSession(phone, 'config', 'autoView', value); }
function setAutoLike(phone, value) { db.setSession(phone, 'config', 'autoLike', value); }
function setLikeEmoji(phone, emoji) { db.setSession(phone, 'config', 'likeEmoji', emoji); }

/**
 * Called from pairManager.js for every status@broadcast message.
 * Fire-and-forget — never blocks the main message loop.
 */
function handleStatusUpdate(sock, msg, phone) {
    if (!msg?.key || msg.key.fromMe) return; // never react to our own status

    const cfg = getConfig(phone);
    if (!cfg.autoView && !cfg.autoLike) return; // both off — nothing to do

    // Don't await this from the caller — run async in background
    (async () => {
        try {
            // ── Random "human-like" delay before viewing ───────────────
            await sleep(rand(1_500, 4_500));

            if (cfg.autoView) {
                try {
                    await sock.readMessages([msg.key]);
                } catch (e) {
                    console.error(`[StatusManager:${phone}] auto-view failed:`, e.message);
                }
            }

            if (cfg.autoLike) {
                // Extra delay between view and reaction — real people don't
                // react the instant they finish viewing
                await sleep(rand(2_000, 6_000));

                const posterJid = msg.key.participant || msg.key.remoteJid;
                const myJid     = sock.user?.id || sock.user?.lid;
                try {
                    await sock.sendMessage(
                        'status@broadcast',
                        { react: { text: cfg.likeEmoji, key: msg.key } },
                        { statusJidList: [posterJid, myJid].filter(Boolean) }
                    );
                } catch (e) {
                    console.error(`[StatusManager:${phone}] auto-like react failed:`, e.message);
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
