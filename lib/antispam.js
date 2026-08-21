// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Anti-Spam Engine                   ║
// ║   Tracks msg rate per user per group, kicks spammers║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const db = require('./db');

// In-memory tracker: { groupJid: { senderJid: [timestamps] } }
const _tracker = new Map();

// ── Retry-storm guard ──────────────────────────────────────────────────
// WhatsApp/Baileys sometimes redelivers a message the sender only typed
// ONCE as several distinct stanzas with different message IDs (session
// resync / prekey retry) — our ID-based dedup in pairManager.js can't
// catch that since each retry has a genuinely new ID. Left unguarded,
// that retry burst alone can trip the spam counter on a single real
// message. Fix: if the same sender's text is identical to their last
// message and arrives within RETRY_WINDOW, don't count it again.
const _lastMsg = new Map(); // `${from}-${sender}` -> { text, ts }
const RETRY_WINDOW = 2500; // ms
setInterval(() => { if (_lastMsg.size > 2000) _lastMsg.clear(); }, 5 * 60 * 1000);

function getText(msg) {
    return msg.message?.conversation
        || msg.message?.extendedTextMessage?.text
        || msg.message?.imageMessage?.caption
        || msg.message?.videoMessage?.caption
        || '';
}

/**
 * Called on every group message.
 * Returns true if the sender was actioned (kick/warn) — caller should return early.
 */
async function checkSpam(sock, from, sender, msg, ctx) {
    try {
        const cfg = db.get('antispam', `antispam_${from}`);
        if (!cfg || !cfg.enabled) return false;

        const limit  = cfg.limit  || 5;
        const window = cfg.window || 5000; // ms
        const now    = Date.now();

        // ── Retry-storm guard ────────────────────────────────────────
        const dedupKey = `${from}-${sender}`;
        const text      = getText(msg);
        const lastMsg   = _lastMsg.get(dedupKey);
        if (text && lastMsg && lastMsg.text === text && (now - lastMsg.ts) < RETRY_WINDOW) {
            return false; // same content, arrived within the retry window — skip counting
        }
        _lastMsg.set(dedupKey, { text, ts: now });

        // Init group tracker
        if (!_tracker.has(from)) _tracker.set(from, new Map());
        const groupMap = _tracker.get(from);

        // Init sender timestamps
        if (!groupMap.has(sender)) groupMap.set(sender, []);
        let times = groupMap.get(sender);

        // Prune old timestamps outside the window
        times = times.filter(t => now - t < window);
        times.push(now);
        groupMap.set(sender, times);

        if (times.length < limit) return false;

        // ── Spam detected ────────────────────────────────────────────
        // Reset their counter immediately to avoid repeated kicks
        const hitCount = times.length;
        groupMap.set(sender, []);

        const senderNum = sender.split('@')[0];

        // Attempt the kick FIRST — only claim "removed" if it actually
        // worked. Previously the bot always said "was removed" and then,
        // if the kick failed, immediately contradicted itself with a
        // second "could not remove" message.
        let kicked = false;
        try {
            await sock.groupParticipantsUpdate(from, [sender], 'remove');
            kicked = true;
        } catch {}

        if (kicked) {
            await sock.sendMessage(from, {
                text: `🚨 *ANTI-SPAM TRIGGERED*\n\n@${senderNum} was removed for sending *${hitCount} messages* in ${window / 1000}s.\n\n> ᴍᴀᴅᴀʀᴀ x-ᴍᴅ | ɪɴᴄ.`,
                mentions: [sender]
            }).catch(() => {});
        } else {
            await sock.sendMessage(from, {
                text: `🚨 *ANTI-SPAM TRIGGERED*\n\n@${senderNum} hit the spam limit (*${hitCount} messages* in ${window / 1000}s) but I couldn\u2019t remove them — make me admin to enforce spam kicks.\n\n> ᴍᴀᴅᴀʀᴀ x-ᴍᴅ | ɪɴᴄ.`,
                mentions: [sender]
            }).catch(() => {});
        }

        return true;
    } catch (e) {
        console.error('[AntiSpam] Error:', e.message);
        return false;
    }
}

/**
 * Clear a group's tracker (called when antispam is disabled)
 */
function clearTracker(groupJid) {
    _tracker.delete(groupJid);
}

module.exports = { checkSpam, clearTracker };
