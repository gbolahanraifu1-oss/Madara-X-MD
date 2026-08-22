// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Powered by MADARA X-MD INC.             ║
// ║   © 2026 MADARA X-MD INC. — All Rights Reserved           ║
// ╚══════════════════════════════════════════════════════╝

// ── Global crash guards — keep bot alive on unhandled errors ─────────────
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

// ── Global CrashLib instances map ─────────────────────────────────────────
global.crashLibInstances = new Map();

// ── getCrashLib — retrieve by phone or create from sock ──────────────────
global.getCrashLib = (sock) => {
    if (sock) {
        const phone = sock._sessionPhone || sock.user?.id?.split(':')[0];
        if (phone && global.crashLibInstances?.has(phone)) {
            return global.crashLibInstances.get(phone);
        }
        // Fallback: create from sock directly
        try {
            const { CrashLib } = require('./lib/crashlib');
            const crashLib = new CrashLib(sock);
            if (phone) global.crashLibInstances?.set(phone, crashLib);
            return crashLib;
        } catch (e) {
            console.error('[CrashLib] Fallback creation error:', e.message);
            return null;
        }
    }
    // Return first available if no sock specified
    const first = global.crashLibInstances?.values().next().value;
    return first || null;
};

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
                return await startSession(phone, null);
            }
            catch (e) {
                console.error('[WebPair] startSession error:', e.message);
                return null;
            }
        },
        clearSession,
    );

    // ── Telegram pairing bot ───────────────────────────────────────────────
    startTelegramBot(startSession, activeSessions);

    // ── Resume all paired sessions from disk ───────────────────────────────
    await resumeSessions();

    // ── Start health monitor ───────────────────────────────────────────────
    const { startMonitor } = require('./lib/healthMonitor');
    startMonitor();

    console.log(chalk.green('\n✅ MADARA X-MD is fully operational\n'));
})();

// ── Global error guards ────────────────────────────────
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