// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — †unpair command                   ║
// ╚══════════════════════════════════════════════════════╝

'use strict';

const { menuBox } = require('../../lib/menuBox');

module.exports = {
    name:      'unpair',
    aliases:   ['removesession', 'clearsession', 'disconnect'],
    category:  'system',
    desc:      'Disconnect and remove a paired session',
    usage:     '†unpair <phone>',
    ownerOnly: true,   // Only bot owner can unpair sessions

    async execute(sock, msg, args, ctx) {
        const { clearSession, activeSessions } = require('../../lib/pairManager');
        const s   = ctx.settings;
        const raw = (args[0] || '').replace(/[^0-9]/g, '');

        if (!raw || raw.length < 7 || raw.length > 15) {
            return ctx.reply(
                `❌ *Usage:* \`${s.prefix}unpair <phone>\`\n` +
                `📌 *Example:* \`${s.prefix}unpair 2348012345678\`${s.FOOTER}`
            );
        }

        const exists = activeSessions.has(raw);
        await clearSession(raw);

        return ctx.reply(
            menuBox('💣', 'ᴜɴᴘᴀɪʀ', [
                exists
                    ? `✅ Session for *+${raw}* has been disconnected and removed.`
                    : `⚠️ No active session found for *+${raw}*.`,
                ...(exists ? [``, `They can re-pair using \`${s.prefix}pair ${raw}\``] : []),
            ]) + s.FOOTER
        );
    }
};
