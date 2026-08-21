// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — All Status (Global, Per-Session)    ║
// ║   .allstatus <text/link>          → text/link blast   ║
// ║   .allstatus (reply to img/video) → media blast        ║
// ║   Sends to EVERY group this session (this paired      ║
// ║   number) is currently in. NOT the same as .gstatus,  ║
// ║   which posts a single native WhatsApp Group Status    ║
// ║   to one group. NOT the same as .gb, which broadcasts  ║
// ║   across every paired session on the whole bot.        ║
// ║   (short forms .gcstatus / .gcbroadcast still work)    ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { menuBox } = require('../../lib/menuBox');

module.exports = {
    name:      'allstatus',
    aliases:   ['gcstatus', 'gcstatusall', 'gcbroadcast', 'gcglobal'],
    category:  'group',
    desc:      "Broadcast text, a link, or media to every group you're in on this session",
    usage:     '.allstatus <text or link>  (or reply to an image/video with a caption)',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const text = ctx.text || args.join(' ').trim();

        const qCtx     = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg   = msg.message?.imageMessage || qCtx?.imageMessage;
        const vidMsg   = msg.message?.videoMessage || qCtx?.videoMessage;
        const hasMedia = imgMsg || vidMsg;

        if (!text && !hasMedia) {
            return ctx.reply(
                menuBox('❌', 'ᴀʟʟ sᴛᴀᴛᴜs ᴜsᴀɢᴇ', [
                    `\`${s.prefix}allstatus Your text or link\` — text/link blast`,
                    `Reply to an image/video with \`${s.prefix}allstatus [caption]\` — media blast`,
                    ``,
                    `_Sends to every group this session is in._`,
                    `_Short form \`${s.prefix}gcstatus\` works the same way._`,
                ]) + s.FOOTER
            );
        }

        let groupIds = [];
        try {
            const chats = await sock.groupFetchAllParticipating();
            groupIds = Object.keys(chats);
        } catch (e) {
            return ctx.reply(`❌ Could not fetch your groups: ${e.message}${s.FOOTER}`);
        }
        if (!groupIds.length)
            return ctx.reply(`⚠️ You're not in any groups on this session.${s.FOOTER}`);

        // ── Pre-download media once (shared across all groups) ─────────────
        let mediaBuffer = null, mediaType = null;
        if (hasMedia) {
            try {
                const tgt = (msg.message?.imageMessage || msg.message?.videoMessage)
                    ? msg : { message: qCtx };
                mediaBuffer = await downloadMediaMessage(tgt, 'buffer', {});
                mediaType   = imgMsg ? 'image' : 'video';
            } catch (e) {
                console.error('[allstatus] Media download failed:', e.message);
            }
        }

        const caption =
            `📢 *All Status — ${s.botName}*\n` +
            `━━━━━━━━━━━━━━━━━━━\n\n` +
            `${text || ''}\n\n` +
            `━━━━━━━━━━━━━━━━━━━` +
            s.FOOTER;

        await ctx.react('📡');

        let sent = 0, failed = 0;
        const delay = ms => new Promise(r => setTimeout(r, ms));

        for (const gid of groupIds) {
            try {
                if (mediaBuffer && mediaType === 'image') {
                    await sock.sendMessage(gid, { image: mediaBuffer, caption });
                } else if (mediaBuffer && mediaType === 'video') {
                    await sock.sendMessage(gid, { video: mediaBuffer, caption });
                } else {
                    await sock.sendMessage(gid, { text: caption });
                }
                sent++;
            } catch {
                failed++;
            }
            await delay(700); // avoid rate-limit / ban risk
        }

        await ctx.react('✅');
        return ctx.reply(
            menuBox('📢', 'ᴀʟʟ sᴛᴀᴛᴜs ᴄᴏᴍᴘʟᴇᴛᴇ', [
                `*Groups targeted:* ${groupIds.length}`,
                `*Delivered:* ${sent}`,
                ...(failed > 0 ? [`*Failed:* ${failed}`] : []),
                `*Message:* _${(text || '[media]').slice(0, 80)}${text?.length > 80 ? '…' : ''}_`,
            ]) + s.FOOTER
        );
    },
};
