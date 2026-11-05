// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Auto-View / Auto-Like commands      ║
// ║   .autoview on|off                                   ║
// ║   .autolike on|off [emoji]                           ║
// ║   .autostatus — show settings                        ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const { menuBox } = require('../../lib/menuBox');
const {
    getConfig,
    setAutoView,
    setAutoLike,
    setLikeEmoji,
} = require('../../lib/statusManager');

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
        const s = ctx.settings;
        const phone = ctx.sessionPhone;
        const invoked = (ctx.rawCmd || '').toLowerCase();
        const sub = (args[0] || '').toLowerCase();

        if (!phone) {
            return ctx.reply(`❌ Could not resolve this bot session.${s.FOOTER || ''}`);
        }

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
                ]) + (s.FOOTER || '')
            );
        }

        const isLikeCmd = invoked === 'autolike' || invoked === 'statuslike';

        if (sub !== 'on' && sub !== 'off') {
            return ctx.reply(
                `❓ *Usage:*\n` +
                `\`${s.prefix}${invoked} on\` or \`${s.prefix}${invoked} off\`` +
                (isLikeCmd ? `\nOptional emoji: \`${s.prefix}autolike on 🔥\`` : '') +
                (s.FOOTER || '')
            );
        }

        const enabled = sub === 'on';

        if (isLikeCmd) {
            if (enabled && args[1]) {
                const em = String(args[1]).trim();
                if (!em) {
                    return ctx.reply(
                        `❌ Provide a valid emoji.\nExample: \`${s.prefix}autolike on 🔥\`` +
                        (s.FOOTER || '')
                    );
                }
                setLikeEmoji(phone, em);
            }
            setAutoLike(phone, enabled);
            const emoji = getConfig(phone).likeEmoji;
            return ctx.reply(
                enabled
                    ? `✅ *Auto-Like enabled!*\nReacting with: ${emoji}\n\n_Random delay added so it doesn't look instant._` + (s.FOOTER || '')
                    : `❌ *Auto-Like disabled.*` + (s.FOOTER || '')
            );
        }

        setAutoView(phone, enabled);
        return ctx.reply(
            enabled
                ? `✅ *Auto-View enabled!*\nEvery contact's status will be marked as viewed automatically.\n\n_Random delay added so it doesn't look instant._` + (s.FOOTER || '')
                : `❌ *Auto-View disabled.*` + (s.FOOTER || '')
        );
    },
};
