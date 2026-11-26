'use strict';
/*
 * WALLPAPER.JS — MADARA X-MD
 * .wallpaper — reply to an image (or send a URL) to set it as the shared
 *              chat background for everyone
 *
 * Requires lib/themeHelper.js
 */

const { downloadMediaMessage } = require('@itsliaaa/baileys');
const pino = require('pino');

const { sendTheme, needsRestart, restartSoon, fixWallpaperMappings } = require('../../lib/themeHelper');

const silentLogger = pino({ level: 'silent' });

module.exports = {
    name: 'wallpaper',
    aliases: ['wall', 'setwallpaper', 'chatwallpaper'],
    category: 'utility',
    desc: 'Set a shared chat wallpaper image for everyone (reply to image or send URL)',
    usage: '.wallpaper (reply to image) | .wallpaper <url>',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const jid = ctx.from;

        if (needsRestart()) {
            restartSoon();
            return ctx.reply(`⚙️ Server patch installed — restarting bot in 2s.\nRun \`.wallpaper\` again in ~20 seconds.${s.FOOTER}`);
        }

        try {
            // Find quoted image
            const ctxInfo = msg.message?.extendedTextMessage?.contextInfo
                         || msg.message?.imageMessage?.contextInfo
                         || msg.message?.videoMessage?.contextInfo
                         || null;
            const qm = ctxInfo?.quotedMessage;

            let media = null;

            if (qm?.imageMessage) {
                // Download quoted image
                const quoted = {
                    key: {
                        remoteJid: msg.key.remoteJid,
                        id: ctxInfo.stanzaId,
                        ...(ctxInfo.participant ? { participant: ctxInfo.participant } : {}),
                        ...(msg.key.remoteJidAlt ? { remoteJidAlt: msg.key.remoteJidAlt } : {}),
                    },
                    message: qm,
                };
                await ctx.react('⏳');
                const buf = await downloadMediaMessage(quoted, 'buffer', {}, { logger: silentLogger });
                if (!Buffer.isBuffer(buf) || buf.length === 0)
                    return ctx.reply(`❌ Could not download that image. Try again.${s.FOOTER}`);
                media = buf;
            } else if (args[0] && /^https?:\/\//i.test(args[0])) {
                await ctx.react('⏳');
                media = { url: args[0] };
            } else {
                return ctx.reply(
                    `🖼️ *WALLPAPER — Shared chat background image*\n\n` +
                    `*Usage:*\n` +
                    `› Reply to an image with \`.wallpaper\`\n` +
                    `› Or: \`.wallpaper <image-url>\`\n\n` +
                    `The image becomes the chat background for everyone.\n` +
                    `Use \`.theme off\` to remove it.${s.FOOTER}`
                );
            }

            // Fix HKDF + upload path mappings for wallpaper media type
            fixWallpaperMappings();

            const { encryptedStream } = require('@itsliaaa/baileys');
            if (typeof encryptedStream !== 'function')
                return ctx.reply(`❌ Wallpaper failed: this Baileys build has no \`encryptedStream\`.${s.FOOTER}`);

            const enc = await encryptedStream(media, 'chat-wallpaper-image', { logger: sock.logger });

            let directPath = null;
            try {
                const up = await sock.waUploadToServer(enc.encFilePath, {
                    mediaType: 'chat-wallpaper-image',
                    fileEncSha256B64: enc.fileEncSha256.toString('base64'),
                });
                directPath = up && up.directPath;
            } finally {
                try { require('node:fs').promises.unlink(enc.encFilePath).catch(() => {}); } catch {}
            }

            if (!directPath)
                return ctx.reply(`❌ Wallpaper upload failed — server returned no directPath.${s.FOOTER}`);

            const r = await sendTheme(sock, jid, {
                customImage: {
                    directPath,
                    mediaKey      : enc.mediaKey,
                    fileEncSha256 : enc.fileEncSha256,
                    fileSha256    : enc.fileSha256,
                    dimLevel      : 0,
                },
            }, '.wallpaper', ctx.reply.bind(ctx));

            if (r !== 'sent') return;
            await ctx.react('✅');
            return ctx.reply(`✅ Wallpaper set for everyone in this chat.${s.FOOTER}`);
        } catch (e) {
            await ctx.react('❌');
            return ctx.reply(`❌ Wallpaper failed: ${e?.message || String(e)}${s.FOOTER}`);
        }
    },
};
