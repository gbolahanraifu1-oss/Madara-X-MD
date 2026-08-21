'use strict';
const { CATEGORIES, getAccount } = require('../../lib/shopDB');

module.exports = {
    name: 'buy', aliases: ['purchase', 'order'],
    category: 'system', desc: 'ʙᴜʏ ᴀ ɢᴀᴍɪɴɢ ᴀᴄᴄᴏᴜɴᴛ',
    usage: '†buy <account_id>',

    async execute(sock, msg, args, ctx) {
        const s  = ctx.settings;
        const id = args[0]?.toLowerCase();
        if (!id) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}buy acc1${s.FOOTER}`);

        // Find which category this account belongs to
        let acc = null, foundCat = null;
        for (const cat of CATEGORIES) {
            acc = getAccount(cat, id);
            if (acc) { foundCat = cat; break; }
        }

        if (!acc) return ctx.reply(`❌ ᴀᴄᴄᴏᴜɴᴛ *${id}* ɴᴏᴛ ғᴏᴜɴᴅ. ᴜsᴇ ${s.prefix}shop ᴛᴏ ʙʀᴏᴡsᴇ.${s.FOOTER}`);

        const ownerJid = s.ownerNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        const buyerNum = ctx.sender.split('@')[0];

        // Confirm to buyer
        await ctx.reply(
`✅ *ᴘᴜʀᴄʜᴀsᴇ ʀᴇQ̲ᴜᴇsᴛ sᴇɴᴛ!*

🆔 ᴀᴄᴄᴏᴜɴᴛ: *${id}*
🎮 ᴄᴀᴛᴇɢᴏʀʏ: *${foundCat?.toUpperCase()}*

ᴛʜᴇ ᴠᴇɴᴅᴏʀ ʜᴀs ʙᴇᴇɴ ɴᴏᴛɪғɪᴇᴅ ᴀɴᴅ ᴡɪʟʟ ᴄᴏɴᴛᴀᴄᴛ ʏᴏᴜ sʜᴏʀᴛʟʏ ᴡɪᴛʜ ᴘᴀʏᴍᴇɴᴛ ᴅᴇᴛᴀɪʟs.${s.FOOTER}`);

        // Forward to owner with full account details
        try {
            await sock.sendMessage(ownerJid, {
                image: { url: acc.img },
                caption:
`🛒 *ɴᴇᴡ ᴘᴜʀᴄʜᴀsᴇ ʀᴇQ̲ᴜᴇsᴛ!*

👤 *ʙᴜʏᴇʀ:* +${buyerNum}
🎮 *ɢᴀᴍᴇ:* ${foundCat?.toUpperCase()}
🆔 *ᴀᴄᴄ ID:* ${id}

━━━━━━━━━━━━━━━━━━━━
${acc.info}
━━━━━━━━━━━━━━━━━━━━
📞 ᴄᴏɴᴛᴀᴄᴛ ʙᴜʏᴇʀ ᴀᴛ: wa.me/${buyerNum}`,
            });
        } catch (e) { console.error('[Buy] Owner notify error:', e.message); }
    }
};
