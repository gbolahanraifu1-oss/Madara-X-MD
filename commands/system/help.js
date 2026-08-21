const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'help', aliases: ['h','?','cmds'], category: 'system',
    desc: 'Show help for any command', usage: '†help [command]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings; const cmd = args[0]?.toLowerCase();
        if (!cmd) return ctx.reply(menuBox('❓', 'ʜᴇʟᴘ', [
            `Use \`${s.prefix}menu\` for all commands`,
            `Use \`${s.prefix}help [cmd]\` for details`,
        ]) + s.FOOTER);
        ctx.reply(`❓ *Help: ${cmd}*\nRun \`${s.prefix}${cmd}\` with no args to see usage info.${s.FOOTER}`);
    }
};
