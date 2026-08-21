// owner.js
const s = require('../../settings');
const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'owner',
    category: 'system',
    desc: 'Display bot owner info and contact',
    usage: '†owner',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        await ctx.reply(
            menuBox('👑', 'ʙᴏᴛ ᴏᴡɴᴇʀ', [
                `*Name:* ${s.ownerName}`,
                `*Number:* +${s.ownerNumber}`,
                `*Brand:* ${s.botBrand}`,
                `*Channel:* ${s.channelName}`,
            ]) + s.FOOTER
        );
    }
};
