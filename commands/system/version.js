const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'version',
    aliases: ['ver', 'changelog'],
    category: 'system',
    desc: 'Show current bot version',
    usage: '†version',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        ctx.reply(
            menuBox('🏷️', 'ᴠᴇʀsɪᴏɴ ɪɴғᴏ', [
                `*Bot:* ${s.botName}`,
                `*Version:* v${s.version}`,
                `*Powered by:* ${s.botBrand}`,
                `*Node.js:* ${process.version}`,
                `*Platform:* WhatsApp Multi-Device`,
            ]) + s.FOOTER
        );
    }
};
