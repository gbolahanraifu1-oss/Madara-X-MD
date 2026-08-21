// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — MUTE USER (Bot-level)             ║
// ║   Deletes every message from a muted user            ║
// ╚══════════════════════════════════════════════════════╝

const db = require('../../lib/db');

// ── Auto-handler: delete muted user messages ────────────
async function checkMutedUser(sock, from, sender, msg) {
    if (!from?.endsWith('@g.us')) return false;
    if (msg.key.fromMe) return false;
    const muteList = db.getGroupSetting(from, 'muteList', []);
    if (!muteList.includes(sender)) return false;
    try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
    return true;
}

module.exports = {
    name: 'muteuser',
    aliases: ['muteMember', 'silenceuser', 'botsoftmute'],
    category: 'group',
    desc: 'Bot-level mute — silently delete all messages from a user',
    usage: '†muteuser @user  |  reply to their message  |  †muteuser list  |  †muteuser @user remove',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();

        // Show mute list
        if (sub === 'list') {
            const muteList = db.getGroupSetting(ctx.from, 'muteList', []);
            if (!muteList.length) return ctx.reply(`✅ No bot-muted users in this group.${s.FOOTER}`);
            const list = muteList.map((j, i) => `${i+1}. @${j.split('@')[0]}`).join('\n');
            return await sock.sendMessage(ctx.from, {
                text: `🔇 *Bot-Muted Users (${muteList.length}):*\n\n${list}\n\nUse \`${s.prefix}muteuser @user remove\` to unmute.${s.FOOTER}`,
                mentions: muteList
            }, { quoted: msg });
        }

        // Resolve target: @mention, reply-to-message participant, or quoted participant
        const ctxInfo         = msg.message?.extendedTextMessage?.contextInfo;
        const quotedParticipant = ctxInfo?.participant || ctxInfo?.quotedParticipant;
        const mention = ctx.getMentions()[0] || quotedParticipant || null;

        if (!mention) return ctx.reply(
            `❌ Tag a user or *reply to their message* with this command.\n\n` +
            `*Usage:*\n` +
            `• \`${s.prefix}muteuser @user\` — mute by tag\n` +
            `• Reply to user's message → \`${s.prefix}muteuser\` — mute by reply\n` +
            `• \`${s.prefix}muteuser @user remove\` — unmute\n` +
            `• \`${s.prefix}muteuser list\` — view muted${s.FOOTER}`
        );

        const num       = mention.split('@')[0];
        let muteList    = db.getGroupSetting(ctx.from, 'muteList', []);
        const isRemove  = args.includes('remove') || args.includes('unmute');

        if (isRemove) {
            if (!muteList.includes(mention)) return ctx.reply(`❌ @${num} is not bot-muted.${s.FOOTER}`);
            muteList = muteList.filter(j => j !== mention);
            db.setGroupSetting(ctx.from, 'muteList', muteList);
            return await sock.sendMessage(ctx.from, {
                text: `🔊 @${num} has been *unmuted*.\n_They can now send messages normally._${s.FOOTER}`,
                mentions: [mention]
            }, { quoted: msg });
        }

        if (muteList.includes(mention)) return ctx.reply(`❌ @${num} is already bot-muted.${s.FOOTER}`);

        const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
        const botNum = sock.user?.id?.split(':')[0] || '';
        const targetNum = mention.split('@')[0].split(':')[0];
        if (mention === botJid || targetNum === botNum)
            return ctx.reply(`❌ Cannot mute the bot itself.${s.FOOTER}`);

        let targetIsAdmin = false;
        try {
            const meta   = ctx.groupMeta || await sock.groupMetadata(ctx.from);
            const sndNum = mention.split('@')[0].split(':')[0];
            targetIsAdmin = (meta.participants || []).some(p => {
                const pNum = (p.id || '').split('@')[0].split(':')[0];
                return (pNum === sndNum || p.id === mention) &&
                       (p.admin === 'admin' || p.admin === 'superadmin');
            });
        } catch {}
        if (targetIsAdmin) return ctx.reply(`❌ Cannot mute a group admin.${s.FOOTER}`);

        muteList.push(mention);
        db.setGroupSetting(ctx.from, 'muteList', muteList);
        await sock.sendMessage(ctx.from, {
            text: `🔇 @${num} has been *bot-muted*.\n\n` +
                  `_All their messages will be silently deleted by the bot._\n` +
                  `_Use \`${s.prefix}muteuser @${num} remove\` to unmute._${s.FOOTER}`,
            mentions: [mention]
        }, { quoted: msg });
    }
};

module.exports.checkMutedUser = checkMutedUser;
