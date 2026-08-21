'use strict';
const { exec } = require('child_process');
module.exports = {
    name: 'exec', aliases: ['$', 'shell', 'bash'],
    category: 'owner', desc: 'ʀᴜɴ sʜᴇʟʟ ᴄᴏᴍᴍᴀɴᴅs',
    usage: '†exec <command>', ownerOnly: true, devOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!ctx.isDevOwner) return ctx.reply(`⛔ *ᴅᴇᴠ ᴏɴʟʏ.*${s.FOOTER}`);
        const cmd = args.join(' ');
        if (!cmd) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}exec ls -la${s.FOOTER}`);
        await ctx.react('⏳');
        exec(cmd, { timeout: 30000 }, async (err, stdout, stderr) => {
            const out = stdout || stderr || err?.message || 'ɴᴏ ᴏᴜᴛᴘᴜᴛ.';
            await ctx.reply(`\`\`\`${out.slice(0, 3000)}\`\`\`${s.FOOTER}`);
        });
    }
};
