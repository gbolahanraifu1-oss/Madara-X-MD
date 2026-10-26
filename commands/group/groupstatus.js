// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Group Status + Link Guard           ║
// ║   .gcstatus on  → auto-delete status posts that      ║
// ║                   contain a link/URL (anyone's post, ║
// ║                   bot or native WhatsApp — content    ║
// ║                   based, NOT a permission lock)       ║
// ║   .gcstatus off → leave all status posts alone        ║
// ║   Also posts replied media/text as a real WhatsApp    ║
// ║   "Group Status" (groupStatusMessageV2)               ║
// ║   Requires: ffmpeg installed + fluent-ffmpeg package  ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const crypto = require('crypto');
const {
    generateWAMessageContent,
    generateWAMessageFromContent,
    downloadContentFromMessage,
} = require('@itsliaaa/baileys');
const { PassThrough } = require('stream');
const ffmpeg = require('fluent-ffmpeg');
const db = require('../../lib/db');

// Single default color for text statuses (purple)
const PURPLE_COLOR = '#9C27B0';

// URL / link detector — catches http(s) links, www., bare domains, and
// WhatsApp group invite links (the most common spam dropped in statuses).
const LINK_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(chat\.whatsapp\.com\/[^\s]+)|(t\.me\/[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|io|me|gg|ly|to|xyz|info|co|biz|cc)(\/[^\s]*)?)/i;

// Pull the text/caption out of whatever inner message type a status used
function extractStatusText(innerMessage) {
    if (!innerMessage) return '';
    return (
        innerMessage.extendedTextMessage?.text   ||
        innerMessage.conversation                ||
        innerMessage.imageMessage?.caption       ||
        innerMessage.videoMessage?.caption       ||
        innerMessage.documentMessage?.caption    ||
        ''
    );
}

// ── Hook: called from handler.js on every group message ───────────────────
// When gcstatusGuard is ON, scans every group-status post (groupStatusMessageV2)
// for links/URLs and deletes ONLY the ones containing a link — regardless of
// who posted it (admin or not, via WhatsApp or another bot). Clean status
// posts with no link are always left alone. When OFF, nothing is touched.
async function checkGroupStatusLink(sock, from, sender, msg, ctx) {
    try {
        if (!db.getGroupSetting(from, 'gcstatusGuard', false)) return false;

        const statusWrapper = msg.message?.groupStatusMessageV2;
        if (!statusWrapper)        return false; // only inspect group-status posts
        if (msg.key?.fromMe)       return false; // never delete our own

        const innerMessage = statusWrapper.message;
        const text = extractStatusText(innerMessage);

        if (!text || !LINK_REGEX.test(text)) return false; // clean post — leave it alone

        await sock.sendMessage(from, { delete: msg.key }).catch(() => {});
        return true;
    } catch {
        return false;
    }
}

module.exports = {
    name:           'groupstatus',
    aliases:        ['togstatus', 'swgc', 'gs', 'gstatus'],
    desc:           'Post replied media or text as a WhatsApp group status (native Group Status feature)',
    category:       'group',
    usage:          '.groupstatus [caption]  (reply to image/video/audio) OR .groupstatus your text',
    groupOnly:      true,
    checkGroupStatusLink, // exported for handler.js

    async execute(sock, msg, args, ctx) {
        try {
            const from = ctx.from;

            if (!ctx.isGroup) {
                return ctx.reply('👥 This command can only be used in groups.');
            }

            const sub = (args[0] || '').toLowerCase();

            // ── ON / OFF / STATUS — group-status link guard toggle ──────
            // When ON, the bot deletes any group status post that contains
            // a link/URL — no matter who posted it (admin or not, via
            // WhatsApp or another bot). Status posts with no link are
            // never touched. When OFF, nothing is scanned or deleted.
            // This toggle is admin-gated deliberately, separate from the
            // rest of the command: it controls whether the bot starts
            // auto-deleting OTHER people's status posts, which is a
            // moderation setting and shouldn't be flippable by any random
            // member. Posting your own status below stays open to everyone.
            if (sub === 'on' || sub === 'off' || sub === 'status' || sub === 'info') {
                if (!ctx.isSenderAdmin) {
                    return ctx.reply(`❌ Only group admins can toggle the status link guard.${ctx.settings.FOOTER}`);
                }
            }

            if (sub === 'on') {
                db.setGroupSetting(from, 'gcstatusGuard', true);
                return ctx.reply(
                    `🛡️ *Group Status Link Guard: ON*\n\n` +
                    `Any group status containing a *link/URL* will be *deleted automatically* — regardless of who posted it.\n` +
                    `Status posts without a link are left alone.\n\n` +
                    `Turn off with \`${ctx.settings.prefix}gcstatus off\`` +
                    ctx.settings.FOOTER
                );
            }
            if (sub === 'off') {
                db.setGroupSetting(from, 'gcstatusGuard', false);
                return ctx.reply(`🔓 *Group Status Link Guard: OFF*\n\nAll group status posts are left alone — no scanning, no deletion.${ctx.settings.FOOTER}`);
            }
            if (sub === 'status' || sub === 'info') {
                const enabled = db.getGroupSetting(from, 'gcstatusGuard', false);
                return ctx.reply(
                    `📋 *Group Status Link Guard*\n\n` +
                    `Status: ${enabled ? '🛡️ ON — links auto-deleted' : '🔓 OFF — nothing scanned'}\n\n` +
                    `*Commands:*\n` +
                    `• \`${ctx.settings.prefix}gcstatus on\` — auto-delete status posts containing links\n` +
                    `• \`${ctx.settings.prefix}gcstatus off\` — leave all status posts alone\n` +
                    `• \`${ctx.settings.prefix}gcstatus [caption]\` — post a status (reply to media for image/video/audio)` +
                    ctx.settings.FOOTER
                );
            }

            const caption = (args.join(' ') || '').trim();
            const ctxInfo   = msg.message?.extendedTextMessage?.contextInfo;
            const hasQuoted = !!ctxInfo?.quotedMessage;

            // ── CASE 1: No quoted message → TEXT group status ──────────
            if (!hasQuoted) {
                if (!caption) {
                    return ctx.reply(
                        '📝 *Group Status Usage*\n\n' +
                        '• Reply to image/video/audio with:\n' +
                        '  `.groupstatus [optional caption]`\n' +
                        '• Or send text status only:\n' +
                        '  `.groupstatus Your text here`\n\n' +
                        'Text statuses use a single purple background colour by default.' +
                        ctx.settings.FOOTER
                    );
                }

                await ctx.reply('⏳ Posting text group status...');

                try {
                    await groupStatus(sock, from, {
                        text: caption,
                        backgroundColor: PURPLE_COLOR,
                    });
                    return ctx.reply(`✅ Text group status posted!${ctx.settings.FOOTER}`);
                } catch (e) {
                    console.error('groupstatus text error:', e);
                    return ctx.reply(`❌ Failed to post text group status: ${e.message || e}${ctx.settings.FOOTER}`);
                }
            }

            // ── CASE 2: Quoted media → image/video/audio group status ──
            const targetMessage = {
                key: {
                    remoteJid:   from,
                    id:          ctxInfo.stanzaId,
                    participant: ctxInfo.participant,
                },
                message: ctxInfo.quotedMessage,
            };

            const mtype = Object.keys(targetMessage.message)[0] || '';

            const downloadBuf = async () => {
                const qmsg = targetMessage.message;
                if (/image/i.test(mtype))   return await downloadMedia(qmsg, 'image');
                if (/video/i.test(mtype))   return await downloadMedia(qmsg, 'video');
                if (/audio/i.test(mtype))   return await downloadMedia(qmsg, 'audio');
                if (/sticker/i.test(mtype)) return await downloadMedia(qmsg, 'sticker');
                return null;
            };

            // ── IMAGE (also handles stickers) ────────────────────────
            if (/image|sticker/i.test(mtype)) {
                await ctx.reply('⏳ Posting image group status...');
                let buf;
                try {
                    buf = await downloadBuf();
                } catch {
                    return ctx.reply(`❌ Failed to download image${ctx.settings.FOOTER}`);
                }
                if (!buf) return ctx.reply(`❌ Could not download image${ctx.settings.FOOTER}`);

                try {
                    await groupStatus(sock, from, { image: buf, caption: caption || '' });
                    return ctx.reply(`✅ Image group status posted!${ctx.settings.FOOTER}`);
                } catch (e) {
                    console.error('groupstatus image error:', e);
                    return ctx.reply(`❌ Failed to post image group status: ${e.message || e}${ctx.settings.FOOTER}`);
                }
            }

            // ── VIDEO ──────────────────────────────────────────────────
            if (/video/i.test(mtype)) {
                await ctx.reply('⏳ Posting video group status...');
                let buf;
                try {
                    buf = await downloadBuf();
                } catch {
                    return ctx.reply(`❌ Failed to download video${ctx.settings.FOOTER}`);
                }
                if (!buf) return ctx.reply(`❌ Could not download video${ctx.settings.FOOTER}`);

                try {
                    await groupStatus(sock, from, { video: buf, caption: caption || '' });
                    return ctx.reply(`✅ Video group status posted!${ctx.settings.FOOTER}`);
                } catch (e) {
                    console.error('groupstatus video error:', e);
                    return ctx.reply(`❌ Failed to post video group status: ${e.message || e}${ctx.settings.FOOTER}`);
                }
            }

            // ── AUDIO (voice-style group status) ─────────────────────
            if (/audio/i.test(mtype)) {
                await ctx.reply('⏳ Posting audio group status...');
                let buf;
                try {
                    buf = await downloadBuf();
                } catch {
                    return ctx.reply(`❌ Failed to download audio${ctx.settings.FOOTER}`);
                }
                if (!buf) return ctx.reply(`❌ Could not download audio${ctx.settings.FOOTER}`);

                let vn;
                try { vn = await toVN(buf); } catch { vn = buf; }

                let waveform;
                try { waveform = await generateWaveform(buf); } catch { waveform = undefined; }

                try {
                    await groupStatus(sock, from, {
                        audio: vn,
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true,
                        waveform,
                    });
                    return ctx.reply(`✅ Audio group status posted!${ctx.settings.FOOTER}`);
                } catch (e) {
                    console.error('groupstatus audio error:', e);
                    return ctx.reply(`❌ Failed to post audio group status: ${e.message || e}${ctx.settings.FOOTER}`);
                }
            }

            return ctx.reply(`❌ Unsupported media type. Reply to an image, video, or audio.${ctx.settings.FOOTER}`);
        } catch (e) {
            console.error('groupstatus command error (outer):', e);
            return ctx.reply(`❌ Error: ${e.message || e}${ctx.settings.FOOTER}`);
        }
    },
};

// ── Helpers ─────────────────────────────────────────────────────────────

async function downloadMedia(msg, type) {
    const mediaMsg = msg[`${type}Message`] || msg;
    const stream   = await downloadContentFromMessage(mediaMsg, type);
    const chunks   = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

async function groupStatus(sock, jid, content) {
    const { backgroundColor } = content;
    delete content.backgroundColor;

    const inside = await generateWAMessageContent(content, {
        upload: sock.waUploadToServer,
        backgroundColor: backgroundColor || PURPLE_COLOR,
    });

    const secret = crypto.randomBytes(32);

    const msg = generateWAMessageFromContent(
        jid,
        {
            messageContextInfo: { messageSecret: secret },
            groupStatusMessageV2: {
                message: {
                    ...inside,
                    messageContextInfo: { messageSecret: secret },
                },
            },
        },
        {}
    );

    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
    return msg;
}

function toVN(buffer) {
    return new Promise((resolve, reject) => {
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
            .on('error', reject)
            .on('end', () => resolve(Buffer.concat(chunks)))
            .pipe(output);

        output.on('data', (c) => chunks.push(c));
    });
}

function generateWaveform(buffer, bars = 64) {
    return new Promise((resolve, reject) => {
        const input = new PassThrough();
        input.end(buffer);

        const chunks = [];

        ffmpeg(input)
            .audioChannels(1)
            .audioFrequency(16000)
            .format('s16le')
            .on('error', reject)
            .on('end', () => {
                const raw     = Buffer.concat(chunks);
                const samples = raw.length / 2;
                const amps    = [];

                for (let i = 0; i < samples; i++) {
                    amps.push(Math.abs(raw.readInt16LE(i * 2)) / 32768);
                }

                const size = Math.floor(amps.length / bars);
                if (size === 0) return resolve(undefined);

                const avg = Array.from({ length: bars }, (_, i) =>
                    amps.slice(i * size, (i + 1) * size).reduce((a, b) => a + b, 0) / size
                );

                const max = Math.max(...avg);
                if (max === 0) return resolve(undefined);

                resolve(
                    Buffer.from(avg.map((v) => Math.floor((v / max) * 100))).toString('base64')
                );
            })
            .pipe()
            .on('data', (c) => chunks.push(c));
    });
}
