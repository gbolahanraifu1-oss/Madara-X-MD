const axios = require('axios');
module.exports = {
    name: 'dl',
    aliases: ['generaldl', 'download'],
    category: 'media',
    desc: 'Universal downloader — auto-detects platform',
    usage: '†dl [url]',
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const url = args[0];
        if (!url) return ctx.reply(`❌ Provide a URL to download.\n\nSupported: YouTube, TikTok, Instagram, Facebook, Twitter, Pinterest, SoundCloud${s.FOOTER}`);
        await ctx.react('⏳');

        // Route to correct downloader based on URL
        const cmdMap = [
            { pattern: /youtube\.com|youtu\.be/i,    cmd: 'ytdl' },
            { pattern: /tiktok\.com/i,               cmd: 'ttdl' },
            { pattern: /instagram\.com/i,             cmd: 'igdl' },
            { pattern: /facebook\.com|fb\.watch/i,   cmd: 'fbdl' },
            { pattern: /twitter\.com|x\.com/i,       cmd: 'twdl' },
            { pattern: /pinterest\.com/i,             cmd: 'pinterestdl' },
            { pattern: /soundcloud\.com/i,            cmd: 'soundcloud' },
            { pattern: /spotify\.com/i,               cmd: 'spotify' },
        ];

        const { getCommand } = require('../../lib/loader');
        for (const { pattern, cmd } of cmdMap) {
            if (pattern.test(url)) {
                const plugin = getCommand(cmd);
                if (plugin) return plugin.execute(sock, msg, args, ctx);
            }
        }

        ctx.reply(`❌ Unsupported URL. Supported: YouTube, TikTok, Instagram, Facebook, Twitter, Pinterest, SoundCloud, Spotify.${s.FOOTER}`);
    }
};
