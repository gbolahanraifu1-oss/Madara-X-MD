'use strict';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  TELESTOP
// Cancels the caller's own in-progress `.telesticker` send. Checks the
// same global._telestickerJobs map telesticker.js writes to — the send
// loop polls this before each sticker and stops as soon as it's cleared.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
    name: 'telestop',
    aliases: ['stoptelesticker', 'tstop'],
    category: 'sticker',
    desc: 'sᴛᴏᴘ ᴀɴ ɪɴ-ᴘʀᴏɢʀᴇss .telesticker sᴇɴᴅ',
    usage: '†telestop',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!global._telestickerJobs) global._telestickerJobs = new Map();

        if (!global._telestickerJobs.get(ctx.sender)) {
            return ctx.reply(`❌ You don't have a pack sending right now.${s.FOOTER}`);
        }

        global._telestickerJobs.set(ctx.sender, false); // send loop checks this and stops
        return ctx.reply(`🛑 Stopping — it'll finish up after the sticker it's currently on.${s.FOOTER}`);
    }
};
