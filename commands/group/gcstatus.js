'use strict';

const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { menuBox } = require('../../lib/menuBox');
const { postGroupStatus, fetchLinkPreview } = require('../../utils/gcstatusHelpers');

const PURPLE_COLOR = '#9C27B0';
const URL_REGEX = /(https?:\/\/[^\s]+)/i;

module.exports = {
    name:      'allstatus',
    aliases:   ['gcstatus', 'gcstatusall', 'gcbroadcast', 'gcglobal'],
    category:  'group',
    desc:      "Post a native Group Status (text/link/image/video) to every group you're in on this session",
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
                    `\`${s.prefix}allstatus Your text or link\` — text/link status`,
                    `Reply to an image/video with \`${s.prefix}allstatus [caption]\` — media status`,
                    ``,
                    `_Posts a native Group Status to every group_`,
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

        let mediaBuffer = null, mediaType = null;
        if (hasMedia) {
            try {
                const tgt = (msg.message?.imageMessage || msg.message?.videoMessage) ? msg : { message: qCtx };
                mediaBuffer = await downloadMediaMessage(tgt, 'buffer', {});
                mediaType   = imgMsg ? 'image' : 'video';
            } catch (e) {
                return ctx.reply(`❌ Could not download media: ${e.message}${s.FOOTER}`);
            }
        }

        // ── BUILD CONTENT WITH LINK PREVIEW ──
        let textContent = null;
        if (!hasMedia && text) {
            const urlMatch = text.match(URL_REGEX);
            if (urlMatch) {
                const url = urlMatch[1];
                let preview = null;
                try { preview = await fetchLinkPreview(url); } catch {}
                
                textContent = {
                    text: text,
                    backgroundColor: PURPLE_COLOR,
                    // Force link preview for groupStatusMessageV2
                    linkPreview: true,
                    previewOptions: {
                        canonicalUrl: url,
                        matchedText: url,
                        title: preview?.title || url,
                        description: preview?.description || '',
                        jpegThumbnail: preview?.imageBuffer || undefined,
                    },
                    // fallback for helpers that use old keys
                    richPreview: true,
                    previewTitle: preview?.title,
                    previewDescription: preview?.description,
                    previewImage: preview?.imageBuffer,
                    canonicalUrl: url,
                    matchedText: url,
                };
            } else {
                textContent = { text, backgroundColor: PURPLE_COLOR };
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
                    // Patch: if helper ignores preview, inject directly
                    if (textContent?.linkPreview) {
                        await postGroupStatus(sock, gid, {
                            text: textContent.text,
                            backgroundColor: textContent.backgroundColor,
                            // These 2 fields make WA render rich card in group status
                            canonicalUrl: textContent.previewOptions.canonicalUrl,
                            matchedText: textContent.previewOptions.matchedText,
                            title: textContent.previewOptions.title,
                            description: textContent.previewOptions.description,
                            jpegThumbnail: textContent.previewOptions.jpegThumbnail,
                            linkPreview: true
                        });
                    } else {
                        await postGroupStatus(sock, gid, { ...textContent });
                    }
                }
                sent++;
            } catch (e) {
                console.error(`[allstatus] failed for ${gid}:`, e.message);
                failed++;
            }
            await delay(1200);
        }

        await ctx.react('✅');
        return ctx.reply(
            menuBox('📢', 'ᴀʟʟ sᴛᴀᴛᴜs ᴄᴏᴍᴘʟᴇᴛᴇ', [
                `*Groups:* ${groupIds.length}`,
                `*Posted:* ${sent}`,
                ...(failed ? [`*Failed:* ${failed}`] : []),
                `*Link preview:* ${textContent?.linkPreview ? '✅ Enabled' : 'No URL'}`,
                `*Content:* _${(text || '[media]').slice(0, 80)}_`,
            ]) + s.FOOTER
        );
    },
};