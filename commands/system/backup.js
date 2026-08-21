const fs   = require('fs');
const path = require('path');
module.exports = {
    name: 'backup',
    aliases: ['savedata', 'exportdata'],
    category: 'system',
    desc: 'Backup bot database/config files',
    usage: '†backup',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        await ctx.react('💾');
        try {
            const dataDir = path.join(process.cwd(), 'data');
            const files   = fs.existsSync(dataDir) ? fs.readdirSync(dataDir).filter(f => f.endsWith('.json')) : [];
            const backup  = {};
            for (const f of files) {
                try { backup[f] = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8')); } catch {}
            }
            const json = JSON.stringify(backup, null, 2);
            const buf  = Buffer.from(json);
            await sock.sendMessage(ctx.from, {
                document: buf,
                mimetype: 'application/json',
                fileName: `madaraxmd_backup_${Date.now()}.json`,
                caption: `💾 *Backup Complete*\n${files.length} database files backed up.${s.FOOTER}`
            }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Backup failed: ${e.message}${s.FOOTER}`); }
    }
};
