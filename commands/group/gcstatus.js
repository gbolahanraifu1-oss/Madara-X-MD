'use strict';

const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { menuBox } = require('../../lib/menuBox');
const { postGroupStatus, fetchLinkPreview } = require('../../utils/gcstatusHelpers');

const PURPLE_COLOR = '#9C27B0';
const URL_REGEX = /(https?:\/\/[^\s]+)/i;

// Slow on purpose — WA bans/rate-limits fast group status spam
const BASE_DELAY_MS = 4500;      // wait between groups
const RATE_LIMIT_WAIT_MS = 15000; // when rate-overlimit hits
const MAX_RETRIES = 2;

function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
}

function isRateLimit(err) {
    var m = String((err && err.message) || err || '').toLowerCase();
    return m.indexOf('rate-overlimit') !== -1
        || m.indexOf('rate_overlimit') !== -1
        || m.indexOf('too many') !== -1
        || m.indexOf('429') !== -1;
}

async function postWithRetry(sock, gid, payload) {
    var lastErr = null;
    for (var attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            await postGroupStatus(sock, gid, payload);
            return true;
        } catch (e) {
            lastErr = e;
            if (isRateLimit(e) && attempt < MAX_RETRIES) {
                console.log('[allstatus] rate-limit on ' + gid + ' — wait ' + RATE_LIMIT_WAIT_MS + 'ms (retry ' + (attempt + 1) + ')');
                await sleep(RATE_LIMIT_WAIT_MS * (attempt + 1));
                continue;
            }
            throw e;
        }
    }
    throw lastErr;
}

module.exports = {
    name: 'allstatus',
    aliases: ['gcstatus', 'gcstatusall', 'gcbroadcast', 'gcglobal'],
    category: 'group',
    desc: "Post a native Group Status (text/link/image/video) to every group you're in on this session",
    usage: '.allstatus <text or link>  (or reply to an image/video with a caption)',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        var s = ctx.settings;
        var text = ctx.text || args.join(' ').trim();

        var qCtx = msg.message && msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo
            ? msg.message.extendedTextMessage.contextInfo.quotedMessage
            : null;
        var imgMsg = (msg.message && msg.message.imageMessage) || (qCtx && qCtx.imageMessage);
        var vidMsg = (msg.message && msg.message.videoMessage) || (qCtx && qCtx.videoMessage);
        var hasMedia = !!(imgMsg || vidMsg);

        if (!text && !hasMedia) {
            return ctx.reply(
                menuBox('❌', 'ᴀʟʟ sᴛᴀᴛᴜs ᴜsᴀɢᴇ', [
                    '`' + s.prefix + 'allstatus Your text or link` — text/link status',
                    'Reply to an image/video with `' + s.prefix + 'allstatus [caption]` — media status',
                    '',
                    '_Posts a native Group Status to every group (slow + safe)_'
                ]) + s.FOOTER
            );
        }

        var groupIds = [];
        try {
            var chats = await sock.groupFetchAllParticipating();
            groupIds = Object.keys(chats);
        } catch (e) {
            return ctx.reply('❌ Could not fetch your groups: ' + e.message + s.FOOTER);
        }
        if (!groupIds.length) {
            return ctx.reply('⚠️ You\'re not in any groups on this session.' + s.FOOTER);
        }

        var mediaBuffer = null;
        var mediaType = null;
        if (hasMedia) {
            try {
                var tgt = (msg.message && (msg.message.imageMessage || msg.message.videoMessage))
                    ? msg
                    : { message: qCtx };
                mediaBuffer = await downloadMediaMessage(tgt, 'buffer', {});
                mediaType = imgMsg ? 'image' : 'video';
            } catch (e) {
                return ctx.reply('❌ Could not download media: ' + e.message + s.FOOTER);
            }
        }

        // Build text/link content
        var textContent = null;
        if (!hasMedia && text) {
            var urlMatch = text.match(URL_REGEX);
            if (urlMatch) {
                var url = urlMatch[1];
                var preview = null;
                try { preview = await fetchLinkPreview(url); } catch (e) {}
                textContent = {
                    text: text,
                    backgroundColor: PURPLE_COLOR,
                    linkPreview: true,
                    canonicalUrl: url,
                    matchedText: url,
                    title: (preview && preview.title) || url,
                    description: (preview && preview.description) || '',
                    jpegThumbnail: (preview && preview.imageBuffer) || undefined,
                    previewTitle: preview && preview.title,
                    previewDescription: preview && preview.description,
                    previewImage: preview && preview.imageBuffer
                };
            } else {
                textContent = { text: text, backgroundColor: PURPLE_COLOR };
            }
        }

        await ctx.react('📡');
        await ctx.reply(
            menuBox('📡', 'ᴀʟʟ sᴛᴀᴛᴜs sᴛᴀʀᴛᴇᴅ', [
                'Groups: ' + groupIds.length,
                'Delay: \~' + (BASE_DELAY_MS / 1000) + 's per group',
                'ETA: \~' + Math.ceil((groupIds.length * BASE_DELAY_MS) / 60000) + ' min',
                'Mode: rate-limit safe'
            ]) + s.FOOTER
        );

        var sent = 0;
        var failed = 0;
        var rateHits = 0;

        for (var i = 0; i < groupIds.length; i++) {
            var gid = groupIds[i];
            try {
                var payload;
                if (mediaBuffer && mediaType === 'image') {
                    payload = { image: mediaBuffer, caption: text || '' };
                } else if (mediaBuffer && mediaType === 'video') {
                    payload = { video: mediaBuffer, caption: text || '' };
                } else {
                    payload = textContent || { text: text, backgroundColor: PURPLE_COLOR };
                }

                await postWithRetry(sock, gid, payload);
                sent++;
            } catch (e) {
                console.error('[allstatus] failed for ' + gid + ':', e.message);
                failed++;
                if (isRateLimit(e)) {
                    rateHits++;
                    // Extra cool-down when WA is angry
                    await sleep(RATE_LIMIT_WAIT_MS);
                }
            }

            // Always wait between groups (even after success)
            if (i < groupIds.length - 1) {
                await sleep(BASE_DELAY_MS);
            }
        }

        await ctx.react('✅');
        return ctx.reply(
            menuBox('📢', 'ᴀʟʟ sᴛᴀᴛᴜs ᴄᴏᴍᴘʟᴇᴛᴇ', [
                'Groups: ' + groupIds.length,
                'Posted: ' + sent,
                'Failed: ' + failed,
                'Rate hits: ' + rateHits,
                'Link preview: ' + (textContent && textContent.linkPreview ? 'yes' : 'no'),
                'Content: ' + String(text || '[media]').slice(0, 80)
            ]) + s.FOOTER
        );
    }
};