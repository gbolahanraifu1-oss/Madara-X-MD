const https = require('https');
const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'speedtest',
    aliases: ['speed', 'netspeed', 'ping2'],
    category: 'system',
    desc: 'Test internet speed/latency of the bot server',
    usage: '†speedtest',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        await ctx.react('⚡');
        const start = Date.now();
        // Download a small test file to measure speed
        await new Promise((res, rej) => {
            let bytes = 0;
            const req = https.get('https://speed.cloudflare.com/__down?bytes=1000000', r => {
                r.on('data', c => bytes += c.length);
                r.on('end', () => res(bytes));
                r.on('error', rej);
            });
            req.on('error', rej);
            req.setTimeout(10000, () => { req.destroy(); res(0); });
        });
        const elapsed = (Date.now() - start) / 1000;
        const mbps    = ((1000000 * 8) / elapsed / 1024 / 1024).toFixed(2);
        const latency = Date.now() - start;
        ctx.reply(
            menuBox('⚡', 'sᴘᴇᴇᴅ ᴛᴇsᴛ', [
                `*Download:* ~${mbps} Mbps`,
                `*Latency:* ${latency}ms`,
                `*Test Size:* 1 MB`,
            ]) + s.FOOTER
        );
    }
};
