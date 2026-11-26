'use strict';
/*
 * DISCO.JS — MADARA X-MD
 * .disco [speed]  — cycle chat background through rainbow colours automatically
 * .disco stop     — stop the disco loop for this chat
 *
 * Requires lib/themeHelper.js
 */

const { sendTheme, nameToArgb } = require('../../lib/themeHelper');

// Active disco loops keyed by JID
const _loops = new Map();

// Disco colour sequence (vivid, high contrast)
const DISCO_COLORS = [
    'FF0000', // red
    'FF8000', // orange
    'FFFF00', // yellow
    '00FF00', // green
    '00FFFF', // cyan
    '0000FF', // blue
    '8000FF', // violet
    'FF00FF', // magenta
    'FF69B4', // pink
    'FF4500', // orangered
    '00FF80', // mint
    'FF1493', // deep pink
];

const SPEEDS = {
    slow  : 8000,
    normal: 4000,
    fast  : 2000,
    insane: 1000,
};
const DEFAULT_SPEED = 'normal';
const MIN_INTERVAL  = 1000; // WA rate-limit safety floor

function colorToArgb(hex) {
    return (0xFF000000 | parseInt(hex, 16)) >>> 0;
}

function stopDisco(jid) {
    const loop = _loops.get(jid);
    if (!loop) return false;
    clearTimeout(loop.timer);
    _loops.delete(jid);
    return true;
}

async function runDisco(sock, jid, intervalMs, ctx) {
    let index = 0;

    const tick = async () => {
        // Stop if cancelled
        if (!_loops.has(jid)) return;

        const hex  = DISCO_COLORS[index % DISCO_COLORS.length];
        const argb = colorToArgb(hex);
        index++;

        try {
            await sendTheme(sock, jid, {
                solidColor: {
                    backgroundLightArgb: argb,
                    backgroundDarkArgb : argb,
                    isDoodleEnabled    : false,
                },
            }, '.disco', null); // suppress restart messages mid-loop
        } catch (e) {
            console.error('[disco] sendTheme error:', e?.message);
        }

        // Schedule next tick only if still active
        if (_loops.has(jid)) {
            const timer = setTimeout(tick, intervalMs);
            _loops.get(jid).timer = timer;
        }
    };

    // Kick off
    const timer = setTimeout(tick, 100);
    _loops.set(jid, { timer, intervalMs });
}

module.exports = {
    name    : 'disco',
    aliases : ['discomode', 'rainbow', 'partytime'],
    category: 'utility',
    desc    : 'Cycle chat background through rainbow colours automatically',
    usage   : '.disco [slow|normal|fast|insane] | .disco stop',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const jid = ctx.from;
        const sub = (args[0] || '').toLowerCase();

        // Stop
        if (sub === 'stop' || sub === 'off' || sub === 'end') {
            const stopped = stopDisco(jid);
            if (!stopped) return ctx.reply(`ℹ️ No disco loop is running in this chat.${s.FOOTER}`);

            // Clear theme back to default
            try {
                await sendTheme(sock, jid, { clearTheme: true }, '.disco stop', null);
            } catch {}

            await ctx.react('🛑');
            return ctx.reply(`🛑 Disco stopped — chat back to default.${s.FOOTER}`);
        }

        // If already running, stop first
        if (_loops.has(jid)) {
            stopDisco(jid);
        }

        // Parse speed
        const speedName = SPEEDS[sub] ? sub : DEFAULT_SPEED;
        const intervalMs = Math.max(SPEEDS[speedName] || SPEEDS[DEFAULT_SPEED], MIN_INTERVAL);

        // Check server patch state before starting
        const { needsRestart, restartSoon } = require('../../lib/themeHelper');
        if (needsRestart()) {
            restartSoon();
            return ctx.reply(`⚙️ Server patch installed — restarting bot in 2s.\nRun \`.disco\` again in ~20 seconds.${s.FOOTER}`);
        }

        await ctx.react('🪩');
        await ctx.reply(
            `🪩 *DISCO MODE ON* — speed: *${speedName}* (${intervalMs / 1000}s per colour)\n` +
            `Run \`.disco stop\` to end it.\n\n` +
            `_Bot must be group admin for this to work._${s.FOOTER}`
        );

        // Start loop (non-blocking)
        runDisco(sock, jid, intervalMs, ctx).catch(e => {
            console.error('[disco] runDisco error:', e?.message);
        });
    },
};
