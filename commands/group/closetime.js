/**
 * CloseTime — close the group after a countdown
 * Usage: .closetime <duration>
 * Example: .closetime 5m, .closetime 3h, .closetime 16d
 */
'use strict';

const { menuBox } = require('../../lib/menuBox');

const MULTIPLIERS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
const UNIT_NAMES  = { s: 'second(s)', m: 'minute(s)', h: 'hour(s)', d: 'day(s)' };

function formatRemaining(ms) {
    if (ms <= 0) return '00:00:00';
    const hrs  = Math.floor(ms / 3_600_000);
    const mins = Math.floor((ms % 3_600_000) / 60_000);
    const secs = Math.floor((ms % 60_000) / 1000);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function makeBar(pct) {
    const total  = 16;
    const filled = Math.max(0, Math.min(total, Math.round(pct * total)));
    return '█'.repeat(filled) + '░'.repeat(total - filled);
}

function editIntervalFor(totalMs) {
    if (totalMs <= 60_000) return 5_000;
    if (totalMs <= 600_000) return 30_000;
    if (totalMs <= 3_600_000) return 60_000;
    return 300_000;
}

module.exports = {
    name: 'closetime',
    aliases: ['ct', 'closeafter', 'gcclose'],
    category: 'group',
    desc: 'Close group after a countdown timer',
    usage: '.closetime <duration>  (e.g. 30s, 5m, 3h, 16d)',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const from = ctx.from;
        const prefix = s.prefix || '.';
        const footer = s.FOOTER || '';

        if (!args.length) {
            return ctx.reply(
                menuBox('🔒', 'ᴄʟᴏsᴇ ᴛɪᴍᴇ', [
                    `Close the group after a countdown.`,
                    ``,
                    `*Usage:* \`${prefix}closetime <duration>\``,
                    ``,
                    `*Examples:*`,
                    `• \`${prefix}closetime 30s\` — 30 seconds`,
                    `• \`${prefix}closetime 5m\` — 5 minutes`,
                    `• \`${prefix}closetime 3h\` — 3 hours`,
                    `• \`${prefix}closetime 16d\` — 16 days`,
                ]) + footer
            );
        }

        const input = String(args[0]).toLowerCase();
        const match = input.match(/^(\d+)(s|m|h|d)$/);
        if (!match) {
            return ctx.reply(
                menuBox('❌', 'ɪɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ', [
                    `Use: 30s · 5m · 3h · 16d`,
                    ``,
                    `Example: \`${prefix}closetime 5m\``,
                ]) + footer
            );
        }

        const value = parseInt(match[1], 10);
        const unit  = match[2];
        const totalMs = value * MULTIPLIERS[unit];

        if (totalMs <= 0) {
            return ctx.reply(menuBox('❌', 'ɪɴᴠᴀʟɪᴅ ᴅᴜʀᴀᴛɪᴏɴ', [`Duration must be greater than zero.`]) + footer);
        }
        if (totalMs > 30 * 86_400_000) {
            return ctx.reply(menuBox('❌', 'ᴛᴏᴏ ʟᴏɴɢ', [`Maximum duration is *30 days*.`]) + footer);
        }

        const endTime = Date.now() + totalMs;

        const buildMsg = (remaining) => {
            const elapsed = totalMs - remaining;
            const pct = Math.min(Math.max(elapsed / totalMs, 0), 1);
            const pctText = Math.floor(pct * 100);
            return menuBox('🔒', 'ɢʀᴏᴜᴘ ᴄʟᴏsᴇ ᴄᴏᴜɴᴛᴅᴏᴡɴ', [
                `${makeBar(pct)}  *${pctText}%*`,
                ``,
                `⏳ Remaining: *${formatRemaining(remaining)}*`,
                `🕐 Closes at: *${new Date(endTime).toLocaleString()}*`,
                `📦 Duration: *${value} ${UNIT_NAMES[unit]}*`,
                ``,
                `_Group will close automatically..._`,
            ]);
        };

        let key = null;
        try {
            const sent = await sock.sendMessage(from, { text: buildMsg(totalMs) }, { quoted: msg });
            key = sent?.key || null;
        } catch (e) {
            console.error('[closetime] initial send failed:', e?.message);
        }

        const editTimer = setInterval(async () => {
            const remaining = endTime - Date.now();
            if (remaining <= 0) {
                clearInterval(editTimer);
                return;
            }
            if (!key) return;
            try {
                await sock.sendMessage(from, { text: buildMsg(remaining), edit: key });
            } catch (_) { /* rate-limit / edit not supported — ignore */ }
        }, editIntervalFor(totalMs));

        setTimeout(async () => {
            clearInterval(editTimer);
            try {
                await sock.groupSettingUpdate(from, 'announcement');
                await sock.sendMessage(from, {
                    text: menuBox('✅', 'ɢʀᴏᴜᴘ ᴄʟᴏsᴇᴅ', [
                        `${makeBar(1)}  *100%*`,
                        ``,
                        `Timer finished — group is now *closed*.`,
                        `Only admins can send messages.`,
                    ]),
                });
            } catch (e) {
                console.error('[closetime] groupSettingUpdate failed:', e?.message);
                await sock.sendMessage(from, {
                    text: menuBox('❌', 'ғᴀɪʟᴇᴅ ᴛᴏ ᴄʟᴏsᴇ', [
                        `Could not close the group automatically.`,
                        ``,
                        `Reason: _${e?.message || 'unknown error'}_`,
                        `Make sure I am a *group admin*.`,
                    ]),
                }).catch(() => {});
            }
        }, totalMs);
    },
};
