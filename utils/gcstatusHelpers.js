/** Shared helpers for native WhatsApp group-status posting. */

'use strict';

const crypto = require('crypto');
const { normaliseBuffer } = require('../lib/groupPhoto');

let _baileys;
let _baileysSource = 'unknown';
const BAILEYS_CANDIDATES = ['@dark-yasiya/baileys'];
for (const pkg of BAILEYS_CANDIDATES) {
    try {
        _baileys = require(pkg);
        _baileysSource = pkg;
        break;
    } catch (_) {}
}
if (!_baileys) throw new Error('No baileys package found. Install @itsliaaa/baileys');
const {
    generateWAMessageContent,
    generateWAMessageFromContent,
    downloadContentFromMessage,
    prepareWAMessageMedia,
    generateMessageIDV2,
} = _baileys;
const { PassThrough } = require('stream');

const TEXT_BG_COLOR = '#9C27B0';
const TEXT_FG_COLOR = '#FFFFFF';
const TIMEOUT_MS    = 30_000;

function hexToArgb(hex, alpha = 0xFF) {
    const clean = String(hex || '').replace('#', '').trim();
    const value = clean.length === 3
        ? clean.split('').map(ch => ch + ch).join('')
        : clean.padStart(6, '0').slice(-6);
    return (((alpha & 0xFF) << 24) | parseInt(value, 16)) >>> 0;
}

const STATUS_BG_ARGB = hexToArgb(TEXT_BG_COLOR);
const STATUS_FG_ARGB = hexToArgb(TEXT_FG_COLOR);

// ── OFFICIAL CHANNEL (View Channel pill on every status post) ─────────────
const CHANNEL_JID  = '120363426805095237@newsletter';
const CHANNEL_NAME = 'Madara X-MD Madara tech';
function buildChannelCtx() {
    return {
        isForwarded: true,
        forwardingScore: 999,
        forwardedNewsletterMessageInfo: {
            newsletterJid:   CHANNEL_JID,
            newsletterName:  CHANNEL_NAME,
            serverMessageId: 143,
        },
    };
}
function attachChannelCtxToInner(inner) {
    const keys = ['extendedTextMessage','imageMessage','videoMessage','audioMessage','documentMessage','stickerMessage'];
    for (const k of keys) {
        if (inner && inner[k]) {
            inner[k] = {
                ...inner[k],
                contextInfo: { ...(inner[k].contextInfo || {}), ...buildChannelCtx() },
            };
        }
    }
    return inner;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

async function downloadMedia(mediaMsg, type) {
    return new Promise(async (resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error('Media download timed out')),
            TIMEOUT_MS
        );
        try {
            const stream = await downloadContentFromMessage(mediaMsg, type);
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            clearTimeout(timer);
            resolve(Buffer.concat(chunks));
        } catch (err) {
            clearTimeout(timer);
            reject(err);
        }
    });
}

/**
 * fetchLinkPreview — fetch OG/meta tags from a URL and return
 * { title, description, imageBuffer } for use as a sharp, full-res
 * preview image instead of WhatsApp's auto-fetched blurry thumbnail.
 *
 * Falls back gracefully: if anything fails the caller just omits the
 * previewImage and lets WhatsApp do its own (blurry) fetch.
 */
async function fetchLinkPreview(url) {
    const result = { title: null, description: null, imageBuffer: null, imageUrl: null };
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10_000);
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'WhatsApp/2.23.20.0 A',
                'Accept':     'text/html,application/xhtml+xml',
            },
            redirect: 'follow',
        });
        clearTimeout(timer);
        if (!res.ok) return result;

        const html = await res.text();

        // Extract og:title / title
        const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
                        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1] ||
                        html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
        if (ogTitle) result.title = ogTitle.trim().slice(0, 120);

        // Extract og:description / description
        const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)?.[1] ||
                       html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1];
        if (ogDesc) result.description = ogDesc.trim().slice(0, 300);

        // Extract og:image and download it at full resolution
        const imgUrl = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1];

        if (imgUrl) {
            const absImg = imgUrl.startsWith('http') ? imgUrl : new URL(imgUrl, url).href;
            // Keep the original remote URL. WhatsApp's thumbnail-link upload can
            // preserve better source metadata than a re-encoded low-res buffer.
            result.imageUrl = absImg;
            try {
                const imgCtrl = new AbortController();
                const imgTimer = setTimeout(() => imgCtrl.abort(), 12_000);
                const imgRes = await fetch(absImg, {
                    signal: imgCtrl.signal,
                    headers: { 'User-Agent': 'WhatsApp/2.23.20.0 A' },
                });
                clearTimeout(imgTimer);
                if (imgRes.ok) {
                    const buf = Buffer.from(await imgRes.arrayBuffer());
                    // Only use if it's a real image (check first bytes)
                    if (buf.length > 1000) {
                    try {
                        const { full } = await normaliseBuffer(buf);
                        result.imageBuffer = full || buf;
                    } catch {
                        result.imageBuffer = buf;
                    }
                }
                }
            } catch (_) {}
        }
    } catch (_) {}
    return result;
}

async function getGroupParticipantJids(sock, groupJid) {
    try {
        const meta = await sock.groupMetadata(groupJid);
        return (meta?.participants || []).map(p => p.id).filter(Boolean);
    } catch (e) {
        console.error('[gcstatus] groupMetadata failed:', e.message);
        return [];
    }
}

async function postGroupStatus(sock, groupJid, content) {
    try {
        const { backgroundColor, previewTitle, previewDescription, previewImage, ...rest } = content;
        // richPreview ONLY makes sense for text/link posts. WhatsApp rejects
        // it on media (image/video/audio/document/sticker) with:
        //   "richPreview requires a `text` field containing the URL"
        const isTextPost = typeof rest.text === 'string' && rest.text.length > 0;
        const hasMedia   = !!(rest.image || rest.video || rest.audio || rest.document || rest.sticker);
        const payload = {
            ...rest,
            groupStatus: true,
            contextInfo: { ...buildChannelCtx() },
        };
        if (isTextPost && !hasMedia) payload.richPreview = true;
        if (backgroundColor && payload.text) payload.backgroundColor = backgroundColor;
        if (isTextPost && !hasMedia) {
            if (previewTitle)       payload.previewTitle       = previewTitle;
            if (previewDescription) payload.previewDescription = previewDescription;
            if (previewImage)       payload.previewImage       = previewImage;
            // Keep the native color metadata on direct/fallback link posts too.
            payload.backgroundArgb = STATUS_BG_ARGB;
            payload.textArgb = STATUS_FG_ARGB;
            payload.font = 0;
        }
        return await sock.sendMessage(groupJid, payload);
    } catch (e) {
        console.error('[gcstatus] groupStatus:true path failed, falling back to relay:', e.message);
    }

    const { backgroundColor } = content;
    const payload = { ...content };
    delete payload.backgroundColor;

    const inner = await generateWAMessageContent(payload, {
        upload: sock.waUploadToServer,
        backgroundColor: backgroundColor || TEXT_BG_COLOR,
    });
    attachChannelCtxToInner(inner);

    const secret = crypto.randomBytes(32);
    const msg = generateWAMessageFromContent(
        groupJid,
        {
            messageContextInfo: { messageSecret: secret },
            groupStatusMessageV2: {
                message: {
                    ...inner,
                    messageContextInfo: { messageSecret: secret },
                },
            },
        },
        {}
    );

    const statusJidList = await getGroupParticipantJids(sock, groupJid);
    await sock.relayMessage(groupJid, msg.message, {
        messageId: msg.key.id,
        statusJidList,
        additionalAttributes: { messageId: msg.key.id },
    });
    return msg;
}

async function encodeOpus(buffer) {
    let ffmpeg;
    try { ffmpeg = require('fluent-ffmpeg'); } catch { return buffer; }
    return new Promise((resolve) => {
        const input  = new PassThrough();
        const output = new PassThrough();
        const chunks = [];
        input.end(buffer);
        ffmpeg(input)
            .noVideo()
            .audioCodec('libopus')
            .format('ogg')
            .audioChannels(1)
            .audioFrequency(48000)
            .on('error', () => resolve(buffer))
            .on('end',   () => resolve(Buffer.concat(chunks)))
            .pipe(output);
        output.on('data', (c) => chunks.push(c));
    });
}

function getQuotedCtx(msg) {
    const m = msg.message;
    return (
        m?.extendedTextMessage?.contextInfo ||
        m?.imageMessage?.contextInfo        ||
        m?.videoMessage?.contextInfo        ||
        m?.audioMessage?.contextInfo        ||
        m?.stickerMessage?.contextInfo      ||
        null
    );
}

function extractRelaySourceMessage(quotedMsg) {
    if (!quotedMsg || typeof quotedMsg !== 'object') return null;
    if (quotedMsg.ephemeralMessage?.message) return extractRelaySourceMessage(quotedMsg.ephemeralMessage.message);
    if (quotedMsg.viewOnceMessage?.message)  return extractRelaySourceMessage(quotedMsg.viewOnceMessage.message);
    if (quotedMsg.extendedTextMessage) return { extendedTextMessage: quotedMsg.extendedTextMessage };
    if (quotedMsg.groupInviteMessage)  return { groupInviteMessage: quotedMsg.groupInviteMessage };
    if (quotedMsg.conversation)        return { conversation: quotedMsg.conversation };
    return null;
}

function extractRelaySourceContextInfo(msg) {
    const ctx = msg?.message?.extendedTextMessage?.contextInfo || null;
    if (!ctx) return null;
    const qm = ctx.quotedMessage || {};
    return (
        qm?.extendedTextMessage?.contextInfo ||
        qm?.imageMessage?.contextInfo ||
        qm?.videoMessage?.contextInfo ||
        null
    );
}

async function postRelayGroupStatus(sock, groupJid, innerMessage, extraContextInfo, quotedMsg) {
    try {
        const ext = innerMessage?.extendedTextMessage;
        if (ext) {
            const merged = {
                ...ext,
                contextInfo: {
                    ...(ext.contextInfo || {}),
                    ...(extraContextInfo?.externalAdReply
                        ? { externalAdReply: extraContextInfo.externalAdReply }
                        : {}),
                    ...buildChannelCtx(),
                },
            };
            return await sock.sendMessage(groupJid, {
                extendedTextMessage: merged,
                raw:         true,
                groupStatus: true,
                richPreview: true,
            }, quotedMsg ? { quoted: quotedMsg } : undefined);
        }
    } catch (e) {
        console.error('[gcstatus] raw extendedTextMessage relay failed, using legacy path:', e.message);
    }

    const secret = crypto.randomBytes(32);
    const inner  = { ...innerMessage };
    if (extraContextInfo?.externalAdReply && inner.extendedTextMessage) {
        inner.extendedTextMessage = {
            ...inner.extendedTextMessage,
            contextInfo: {
                ...(inner.extendedTextMessage.contextInfo || {}),
                externalAdReply: extraContextInfo.externalAdReply,
            },
        };
    }
    attachChannelCtxToInner(inner);

    const msg = generateWAMessageFromContent(
        groupJid,
        {
            messageContextInfo: { messageSecret: secret },
            groupStatusMessageV2: {
                message: { ...inner, messageContextInfo: { messageSecret: secret } },
            },
        },
        {}
    );

    const statusJidList = await getGroupParticipantJids(sock, groupJid);
    await sock.relayMessage(groupJid, msg.message, {
        messageId: msg.key.id,
        statusJidList,
        additionalAttributes: { messageId: msg.key.id },
    });
    return msg;
}


function unwrapQuotedDeep(qm) {
    if (!qm || typeof qm !== 'object') return qm;
    if (qm.ephemeralMessage?.message)              return unwrapQuotedDeep(qm.ephemeralMessage.message);
    if (qm.viewOnceMessage?.message)               return unwrapQuotedDeep(qm.viewOnceMessage.message);
    if (qm.viewOnceMessageV2?.message)             return unwrapQuotedDeep(qm.viewOnceMessageV2.message);
    if (qm.viewOnceMessageV2Extension?.message)    return unwrapQuotedDeep(qm.viewOnceMessageV2Extension.message);
    if (qm.documentWithCaptionMessage?.message)    return unwrapQuotedDeep(qm.documentWithCaptionMessage.message);
    return qm;
}

// Build non-blue link preview with image thumbnail
async function createImageLinkPreview(sock, url, title, description, imageBuffer, imageUrl) {
    try {
        let thumbnail = null;
        // Prefer the original image URL, matching the sharper group-invite path.
        // Use the downloaded/normalised buffer only if direct URL preparation fails.
        const sources = [];
        if (imageUrl) sources.push({ image: { url: imageUrl } });
        if (imageBuffer) sources.push({ image: imageBuffer });
        for (const source of sources) {
            try {
                const prepared = await prepareWAMessageMedia(
                    source,
                    { upload: sock.waUploadToServer, mediaTypeOverride: 'thumbnail-link' }
                );
                const hq = prepared.imageMessage;
                thumbnail = {
                    thumbnailDirectPath: hq?.directPath,
                    mediaKey: hq?.mediaKey,
                    mediaKeyTimestamp: hq?.mediaKeyTimestamp,
                    thumbnailWidth: hq?.width,
                    thumbnailHeight: hq?.height,
                    thumbnailSha256: hq?.fileSha256,
                    thumbnailEncSha256: hq?.fileEncSha256,
                    jpegThumbnail: hq?.jpegThumbnail ? Buffer.from(hq.jpegThumbnail) : undefined,
                };
                if (thumbnail.thumbnailDirectPath || thumbnail.jpegThumbnail) break;
            } catch (err) {
                console.error('[thumbnail prepare]', err.message);
            }
        }

        return {
            extendedTextMessage: {
                text: url,
                matchedText: url,
                canonicalUrl: url,
                title: title || 'Link',
                description: description || url,
                previewType: 5, // IMAGE - not blue
                // Native status color fields prevent WhatsApp from treating the
                // link as a default blue/blurred text preview.
                backgroundArgb: STATUS_BG_ARGB,
                textArgb: STATUS_FG_ARGB,
                font: 0,
                ...(thumbnail || { jpegThumbnail: undefined }),
            }
        };
    } catch (err) {
        console.error('[image preview]', err.message);
        return null;
    }
}

// Post a URL to group status with a crisp, non-blurry image preview —
// the exact same prepareWAMessageMedia(mediaTypeOverride:'thumbnail-link')
// technique commands/group/invite.js uses for group invite links, applied
// to the groupStatusMessageV2 envelope. Falls back to the plainer
// richPreview/previewImage path (WhatsApp's own, softer thumbnail) only if
// thumbnail generation fails outright.
//
// Shared by gcstatus.js's own command AND globalstatus.js, so both render
// identically instead of globalstatus using a lower-quality fallback path.
async function postNativeGroupInviteStatus(sock, groupJid) {
    const meta = await sock.groupMetadata(groupJid);
    const inviteCode = await sock.groupInviteCode(groupJid);
    const inviteLink = `https://chat.whatsapp.com/${inviteCode}?mode=gi_t`;
    const groupName = meta?.subject || 'WhatsApp Group';

    let hq = null;
    try {
        const photoUrl = await sock.profilePictureUrl(groupJid, 'image');
        if (photoUrl) {
            const prepared = await prepareWAMessageMedia(
                { image: { url: photoUrl } },
                { upload: sock.waUploadToServer, mediaTypeOverride: 'thumbnail-link' }
            );
            hq = prepared?.imageMessage || null;
        }
    } catch (error) {
        console.error('[gcstatus invite preview]', error.message);
    }

    const inviteMessage = {
        extendedTextMessage: {
            text: inviteLink,
            matchedText: inviteLink,
            canonicalUrl: inviteLink,
            title: groupName,
            description: `${meta?.participants?.length || 0} members · WhatsApp Group Invite`,
            previewType: 5,
            jpegThumbnail: hq?.jpegThumbnail ? Buffer.from(hq.jpegThumbnail) : undefined,
            ...(hq ? {
                thumbnailDirectPath: hq.directPath,
                mediaKey: hq.mediaKey,
                mediaKeyTimestamp: hq.mediaKeyTimestamp,
                thumbnailWidth: hq.width,
                thumbnailHeight: hq.height,
                thumbnailSha256: hq.fileSha256,
                thumbnailEncSha256: hq.fileEncSha256,
            } : {}),
        },
    };

    attachChannelCtxToInner(inviteMessage);
    const secret = crypto.randomBytes(32);
    const msg = generateWAMessageFromContent(
        groupJid,
        {
            messageContextInfo: { messageSecret: secret },
            groupStatusMessageV2: {
                message: {
                    ...inviteMessage,
                    messageContextInfo: { messageSecret: secret },
                },
            },
        },
        {}
    );

    const statusJidList = await getGroupParticipantJids(sock, groupJid);
    await sock.relayMessage(groupJid, msg.message, {
        messageId: msg.key.id,
        statusJidList,
        additionalAttributes: { messageId: msg.key.id },
    });
    return msg;
}

async function postGroupStatusLinkPreview(sock, groupJid, url) {
    const preview = await fetchLinkPreview(url);

    // A native link preview is always rendered from a thumbnail by WhatsApp.
    // When an OG image is available, send that image as the actual group-status
    // media instead. This is the only reliable way to keep the photo sharp on
    // recipients' devices; the URL and page metadata remain in the caption.
    if (preview.imageBuffer) {
        const lines = [preview.title || 'Link', preview.description || '', url]
            .map(value => String(value || '').trim())
            .filter(Boolean);
        return postGroupStatus(sock, groupJid, {
            image: preview.imageBuffer,
            caption: lines.join('\\n\\n'),
        });
    }

    const imagePrev = await createImageLinkPreview(
        sock,
        url,
        preview.title || 'Link',
        preview.description || url,
        preview.imageBuffer,
        preview.imageUrl
    );

    if (!imagePrev) {
        // Thumbnail generation failed outright — fall back to WhatsApp's
        // own (softer) auto-preview rather than posting nothing.
        return postGroupStatus(sock, groupJid, {
            text:        url,
            richPreview: true,
            ...(preview.title       ? { previewTitle:       preview.title }       : {}),
            ...(preview.description ? { previewDescription: preview.description } : {}),
            ...(preview.imageBuffer ? { previewImage:       preview.imageBuffer } : {}),
        });
    }

    const inner = { ...imagePrev };
    if (inner.extendedTextMessage) {
        inner.extendedTextMessage.backgroundArgb = STATUS_BG_ARGB;
        inner.extendedTextMessage.textArgb = STATUS_FG_ARGB;
        inner.extendedTextMessage.font = 0;
    }
    attachChannelCtxToInner(inner);

    const secret = crypto.randomBytes(32);
    const msg_relay = generateWAMessageFromContent(
        groupJid,
        {
            messageContextInfo: { messageSecret: secret },
            groupStatusMessageV2: {
                message: { ...inner, messageContextInfo: { messageSecret: secret } },
            },
        },
        {}
    );

    const statusJidList = await getGroupParticipantJids(sock, groupJid);
    await sock.relayMessage(groupJid, msg_relay.message, {
        messageId: msg_relay.key.id,
        statusJidList,
        additionalAttributes: { messageId: msg_relay.key.id },
    });
    return msg_relay;
}

// ─── shared native group-status helpers ─────────────────────────────────────
module.exports.downloadMedia        = downloadMedia;
module.exports.fetchLinkPreview     = fetchLinkPreview;
module.exports.postGroupStatus          = postGroupStatus;
module.exports.postRelayGroupStatus     = postRelayGroupStatus;
module.exports.postGroupStatusLinkPreview = postGroupStatusLinkPreview;
module.exports.postNativeGroupInviteStatus = postNativeGroupInviteStatus;
module.exports.encodeOpus               = encodeOpus;
module.exports.getQuotedCtx             = getQuotedCtx;
module.exports.unwrapQuotedDeep         = unwrapQuotedDeep;
module.exports.createImageLinkPreview   = createImageLinkPreview;
module.exports.TEXT_BG_COLOR            = TEXT_BG_COLOR;
module.exports.baileysSource            = _baileysSource;

