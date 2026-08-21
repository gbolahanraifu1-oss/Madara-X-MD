const { reloadCommands } = require('../../lib/loader');
module.exports = {
    name: 'debug',
    aliases: ['reload', 'reloadcmds', 'update'],
    category: 'system',
    desc: 'Hot-reload all command plugins without restarting',
    usage: '†debug',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        await ctx.react('🔄');
        try {
            const count = reloadCommands();
            ctx.reply(`✅ *Hot-reload complete!*\n\n*Loaded:* ${count} command plugins\n_No restart needed._${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Reload failed: ${e.message}${s.FOOTER}`); }
    }
};
