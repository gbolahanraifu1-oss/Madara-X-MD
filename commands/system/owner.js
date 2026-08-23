// owner.js
const s = require('../../settings');
const { menuBox } = require('../../lib/menuBox');
const theme = require('../../lib/sessionTheme');
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
                `*Theme:* ${theme.string(ctx.sessionPhone, 'botName', s.botName)}`,
                `*Theme message:* ${theme.string(ctx.sessionPhone, 'owner', 'Owner access')}`, 
                `*Number:* +${s.ownerNumber}`,
                `*Brand:* ${s.botBrand}`,
                `*Channel:* ${s.channelName}`,
            ]) + s.FOOTER
        );
    }
};
