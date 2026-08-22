// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Powered by MADARA X-MD INC.             ║
// ║   © 2026 MADARA X-MD INC. — All Rights Reserved           ║
// ╚══════════════════════════════════════════════════════╝

process.on('uncaughtException', (err) => {
    const noise = ['ECONNRESET','ETIMEDOUT','EPIPE','ENOTFOUND','EFATAL','Connection Closed'];
    if (noise.some(n => err.message?.includes(n))) return;
    console.error('[uncaughtException]', err.message);
});
process.on('unhandledRejection', (reason) => {
    const msg = reason?.message || String(reason);
    const noise = ['ECONNRESET','ETIMEDOUT','EPIPE','ENOTFOUND','Connection Closed','timed out'];
    if (noise.some(n => msg.includes(n))) return;
    console.error('[unhandledRejection]', msg);
});

try { require('dotenv').config(); } catch {}

const chalk    = require('chalk') || { green: s=>s, red: s=>s, cyan: s=>s, yellow: s=>s, magenta: s=>s };
const settings = require('./settings');

const { loadCommands }                                  = require('./lib/loader');
const { startTelegramBot, pairingBridge }               = require('./lib/telegram');
const { activeSessions, startSession, clearSession,
        resumeSessions }                                = require('./lib/pairManager');
const pairApi                                           = require('./pairApi');

// ── Import CrashLib ──────────────────────────────────────────────────────
const { CrashLib } = require('./lib/crashlib');

// ── Global crashLib storage ──────────────────────────────────────────────
global.crashLibInstances = new Map();

// ── Helper to attach crashLib to a session ───────────────────────────────
function attachCrashLib(sock) {
    if (!sock) return null;
    const crashLib = new CrashLib(sock);
    global.crashLibInstances.set(sock.user?.id || 'default', crashLib);
    console.log(chalk.magenta('✅ CrashLib attached to session'));
    return crashLib;
}

// ── Expose crashLib globally for command handlers ────────────────────────
global.getCrashLib = (sock) => {
    if (sock) {
        const key = sock.user?.id || 'default';
        if (global.crashLibInstances.has(key)) {
            return global.crashLibInstances.get(key);
        }
        // Create on-the-fly if not exists
        return attachCrashLib(sock);
    }
    // Return first available if no sock specified
    const first = global.crashLibInstances.values().next().value;
    return first || null;
};

global.attachCrashLib = attachCrashLib;

// ── Boot ───────────────────────────────────────────────
(async () => {
    console.log(chalk.cyan('\n╔══════════════════════════════════════╗'));
    console.log(chalk.cyan('║   MADARA X-MD — MADARA X-MD INC.         ║'));
    console.log(chalk.cyan(`║   v${settings.version} — Loading...                ║`));
    console.log(chalk.cyan('╚══════════════════════════════════════╝\n'));

    const cmdCount = loadCommands();
    console.log(chalk.green(`✅ Loaded ${cmdCount} command plugins\n`));

    // ── Web pairing API ────────────────────────────────────────────────────
    pairApi.init(
        async (phone) => {
            try {
                const session = await startSession(phone, null);
                if (session?.sock) {
                    attachCrashLib(session.sock);
                }
                return session;
            }
            catch (e) {
                console.error('[WebPair] startSession error:', e.message);
                return null;
            }
        },
        clearSession,
    );

    // ── Telegram pairing bot ───────────────────────────────────────────────
    const telegramStartSession = async (phone) => {
        const session = await startSession(phone);
        if (session?.sock) {
            attachCrashLib(session.sock);
        }
        return session;
    };
    startTelegramBot(telegramStartSession, activeSessions);

    // ── Resume all paired sessions from disk ───────────────────────────────
    const resumedSessions = await resumeSessions();
    
    if (resumedSessions && typeof resumedSessions === 'object') {
        for (const sessionId of Object.keys(resumedSessions)) {
            const session = resumedSessions[sessionId];
            if (session?.sock) {
                attachCrashLib(session.sock);
                console.log(chalk.green(`✅ CrashLib attached to resumed session: ${sessionId}`));
            }
        }
    }

    // ── Start health monitor ───────────────────────────────────────────────
    const { startMonitor } = require('./lib/healthMonitor');
    startMonitor();

    console.log(chalk.green('\n✅ MADARA X-MD is fully operational\n'));
})();

process.on('uncaughtException', (err) => {
    const msg = err?.message || String(err);
    if (msg.includes('Connection Closed') || msg.includes('rate-overlimit') ||
        msg.includes('not-authorized')    || msg.includes('Timed Out')) return;
    console.error('[Process] Uncaught Exception:', msg);
});
process.on('unhandledRejection', (reason) => {
    const msg = String(reason?.message || reason || '');
    if (msg.includes('Connection Closed') || msg.includes('rate-overlimit') ||
        msg.includes('not-authorized')    || msg.includes('Timed Out')) return;
    console.error('[Process] Unhandled Rejection:', msg);
});

module.exports = { startSession, activeSessions, getCrashLib: global.getCrashLib };