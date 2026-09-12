// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Bot's-Own-Message Tracker          ║
// ║   Lets passive hooks (AFK, chatbot) tell the         ║
// ║   difference between "the bot just sent this" vs    ║
// ║   "the owner typed this themselves" — both arrive   ║
// ║   with fromMe:true in a self-bot, but only one is   ║
// ║   actually an echo we should ignore.                ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const _sentIds = new Map(); // msgId → timestamp
const TTL_MS   = 60_000;    // forget after 60s, plenty for echo detection

function trackSent(id) {
    if (!id) return;
    _sentIds.set(id, Date.now());
}

function wasSentByBot(id) {
    if (!id) return false;
    return _sentIds.has(id);
}

// Periodic cleanup so this never grows unbounded over a 20+ day uptime
const _sweep = setInterval(() => {
    const cutoff = Date.now() - TTL_MS;
    for (const [id, ts] of _sentIds) {
        if (ts < cutoff) _sentIds.delete(id);
    }
}, 30_000);
if (_sweep.unref) _sweep.unref();

module.exports = { trackSent, wasSentByBot };