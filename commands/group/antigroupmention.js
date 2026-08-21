// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  ANTI GROUP MENTION
// Persistent warn+kick for status mentions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const fs   = require('fs');
const path = require('path');
const db   = require('../../lib/db');
const { menuBox } = require('../../lib/menuBox');

const VIOLATIONS_FILE = path.join(process.cwd(), 'data', 'agm_violations.json');

function loadViolations() {
    try {
        if (fs.existsSync(VIOLATIONS_FILE)) return JSON.parse(fs.readFileSync(VIOLATIONS_FILE, 'utf8'));
    } catch {}
    return {};
}

function saveViolations(data) {
    try {
        fs.mkdirSync(path.dirname(VIOLATIONS_FILE), { recursive: true });
        fs.writeFileSync(VIOLATIONS_FILE, JSON.stringify(data, null, 2));
    } catch (e) { console.error('[agm] save violations failed:', e.message); }
}

function incrementCount(groupJid, senderJid) {
    const data = loadViolations();
    if (!data[groupJid]) data[groupJid] = {};
    data[groupJid][senderJid] = (data[groupJid][senderJid] || 0) + 1;
    saveViolations(data);
    return data[groupJid][senderJid];
}

function resetCount(groupJid, senderJid) {
    const data = loadViolations();
    if (!data[groupJid]) return;
    if (senderJid) {
        delete data[groupJid][senderJid];
        if (!Object.keys(data[groupJid]).length) delete data[groupJid];
    } else {
        delete data[groupJid]; // reset all in group
    }
    saveViolations(data);
}

// ── Detect status-to-group mention message ────────────────
function isGroupMentionMsg(msg) {
    const m = msg?.message;
    if (!m) return false;
    if (m.groupStatusMentionMessage) return true;
    if (m.protocolMessage?.type === 25) return true;
    const text = (m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || '').toLowerCase();
    if (text.includes('mentioned your group') || text.includes('mentioned the group') ||
        text.includes('mentioned this group') || text.includes('privately in a status') ||
        (text.includes('mentioned') && text.includes('status')) ||
        /mentioned.*group.*status/i.test(text)) return true;
    return false;
}

// ── Auto-handler called from handler.js ──────────────────
async function handleGroupMentionDetect(sock, from, sender, msg) {
    try {
        if (!from?.endsWith('@g.us')) return false;
        if (!db.getGroupSetting(from, 'antigroupmention', false)) return false;
        if (msg.key.fromMe) return false;
        if (!isGroupMentionMsg(msg)) return false;

        // Skip admins
        try {
            const meta   = await sock.groupMetadata(from);
            const sndNum = (sender || '').split('@')[0].split(':')[0];
            const isAdm  = (meta.participants || []).some(p => {
                const pNum = (p.id || '').split('@')[0].split(':')[0];
                return (pNum === sndNum || p.id === sender) &&
                       (p.admin === 'admin' || p.admin === 'superadmin');
            });
            if (isAdm) return false;
        } catch {}

        const warnMode = db.getGroupSetting(from, 'agm_warn', false);   // DEFAULT: delete only
        const kickMode = db.getGroupSetting(from, 'agm_kick_direct', false); // direct kick mode
        const limit    = db.getGroupSetting(from, 'agm_limit', 2);
        const name     = msg.pushName || sender.split('@')[0];

        // ALWAYS delete the message — this is the default behaviour
        try { await sock.sendMessage(from, { delete: msg.key }); } catch {}

        // DEFAULT: silent delete only — no warn, no kick
        if (!warnMode && !kickMode) return true;

        // KICK DIRECT MODE (warn off, kick on)
        if (kickMode && !warnMode) {
            try {
                await sock.groupParticipantsUpdate(from, [sender], 'remove');
                await sock.sendMessage(from, {
                    text: `🚪 @${name} was *removed* for mentioning this group in their status.`,
                    mentions: [sender]
                });
            } catch {
                await sock.sendMessage(from, {
                    text: `🚫 @${name} (Message deleted — could not remove)`,
                    mentions: [sender]
                }).catch(() => {});
            }
            return true;
        }

        // WARN MODE: count violations → warn → kick at limit
        const count = incrementCount(from, sender);
        if (count < limit) {
            await sock.sendMessage(from, {
                text:
                    `⚠️ *Warning ${count}/${limit}*\n\n` +
                    `@${name} mentioning this group in your *Status* is not allowed.\n` +
                    `_${limit - count} more violation${limit - count !== 1 ? 's' : ''} → removal._`,
                mentions: [sender]
            });
        } else {
            try {
                await sock.groupParticipantsUpdate(from, [sender], 'remove');
                await sock.sendMessage(from, {
                    text: `🚪 @${name} removed after ${count} violations.`,
                    mentions: [sender]
                });
            } catch {
                await sock.sendMessage(from, {
                    text: `🚫 @${name} hit limit (${count}/${limit}) — removal failed, check bot is admin.`,
                    mentions: [sender]
                }).catch(() => {});
            }
            resetCount(from, sender);
        }

        return true;
    } catch (err) {
        console.error('[agm] error:', err.message);
        return false;
    }
}

// ── Command plugin ────────────────────────────────────────
module.exports = {
    name: 'antigroupmention',
    aliases: ['agm', 'antimentiongroup', 'antistatusmention2'],
    category: 'group',
    desc: 'Block status-to-group mentions — warn mode or direct kick',
    usage: '†agm on|off | †agm warn on|off | †agm limit [n] | †agm reset | †agm violations',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const sub  = (args[0] || '').toLowerCase();
        const sub2 = (args[1] || '').toLowerCase();

        // ── ON / OFF ──────────────────────────────────────
        if (sub === 'on') {
            db.setGroupSetting(ctx.from, 'antigroupmention', true);
            return ctx.reply(
                `✅ *Anti Group Mention ON*\n\n` +
                `_Status mentions will be silently *deleted*._\n` +
                `_No warnings, no kicks — just silent delete._\n\n` +
                `*To escalate:*\n` +
                `  \`${s.prefix}agm warn on\` — warn before kick\n` +
                `  \`${s.prefix}agm kick on\` — immediate kick${s.FOOTER}`
            );
        }
        if (sub === 'off') {
            db.setGroupSetting(ctx.from, 'antigroupmention', false);
            return ctx.reply(`❌ *Anti Group Mention OFF*${s.FOOTER}`);
        }

        // ── WARN MODE TOGGLE ─────────────────────────────
        if (sub === 'warn') {
            if (sub2 === 'on') {
                db.setGroupSetting(ctx.from, 'agm_warn', true);
                const lim = db.getGroupSetting(ctx.from, 'agm_limit', 2);
                return ctx.reply(
                    `✅ *Warn mode ON*\n\n` +
                    `_Members will be warned *${lim} time${lim !== 1 ? 's' : ''}* before being kicked._\n` +
                    `_Use \`${s.prefix}agm limit [n]\` to change the limit._${s.FOOTER}`
                );
            }
            if (sub2 === 'off') {
                db.setGroupSetting(ctx.from, 'agm_warn', false);
                return ctx.reply(
                    `🚫 *Warn mode OFF*\n\n` +
                    `_Members will be *immediately kicked* when they mention the group in their status._\n` +
                    `_No warnings given._${s.FOOTER}`
                );
            }
            // Toggle current state
            const cur = db.getGroupSetting(ctx.from, 'agm_warn', true);
            const newVal = !cur;
            db.setGroupSetting(ctx.from, 'agm_warn', newVal);
            const lim = db.getGroupSetting(ctx.from, 'agm_limit', 2);
            return ctx.reply(
                newVal
                    ? `✅ *Warn mode ON* — kick after ${lim} violation${lim !== 1 ? 's' : ''}${s.FOOTER}`
                    : `🚫 *Warn mode OFF* — immediate kick${s.FOOTER}`
            );
        }

        // ── LIMIT ─────────────────────────────────────────
        if (sub === 'limit') {
            const n = parseInt(sub2);
            if (!n || n < 1) return ctx.reply(`❌ Usage: \`${s.prefix}agm limit 3\`${s.FOOTER}`);
            db.setGroupSetting(ctx.from, 'agm_limit', n);
            // Also ensure warn mode is on when setting a limit
            db.setGroupSetting(ctx.from, 'agm_warn', true);
            return ctx.reply(
                `✅ *Warning limit set to ${n}*\n\n` +
                `_Members get warned ${n} time${n !== 1 ? 's' : ''} then kicked._\n` +
                `_Warn mode automatically enabled._${s.FOOTER}`
            );
        }

        // ── RESET ─────────────────────────────────────────
        if (sub === 'reset') {
            const target = ctx.getMentions()[0];
            if (target) {
                resetCount(ctx.from, target);
                return ctx.reply(`✅ Violations cleared for @${target.split('@')[0]}${s.FOOTER}`, { mentions: [target] });
            }
            // Reset all
            resetCount(ctx.from, null);
            return ctx.reply(`✅ *All violations cleared* for this group.${s.FOOTER}`);
        }

        // ── VIOLATIONS LIST ───────────────────────────────
        if (sub === 'violations' || sub === 'list' || sub === 'check') {
            const data    = loadViolations()[ctx.from] || {};
            const entries = Object.entries(data);
            if (!entries.length) return ctx.reply(`📋 No violations recorded in this group.${s.FOOTER}`);
            const mentions = entries.map(([j]) => j);
            const limit    = db.getGroupSetting(ctx.from, 'agm_limit', 2);
            const list     = entries.map(([j, c]) =>
                `• @${j.split('@')[0]}: ${c}/${limit} violation${c !== 1 ? 's' : ''}`
            ).join('\n');
            return await sock.sendMessage(ctx.from, {
                text: `📋 *AGM Violations:*\n\n${list}\n\nUse \`${s.prefix}agm reset @user\` to clear.${s.FOOTER}`,
                mentions
            }, { quoted: msg });
        }

        // ── STATUS (default) ──────────────────────────────
        const cur  = db.getGroupSetting(ctx.from, 'antigroupmention', false);
        const warn = db.getGroupSetting(ctx.from, 'agm_warn', false);
        const kick = db.getGroupSetting(ctx.from, 'agm_kick_direct', false);
        const lim  = db.getGroupSetting(ctx.from, 'agm_limit', 2);
        const mode = !cur ? '❌ OFF' : warn ? `⚠️ Warn mode (${lim} violations → kick)` : kick ? '🚪 Direct kick' : '🗑️ Silent delete (default)';
        ctx.reply(menuBox('🚫', 'ᴀɴᴛɪ ɢʀᴏᴜᴘ ᴍᴇɴᴛɪᴏɴ', [
            `*Status:* ${cur ? '✅ ON' : '❌ OFF'}`,
            `*Mode:* ${mode}`,
            ``,
            `*Commands:*`,
            `\`${s.prefix}agm on\` / \`${s.prefix}agm off\``,
            `\`${s.prefix}agm warn on\` — warn ${lim}x then kick`,
            `\`${s.prefix}agm warn off\` — back to silent delete`,
            `\`${s.prefix}agm kick on\` — direct kick (no warn)`,
            `\`${s.prefix}agm kick off\` — back to silent delete`,
            `\`${s.prefix}agm limit [n]\` — set warn count`,
            `\`${s.prefix}agm violations\` — show records`,
            `\`${s.prefix}agm reset [@user]\` — clear violations`,
        ]) + s.FOOTER);
    }
};
module.exports.handleGroupMentionDetect = handleGroupMentionDetect;
