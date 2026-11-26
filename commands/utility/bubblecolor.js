'use strict';
/*
 * BUBBLECOLOR.JS — MADARA X-MD
 * .bubblecolor <name>  — set shared chat bubble colour for everyone
 *
 * Requires lib/themeHelper.js
 */

const { sendTheme } = require('../../lib/themeHelper');

const BUBBLES = {
    blue        : 'Default-Blue@Minimal',
    tonal       : 'Default-Blue@Tonal@Minimal',
    emerald     : 'Emerald@Minimal',
    emeraldtonal: 'Emerald@Tonal@Minimal',
    pink        : 'Pink@Minimal',
    red         : 'Red@Minimal',
    royal       : 'Royal-Blue@Minimal',
    purple      : 'Tyrian-Purple@Minimal',
    green       : 'WhatsApp-Green@Minimal',
};

const BUBBLE_LIST = Object.keys(BUBBLES).join(', ');

module.exports = {
    name: 'bubblecolor',
    aliases: ['chatbubble', 'bubblecolour', 'bubbleclr'],
    category: 'utility',
    desc: 'Set a shared chat bubble colour for everyone in this chat',
    usage: '.bubblecolor <name|list>',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const jid = ctx.from;
        const sub = (args[0] || '').toLowerCase();

        if (!sub || sub === 'list' || sub === 'help') {
            return ctx.reply(
                `💬 *BUBBLE COLOUR — Shared chat bubble theme*\n\n` +
                `*Usage:* \`.bubblecolor <name>\`\n\n` +
                `*Options:* ${BUBBLE_LIST}\n\n` +
                `_In groups the bot must be admin, or "Edit group info" set to All participants._${s.FOOTER}`
            );
        }

        const id = BUBBLES[sub];
        if (!id) {
            return ctx.reply(`❌ Unknown bubble *"${sub}"*.\nOptions: ${BUBBLE_LIST}${s.FOOTER}`);
        }

        await ctx.react('⏳');
        const r = await sendTheme(sock, jid, { colorSchemeId: id }, `.bubblecolor ${sub}`, ctx.reply.bind(ctx));
        if (r !== 'sent') return;

        await ctx.react('✅');
        return ctx.reply(`✅ Bubble colour set to *${sub}* for everyone in this chat.${s.FOOTER}`);
    },
};
