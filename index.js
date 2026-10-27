// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Powered by MADARA X-MD INC.        ║
// ╚══════════════════════════════════════════════════════╝

// NOTE: the @dark-yasiya/baileys LID-decrypt monkey-patch has been removed.
// It patched that fork's specific decode-wa-message.js internals, which no
// longer apply now that this build is back on @itsliaaa/baileys. Requiring
// it here used to crash the whole process at startup — require.resolve()
// for a package that's no longer a dependency throws immediately, before
// anything else in this file even runs. That was almost certainly the
// "npm issues" being hit: the same script also ran via the postinstall
// hook (removed from package.json), so it broke `npm install` too.

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
const { startTelegramBot }                              = require('./lib/telegram');
const { activeSessions, startSession, clearSession, resumeSessions } = require('./lib/pairManager');
const pairApi                                           = require('./pairApi');

(async () => {
    console.log(chalk.cyan('\n╔══════════════════════════════════════╗'));
    console.log(chalk.cyan('║   MADARA X-MD — MADARA X-MD INC.     ║'));
    console.log(chalk.cyan(`║   v${settings.version} — Loading...  ║`));
    console.log(chalk.cyan('╚══════════════════════════════════════╝\n'));

    const cmdCount = loadCommands();
    console.log(chalk.green(`✅ Loaded ${cmdCount} command plugins\n`));

    pairApi.init(
        async (phone, forceNew = false) => {
            try {
                if (forceNew) {
                    console.log(`[Main] Force new for +${phone} — clearing`);
                    try { await clearSession(phone); } catch {}
                    await new Promise(r => setTimeout(r, 1000));
                }
                return await startSession(phone, null, forceNew);
            } catch (e) {
                console.error('[WebPair] startSession error:', e.message);
                return null;
            }
        },
        clearSession,
    );

    startTelegramBot(startSession, activeSessions, clearSession);
    await resumeSessions();

    const { startMonitor } = require('./lib/healthMonitor');
    startMonitor();

    console.log(chalk.green('\n✅ MADARA X-MD is fully operational\n'));
})();

process.on('uncaughtException', (err) => {
    const msg = err?.message || String(err);
    if (msg.includes('Connection Closed') || msg.includes('rate-overlimit') || msg.includes('not-authorized') || msg.includes('Timed Out')) return;
    console.error('[Process] Uncaught Exception:', msg);
});
process.on('unhandledRejection', (reason) => {
    const msg = String(reason?.message || reason || '');
    if (msg.includes('Connection Closed') || msg.includes('rate-overlimit') || msg.includes('not-authorized') || msg.includes('Timed Out')) return;
    console.error('[Process] Unhandled Rejection:', msg);
});

module.exports = { startSession, activeSessions };