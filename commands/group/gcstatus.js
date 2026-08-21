// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — All Status (Global, Per-Session)    ║
// ║   .allstatus <text/link>          → text/link status  ║
// ║   .allstatus (reply to img/video) → media status       ║
// ║   Posts a REAL native WhatsApp "Group Status"          ║
// ║   (groupStatusMessageV2 — same mechanism .gstatus      ║
// ║   uses for one group) to EVERY group this session is   ║
// ║   in — NOT a regular chat message dropped into each    ║
// ║   group's chat. Usable from DM or a group — no         ║
// ║   groupOnly gate, since it targets every other group   ║
// ║   regardless of where the command itself was typed.    ║
// ║   NOT the same as .gstatus (single group's native       ║
// ║   status) or .gb (broadcasts a normal chat message      ║
// ║   across every paired session on the whole bot).        ║
// ║   (short forms .gcstatus / .gcbroadcast still work)     ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const crypto = require('crypto');
const {
    downloadMediaMessage,
    generateWAMessageContent,
    generateWAMessageFromContent,
} = require('@itsliaaa/baileys');
const { menuBox } = require('../../lib/menuBox');

const PURPLE_COLOR = '#9C27B0'; // same default as .gstatus text statuses

// Posts a real native "Group Status" to one group — identical mechanism
// to the groupStatus() helper in commands/group/groupstatus.js.
async function postGroupStatus(sock, jid, content) {
    const { backgroundColor } = content;
    delete content.backgroundColor;

    const inside = await generateWAMessageContent(content, {
        upload: sock.waUploadToServer,
        backgroundColor: backgroundColor || PURPLE_COLOR,
    });

    const secret = crypto.randomBytes(32);
    const waMsg  = generateWAMessageFromContent(
        jid,
        {
            messageContextInfo: { messageSecret: secret },
            groupStatusMessageV2: {
                message: { ...inside, messageContextInfo: { messageSecret: secret } },
            },
        },
        {}
    );

    await sock.relayMessage(jid, waMsg.message, { messageId: waMsg.key.id });
}

module.exports = {
    name:      'allstatus',
    aliases:   ['gcstatus', 'gcstatusall', 'gcbroadcast', 'gcglobal'],
    category:  'group',
    desc:      "Post a native Group Status (text/link/image/video) to every group you're in on this session",
    usage:     '.allstatus <text or link>  (or reply to an image/video with a caption)',
    ownerOnly: true,
    // Deliberately no groupOnly — this targets every OTHER group the
    // session is in, so it makes just as much sense run from DM as from
    // inside any one group.

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
                    `\`${s.prefix}allstatus Your text or link\` — text/link status`,
                    `Reply to an image/video with \`${s.prefix}allstatus [caption]\` — media status`,
                    ``,
                    `_Posts a native Group Status (same as .gstatus) to every group_`,
                    `_this session is in — works from DM or any group._`,
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
                return ctx.reply(`❌ Could not download the media to post: ${e.message}${s.FOOTER}`);
            }
        }

        await ctx.react('📡');

        let sent = 0, failed = 0;
        const delay = ms => new Promise(r => setTimeout(r, ms));

        for (const gid of groupIds) {
            try {
                if (mediaBuffer && mediaType === 'image') {
                    await postGroupStatus(sock, gid, { image: mediaBuffer, caption: text || '' });
                } else if (mediaBuffer && mediaType === 'video') {
                    await postGroupStatus(sock, gid, { video: mediaBuffer, caption: text || '' });
                } else {
                    await postGroupStatus(sock, gid, { text, backgroundColor: PURPLE_COLOR });
                }
                sent++;
            } catch (e) {
                console.error(`[allstatus] failed for group ${gid}:`, e.message);
                failed++;
            }
            await delay(1000); // native group-status relay — a bit more conservative than a plain chat message
        }

        await ctx.react('✅');
        return ctx.reply(
            menuBox('📢', 'ᴀʟʟ sᴛᴀᴛᴜs ᴄᴏᴍᴘʟᴇᴛᴇ', [
                `*Groups targeted:* ${groupIds.length}`,
                `*Posted:* ${sent}`,
                ...(failed > 0 ? [`*Failed:* ${failed}`] : []),
                `*Content:* _${(text || '[media]').slice(0, 80)}${text?.length > 80 ? '…' : ''}_`,
            ]) + s.FOOTER
        );
    },
};
