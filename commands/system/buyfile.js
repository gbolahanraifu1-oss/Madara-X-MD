'use strict';
const { findPaidFileById } = require('../../lib/fileStore');
const { createOrder } = require('../../lib/orderStore');

module.exports = {
    name: 'buyfile', aliases: ['orderfile', 'purchasefile'],
    category: 'system', desc: 'ᴏʀᴅᴇʀ ᴀ ᴘᴀɪᴅ ғɪʟᴇ ғʀᴏᴍ ᴛʜᴇ ғɪʟᴇ sʜᴏᴘ',
    usage: '†buyfile <ID>',

    async execute(sock, msg, args, ctx) {
        const s  = ctx.settings;
        const id = args[0]?.toUpperCase();
        if (!id) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}buyfile MACRO-ANDROID-1\n_ʙʀᴏᴡsᴇ ᴡɪᴛʜ_ ${s.prefix}files${s.FOOTER}`);

        const file = findPaidFileById(id);
        if (!file) return ctx.reply(`❌ ғɪʟᴇ *${id}* ɴᴏᴛ ғᴏᴜɴᴅ. ᴜsᴇ ${s.prefix}files ᴛᴏ ʙʀᴏᴡsᴇ.${s.FOOTER}`);

        const vendorNum  = (s.vendorNumber || s.ownerNumber).replace(/[^0-9]/g, '');
        const vendorJid  = vendorNum + '@s.whatsapp.net';
        const buyerNum   = ctx.sender.split('@')[0];
        const buyerName  = ctx.pushName || buyerNum;

        const order = createOrder({
            buyerNumber: buyerNum,
            buyerName,
            cat: file.cat,
            plat: file.plat,
            filename: file.filename,
            price: file.price,
        });

        // Confirm to buyer — file is NEVER sent here
        await ctx.reply(
`✅ *ʏᴏᴜʀ ᴏʀᴅᴇʀ ʜᴀs ʙᴇᴇɴ sᴜᴄᴄᴇssғᴜʟʟʏ sᴜʙᴍɪᴛᴛᴇᴅ!*

🆔 *Track ID:* \`${order.trackId}\`
📦 *ғɪʟᴇ:* ${file.filename}
🗂️ *ᴄᴀᴛᴇɢᴏʀʏ:* ${file.cat.toUpperCase()} (${file.plat.toUpperCase()})
💰 *ᴘʀɪᴄᴇ:* ${file.price}

ᴛʜᴇ ᴠᴇɴᴅᴏʀ ᴡɪʟʟ ᴄᴏɴᴛᴀᴄᴛ ʏᴏᴜ sʜᴏʀᴛʟʏ ғᴏʀ ᴘᴀʏᴍᴇɴᴛ ᴀɴᴅ ᴅᴇʟɪᴠᴇʀʏ.
⚠️ ᴘʟᴇᴀsᴇ ᴅᴏ ɴᴏᴛ ᴅᴇʟᴇᴛᴇ ᴛʜɪs ᴄʜᴀᴛ.${s.FOOTER}`);

        // Forward order details to the vendor/owner — never the file
        try {
            await sock.sendMessage(vendorJid, {
                text:
`🛒 *ɴᴇᴡ ғɪʟᴇ ᴏʀᴅᴇʀ!*

👤 *ʙᴜʏᴇʀ:* ${buyerName}
📞 *ɴᴜᴍʙᴇʀ:* +${buyerNum}
🗂️ *ᴄᴀᴛᴇɢᴏʀʏ:* ${file.cat.toUpperCase()}
📱 *ᴘʟᴀᴛғᴏʀᴍ:* ${file.plat.toUpperCase()}
📎 *ғɪʟᴇ:* ${file.filename}
💰 *ᴘʀɪᴄᴇ:* ${file.price}
🆔 *Track ID:* ${order.trackId}
🕒 *ᴅᴀᴛᴇ:* ${new Date(order.createdAt).toLocaleString()}

━━━━━━━━━━━━━━━━━━━━
📞 ᴄᴏɴᴛᴀᴄᴛ ʙᴜʏᴇʀ ᴀᴛ: wa.me/${buyerNum}`,
            });
        } catch (e) { console.error('[BuyFile] Vendor notify error:', e.message); }
    }
};
