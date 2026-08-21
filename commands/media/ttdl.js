'use strict';
// Was its own separate single-API implementation (siputzx only, no
// fallback) — one 503 from that one source killed it outright every
// time, no recovery. dl-tiktok.js's 'tiktok' command already has a
// 5-source fallback chain for this exact problem, so .ttdl now just
// delegates there instead of maintaining a second, weaker download path.
module.exports = {
    name: 'ttdl', aliases: ['tiktokvideo'], category: 'media',
    desc: 'Download TikTok video (with/without watermark)', usage: '†ttdl [tiktok-url]',
    async execute(sock, msg, args, ctx) {
        return require('./dl-tiktok').execute(sock, msg, args, ctx);
    }
};
