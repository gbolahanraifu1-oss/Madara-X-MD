'use strict';
const axios = require('axios');

module.exports = {
    name:     'getpp',
    aliases:  ['pfp', 'dp', 'getdp', 'ppic'],
    category: 'utility',
    desc:     "Fetch a user's WhatsApp profile picture",
    usage:    '†getpp [@user | number] (or reply to their message)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;

        // ── Resolve target: mention > reply > number arg > self ──────────
        const mentioned = ctx.getMentions?.() ?? [];
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const numArg = args.find(a => /^\+?\d{6,15}$/.test(a.replace(/[^\d+]/g, '')));

        let target = mentioned[0]
            || quotedParticipant
            || (numArg ? numArg.replace(/[^\d]/g, '') + '@s.whatsapp.net' : null)
            || ctx.sender;

        await ctx.react('🔍');

        try {
            // 'image' = full-res, falls back to preview if unavailable
            const url = await sock.profilePictureUrl(target, 'image').catch(() =>
                sock.profilePictureUrl(target, 'preview').catch(() => null)
            );

            if (!url) {
                // ctx.reply() only takes ONE argument — content itself.
                // Passing {mentions:[...]} as a second parameter (like the
                // original code did) is silently ignored, since reply()'s
                // signature is just `(content) => ...`. The @mention still
                // displayed as plain text, just never rendered as an
                // actual clickable/highlighted tag. Fixed by folding
                // mentions into the single content object instead.
                return ctx.reply({
                    text: `❌ *ɴᴏ ᴘʀᴏғɪʟᴇ ᴘɪᴄᴛᴜʀᴇ ғᴏᴜɴᴅ* ғᴏʀ @${target.split('@')[0]}.\n_ᴛʜᴇʏ ᴍᴀʏ ʜᴀᴠᴇ ɴᴏ ᴅᴘ ᴏʀ ᴘʀɪᴠᴀᴄʏ sᴇᴛᴛɪɴɢs ʜɪᴅᴇ ɪᴛ._${s.FOOTER}`,
                    mentions: [target],
                });
            }

            const img = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });

            await sock.sendMessage(ctx.from, {
                image: Buffer.from(img.data),
                caption: `🖼️ *ᴘʀᴏғɪʟᴇ ᴘɪᴄᴛᴜʀᴇ*\n👤 @${target.split('@')[0]}${s.FOOTER}`,
                mentions: [target],
            }, { quoted: msg });
        } catch (e) {
            ctx.reply(`❌ *ᴄᴏᴜʟᴅɴ'ᴛ ғᴇᴛᴄʜ ᴘʀᴏғɪʟᴇ ᴘɪᴄᴛᴜʀᴇ:* ${e.message}${s.FOOTER}`);
        }
    }
};
