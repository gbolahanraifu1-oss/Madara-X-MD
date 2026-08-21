// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  ANTI BOT CLONE
// Leaves a group automatically if another instance of this same bot
// number is detected already present (or joining) that group.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const db = require('../../lib/db');

function sameUser(jidA, jidB) {
    if (!jidA || !jidB) return false;
    const a = jidA.split('@')[0].split(':')[0];
    const b = jidB.split('@')[0].split(':')[0];
    return a === b;
}

// ── Called from madaraFeatures.js on group-participants.update (action: add) ──
async function checkBotClone(sock, groupId, joinedIds) {
    try {
        if (!groupId?.endsWith('@g.us')) return false;
        if (!db.getGroupSetting(groupId, 'antiBotClone', false)) return false;

        const ownJid = sock?.user?.id || sock?.user?.jid;
        if (!ownJid) return false;

        const cloneJoined = (joinedIds || []).some(id => {
            const idStr = typeof id === 'string' ? id : (id?.id || id?.jid || '');
            return sameUser(idStr, ownJid) && idStr !== ownJid;
        });
        if (!cloneJoined) return false;

        await sock.sendMessage(groupId, {
            text: `✨ ᴀᴍ ʟᴇᴀᴠɪɴɢ, ᴡᴇ ᴄᴀɴ'ᴛ ʙᴇ ᴛᴡᴏ ᴏғ ᴛʜᴇ sᴀᴍᴇ ᴋɪɴᴅ ɢᴏᴏᴅʙʏᴇ.`,
        }).catch(() => {});
        setTimeout(() => sock.groupLeave(groupId).catch(() => {}), 5000);
        return true;
    } catch (err) {
        console.error('[antibotclone] error:', err.message);
        return false;
    }
}

// ── Command plugin ────────────────────────────────────────
module.exports = {
    name: 'antibotclone',
    aliases: ['botclone'],
    category: 'misc',
    desc: 'Auto-leave a group if another instance of this same bot number joins it',
    usage: '†antibotclone on|off',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on') {
            db.setGroupSetting(ctx.from, 'antiBotClone', true);
            return ctx.reply(`✅ *Anti-Bot-Clone enabled.*${s.FOOTER}`);
        }
        if (sub === 'off') {
            db.setGroupSetting(ctx.from, 'antiBotClone', false);
            return ctx.reply(`❌ *Anti-Bot-Clone disabled.*${s.FOOTER}`);
        }

        const cur = db.getGroupSetting(ctx.from, 'antiBotClone', false);
        ctx.reply(
            `⚙️ *Anti-Bot-Clone:* ${cur ? '✅ On' : '❌ Off'}\n\nUsage:\n\`${s.prefix}antibotclone on\`\n\`${s.prefix}antibotclone off\`${s.FOOTER}`
        );
    }
};
module.exports.checkBotClone = checkBotClone;
