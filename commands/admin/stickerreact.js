// language: JavaScript, file: commands/admin/stickerreact.js
'use strict';

const {
    MAX_STICKER_REACTION_ATTEMPTS,
    parseReactionCount,
    getQuotedStickerMessage,
    saveStickerReactionMessage,
    sendStickerReaction,
} = require('../../utils/stickerReaction');

module.exports = {
    name: 'sreact',
    aliases: ['stickerreact', 'stickerreaction'],
    description: 'Enable or disable Madara sticker reactions in this chat.',
    usage: '.sreact on|off|status | reply to a message with .sreact [count]',
    category: 'admin',

    async execute({ args = [], reply, from, isGroup, isAdmin, isOwner, database, sock, m, msg }) {
        if (isGroup && !isAdmin && !isOwner) {
            return reply('🛡️ *Admin only.* Only clan leaders can configure sticker reactions.');
        }
        if (!isGroup && !isOwner) {
            return reply('🔒 *Owner only.* Only the War Lord can configure sticker reactions in private chats.');
        }

        const action = String(args[0] || '').trim().toLowerCase();

        // ===== ON / OFF / STATUS =====
        if (['on', 'off', 'status'].includes(action)) {
            const enabled = database.getStickerReaction(from);

            if (action === 'status') {
                return reply(
                    `🌀 *Madara Sticker Reaction*\n\n` +
                    `Status: ${enabled ? '✅ ACTIVE' : '❌ DISABLED'}\n` +
                    `Scope: ${isGroup ? 'this group' : 'this private chat'}\n` +
                    `_Reply to a message with .sreact [count] to manually trigger it._`
                );
            }

            const next = action === 'on';
            database.setStickerReaction(from, next);

            return reply(next
                ? '✅ *Madara sticker reactions activated.* The Rinnegan will mark messages in this chat.'
                : '❌ *Madara sticker reactions disabled* for this chat.');
        }

        // ===== ADD NEW STICKER =====
        if (action === 'add') {
            // Check if m.quoted exists, otherwise build it manually from the message context
            const quoted = m?.quoted || {
                message: msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage,
                key: { id: msg?.message?.extendedTextMessage?.contextInfo?.stanzaId }
            };

            const quotedSticker = getQuotedStickerMessage(quoted);

            if (!quotedSticker) {
                return reply(
                    '❌ Could not detect a sticker.\n\n' +
                    'Make sure you *reply* to a real WhatsApp sticker, then send:\n' +
                    '`.sreact add`'
                );
            }

            try {
                const saved = saveStickerReactionMessage(quoted);
                if (!saved) {
                    return reply('❌ Failed to extract sticker data.');
                }
                return reply('✅ New Madara reaction sticker has been sealed.');
            } catch (error) {
                console.error('[SREACT]', error);
                return reply(`❌ Failed to save sticker: ${error.message}`);
            }
        }

        // ===== MANUAL REACT WITH COUNT =====
        const count = parseReactionCount(action);

        if (!count) {
            return reply(
                `🌀 *Madara Sticker Reaction*\n\n` +
                `• \`.sreact on\` — activate reactions\n` +
                `• \`.sreact off\` — disable reactions\n` +
                `• \`.sreact status\` — check current status\n` +
                `• \`.sreact add\` — seal a new reaction sticker (reply to sticker)\n` +
                `• \`.sreact [1-${MAX_STICKER_REACTION_ATTEMPTS}]\` — react to a replied message`
            );
        }

        // FIX: Safely fall back to raw contextInfo for the target key
        const targetKey = m?.quoted?.key || {
            remoteJid: from,
            id: msg?.message?.extendedTextMessage?.contextInfo?.stanzaId,
            participant: msg?.message?.extendedTextMessage?.contextInfo?.participant
        };

        if (!targetKey?.id) {
            return reply('↩️ Reply to the message you want to mark, then send `.sreact [count]`.');
        }

        try {
            const sent = await sendStickerReaction(sock, from, targetKey, count);
            if (!sent) {
                return reply('❌ Sticker reaction is currently unavailable on this connection.');
            }
        } catch (error) {
            console.error('[SREACT]', error.message);
            return reply('❌ The Rinnegan failed to mark this message.');
        }
    },
};