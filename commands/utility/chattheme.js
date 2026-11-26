'use strict';
/*
 * CHATTHEME.JS — MADARA X-MD
 * .chattheme <colour>  — set shared chat background colour for everyone
 * .chattheme off       — clear the theme
 * .chattheme list      — show available colours
 * .chatthemecheck      — diagnostic: patch state, Baileys version, admin status
 *
 * Requires lib/themeHelper.js
 */

const { sendTheme, nameToArgb, themeCheck, COLOR_LIST } = require('../../lib/themeHelper');

module.exports = {
    name: 'chattheme',
    aliases: ['ctheme', 'wallcolor', 'chatthemecheck'],
    category: 'utility',
    desc: 'Set a shared background colour for everyone in this chat',
    usage: '.chattheme <colour|off|list>',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const jid = ctx.from;

        // chatthemecheck alias
        const cmd = (msg.message?.extendedTextMessage?.text || msg.message?.conversation || '').trim().split(/\s+/)[0].replace(/^[^a-z]*/i, '').toLowerCase();
        if (cmd === 'chatthemecheck') {
            await ctx.react('🔍');
            const result = await themeCheck(sock, jid);
            return ctx.reply(`${result}${s.FOOTER}`);
        }

        const sub = (args[0] || '').toLowerCase();

        if (!sub || sub === 'list' || sub === 'help') {
            return ctx.reply(
                `🎨 *CHAT THEME — Shared background colour*\n\n` +
                `*Usage:*\n` +
                `› \`.chattheme <colour>\` — set solid background for everyone\n` +
                `› \`.chattheme off\` — remove theme (back to default)\n` +
                `› \`.chattheme list\` — show this list\n\n` +
                `*Colours:* ${COLOR_LIST}\n` +
                `Or use a hex code: \`.chattheme FF0000\`\n\n` +
                `_In groups the bot must be admin, or "Edit group info" set to All participants._${s.FOOTER}`
            );
        }

        if (sub === 'off' || sub === 'clear' || sub === 'default') {
            await ctx.react('⏳');
            const r = await sendTheme(sock, jid, { clearTheme: true }, '.chattheme off', ctx.reply.bind(ctx));
            if (r !== 'sent') return;
            await ctx.react('✅');
            return ctx.reply(`✅ Theme cleared — back to default for everyone.${s.FOOTER}`);
        }

        const argb = nameToArgb(sub);
        if (argb == null) {
            return ctx.reply(`❌ Unknown colour *"${sub}"*.\nUse \`.chattheme list\` for all colours.${s.FOOTER}`);
        }

        await ctx.react('⏳');
        const r = await sendTheme(sock, jid, {
            solidColor: {
                backgroundLightArgb: argb,
                backgroundDarkArgb: argb,
                isDoodleEnabled: false,
            },
        }, `.chattheme ${sub}`, ctx.reply.bind(ctx));
        if (r !== 'sent') return;

        await ctx.react('✅');
        return ctx.reply(`✅ Background set to *${sub}* for everyone in this chat.${s.FOOTER}`);
    },
};
