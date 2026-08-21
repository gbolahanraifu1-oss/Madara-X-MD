const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'stats',
    aliases: ['botinfo', 'info'],
    category: 'system',
    desc: 'Shows bot usage stats, memory, and uptime',
    usage: '†stats',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const mem = process.memoryUsage();
        const up  = process.uptime();
        const h = Math.floor(up/3600), m = Math.floor((up%3600)/60), sec = Math.floor(up%60);
        await ctx.reply(
            menuBox('📊', 'ʙᴏᴛ sᴛᴀᴛs', [
                `*Bot:* ${s.botName}`,
                `*Version:* v${s.version}`,
                `*Uptime:* ${h}h ${m}m ${sec}s`,
                `*RAM Used:* ${(mem.rss/1024/1024).toFixed(1)} MB`,
                `*Heap:* ${(mem.heapUsed/1024/1024).toFixed(1)} / ${(mem.heapTotal/1024/1024).toFixed(1)} MB`,
                `*Node.js:* ${process.version}`,
                `*Platform:* ${process.platform}`,
            ]) + s.FOOTER
        );
    }
};
