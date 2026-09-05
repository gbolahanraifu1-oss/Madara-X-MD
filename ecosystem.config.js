// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — pm2 Ecosystem Config                ║
// ║   Usage: pm2 start ecosystem.config.js              ║
// ╚══════════════════════════════════════════════════════╝

module.exports = {
    apps: [
        {
            name:             'madara-xmd',
            script:           'index.js',
            interpreter:      'node',

            // ── Auto-restart ───────────────────────────────
            watch:            false,        // don't watch files (pairManager writes sessions/)
            autorestart:      true,         // restart on crash or process.exit()
            restart_delay:    3000,         // wait 3s before restarting
            max_restarts:     20,           // give up after 20 rapid restarts
            min_uptime:       '10s',        // must stay up 10s to count as a clean start

            // ── Memory guard ──────────────────────────────
            // pm2 will restart the bot if RSS exceeds this.
            // Works alongside the internal healthMonitor.js check.
            max_memory_restart: '1G',

            // ── Logging ───────────────────────────────────
            log_date_format:  'YYYY-MM-DD HH:mm:ss',
            error_file:       './logs/pm2-error.log',
            out_file:         './logs/pm2-out.log',
            merge_logs:       true,

            // ── Environment ───────────────────────────────
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
};
