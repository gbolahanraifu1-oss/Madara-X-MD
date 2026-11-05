'use strict';

/**
 * Legacy entry kept so old menus still resolve.
 * Real logic lives in commands/owner/autostatus.js (name: autoview) + lib/statusManager.js.
 * This file no longer steals the `autostatus` / `autoview` aliases.
 */
const {
    getConfig,
    setAutoView,
    setAutoLike,
    setLikeEmoji,
} = require('../../lib/statusManager');

module.exports = {
    name: 'autoviewstatus',
    // Do NOT alias autostatus / autoview — those belong to autostatus.js
    aliases: ['avs'],
    category: 'owner',
    desc: 'Auto-view / auto-like contact statuses (see .autoview / .autolike)',
    usage: '.avs  → shows help (use .autoview / .autolike)',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const phone = ctx.sessionPhone;
        const cfg = getConfig(phone);
        return ctx.reply(
            `👁️ *Auto Status*\n\n` +
            `*Auto-View:* ${cfg.autoView ? '✅ ON' : '❌ OFF'}\n` +
            `*Auto-Like:* ${cfg.autoLike ? `✅ ON (${cfg.likeEmoji})` : '❌ OFF'}\n\n` +
            `Use:\n` +
            `\`${s.prefix}autoview on|off\`\n` +
            `\`${s.prefix}autolike on|off [emoji]\`\n` +
            `\`${s.prefix}autostatus\` — show settings`
        );
    },
};
