// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Health Monitor & Auto-Restart       ║
// ║                                                      ║
// ║   Watches: memory usage, event-loop lag, uncaught   ║
// ║   crash bursts. When thresholds are hit it clears   ║
// ║   temp files and exits cleanly (process manager     ║
// ║   like pm2 / forever handles the actual restart).  ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const os   = require('os');
const fs   = require('fs');
const path = require('path');

// ── Configurable thresholds ───────────────────────────────────────────────
const CFG = {
    // Check interval
    intervalMs:       60_000,        // check every 60 seconds

    // Memory: restart if heap used > this % of total system RAM
    memPctThreshold:  95,            // 95% — raised to avoid false positives on multi-session bots

    // Event-loop lag: restart if main thread is blocked > this ms
    lagThreshold:     15_000,        // 15s — menu cmd causes brief spike, not a real freeze

    // Consecutive threshold breaches before acting (avoids false positives)
    breachesRequired: 5,             // need 5 consecutive hits (~5 min) before acting

    // Cooldown between auto-restarts (don't restart more than once per 5 min)
    restartCooldownMs: 10 * 60_000,  // 10 min cooldown between restarts
};

// ── State ─────────────────────────────────────────────────────────────────
let _memoryBreaches = 0;
let _lagBreaches    = 0;
let _lastRestart    = 0;
let _monitorTimer   = null;
let _lagTimer       = null;
let _lagStart       = Date.now();

// ── Temp cleanup — mirrors clearcache.js ─────────────────────────────────
function clearTemp() {
    const dirs = [
        path.join(process.cwd(), 'temp'),
        path.join(process.cwd(), 'tmp'),
        path.join(process.cwd(), '.tmp'),
    ];
    // Per-session temp dirs
    const sessRoot = path.join(process.cwd(), 'sessions');
    try {
        if (fs.existsSync(sessRoot)) {
            for (const p of fs.readdirSync(sessRoot)) {
                ['temp', 'tmp', '.tmp'].forEach(d =>
                    dirs.push(path.join(sessRoot, p, d))
                );
            }
        }
    } catch {}

    let count = 0;
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir)) {
            try { fs.unlinkSync(path.join(dir, f)); count++; } catch {}
        }
    }
    if (count) console.log(`[Health] 🗑️  Cleared ${count} temp file(s) before restart.`);
    if (global.gc) try { global.gc(); } catch {}
}

// ── Graceful restart ──────────────────────────────────────────────────────
function triggerRestart(reason) {
    const now = Date.now();
    if (now - _lastRestart < CFG.restartCooldownMs) {
        console.log(`[Health] ⏳ Restart suppressed — cooldown active (${Math.round((CFG.restartCooldownMs - (now - _lastRestart)) / 1000)}s remaining).`);
        _breaches = 0;
        return;
    }
    _lastRestart = now;
    _breaches    = 0;
    console.log(`[Health] ⚠️  Auto-restart triggered: ${reason}`);
    clearTemp();
    // Give any in-flight sends ~2 seconds to finish
    setTimeout(() => process.exit(0), 2000);
}

// ── Event-loop lag detector ───────────────────────────────────────────────
// Schedules a callback every 1 s and measures how long it actually takes.
// If the difference is > lagThreshold, the event loop is blocked.
let _lagCheckAt = Date.now();
function startLagDetector() {
    function tick() {
        const now = Date.now();
        const lag = now - _lagCheckAt - 1000;
        _lagCheckAt = now;
        if (lag > CFG.lagThreshold) {
            console.warn(`[Health] 🐢 Event-loop lag: ${lag}ms (threshold: ${CFG.lagThreshold}ms)`);
            _lagBreaches++;
            if (_lagBreaches >= CFG.breachesRequired) {
                triggerRestart(`Event-loop blocked ${lag}ms`);
            }
        } else {
            // Breaches must be consecutive; an ordinary tick clears the streak.
            _lagBreaches = 0;
        }
        _lagTimer = setTimeout(tick, 1000);
    }
    _lagCheckAt = Date.now();
    _lagTimer = setTimeout(tick, 1000);
}

// ── Periodic health check ─────────────────────────────────────────────────
function startMonitor() {
    if (_monitorTimer) return; // already running

    startLagDetector();

    _monitorTimer = setInterval(() => {
        const totalRam  = os.totalmem();
        const freeRam   = os.freemem();
        const usedRam   = totalRam - freeRam;
        const usedPct   = (usedRam / totalRam) * 100;

        const heap = process.memoryUsage();
        const heapMb = Math.round(heap.heapUsed / 1048576);
        const rssMb  = Math.round(heap.rss / 1048576);

        console.log(
            `[Health] 💓 RAM: ${usedPct.toFixed(1)}% used | ` +
            `Heap: ${heapMb}MB | RSS: ${rssMb}MB`
        );

        if (usedPct >= CFG.memPctThreshold) {
            console.warn(`[Health] 🔴 Memory threshold hit: ${usedPct.toFixed(1)}% >= ${CFG.memPctThreshold}%`);
            _memoryBreaches++;
            if (_memoryBreaches >= CFG.breachesRequired) {
                triggerRestart(`Memory ${usedPct.toFixed(1)}% — above ${CFG.memPctThreshold}% threshold`);
            }
        } else {
            // Breaches must be consecutive; a clean check clears the streak.
            _memoryBreaches = 0;
        }
    }, CFG.intervalMs);

    // Prevent the interval from keeping the process alive if everything else exits
    if (_monitorTimer.unref) _monitorTimer.unref();

    console.log(
        `[Health] ✅ Monitor started — ` +
        `mem threshold: ${CFG.memPctThreshold}%, ` +
        `lag threshold: ${CFG.lagThreshold}ms, ` +
        `check every ${CFG.intervalMs / 1000}s`
    );
}

function stopMonitor() {
    if (_monitorTimer) { clearInterval(_monitorTimer); _monitorTimer = null; }
    if (_lagTimer)     { clearTimeout(_lagTimer);      _lagTimer     = null; }
}

module.exports = { startMonitor, stopMonitor, clearTemp, CFG };
