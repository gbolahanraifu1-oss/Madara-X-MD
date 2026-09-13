'use strict';
const path = require('path');
const fs = require('fs');
const { menuBox } = require('../../lib/menuBox');
const { getRandomBanner } = require('../../lib/menuBanner');
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('@itsliaaa/baileys');

const _pending = new Map();

module.exports = {
    name: 'pair',
    aliases: ['addbot', 'linkbot', 'pairbot', 'paircmd'],
    category: 'system',
    desc: 'Pair your WhatsApp number to MADARA X-MD',
    usage: '.pair <phone>',
    waitReact: false,

    async execute(sock, msg, args, ctx) {
        const { startSession, clearSession, getPairingCode, activeSessions, SESSIONS_ROOT } = require('../../lib/pairManager');
        const s = ctx.settings;

        const allowedGroup = (s.pairGroupJid || '').trim();
        if (allowedGroup && (!ctx.isGroup || ctx.from !== allowedGroup)) {
            return ctx.reply(menuBox('💣', s.botName, [`❌ Use this inside the *official group*.`, ``, `📌 ${s.channelLink || ''}`, ``, `Then: \`${s.prefix}pair <your number>\``]) + s.FOOTER);
        }

        const maintenance = require('../../lib/maintenance');
        if (maintenance.isOn() && !ctx.isOwner) {
            return ctx.reply(menuBox('🚧', s.botName, [`Pairing disabled for maintenance.`, ...(maintenance.reason()? [`*Reason:* ${maintenance.reason()}`] : [])]) + s.FOOTER);
        }

        const { resolveLid } = require('../../lib/context');
        const rawSenderNum = ctx.sender? ctx.sender.split('@')[0].replace(/[^0-9]/g, '') : '';
        const senderNumber = resolveLid(rawSenderNum);
        const raw = (args[0] || '').replace(/[^0-9]/g, '') || senderNumber;

        if (!raw || raw.length < 7) return ctx.reply(`❌ Invalid number. Use: \`${s.prefix}pair 2348012345678\`` + s.FOOTER);
        if (activeSessions.get(raw)?.sock?.ws?.readyState === 1) return ctx.reply(`✅ *+${raw}* already connected! Use \`${s.prefix}unpair ${raw}\` to re-pair` + s.FOOTER);
        if (_pending.has(raw)) return ctx.reply(`⏳ Already generating code for *+${raw}*...` + s.FOOTER);

        _pending.set(raw, true);
        await ctx.react('⏳');

        const sessionDir = path.join(SESSIONS_ROOT, raw);
        if (fs.existsSync(sessionDir) && !fs.existsSync(path.join(sessionDir, 'creds.json'))) await clearSession(raw).catch(() => {});

        let timeoutHandle;
        try {
            const newSock = await startSession(raw, null);
            if (!newSock) throw new Error('Could not start session');

            const code = await Promise.race([
                getPairingCode(newSock, raw, 'custom'),
                new Promise((_, rej) => { timeoutHandle = setTimeout(() => rej(new Error('Timeout 70s')), 70_000); }),
            ]);

            clearTimeout(timeoutHandle);
            _pending.delete(raw);
            await ctx.react('✅');

            const cleanCode = String(code).replace(/[^a-z0-9]/gi, '').toUpperCase();
            const codeOnlyMsg = cleanCode.match(/.{1,4}/g)?.join('-') || cleanCode;

            let bannerImg = null;
            try {
                const localBanner = getRandomBanner(ctx.sender);
                if (localBanner && fs.existsSync(localBanner))
                    bannerImg = await prepareWAMessageMedia({ image: fs.readFileSync(localBanner) }, { upload: sock.waUploadToServer });
            } catch {}

            const pairText = `❤️ *_ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ ғᴏʀ @${ctx.sender.split('@')[0]}_* ❤️
╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
┃✰│CODE: *${codeOnlyMsg}*
┃✰│EXPIRES: 60s
╰──────────────────

1. Open WhatsApp > Settings > Linked Devices
2. Tap "Link a Device" 
3. Tap "Link with phone number"
4. Paste the code above

_Tap button below to copy instantly_`;

            // FIXED: VIEWONCE + CTA_COPY BUTTON
            const pairMsg = generateWAMessageFromContent(ctx.from, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ text: pairText }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: `© Powered by ${s.botName}` }),
                            header: proto.Message.InteractiveMessage.Header.create({ 
                                title: `🔑 ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ`, 
                                hasMediaAttachment:!!bannerImg, 
                                imageMessage: bannerImg?.imageMessage || undefined 
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    { 
                                      name: "cta_copy", // CHANGED FROM "copy"
                                      buttonParamsJson: JSON.stringify({ 
                                        display_text: "📋 Copy Code", 
                                        id: "copy_pair", 
                                        copy_code: cleanCode 
                                      }) 
                                    },
                                    { 
                                      name: "quick_reply", 
                                      buttonParamsJson: JSON.stringify({ display_text: "⚡ Bot Uptime", id: "madara_ping" }) 
                                    }
                                ]
                            })
                        })
                    }
                }
            }, { quoted: msg });

            await sock.relayMessage(ctx.from, pairMsg.message, { messageId: pairMsg.key.id });

        } catch (err) {
            clearTimeout(timeoutHandle);
            _pending.delete(raw);
            await ctx.react('❌');
            return ctx.reply(`❌ *Pairing failed for +${raw}*\n📋 ${err.message}` + s.FOOTER);
        }
    }
};