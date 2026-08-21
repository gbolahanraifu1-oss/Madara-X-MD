// ☠️ MADARA X-MD Anti-Spam Plugin (Strict Message-Only Flood Warning)
// Separate, opt-in flood warning on top of the main .antispam kicker —
// warns (does not kick) when a member floods short bursts of messages.

const db = require('../../lib/db');

const messageTracker = {};
const warnedUsers = {};

// ── Auto-handler called from handler.js ──────────────────
async function checkGroupSpam(sock, from, sender, msg, ctx) {
    try {
        if (!from?.endsWith('@g.us') || !sender || msg.key.fromMe) return false;
        if (!db.getGroupSetting(from, 'santiGroupSpam', false)) return false;

        // Ignore messages with no real content (system / reaction / etc.)
        const content = msg.message;
        if (!content || Object.keys(content).length === 0) return false;

        const ignoredTypes = [
            'senderKeyDistributionMessage',
            'protocolMessage',
            'messageContextInfo',
            'reactionMessage',
        ];
        const actualContent = Object.keys(content).find(k => !ignoredTypes.includes(k));
        if (!actualContent) return false;

        const key       = `${from}-${sender}`;
        const now        = Date.now();
        const timeLimit  = 45 * 1000;      // 45 seconds
        const maxMessages = 5;
        const cooldown   = 5 * 60 * 1000;  // 5 minutes

        if (!messageTracker[key]) messageTracker[key] = [];
        messageTracker[key].push(now);
        messageTracker[key] = messageTracker[key].filter(ts => now - ts <= timeLimit);

        if (messageTracker[key].length > maxMessages) {
            const lastWarned = warnedUsers[key] || 0;
            if (now - lastWarned > cooldown) {
                await sock.sendMessage(from, {
                    text: `🚨 *Stop Spamming!*\n@${sender.split('@')[0]}, you've sent more than ${maxMessages} messages in under 45 seconds.\nPlease slow down or face Madara consequences. 💖\n\n_MADARA X-MD Bot cooling down..._`,
                    mentions: [sender],
                }, { quoted: msg }).catch(() => {});

                warnedUsers[key] = now;
                messageTracker[key] = [];
            }
        }
        return false; // this plugin only warns, never blocks the message pipeline
    } catch (err) {
        console.error('[santigroupspam] error:', err.message);
        return false;
    }
}

// ── Command plugin ────────────────────────────────────────
module.exports = {
    name: 'santigroupspam',
    aliases: ['floodwarn'],
    category: 'group',
    desc: 'Warn members who flood the group with rapid messages',
    usage: '†santigroupspam on|off',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on') {
            db.setGroupSetting(ctx.from, 'santiGroupSpam', true);
            return ctx.reply(`✅ *Flood warning enabled.*${s.FOOTER}`);
        }
        if (sub === 'off') {
            db.setGroupSetting(ctx.from, 'santiGroupSpam', false);
            return ctx.reply(`❌ *Flood warning disabled.*${s.FOOTER}`);
        }

        const cur = db.getGroupSetting(ctx.from, 'santiGroupSpam', false);
        ctx.reply(
            `⚙️ *Flood Warning:* ${cur ? '✅ On' : '❌ Off'}\n\nUsage:\n\`${s.prefix}santigroupspam on\`\n\`${s.prefix}santigroupspam off\`${s.FOOTER}`
        );
    }
};
module.exports.checkGroupSpam = checkGroupSpam;
