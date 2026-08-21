const fs = require('fs'), path = require('path'), os = require('os');
module.exports = {
    name: 'clearcache',
    aliases: ['cleartmp', 'clearmem'],
    category: 'system',
    desc: 'Clears temporary files and cache',
    usage: '†clearcache',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        // Scan every directory the bot actually writes temp/media files to
        const dirs = [
            path.join(process.cwd(), 'temp'),
            path.join(process.cwd(), 'tmp'),
            path.join(process.cwd(), '.tmp'),
            os.tmpdir(),
        ];
        let count = 0;
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) continue;
            for (const f of fs.readdirSync(dir)) {
                // Only delete files we likely created — skip system files in /tmp
                if (dir === os.tmpdir() && !f.match(/^\d+[\._-]/)) continue;
                try { fs.unlinkSync(path.join(dir, f)); count++; } catch {}
            }
        }
        if (global.gc) global.gc();
        await ctx.reply(`✅ Cleared *${count}* temp file(s).${ctx.settings.FOOTER}`);
    }
};
