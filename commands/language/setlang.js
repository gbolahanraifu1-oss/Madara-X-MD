'use strict';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  SET LANGUAGE
// Personal DM language preference — once set, plain short bot replies
// in your private chat with the bot get auto-translated. Group chats
// and stylized cards (menu, banners) are never translated.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { setUserLang, getUserLang } = require('../../lib/autotranslate');

module.exports = {
    name: 'setlang',
    aliases: ['mylang', 'preferlang'],
    category: 'language',
    desc: 'Set your personal DM reply language (auto-translate)',
    usage: '†setlang <code> | †setlang off',
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const code = (args[0] || '').toLowerCase();

        if (!code) {
            const cur = getUserLang(ctx.sender);
            return ctx.reply(
                `🌐 *Your language:* ${cur || 'en (default)'}\n\n` +
                `Usage:\n\`${s.prefix}setlang <code>\` e.g. \`${s.prefix}setlang es\`\n\`${s.prefix}setlang off\`\n\n` +
                `See \`${s.prefix}langlist\` for supported codes.${s.FOOTER}`
            );
        }

        if (code === 'off' || code === 'en') {
            setUserLang(ctx.sender, null);
            return ctx.reply(`✅ Replies switched back to *English* (default).${s.FOOTER}`);
        }

        if (code.length !== 2) {
            return ctx.reply(`❌ Use a 2-letter language code, e.g. \`${s.prefix}setlang fr\`. See \`${s.prefix}langlist\`.${s.FOOTER}`);
        }

        setUserLang(ctx.sender, code);
        return ctx.reply(`✅ *DM replies will now be translated to:* ${code}\n\n_Only applies to your private chat with the bot — group replies stay in English._${s.FOOTER}`);
    }
};
