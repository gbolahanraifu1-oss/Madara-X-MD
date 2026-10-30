// language: JavaScript, file: commands/hijack/hijackadd.js
'use strict';

const { addTarget, readTargets } = require('../../lib/hijackSession');

module.exports = {
    name: 'hijackadd',
    aliases: ['hijadd', 'hadd'],
    category: 'hijack',
    desc: 'Manually add a target number to your hijack list',
    usage: '.hijackadd <phone>',
    privateOnly: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const raw = (args[0] || '').replace(/\D/g, '');
        if (!raw || raw.length < 7) {
            return ctx.reply(`❌ ᴜsᴀɢᴇ: ${s.prefix}hijackadd <ᴘʜᴏɴᴇ>${s.FOOTER}`);
        }

        const scopeKey = ctx.sender;
        if (!scopeKey) return ctx.reply(`❌ sᴇɴᴅᴇʀ ᴜɴᴋɴᴏᴡɴ.${s.FOOTER}`);

        const before = readTargets(scopeKey).length;
        const list   = addTarget(scopeKey, raw);
        const added  = list.length > before;

        return ctx.reply(
            `${added ? '✅ ᴀᴅᴅᴇᴅ' : '⚠️ ᴀʟʀᴇᴀᴅʏ ᴘʀᴇsᴇɴᴛ'}: +${raw}\n` +
            `📋 ʏᴏᴜʀ ᴛᴀʀɢᴇᴛs: ${list.length}${s.FOOTER}`
        );
    },
};