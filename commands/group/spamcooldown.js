'use strict';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  SPAM COOLDOWN
// Fast-typer protection: 5+ messages inside 10s gets a short bot-level
// mute (message auto-delete) instead of a warning or a kick — the middle
// rung between .santigroupspam (warns only) and .antispam (kicks).
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const db = require('../../lib/db');

const _tracker = new Map(); // `${group}-${sender}` -> [timestamps]

// ── Auto-handler called from handler.js ──────────────────
async function checkSpamCooldown(sock, from, sender, msg, ctx) {
    try {
        if (!from?.endsWith('@g.us') || !sender || msg.key.fromMe) return false;
        if (!db.getGroupSetting(from, 'spamCooldown', false)) return false;

        const content = msg.message;
        if (!content || Object.keys(content).length === 0) return false;
        const ignoredTypes = ['senderKeyDistributionMessage', 'protocolMessage', 'messageContextInfo', 'reactionMessage'];
        if (!Object.keys(content).some(k => !ignoredTypes.includes(k))) return false;

        const key   = `${from}-${sender}`;
        const now   = Date.now();
        const limit = 5, window = 10_000, muteMs = 5_000;

        let times = (_tracker.get(key) || []).filter(t => now - t < window);
        times.push(now);
        _tracker.set(key, times);

        if (times.length < limit) return false;

        // ── Threshold hit — apply a short bot-level mute ────────────────
        _tracker.set(key, []); // reset immediately, avoid repeat triggers

        let muteList = db.getGroupSetting(from, 'muteList', []);
        if (!muteList.includes(sender)) {
            muteList.push(sender);
            db.setGroupSetting(from, 'muteList', muteList);
        }

        await sock.sendMessage(from, {
            text: `❌ @${sender.split('@')[0]}, please don't spam.\nMuted for ${muteMs / 1000}s — messages will be auto-deleted.`,
            mentions: [sender],
        }, { quoted: msg }).catch(() => {});

        setTimeout(() => {
            const cur = db.getGroupSetting(from, 'muteList', []);
            db.setGroupSetting(from, 'muteList', cur.filter(j => j !== sender));
            sock.sendMessage(from, {
                text: `✅ @${sender.split('@')[0]} — cooldown finished, you can send messages again.`,
                mentions: [sender],
            }).catch(() => {});
        }, muteMs);

        return true;
    } catch (err) {
        console.error('[spamcooldown] error:', err.message);
        return false;
    }
}

// ── Command plugin ────────────────────────────────────────
module.exports = {
    name: 'spamcooldown',
    aliases: ['floodcooldown'],
    category: 'group',
    desc: 'Short bot-level mute for members who flood 5+ messages in 10s',
    usage: '†spamcooldown on|off',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on') {
            db.setGroupSetting(ctx.from, 'spamCooldown', true);
            return ctx.reply(`✅ *Spam Cooldown enabled.* 5+ msgs in 10s = 5s auto-mute.${s.FOOTER}`);
        }
        if (sub === 'off') {
            db.setGroupSetting(ctx.from, 'spamCooldown', false);
            return ctx.reply(`❌ *Spam Cooldown disabled.*${s.FOOTER}`);
        }

        const cur = db.getGroupSetting(ctx.from, 'spamCooldown', false);
        ctx.reply(
            `⚙️ *Spam Cooldown:* ${cur ? '✅ On' : '❌ Off'}\n\nUsage:\n\`${s.prefix}spamcooldown on\`\n\`${s.prefix}spamcooldown off\`${s.FOOTER}`
        );
    }
};
module.exports.checkSpamCooldown = checkSpamCooldown;
