// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — All Status (Global, Per-Session)    ║
// ║   Clean link/text/media Group Status — no branding  ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const crypto = require('crypto');
const {
    downloadMediaMessage,
    generateWAMessageContent,
    generateWAMessageFromContent,
} = require('@itsliaaa/baileys');

const PURPLE_COLOR = '#9C27B0';

// Detect pure / primarily-link text so we can strip any extra decoration
function extractCleanLink(text) {
    if (!text) return null;
    const t = String(text).trim();
    // Full URL as the whole message
    const full = t.match(/^(https?:\/\/[^\s]+)$/i);
    if (full) return full[1];
    // First URL in the text (if user pasted link + extra lines)
    const any = t.match(/(https?:\/\/[^\s]+)/i);
    return any ? any[1] : null;
}

async function postGroupStatus(sock, jid, content) {
    const { backgroundColor } = content;
    delete content.backgroundColor;

    const inside = await generateWAMessageContent(content, {
        upload: sock.waUploadToServer,
        backgroundColor: backgroundColor || PURPLE_COLOR,
    });

    const secret = crypto.randomBytes(32);
    const waMsg = generateWAMessageFromContent(
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
    name: 'allstatus',
    aliases: ['gcstatus', 'gcstatusall', 'gcbroadcast', 'gcglobal'],
    category: 'group',
    desc: "Post a native Group Status (text/link/image/video) to every group you're in on this session",
    usage: '.allstatus <text or link>  (or reply to an image/video with a caption)',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        let text = (ctx.text || args.join(' ').trim() || '').trim();

        const qCtx = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg = msg.message?.imageMessage || qCtx?.imageMessage;
        const vidMsg = msg.message?.videoMessage || qCtx?.videoMessage;
        const hasMedia = imgMsg || vidMsg;

        if (!text && !hasMedia) {
            return ctx.reply(
                `❌ *Usage*\n\n` +
                `\`${s.prefix}allstatus Your text or link\`\n` +
                `Reply to image/video with \`${s.prefix}allstatus [caption]\`\n\n` +
                `_Posts native Group Status to every group this session is in._`
            );
        }

        // If it's a link, keep ONLY the clean URL so WhatsApp shows pure rich preview
        // (no branding / menuBox / footer decoration under the preview)
        const cleanLink = !hasMedia ? extractCleanLink(text) : null;
        if (cleanLink) text = cleanLink;

        let groupIds = [];
        try {
            const chats = await sock.groupFetchAllParticipating();
            groupIds = Object.keys(chats);
        } catch (e) {
            return ctx.reply(`❌ Could not fetch your groups: ${e.message}`);
        }
        if (!groupIds.length) {
            return ctx.reply(`⚠️ You're not in any groups on this session.`);
        }

        let mediaBuffer = null, mediaType = null;
        if (hasMedia) {
            try {
                const tgt = (msg.message?.imageMessage || msg.message?.videoMessage)
                    ? msg : { message: qCtx };
                mediaBuffer = await downloadMediaMessage(tgt, 'buffer', {});
                mediaType = imgMsg ? 'image' : 'video';
            } catch (e) {
                console.error('[allstatus] Media download failed:', e.message);
                return ctx.reply(`❌ Could not download the media: ${e.message}`);
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
                    // Clean text / pure link only — no FOOTER, no menuBox
                    await postGroupStatus(sock, gid, { text, backgroundColor: PURPLE_COLOR });
                }
                sent++;
            } catch (e) {
                console.error(`[allstatus] failed for group ${gid}:`, e.message);
                failed++;
            }
            await delay(1000);
        }

        await ctx.react('✅');

        // Simple confirmation — no menuBox branding
        return ctx.reply(
            `✅ *All Status done*\n` +
            `Groups: ${groupIds.length} | Posted: ${sent}` +
            (failed ? ` | Failed: ${failed}` : '') +
            `\nContent: ${(text || '[media]').slice(0, 60)}`
        );
    },
};