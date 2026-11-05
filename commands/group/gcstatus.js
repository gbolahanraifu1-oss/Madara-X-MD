// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — All Status (Global, Per-Session)    ║
// ║   .allstatus <text/link>          → text/link status  ║
// ║   .allstatus (reply to img/video) → media status       ║
// ║   Posts a REAL native WhatsApp "Group Status"          ║
// ║   (groupStatusMessageV2 — same mechanism .gstatus      ║
// ║   uses for one group) to EVERY group this session is   ║
// ║   in. Usable from DM or a group — no groupOnly gate.   ║
// ║   (short forms .gcstatus / .gcbroadcast still work)     ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const { downloadMediaMessage } = require('@itsliaaa/baileys');
// Shared helper: handles rich link previews (OG tags) properly.
const { postGroupStatus, fetchLinkPreview } = require('../../utils/gcstatusHelpers');

const PURPLE_COLOR = '#9C27B0'; // same default as .gstatus text statuses
const URL_REGEX = /https?:\/\//i;

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
                `❌ *All Status — Usage*\n\n` +
                `\`${s.prefix}allstatus Your text or link\` — text/link status\n` +
                `Reply to an image/video with \`${s.prefix}allstatus [caption]\` — media status\n\n` +
                `_Posts a native Group Status (same as .gstatus) to every group this session is in — works from DM or any group._\n` +
                `_Short form \`${s.prefix}gcstatus\` works the same way._`
            );
        }

        // groupFetchAllParticipating is rate-limited by WhatsApp.
        // Retry with backoff instead of dying on the first rate-overlimit.
        let groupIds = [];
        {
            const maxAttempts = 4;
            let lastErr = null;
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    const chats = await sock.groupFetchAllParticipating();
                    groupIds = Object.keys(chats || {});
                    lastErr = null;
                    break;
                } catch (e) {
                    lastErr = e;
                    const errMsg = String(e?.message || e || '');
                    const isRate = /rate-overlimit|rate.?limit|too many|429/i.test(errMsg);
                    console.error(`[allstatus] groupFetchAllParticipating attempt ${attempt}/${maxAttempts}:`, errMsg);
                    if (!isRate || attempt === maxAttempts) break;
                    // Exponential backoff: 2s, 4s, 8s
                    await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
                }
            }
            if (lastErr) {
                const errMsg = String(lastErr?.message || lastErr || 'unknown error');
                const hint = /rate-overlimit|rate.?limit/i.test(errMsg)
                    ? '\n\n_WhatsApp rate-limited the group list fetch. Wait ~30–60s and try again._'
                    : '';
                return ctx.reply(`❌ Could not fetch your groups: ${errMsg}${hint}`);
            }
        }
        if (!groupIds.length)
            return ctx.reply(`⚠️ You're not in any groups on this session.`);

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
                return ctx.reply(`❌ Could not download the media to post: ${e.message}`);
            }
        }

        // ── Build the text/link content ONCE, shared across every group ────
        let textContent = null;
        if (!hasMedia && text) {
            if (URL_REGEX.test(text)) {
                const linkPreview = await fetchLinkPreview(text);
                textContent = {
                    text,
                    richPreview: true,
                    ...(linkPreview.title       ? { previewTitle:       linkPreview.title }       : {}),
                    ...(linkPreview.description ? { previewDescription: linkPreview.description } : {}),
                    ...(linkPreview.imageBuffer ? { previewImage:       linkPreview.imageBuffer } : {}),
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
                    await postGroupStatus(sock, gid, { ...textContent });
                }
                sent++;
            } catch (e) {
                console.error(`[allstatus] failed for group ${gid}:`, e.message);
                failed++;
                if (/rate-overlimit|rate.?limit|429/i.test(String(e.message || ''))) {
                    // Back off harder before hitting the next group
                    await delay(4000);
                }
            }
            // Slightly longer gap + extra pause after failures (esp. rate-overlimit)
            const extra = failed > sent ? 2500 : 0;
            await delay(1800 + extra);
        }

        await ctx.react('✅');
        const contentPreview = (text || '[media]').slice(0, 80);
        const ellipsis = text?.length > 80 ? '…' : '';
        return ctx.reply(
            `📢 *All Status Complete*\n\n` +
            `*Groups targeted:* ${groupIds.length}\n` +
            `*Posted:* ${sent}\n` +
            (failed > 0 ? `*Failed:* ${failed}\n` : '') +
            `*Content:* _${contentPreview}${ellipsis}_`
        );
    },
};