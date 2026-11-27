'use strict';
/*
 * CLEANUP.JS — MADARA X-MD
 * Clears temp/cache files to free disk space.
 * Add as: commands/owner/cleanup.js
 * Usage: .cleanup
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function rimraf(dir) {
    let freed = 0;
    if (!fs.existsSync(dir)) return 0;
    for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        try {
            const stat = fs.statSync(full);
            freed += stat.size;
            if (stat.isDirectory()) { rimraf(full); fs.rmdirSync(full); }
            else fs.unlinkSync(full);
        } catch {}
    }
    return freed;
}

function diskFree() {
    try {
        const out = execSync("df -k / | tail -1 | awk '{print $4}'").toString().trim();
        return parseInt(out) * 1024;
    } catch { return -1; }
}

module.exports = {
    name    : 'cleanup',
    aliases : ['clearcache', 'cleartemp', 'freespace'],
    category: 'owner',
    ownerOnly: true,
    desc    : 'Clear temp/cache files to free disk space',
    usage   : '.cleanup',

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        await ctx.react('🧹');

        const before = diskFree();
        let totalFreed = 0;

        // Directories to clean (adjust to your actual paths)
        const dirs = [
            path.join(process.cwd(), 'temp'),
            path.join(process.cwd(), 'tmp'),
            path.join(process.cwd(), 'cache'),
            path.join(process.cwd(), 'downloads'),
            path.join(process.cwd(), '.cache'),
        ];

        for (const d of dirs) {
            totalFreed += rimraf(d);
        }

        // Clean /tmp yt-dlp extracted files
        try {
            const tmpFiles = fs.readdirSync('/tmp');
            for (const f of tmpFiles) {
                if (f.startsWith('yt-dlp') || f.startsWith('_MEI') || f.endsWith('.so')) {
                    const full = '/tmp/' + f;
                    try {
                        const stat = fs.statSync(full);
                        if (stat.isDirectory()) { totalFreed += rimraf(full); fs.rmdirSync(full); }
                        else { totalFreed += stat.size; fs.unlinkSync(full); }
                    } catch {}
                }
            }
            // Clean stale media in /tmp
            for (const f of fs.readdirSync('/tmp')) {
                if (/\.(mp3|mp4|webp|jpg|jpeg|png|opus|ogg|m4a|wav|aac)$/.test(f)) {
                    const full = '/tmp/' + f;
                    try { totalFreed += fs.statSync(full).size; fs.unlinkSync(full); } catch {}
                }
            }
        } catch {}

        const after = diskFree();
        const freed = after > 0 && before > 0 ? after - before : totalFreed;

        await ctx.react('✅');
        await ctx.reply(
            `🧹 *Cleanup Complete*\n\n` +
            `♻️ Files cleaned: *${fmtSize(totalFreed)}* freed\n` +
            (after > 0 ? `💾 Disk free now: *${fmtSize(after)}*\n` : '') +
            `\n_Run \`.cleanup\` regularly to prevent disk-full errors._${s.FOOTER}`
        );
    },
};
