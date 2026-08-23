'use strict';
/**
 * madara-features.js
 * All Madara X-MD auto-features ported & adapted for Madara X-MD (CommonJS)
 * Hooks: call startMadaraFeatures(sock, settings) after connection
 */

const s = require('../settings');
const sessionTheme = require('./sessionTheme');

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
    if (!update || !update.id) return;
    // Anti-bot-clone check runs independently of the greeting toggle
    if (update.action === 'add') {
        try {
            const { checkBotClone } = require('../commands/misc/antibotclone');
            if (await checkBotClone(sock, update.id, update.participants)) return;
        } catch (e) { console.error('[MadaraFeatures] antibotclone error:', e.message); }
    }

    if (!isGreetingOn(update.id)) return; // greeting disabled for this group
    try {
        const meta         = await sock.groupMetadata(update.id).catch(() => null);
        if (!meta) return;
        const memberCount  = meta.participants.length;
        const ctx          = channelCtx(settings);
        const themed       = sessionTheme.info(sock._sessionPhone) || {}; 

        for (const user of update.participants) {
            const userId = typeof user === 'string' ? user : (user?.id || user?.jid || String(user));
            const num  = userId.split('@')[0];
            const pic  = await sock.profilePictureUrl(userId, 'image')
                               .catch(() => '');

            // Welcome
            if (update.action === 'add' && process.env.WELCOME_MSG !== 'false') {
                // If .setwelcome was used, its message is stored as
                // 'welcomeMsg' — use it. Previously this was written but
                // never read anywhere, so a custom message silently had
                // zero effect and everyone always got the hardcoded caption.
                const customMsg = require('./db').getGroupSetting(update.id, 'welcomeMsg', null);
                const caption = customMsg
                    ? customMsg
                        .replace(/{name}/g, `@${num}`)
                        .replace(/{mention}/g, `@${num}`)
                        .replace(/{group}/g, meta.subject || 'the group')
                        .replace(/{count}/g, String(memberCount))
                        + settings.footerWelcome(userId)
                    : `🌟 *${themed.welcome || 'Heads Up Everyone!'}* 🌟\n\n@${num} just joined *${meta.subject}*! 🚀\n${themed.greet || getGreeting()}, welcome to the family! 🎊\n👥 We are now *${memberCount}* strong${settings.footerWelcome(userId)}`;

                await sock.sendMessage(update.id, {
                    image:   { url: pic },
                    caption,
                    mentions: [userId],
                    contextInfo: ctx,
                }, { quoted: null });
            }

            // Goodbye is intentionally NOT handled here — lib/groupevents.js
            // already owns goodbye messages, gated by its own separate
            // 'goodbye' flag (toggled via `.goodbye on/off` / `.setgoodbye`).
            // This used to also fire a second, different-looking goodbye
            // message gated by the 'welcome' flag instead — anyone with both
            // flags on got two goodbye messages per member leaving, and
            // anyone who only ever set the 'goodbye' flag (the intended,
            // documented way) got exactly one from groupevents.js, which
          // made behavior look inconsistent depending on which flags a
            // group happened to have set.
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
// ── Greeting toggle helpers ──────────────────────────────────────────
// Was global._madaraGreetings, a plain in-memory Map — every bot restart
// silently wiped every group's welcome/goodbye setting back to "off"
// with no error shown anywhere, which is exactly why `.welcome on`
// would stop working after a while. Also, lib/groupevents.js has its
// own SEPARATE welcome system that checks db.getGroupSetting(id,
// 'welcome') — a flag `.welcome on` never touched at all. Routing both
// through the same persisted db key fixes both problems: the setting
// survives restarts, and both welcome code paths now agree with each
// other instead of silently disagreeing.
function isGreetingOn(groupId) {
    const db = require('./db');
    const saved = db.getGroupSetting(groupId, 'welcome', null);
    // WELCOME_MSG is the global default; an explicit .welcome off still wins.
    if (saved !== null) return saved === true;
    return String(process.env.WELCOME_MSG || 'true').trim().toLowerCase() !== 'false';
}
function toggleGreeting(groupId, val) { require('./db').setGroupSetting(groupId, 'welcome', val); }

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

module.exports = { startMadaraFeatures, toggleGreeting, isGreetingOn };
