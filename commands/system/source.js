const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'source',
    aliases: ['sourcecode', 'repo'],
    category: 'system',
    desc: 'Get bot source / developer info',
    usage: '†source',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        ctx.reply(
            menuBox('💣', 'sᴏᴜʀᴄᴇ', [
                `*Bot:* ${s.botName}`,
                `*Version:* v${s.version}`,
                `*Developer:* ${s.ownerName}`,
                `*Brand:* ${s.botBrand}`,
                `*Channel:* ${s.channelName}`,
                `*TikTok:* @madaraxmd_official`,
                ``,
                `_Built with ❤️ by MADARA X-MD INC._`,
            ]) + s.FOOTER
        );
    }
};
