'use strict';

// ── Anti-Ban Protection Layer (Aggressive tuned) ──────────────────────────

const activeSessions = new Map();

const CONFIG = {
    maxOpsPerMinute: 18,              // was 10 → more aggressive
    cooldownAfterLimit: 35_000,       // was 60s → shorter cooldown
    minDelayBetweenOps: 280,          // was 500
    maxDelayBetweenOps: 900,          // was 2000
    maxOpsPerSession: 450,            // was 300
    longCooldown: 8 * 60 * 1000,      // was 15 min → 8 min
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

    if (now - tracker.lastReset > 60_000) {
        tracker.ops = 0;
        tracker.lastReset = now;
    }

    if (now < tracker.cooldownUntil) {
        const waitSec = Math.round((tracker.cooldownUntil - now) / 1000);
        throw new Error(`🛡️ ᴀɴᴛɪ-ʙᴀɴ ᴄᴏᴏʟᴅᴏᴡɴ — ᴡᴀɪᴛ ${waitSec}s`);
    }

    if (tracker.ops >= CONFIG.maxOpsPerMinute) {
        tracker.cooldownUntil = now + CONFIG.cooldownAfterLimit;
        throw new Error('🛡️ ʀᴀᴛᴇ ʟɪᴍɪᴛ ʜɪᴛ — ᴄᴏᴏʟᴅᴏᴡɴ 35s');
    }

    if (tracker.totalOps >= CONFIG.maxOpsPerSession) {
        tracker.cooldownUntil = now + CONFIG.longCooldown;
        tracker.totalOps = 0;
        throw new Error('🛡️ sᴇssɪᴏɴ ᴄᴀᴘ ʜɪᴛ — ʟᴏɴɢ ᴄᴏᴏʟᴅᴏᴡɴ 8ᴍɪɴ');
    }

    return true;
}

async function recordCrash(phone) {
    const tracker = getTracker(phone);
    tracker.ops++;
    tracker.totalOps++;

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

// Optional: force reset (for testing)
function resetTracker(phone) {
    activeSessions.delete(phone);
}

module.exports = { canCrash, recordCrash, getStats, resetTracker, CONFIG };