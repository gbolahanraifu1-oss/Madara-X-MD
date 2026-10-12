'use strict';
/**
 * madara-features.js
 * All Madara X-MD auto-features ported & adapted for Madara X-MD (CommonJS)
 * Hooks: call startMadaraFeatures(sock, settings) after connection
 */

const s = require('../settings');
const sessionTheme = require('./sessionTheme');
const db = require('./db');
const premium = require('./premium');

// ── helpers ───────────────────────────────────────────────────────────────────
const channelCtx = (settings) => settings.newsletterJid ? {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid:   settings.newsletterJid,
        newsletterName:  settings.channelName || settings.botName,
        serverMessageId: 143,
    },
} : {};

function getGreeting() {
    const h = new Date().getHours();
    if (h < 4)  return 'Happy early hours ✨';
    if (h < 10) return 'Good Morning 🌅';
    if (h < 15) return 'Good Afternoon ☀️';
    if (h < 18) return 'Good Evening 🌇';
    return 'Good Night 🌙';
}

function fmtUptime(ms) {
    const d = Math.floor(ms / 86400000);
    const h = Math.floor(ms / 3600000) % 24;
    const m = Math.floor(ms / 60000)  % 60;
    return `${d}d ${h}h ${m}m`;
}

// ── WELCOME / GOODBYE (group-participants.update) ─────────────────────────────
async function handleGroupUpdate(sock, update, settings) {
    if (!update?.id || !update.id.endsWith('@g.us')) return;
    // Anti-bot-clone check is independent of welcome/goodbye settings.
    if (update.action === 'add') {
        try {
            const { checkBotClone } = require('../commands/misc/antibotclone');
            if (await checkBotClone(sock, update.id, update.participants)) return;
        } catch (e) { console.error('[MadaraFeatures] antibotclone error:', e.message); }
    }

    const feature = update.action === 'add' ? 'welcome'
        : update.action === 'remove' ? 'goodbye' : null;
    const sessionPhone = sock._sessionPhone;
    if (!feature || !isGroupFeatureOn(sessionPhone, update.id, feature)) return;

    try {
        const meta = await sock.groupMetadata(update.id).catch(() => null);
        if (!meta) return;
        const memberCount = meta.participants?.length || 0;
        const ctx = channelCtx(settings);
        const themed = sessionTheme.info(sessionPhone) || {};

        for (const user of update.participants || []) {
            const userId = typeof user === 'string' ? user : (user?.id || user?.jid || user?.lid || String(user));
            if (!userId.includes('@')) continue;
            const num = userId.split('@')[0];

            if (feature === 'welcome') {
                const pic = await sock.profilePictureUrl(userId, 'image').catch(() => '');
                const legacyMessage = db.getGroupSetting(update.id, 'welcomeMsg', null);
                const customMsg = getGroupMessage(sessionPhone, update.id, 'welcome', legacyMessage);
                const caption = customMsg
                    ? customMsg
                        .replace(/{name}/g, '@' + num)
                        .replace(/{mention}/g, '@' + num)
                        .replace(/{group}/g, meta.subject || 'the group')
                        .replace(/{count}/g, String(memberCount))
                        + settings.footerWelcome(userId)
                    : '🌟 *' + (themed.welcome || 'Heads Up Everyone!') + '* 🌟\n\n@' + num + ' just joined *' + meta.subject + '*! 🚀\n'
                        + getGreeting() + ', welcome to the family! 🎊\n👥 We are now *' + memberCount + '* strong'
                        + settings.footerWelcome(userId);
                const payload = pic
                    ? { image: { url: pic }, caption, mentions: [userId], contextInfo: ctx }
                    : { text: caption, mentions: [userId], contextInfo: ctx };
                await sock.sendMessage(update.id, payload, { quoted: null });
                continue;
            }

            const participant = meta.participants?.find(p => p.id === userId || p.lid === userId);
            const name = participant?.pushName || participant?.notify || '+' + num;
            const defaultGoodbye = themed.goodbye || 'Goodbye @{user}! Thanks for being with us 👋';
            const legacyMessage = db.getGroupSetting(update.id, 'goodbyeMsg', null) || defaultGoodbye;
            const template = getGroupMessage(sessionPhone, update.id, 'goodbye', legacyMessage) || defaultGoodbye;
            const text = template
                .replace(/{user}/g, num)
                .replace(/{name}/g, name)
                .replace(/{group}/g, meta.subject || 'the group');
            await sock.sendMessage(update.id, {
                text: text + settings.footerGoodbye(userId),
                mentions: [userId],
                contextInfo: ctx,
            });
        }
    } catch (e) {
        console.error('[MadaraFeatures] group update error:', e.message);
    }
}

// ── ALWAYS ONLINE ─────────────────────────────────────────────────────────────
async function setAlwaysOnline(sock) {
    if (process.env.ALWAYS_ONLINE !== 'true') return;
    try {
        await sock.sendPresenceUpdate('available');
    } catch {}
}

// ── AUTO BIO (updates every 5 min) ───────────────────────────────────────────
let _bioCron;
function startAutoBio(sock) {
    if (process.env.AUTO_BIO !== 'true') return;
    if (_bioCron) clearInterval(_bioCron);
    _bioCron = setInterval(async () => {
        try {
            const uptime = fmtUptime(process.uptime() * 1000);
            const s2 = require('../settings');
            const bio = `⚡ ${s2.botName} | Uptime: ${uptime} | ${new Date().toLocaleTimeString()}`;
            await sock.updateProfileStatus(bio);
        } catch {}
    }, 5 * 60 * 1000);
}

// ── AUTO TYPING / RECORDING PRESENCE ─────────────────────────────────────────
async function handlePresence(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid) return;
    if (process.env.AUTO_TYPING === 'true') {
        await sock.sendPresenceUpdate('composing', jid).catch(() => {});
        setTimeout(() => sock.sendPresenceUpdate('paused', jid).catch(() => {}), 5000);
    } else if (process.env.AUTO_RECORDING === 'true') {
        await sock.sendPresenceUpdate('recording', jid).catch(() => {});
        setTimeout(() => sock.sendPresenceUpdate('paused', jid).catch(() => {}), 5000);
    }
}

// ── ANTI-CALL ─────────────────────────────────────────────────────────────────
async function handleCall(sock, calls) {
    const db = require('./db');
    // Runtime toggle (.anticall on/off) takes priority; ANTI_CALL env var is
    // the fallback default for people who haven't touched the command yet.
    const dbSetting  = db.get('settings', 'antiCall', null);
    const enabled    = dbSetting !== null ? dbSetting : process.env.ANTI_CALL === 'true';
    if (!enabled) return;

    const silent  = db.get('settings', 'antiCallSilent', false);
    const callMsg = db.get('settings', 'antiCallMsg', null)
        || `❌ *Sorry, I don't accept calls.*\n\nPlease send a text message instead.\n\n> _${require('../settings').botName}_`;

    for (const call of calls) {
        if (call.status === 'offer') {
            await sock.rejectCall(call.id, call.from).catch(() => {});
            if (!silent) {
                await sock.sendMessage(call.from, { text: callMsg }).catch(() => {});
            }
        }
    }
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
// ── Session-scoped welcome/goodbye controls ───────────────────────────────────
const GROUP_FEATURES = new Set(['welcome', 'goodbye']);
function readGroupFeatures(sessionPhone, groupId) {
    if (!sessionPhone || !groupId) return {};
    return db.getSession(sessionPhone, 'groupFeatures', groupId, {}) || {};
}
function isGroupFeatureOn(sessionPhone, groupId, feature) {
    if (!GROUP_FEATURES.has(feature)) return true;
    const state = readGroupFeatures(sessionPhone, groupId);
    return typeof state[feature] === 'boolean' ? state[feature] : true;
}
function setGroupFeature(sessionPhone, groupId, feature, enabled) {
    if (!sessionPhone || !groupId || !GROUP_FEATURES.has(feature)) return false;
    const state = readGroupFeatures(sessionPhone, groupId);
    db.setSession(sessionPhone, 'groupFeatures', groupId, { ...state, [feature]: Boolean(enabled) });
    return true;
}
function updateGroupFeature(sessionPhone, groupId, feature, enabled, senderJid) {
    if (!GROUP_FEATURES.has(feature)) return { ok: false, reason: 'invalid_feature' };
    if (!premium.isPremiumUser(senderJid)) return { ok: false, reason: 'premium_required' };
    if (!setGroupFeature(sessionPhone, groupId, feature, enabled)) return { ok: false, reason: 'session_unavailable' };
    return { ok: true, enabled: Boolean(enabled) };
}
function getGroupMessage(sessionPhone, groupId, feature, fallback = null) {
    if (!GROUP_FEATURES.has(feature)) return fallback;
    const message = readGroupFeatures(sessionPhone, groupId)[feature + 'Message'];
    return typeof message === 'string' && message.length ? message : fallback;
}
function setGroupMessage(sessionPhone, groupId, feature, message) {
    if (!sessionPhone || !groupId || !GROUP_FEATURES.has(feature) || typeof message !== 'string') return false;
    const state = readGroupFeatures(sessionPhone, groupId);
    db.setSession(sessionPhone, 'groupFeatures', groupId, { ...state, [feature + 'Message']: message });
    return true;
}
// Backwards-compatible helpers for older command plugins.
function isGreetingOn(groupId, sessionPhone) { return isGroupFeatureOn(sessionPhone, groupId, 'welcome'); }
function toggleGreeting(groupId, enabled, sessionPhone, senderJid) {
    return updateGroupFeature(sessionPhone, groupId, 'welcome', enabled, senderJid);
}

function startMadaraFeatures(sock, settings) {
    // Group welcome/goodbye
    sock.ev.on('group-participants.update', (update) =>
        handleGroupUpdate(sock, update, settings));

    // Always online — set on connection
    sock.ev.on('connection.update', (update) => {
        if (update.connection === 'open') {
            setAlwaysOnline(sock);
            startAutoBio(sock);
        }
    });

    // Auto typing/recording presence
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (!msg.key.fromMe && msg.message) {
                await handlePresence(sock, msg);
            }
        }
    });

    // Anti-call
    sock.ev.on('call', (calls) => handleCall(sock, calls));

    console.log('[MadaraFeatures] ✅ Auto-features loaded');
}

module.exports = {
    startMadaraFeatures, handleGroupUpdate,
    isGreetingOn, toggleGreeting, isGroupFeatureOn, setGroupFeature, updateGroupFeature,
    getGroupMessage, setGroupMessage,
};
