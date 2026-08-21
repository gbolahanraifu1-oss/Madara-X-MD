'use strict';
const { CATEGORIES, listAccounts, getAccount } = require('../../lib/shopDB');
const { menuBox } = require('../../lib/menuBox');

const CAT_EMOJI = { freefire:'🔥', pubg:'🎮', roblox:'🟥', valorant:'🎯', cod:'💣', genshin:'⚡' };

module.exports = {
    name: 'shop', aliases: ['store', 'accounts', 'acc'],
    category: 'system', desc: 'ʙʀᴏᴡsᴇ ɢᴀᴍɪɴɢ ᴀᴄᴄᴏᴜɴᴛ sʜᴏᴘ',
    usage: '†shop [category]',

    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const cat = args[0]?.toLowerCase();

        // ── Main shop menu ──────────────────────────────────────────────────
        if (!cat) {
            const lines = CATEGORIES.map(c => {
                const count = listAccounts(c).length;
                return `${CAT_EMOJI[c]||'📦'} _${s.prefix}shop ${c}_ — ${count} ᴀᴄᴄᴏᴜɴᴛ(s)`;
            });
            lines.push('');
            lines.push(`💳 _${s.prefix}buy <ɪᴅ>_ — ᴘᴜʀᴄʜᴀsᴇ ᴀɴ ᴀᴄᴄᴏᴜɴᴛ`);

            return sock.sendMessage(ctx.from, {
                text: menuBox('🛒', 'ᴍᴀᴅᴀʀᴀ x-ᴍᴅ sʜᴏᴘ', lines) + s.FOOTER,
            }, { quoted: msg });
        }

        // ── Category listing ────────────────────────────────────────────────
        if (!CATEGORIES.includes(cat))
            return ctx.reply(menuBox('❌', 'ɪɴᴠᴀʟɪᴅ ᴄᴀᴛᴇɢᴏʀʏ', [
                `ᴀᴠᴀɪʟᴀʙʟᴇ: ${CATEGORIES.join(', ')}`,
            ]) + s.FOOTER);

        const ids = listAccounts(cat);
        if (!ids.length)
            return ctx.reply(menuBox(CAT_EMOJI[cat]||'📦', cat.toUpperCase(), [
                'ɴᴏ ᴀᴄᴄᴏᴜɴᴛs ᴀᴠᴀɪʟᴀʙʟᴇ ʀɪɢʜᴛ ɴᴏᴡ. ᴄʜᴇᴄᴋ ʙᴀᴄᴋ ʟᴀᴛᴇʀ!',
            ]) + s.FOOTER);

        await ctx.reply(menuBox(CAT_EMOJI[cat]||'📦', cat.toUpperCase(), [
            `${ids.length} ᴀᴠᴀɪʟᴀʙʟᴇ — sᴇɴᴅɪɴɢ ᴅᴇᴛᴀɪʟs...`,
        ]) + s.FOOTER);

        for (const id of ids) {
            const acc = getAccount(cat, id);
            if (!acc) continue;
            try {
                await sock.sendMessage(ctx.from, {
                    image: { url: acc.img },
                    caption: menuBox(CAT_EMOJI[cat]||'📦', `${cat.toUpperCase()} ᴀᴄᴄᴏᴜɴᴛ`, [
                        ...acc.info.split('\n'),
                        '',
                        `🆔 ID: \`${id}\``,
                        `💳 ${s.prefix}buy ${id}`,
                    ]) + s.FOOTER,
                }, { quoted: msg });
                await new Promise(r => setTimeout(r, 800));
            } catch (e) { console.error(`[Shop] Error sending ${id}:`, e.message); }
        }
    }
};
