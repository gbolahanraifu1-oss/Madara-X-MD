'use strict';

// ── Anti-Ban Protection Layer ─────────────────────────────────────────────
// Throttles crash commands so WhatsApp doesn't flag the bot account

const activeSessions = new Map();

const CONFIG = {
    maxOpsPerMinute: 10,              // Max crash operations per minute
    cooldownAfterLimit: 60_000,       // 60s cooldown when limit hit
    minDelayBetweenOps: 500,          // Min delay between operations (ms)
    maxDelayBetweenOps: 2000,         // Max delay between operations (ms)
    maxOpsPerSession: 300,            // Hard cap before long cooldown
    longCooldown: 15 * 60 * 1000,     // 15 min long cooldown
};

function getTracker(phone) {
    if (!activeSessions.has(phone)) {
        activeSessions.set(phone, {
            ops: 0,
            lastReset: Date.now(),
            cooldownUntil: 0,
            totalOps: 0,
        });
    }
    return activeSessions.get(phone);
}

async function canCrash(phone) {
    const tracker = getTracker(phone);
    const now = Date.now();

    // Reset per-minute counter
    if (now - tracker.lastReset > 60_000) {
        tracker.ops = 0;
        tracker.lastReset = now;
    }

    // Check cooldown
    if (now < tracker.cooldownUntil) {
        const waitSec = Math.round((tracker.cooldownUntil - now) / 1000);
        throw new Error(`🛡️ ᴀɴᴛɪ-ʙᴀɴ ᴄᴏᴏʟᴅᴏᴡɴ — ᴡᴀɪᴛ ${waitSec}s`);
    }

    // Check per-minute limit
    if (tracker.ops >= CONFIG.maxOpsPerMinute) {
        tracker.cooldownUntil = now + CONFIG.cooldownAfterLimit;
        throw new Error('🛡️ ʀᴀᴛᴇ ʟɪᴍɪᴛ ʜɪᴛ — ᴄᴏᴏʟᴅᴏᴡɴ 60s');
    }

    // Check session cap
    if (tracker.totalOps >= CONFIG.maxOpsPerSession) {
        tracker.cooldownUntil = now + CONFIG.longCooldown;
        tracker.totalOps = 0;
        throw new Error('🛡️ sᴇssɪᴏɴ ᴄᴀᴘ ʜɪᴛ — ʟᴏɴɢ ᴄᴏᴏʟᴅᴏᴡɴ 15ᴍɪɴ');
    }

    return true;
}

async function recordCrash(phone) {
    const tracker = getTracker(phone);
    tracker.ops++;
    tracker.totalOps++;
    
    // Human-like random delay
    const delay = CONFIG.minDelayBetweenOps + Math.random() * (CONFIG.maxDelayBetweenOps - CONFIG.minDelayBetweenOps);
    await new Promise(r => setTimeout(r, delay));
    return delay;
}

function getStats(phone) {
    const tracker = getTracker(phone);
    return {
        opsThisMinute: tracker.ops,
        totalOps: tracker.totalOps,
        cooldownActive: Date.now() < tracker.cooldownUntil,
        cooldownRemaining: Math.max(0, tracker.cooldownUntil - Date.now()),
    };
}

module.exports = { canCrash, recordCrash, getStats };