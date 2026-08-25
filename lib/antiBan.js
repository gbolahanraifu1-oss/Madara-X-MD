'use strict';

const activeSessions = new Map();

const CONFIG = {
    maxOpsPerMinute: 15,              // 15 ops per minute (increased from 10)
    cooldownAfterLimit: 30_000,       // 30s cooldown (reduced from 60s)
    minDelayBetweenOps: 300,          // 300ms min delay
    maxDelayBetweenOps: 1000,         // 1000ms max delay
    maxOpsPerSession: 500,            // 500 ops before long cooldown
    longCooldown: 5 * 60 * 1000,      // 5 min long cooldown
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
        throw new Error('🛡️ ʀᴀᴛᴇ ʟɪᴍɪᴛ ʜɪᴛ — ᴄᴏᴏʟᴅᴏᴡɴ 30s');
    }

    if (tracker.totalOps >= CONFIG.maxOpsPerSession) {
        tracker.cooldownUntil = now + CONFIG.longCooldown;
        tracker.totalOps = 0;
        throw new Error('🛡️ sᴇssɪᴏɴ ᴄᴀᴘ ʜɪᴛ — ʟᴏɴɢ ᴄᴏᴏʟᴅᴏᴡɴ 5ᴍɪɴ');
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

function resetTracking(phone) {
    activeSessions.delete(phone);
}

module.exports = { canCrash, recordCrash, getStats, resetTracking, CONFIG };