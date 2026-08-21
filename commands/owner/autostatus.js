// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Auto-View / Auto-Like Status        ║
// ║   .autoview on/off                                   ║
// ║   .autolike on/off [emoji]                           ║
// ║   .autostatus — show both settings                   ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const {
    getConfig, setAutoView, setAutoLike, setLikeEmoji, DEFAULT_EMOJI
} = require('../../lib/statusManager');
const { menuBox } = require('../../lib/menuBox');

module.exports = {
    name:      'autoview',
    aliases:   ['autostatus', 'autolike', 'statusview', 'statuslike'],
    category:  'owner',
    desc:      'Auto-view and/or auto-react to contacts\' WhatsApp status updates',
    usage:
        '.autoview on|off — toggle auto-view\n' +
        '.autolike on|off [emoji] — toggle auto-react (optional custom emoji)\n' +
        '.autostatus — show current settings',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const phone = ctx.sessionPhone;
        const invoked = (ctx.rawCmd || '').toLowerCase();
        const sub  = (args[0] || '').toLowerCase();

        // ── .autostatus → show combined status ──────────────────────
        if (invoked === 'autostatus' && !sub) {
            const cfg = getConfig(phone);
            return ctx.reply(
                menuBox('👁️', 'ᴀᴜᴛᴏ-sᴛᴀᴛᴜs sᴇᴛᴛɪɴɢs', [
                    `*Auto-View:* ${cfg.autoView ? '✅ ON' : '❌ OFF'}`,
                    `*Auto-Like:* ${cfg.autoLike ? `✅ ON (${cfg.likeEmoji})` : '❌ OFF'}`,
                    ``,
                    `*Commands:*`,
                    `\`${s.prefix}autoview on|off\``,
                    `\`${s.prefix}autolike on|off [emoji]\``,
                ]) + s.FOOTER
            );
        }

        // ── Determine which feature is being toggled ─────────────────
        const isLikeCmd = invoked === 'autolike' || invoked === 'statuslike';

        if (sub !== 'on' && sub !== 'off') {
            return ctx.reply(
                `❓ *Usage:*\n` +
                `\`${s.prefix}${invoked} on\` or \`${s.prefix}${invoked} off\`` +
                (isLikeCmd ? `\nOptional emoji: \`${s.prefix}autolike on 🔥\`` : '') +
                s.FOOTER
            );
        }

        const enabled = sub === 'on';

        if (isLikeCmd) {
            setAutoLike(phone, enabled);
            if (enabled && args[1]) setLikeEmoji(phone, args[1]);
            const emoji = getConfig(phone).likeEmoji;
            return ctx.reply(
                enabled
                    ? `✅ *Auto-Like enabled!*\nReacting with: ${emoji}\n\n_Random delay added so it doesn't look instant._${s.FOOTER}`
                    : `❌ *Auto-Like disabled.*${s.FOOTER}`
            );
        } else {
            setAutoView(phone, enabled);
            return ctx.reply(
                enabled
                    ? `✅ *Auto-View enabled!*\nEvery contact's status will be marked as viewed automatically.\n\n_Random delay added so it doesn't look instant._${s.FOOTER}`
                    : `❌ *Auto-View disabled.*${s.FOOTER}`
            );
        }
    }
};
