// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Global Broadcast (FIXED)           ║
// ║   Old bug: sent a DM to the bot's OWN number on     ║
// ║   each session — never reached anyone. Now sends    ║
// ║   to every group across every active paired session.║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const { downloadMediaMessage } = require('@itsliaaa/baileys');

module.exports = {
    name:      'gb',                                    // shortened — was "globalbroadcast"
    aliases:   ['globalbroadcast', 'gbroadcast', 'gbcast'],
    category:  'system',
    desc:      'Broadcast a message to every group, across every paired session',
    usage:     '.gb <message>  (or reply to an image/video)',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const text = ctx.text || args.join(' ').trim();

        const qCtx   = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg = msg.message?.imageMessage || qCtx?.imageMessage;
        const vidMsg = msg.message?.videoMessage || qCtx?.videoMessage;
        const hasMedia = imgMsg || vidMsg;

        if (!text && !hasMedia) {
            return ctx.reply(
                `❌ Provide a message or reply to an image/video.\n` +
                `\`${s.prefix}gb Hello everyone!\`${s.FOOTER}`
            );
        }

        let sessions;
        try {
            sessions = require('../../lib/pairManager').activeSessions; // Map<phone, {sock, tgChatId, retries}>
        } catch {
            return ctx.reply(`❌ Could not load session manager.${s.FOOTER}`);
        }
        if (!sessions || sessions.size === 0)
            return ctx.reply(`⚠️ No active sessions found.${s.FOOTER}`);

        // Pre-download media once (shared across all sessions/groups)
        let mediaBuffer = null, mediaType = null;
        if (hasMedia) {
            try {
                const tgt = msg.message?.imageMessage || msg.message?.videoMessage
                    ? msg : { message: qCtx };
                mediaBuffer = await downloadMediaMessage(tgt, 'buffer', {});
                mediaType   = imgMsg ? 'image' : 'video';
            } catch (e) {
                console.error('[GlobalBroadcast] Media download failed:', e.message);
            }
        }

        const caption =
            `📢 *Global Broadcast — ${s.botName}*\n` +
            `━━━━━━━━━━━━━━━━━━━\n\n` +
            `${text || ''}\n\n` +
            `━━━━━━━━━━━━━━━━━━━` +
            s.FOOTER;

        await ctx.react('📡');

        let totalGroups = 0, sent = 0, failed = 0, sessionsUsed = 0;
        const delay = ms => new Promise(r => setTimeout(r, ms));

        for (const [phone, sessionData] of sessions) {
            const sessionSocket = sessionData?.sock;
            if (!sessionSocket || sessionSocket.ws?.readyState !== 1) continue;

            let groupIds = [];
            try {
                const chats = await sessionSocket.groupFetchAllParticipating();
                groupIds = Object.keys(chats);
            } catch (e) {
                console.error(`[GlobalBroadcast] ${phone} group fetch failed:`, e.message);
                continue;
            }
            if (!groupIds.length) continue;

            sessionsUsed++;
            totalGroups += groupIds.length;

            for (const gid of groupIds) {
                try {
                    if (mediaBuffer && mediaType === 'image') {
                        await sessionSocket.sendMessage(gid, { image: mediaBuffer, caption });
                    } else if (mediaBuffer && mediaType === 'video') {
                        await sessionSocket.sendMessage(gid, { video: mediaBuffer, caption });
                    } else {
                        await sessionSocket.sendMessage(gid, { text: caption });
                    }
                    sent++;
                } catch {
                    failed++;
                }
                await delay(700); // avoid rate-limit / ban risk
            }
        }

        await ctx.react('✅');
        return ctx.reply(
            `📢 *Global Broadcast Complete*\n\n` +
            `📱 Sessions used: *${sessionsUsed}/${sessions.size}*\n` +
            `👥 Groups targeted: *${totalGroups}*\n` +
            `✅ Delivered: *${sent}*\n` +
            `${failed > 0 ? `❌ Failed: *${failed}*\n` : ''}` +
            `📝 Message: _${(text || '[media]').slice(0, 80)}${text?.length > 80 ? '…' : ''}_` +
            s.FOOTER
        );
    }
};
