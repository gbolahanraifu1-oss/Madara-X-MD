// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  PM BLOCKER
// Blocks non-owner users who message the bot privately, when enabled.
// (Group only mode is best paired with a single prefix.)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const db = require('../../lib/db');

// ── Auto-handler called from handler.js on every private message ─────────
async function checkPmBlock(sock, from, sender, msg, ctx) {
    try {
        if (msg.key.fromMe) return false;
        if (from?.endsWith('@g.us')) return false; // groups are never blocked
        if (ctx?.isOwner) return false;

        if (!db.get('settings', 'pmblocker', false)) return false;

        const allowlist = db.get('settings', 'pmAllowlist', []);
        if (allowlist.includes(sender.split('@')[0])) return false;

        await sock.sendMessage(
            from,
            {
                text: `*Hello @${sender.split('@')[0]}, messaging the bot privately is currently disabled. You have been blocked from using the bot.*`,
                mentions: [sender],
            },
            { quoted: msg }
        ).catch(() => {});

        await sock.updateBlockStatus(sender, 'block').catch(() => {});
        return true;
    } catch (err) {
        console.error('[pmblocker] error:', err.message);
        return false;
    }
}

// ── Command plugin ────────────────────────────────────────
module.exports = {
    name: 'pmblocker',
    aliases: ['pmblock'],
    category: 'misc',
    desc: 'Block non-owner users who DM the bot privately',
    usage: '†pmblocker on|off',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on') {
            db.set('settings', 'pmblocker', true);
            return ctx.reply(`✅ *PM Blocker enabled.* Non-owner private messages will be blocked.${s.FOOTER}`);
        }
        if (sub === 'off') {
            db.set('settings', 'pmblocker', false);
            return ctx.reply(`❌ *PM Blocker disabled.*${s.FOOTER}`);
        }

        const cur = db.get('settings', 'pmblocker', false);
        ctx.reply(
            `⚙️ *PM Blocker:* ${cur ? '✅ On' : '❌ Off'}\n\nUsage:\n\`${s.prefix}pmblocker on\`\n\`${s.prefix}pmblocker off\`${s.FOOTER}`
        );
    }
};
module.exports.checkPmBlock = checkPmBlock;
