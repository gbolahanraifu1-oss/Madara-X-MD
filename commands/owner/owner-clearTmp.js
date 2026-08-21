'use strict';
const fs   = require('fs');
const path = require('path');
const os   = require('os');
module.exports = {
    name: 'cleartmp', aliases: ['cleartemp', 'deltmp'],
    category: 'owner', desc: 'ᴄʟᴇᴀʀ ᴀʟʟ ᴛᴇᴍᴘ ғɪʟᴇs',
    usage: '†cleartmp', ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const dirs = [
            path.join(process.cwd(), 'temp'),
            path.join(process.cwd(), 'tmp'),
            path.join(process.cwd(), '.tmp'),
        ];
        let count = 0, bytes = 0;
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) continue;
            for (const f of fs.readdirSync(dir)) {
                try {
                    const fp = path.join(dir, f);
                    bytes += fs.statSync(fp).size;
                    fs.unlinkSync(fp); count++;
                } catch {}
            }
        }
        if (global.gc) global.gc();
        await ctx.reply(`🗑️ ᴄʟᴇᴀʀᴇᴅ *${count}* ᴛᴇᴍᴘ ғɪʟᴇs (${(bytes/1048576).toFixed(2)} ᴍʙ)${s.FOOTER}`);
    }
};
