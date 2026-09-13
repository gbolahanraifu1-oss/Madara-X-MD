'use strict';
const settings = require('../settings');
const { buildCtx } = require('./context');
const { getCommand } = require('./loader');
const { getRateLimit, setRateLimit } = require('./ratelimit');
const { menuBox } = require('./menuBox');

function safeRequire(mod) {
    try { return require(mod); } catch (e) {
        console.warn('[Handler] Could not load:', mod, '—', e.message);
        return {};
    }
}

const antilinkMod = safeRequire('../commands/group/antilink');
const agmMod = safeRequire('../commands/group/antigroupmention');
const antideleteMod = safeRequire('../commands/group/antidelete');
const antistatusMod = safeRequire('../commands/group/antistatusmention');
const muteuserMod = safeRequire('../commands/group/muteuser');
const afkMod = safeRequire('../commands/utility/afk');
const chatbotMod = safeRequire('../commands/utility/chatbot');
const topmembersMod = safeRequire('../commands/group/topmembers');
const antispamLib = safeRequire('./antispam');
const groupstatusMod = safeRequire('../commands/group/groupstatus');
const wordgameMod = safeRequire('../commands/fun/wordgame');
const roastbattleMod = safeRequire('../commands/fun/roastbattle');
const filesMod = safeRequire('../commands/system/files');
const pmblockerMod = safeRequire('../commands/misc/pmblocker');
const santigroupspamMod = safeRequire('../commands/group/santigroupspam');
const getmsgMod = safeRequire('../commands/misc/getmsg');
const antibadwordMod = safeRequire('../commands/group/antibadword');
const spamcooldownMod = safeRequire('../commands/group/spamcooldown');
const datingMod = safeRequire('./dating');
const sessionTheme = safeRequire('./sessionTheme');
const groupResponseMod = safeRequire('../commands/system/response');

const isAntilink = antilinkMod.isAntilink || (() => false);
const isAntiDelete = antideleteMod.isAntiDelete || (() => false);
const storeMessage = antideleteMod.storeMessage || (() => {});
const isAntiStatusMention = antistatusMod.isAntiStatusMention || (() => false);
const checkMutedUser = muteuserMod.checkMutedUser || (() => false);
const handleAfk = afkMod.handleAfk || (() => {});
const handleChatbot = chatbotMod.handleChatbot || (() => false);
const handleChatbotInteractive = chatbotMod.handleInteractive || (() => false);
const handleGroupMentionDetect = agmMod.handleGroupMentionDetect || (() => false);
const trackMessage = topmembersMod.trackMessage || (() => {});
const checkPmBlock = pmblockerMod.checkPmBlock || (() => false);
const checkGroupSpam = santigroupspamMod.checkGroupSpam || (() => false);
const checkSavedMessage = getmsgMod.checkSavedMessage || (() => false);
const checkBadWord = antibadwordMod.checkBadWord || (() => false);
const checkSpamCooldown = spamcooldownMod.checkSpamCooldown || (() => false);
const handleDatingText = datingMod.handlePendingText || (() => false);
const handleThemeText = sessionTheme.handlePendingText || (() => false);
const enforceTheme = sessionTheme.enforce || (() => false);
const shouldIgnoreGroup = groupResponseMod.shouldIgnoreGroup || (() => false);
const isResponseControl = groupResponseMod.isControlCommand || (() => false);
const isResponseInteractive = groupResponseMod.isInteractiveControlMessage || (() => false);
const handleResponseInteractive = groupResponseMod.handleInteractive || (() => false);

const COOLDOWN_MS = 1500;
const GATE_TIMEOUT_MS = 4000;

// Auto-moderation must not become a single point of failure for replies.
// A slow network/database check is treated as unavailable for this message;
// the command handler continues instead of making the bot appear offline.
async function runGate(name, fn) {
    let timer;
    try {
        const result = await Promise.race([
            Promise.resolve().then(fn),
            new Promise(resolve => {
                timer = setTimeout(() => {
                    console.warn(`[Handler] ${name} timed out; continuing message processing`);
                    resolve(false);
                }, GATE_TIMEOUT_MS);
            }),
        ]);
        return Boolean(result);
    } catch (e) {
        console.error(`[Handler] ${name} failed:`, e.message);
        return false;
    } finally {
        if (timer) clearTimeout(timer);
    }
}

// IMPORT CAT FROM MENU
const { CAT } = require('../commands/system/menu');

function getStickerKey(stkMsg) {
    if (!stkMsg) return null;
    try {
        const sha = stkMsg.fileSha256;
        if (sha) {
            if (typeof sha === 'string') return sha;
            if (Buffer.isBuffer(sha)) return sha.toString('hex');
            if (sha instanceof Uint8Array) return Buffer.from(sha).toString('hex');
            if (sha.type === 'Buffer' && Array.isArray(sha.data)) return Buffer.from(sha.data).toString('hex');
            if (typeof sha === 'object') return Buffer.from(Object.values(sha)).toString('hex');
        }
        const enc = stkMsg.fileEncSha256;
        if (enc) {
            if (typeof enc === 'string') return 'enc:' + enc;
            if (Buffer.isBuffer(enc)) return 'enc:' + enc.toString('hex');
            if (enc instanceof Uint8Array) return 'enc:' + Buffer.from(enc).toString('hex');
            if (enc.type === 'Buffer' && Array.isArray(enc.data)) return 'enc:' + Buffer.from(enc.data).toString('hex');
        }
        return null;
    } catch { return null; }
}

async function handleMessage(sock, msg) {
    try {
        let ctx;
        try { ctx = await buildCtx(sock, msg); }
        catch (ctxErr) {
            console.error('[Handler] ctx build error:', ctxErr.message);
            try { await sock.sendMessage(msg.key.remoteJid, { text: `❌ Internal error. Try again.` }, { quoted: msg }); } catch {}
            return;
        }

        if (sessionTheme.isThemePromptMessage && sessionTheme.isThemePromptMessage(sock, msg)) return;
        try { if (await handleThemeText(sock, msg, ctx)) return; } catch (e) { console.error('[Handler] Theme selection error:', e.message); }
        try { if (await enforceTheme(sock, msg, ctx)) return; } catch (e) { console.error('[Handler] Theme gate error:', e.message); }

        { // Category carousel tap
            const body = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
            if (body) {
                try {
                    const hit = Object.entries(CAT).find(([, m]) => m.l === body);
                    if (hit) { const menuCmd = require('../commands/system/menu'); await menuCmd.sendCategoryMenu(sock, msg, ctx, hit[0]); return; }
                } catch (e) { console.error('[Handler] Category carousel tap error:', e.message); }
            }
        }

        if (ctx.isGroup && shouldIgnoreGroup(ctx) &&!(ctx.isCmd && isResponseControl(ctx.rawCmd)) &&!isResponseInteractive(msg)) return;

        const { from, sender, isCmd, rawCmd, args, isGroup, isOwner, isSenderAdmin, isBotAdmin } = ctx;
        const commandMode = ctx.commandMode;
        const s = ctx.settings;

        if (isGroup) setImmediate(() => storeMessage(from, msg));
        if (isGroup &&!msg.key.fromMe) setImmediate(() => trackMessage(from, sender));
        if (!isGroup && await runGate('PM block check', () =>
            checkPmBlock(sock, from, sender, msg, ctx)
        )) return;

        if (isGroup) {
            if (await runGate('mute check', () => checkMutedUser(sock, from, sender, msg))) return;
            if (await runGate('group mention check', () => handleGroupMentionDetect(sock, from, sender, msg))) return;
            if (await runGate('status mention check', () => isAntiStatusMention(sock, from, sender, msg))) return;
            if (await runGate('antilink check', () => isAntilink(sock, from, sender, msg, ctx))) return;
            if (antispamLib.checkSpam && await runGate('antispam check', () =>
                antispamLib.checkSpam(sock, from, sender, msg, ctx)
            )) return;
            if (await runGate('group spam check', () => checkGroupSpam(sock, from, sender, msg, ctx))) return;
            if (await runGate('bad-word check', () => checkBadWord(sock, from, sender, msg, ctx))) return;
            if (await runGate('spam cooldown check', () => checkSpamCooldown(sock, from, sender, msg, ctx))) return;
            if (groupstatusMod.checkGroupStatusLink && await runGate('group-status check', () =>
                groupstatusMod.checkGroupStatusLink(sock, from, sender, msg, ctx)
            )) return;
        }

        try { await handleAfk(sock, msg, ctx); } catch (e) { console.error('[Handler] AFK error:', e.message); }
        if (await isAntiDelete(sock, msg)) return;

        if (isGroup &&!isCmd && wordgameMod.handleWordGame) { if (await wordgameMod.handleWordGame(sock, msg, ctx)) return; }
        if (isGroup && roastbattleMod.handleTurn) { if (await roastbattleMod.handleTurn(sock, msg, ctx)) return; }

        if (!isCmd && filesMod.handlePendingText) { try { if (await filesMod.handlePendingText(sock, msg, ctx)) return; } catch (e) { console.error('[Handler] files.handlePendingText error:', e.message); } }
        if (!isCmd) { try { if (await handleDatingText(sock, msg, ctx)) return; } catch (e) { console.error('[Handler] Dating flow error:', e.message); } }
        if (!isCmd) { try { if (await handleChatbot(sock, msg, ctx)) return; } catch (e) { console.error('[Handler] Chatbot error:', e.message); } }

        if (!isCmd) {
            try {
                const db = require('./db');
                const taught = db.get('taught', 'responses', {});
                const bodyLow = ctx.body.toLowerCase().trim();
                if (taught[bodyLow]) return await sock.sendMessage(ctx.from, { text: taught[bodyLow] }, { quoted: msg });
            } catch {}
        }

        if (!isCmd) { try { if (await checkSavedMessage(sock, from, sender, msg, ctx)) return; } catch (e) { console.error('[Handler] getmsg error:', e.message); } }

        const incomingSticker = msg.message?.stickerMessage;
        if (incomingSticker) {
            const stickerKey = getStickerKey(incomingSticker);
            if (stickerKey) {
                try {
                    const db = require('./db');
                    const binds = db.get('stickercmds', 'bindings', {});
                    let bound = binds[stickerKey];
                    if (!bound) {
                        for (const [k, v] of Object.entries(binds)) {
                            try {
                                const asHex = Buffer.from(k, 'base64').toString('hex');
                                if (asHex === stickerKey) {
                                    bound = v;
                                    delete binds[k];
                                    binds[stickerKey] = v;
                                    db.set('stickercmds', 'bindings', binds);
                                    break;
                                }
                            } catch {}
                        }
                    }
                    if (bound?.cmd) {
                        const plugin = getCommand(bound.cmd);
                        if (plugin) {
                            if (commandMode === 'private' &&!isOwner) return;
                            const rlKey = `${sender}:sticker:${bound.cmd}`;
                            const last = getRateLimit(rlKey);
                            if (last && Date.now() - last < COOLDOWN_MS) return;
                            setRateLimit(rlKey, Date.now());
                            ctx.react('⚡').catch(() => {});
                            ctx.isStickerTrigger = true;
                            const ctxInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.stickerMessage?.contextInfo;
                            const repliedTo = ctxInfo?.participant || ctxInfo?.remoteJid;
                            if (repliedTo &&!repliedTo.endsWith('@g.us')) {
                                ctx._stickerTarget = repliedTo;
                                const origGetMentions = ctx.getMentions.bind(ctx);
                                ctx.getMentions = () => { const fromMsg = origGetMentions(); return fromMsg.length? fromMsg : [repliedTo]; };
                                try {
                                    if (!msg.message.extendedTextMessage) msg.message.extendedTextMessage = { contextInfo: {} };
                                    msg.message.extendedTextMessage.contextInfo.mentionedJid = [repliedTo];
                                    const stickerCtx = msg.message?.stickerMessage?.contextInfo;
                                    if (stickerCtx?.quotedMessage) {
                                        msg.message.extendedTextMessage.contextInfo.quotedMessage = stickerCtx.quotedMessage;
                                        msg.message.extendedTextMessage.contextInfo.stanzaId = stickerCtx.stanzaId;
                                        msg.message.extendedTextMessage.contextInfo.participant = stickerCtx.participant;
                                    }
                                } catch {}
                            }
                            const stickerArgs = bound.args || [];
                            await plugin.execute(sock, msg, stickerArgs, ctx);
                            return;
                        }
                    }
                } catch (e) { console.error('[Handler] Sticker trigger error:', e.message); }
            }
        }

       // ── INTERACTIVE RESPONSE COMPATIBILITY SEPT 2026 ─────────────────────────────
        const interactiveResp = msg.message?.interactiveResponseMessage;
        const buttonResp = msg.message?.buttonsResponseMessage || msg.message?.templateButtonReplyMessage;
        if (interactiveResp || buttonResp) {
            try {
                const nativeFlow = interactiveResp?.nativeFlowResponseMessage;
                const params = nativeFlow?.paramsJson? JSON.parse(nativeFlow.paramsJson) : {};
                const selectedId = params.id || buttonResp?.selectedButtonId || buttonResp?.selectedId || buttonResp?.selectedDisplayText || '';
                if (!selectedId) return;
                console.log('[BUTTON CLICKED]', selectedId);

                if (selectedId.startsWith('group_response_')) { if (await handleResponseInteractive(sock, msg, ctx, selectedId)) return; }
                if (selectedId.startsWith('chatbot_group_')) { if (await handleChatbotInteractive(sock, msg, ctx, selectedId)) return; }
                if (selectedId.startsWith('madara_theme_')) { if (await handleThemeText(sock, msg, ctx)) return; }

                // 0. BACK BUTTON - RESEND MAIN MENU
                if (selectedId === 'madara_back_menu' || selectedId === '.menu') {
                    const { execute } = require('../commands/system/menu');
                    await execute(sock, msg, [], ctx); // resend main menu so buttons stay alive
                    return;
                }

                // 1. CATEGORY FROM SINGLE_SELECT OR QUICK_REPLY
                if (selectedId.startsWith('madara_cat_')) {
                    const catKey = selectedId.replace('madara_cat_', '');
                    if (catKey === 'channel') {
                        await sock.sendMessage(ctx.from, {
                            text: menuBox('📢', 'ᴏғɪᴄɪᴀʟ ᴄʜᴀɴᴇʟ', [
                                `*Name:* ${s.botName}`,
                                `*Brand:* ${s.botBrand}`,
                                ``,
                                `_Follow for updates, new commands, and bot news!_`,
                            ]) + s.FOOTER,
                            contextInfo: {
                                forwardingScore: 1,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: s.newsletterJid || '120363424626346173@newsletter',
                                    newsletterName: `${s.botName} | ${s.botBrand}`,
                                    serverMessageId: -1,
                                }
                            }
                        }, { quoted: msg });
                        return;
                    }
                    const menuCmd = require('../commands/system/menu');
                    await menuCmd.sendCategoryMenu(sock, msg, ctx, catKey);
                    return;
                }

                // 2. CHANNEL
                if (selectedId === 'madara_channel') {
                    await sock.sendMessage(ctx.from, {
                        text: menuBox('📢', 'ᴏғɪᴄɪᴀʟ ᴄʜᴀɴᴇʟ', [
                            `*Name:* ${s.botName}`,
                            `*Brand:* ${s.botBrand}`,
                            ``,
                            `_Follow for updates, new commands, and bot news!_`,
                        ]) + s.FOOTER,
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: s.newsletterJid || '120363424626346173@newsletter',
                                newsletterName: `${s.botName} | ${s.botBrand}`,
                                serverMessageId: -1,
                            }
                        }
                    }, { quoted: msg });
                    return;
                }

                // 3. COPY CODE REMOVED - NOW USING name: "copy" IN pair.js

                // 4. SLOT
                if (selectedId === 'madara_slot_spin') { await sock.sendMessage(ctx.from, { text: `🎰 *Spinning...*\nGood luck!` }, { quoted: msg }); return; }
                if (selectedId === 'madara_slot_help') { await sock.sendMessage(ctx.from, { text: `🎰 *How to Play*\n1. Download the.html file\n2. Open in Chrome` }, { quoted: msg }); return; }
                // 5. UPTIME/PING
                if (selectedId === 'madara_ping') {
                    const uptime = process.uptime();
                    const hrs = Math.floor(uptime / 3600);
                    const mins = Math.floor((uptime % 3600) / 60);
                    const secs = Math.floor(uptime % 60);
                    const footerText = sessionTheme.footer(ctx.sessionPhone) || s.FOOTER;
                    await sock.sendMessage(ctx.from, {
                        text: `⏱️ *Uptime*\n\n` +
                              `✅ *Status:* Online\n` +
                              `🕐 *Uptime:* ${hrs}h ${mins}m ${secs}s` +
                              footerText,
                    }, { quoted: msg });
                    return;
                }

            } catch (e) { console.error('[Handler] Interactive response error:', e.message); }
            return;
        }
        // ── Legacy listResponseMessage ──────────────────────
        const listResp = msg.message?.listResponseMessage;
        if (listResp) {
            const rowId = listResp.singleSelectReply?.selectedRowId || '';
            if (!rowId) return;
            console.log('[LIST CLICKED]', rowId);

            if (rowId.startsWith('group_response_')) { try { if (await handleResponseInteractive(sock, msg, ctx, rowId)) return; } catch (e) { console.error('[Handler] Group response list error:', e.message); } }
            if (rowId.startsWith('chatbot_group_')) { try { if (await handleChatbotInteractive(sock, msg, ctx, rowId)) return; } catch (e) { console.error('[Handler] Chatbot list response error:', e.message); } }
            if (rowId.startsWith('madara_theme_')) { try { if (await handleThemeText(sock, msg, ctx)) return; } catch (e) { console.error('[Handler] Theme list response error:', e.message); } }

            if (rowId.startsWith('madara_cat_')) {
                const catKey = rowId.replace('madara_cat_', '');
                try { const menuCmd = require('../commands/system/menu'); await menuCmd.sendCategoryMenu(sock, msg, ctx, catKey); }
                catch (e) { console.error('[Handler] List response error:', e.message); }
                return;
            }
            if (rowId === 'madara_channel') {
                await sock.sendMessage(ctx.from, {
                    text: menuBox('📢', 'ᴏғɪᴄɪᴀʟ ᴄʜᴀɴᴇʟ', [
                        `*Name:* ${s.botName}`,
                        `*Brand:* ${s.botBrand}`,
                        ``,
                        `_Follow for updates, new commands, and bot news!_`,
                    ]) + s.FOOTER,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: s.newsletterJid || '120363424626346173@newsletter',
                            newsletterName: `${s.botName} | ${s.botBrand}`,
                            serverMessageId: -1,
                        }
                    }
                }, { quoted: msg });
                return;
            }
            if (rowId.startsWith('madara_cmd_')) {
                const cmdName = rowId.replace('madara_cmd_', '');
                try { const synthMsg = {...msg, message: { conversation: `${s.prefix}${cmdName}` } }; await handleMessage(sock, synthMsg); }
                catch (e) { console.error('[Handler] Command list response error:', e.message); }
            }
            return;
        }

        if (!isCmd ||!rawCmd) return;
        let plugin = getCommand(rawCmd);
        if (!plugin) return;

        function normJid(jid) { return (jid || '').split('@')[0].split(':')[0].replace(/^0+/, ''); }
        let hasSudo = isOwner;
        if (!hasSudo) { try { const db = require('./db'); const sudoList = db.get('system', 'sudo', []); const sndNorm = normJid(sender); hasSudo = sudoList.some(s2 => s2 === sender || normJid(s2) === sndNorm); } catch {} }
        if (commandMode === 'private' &&!hasSudo) return;

        if (plugin.devOnly &&!ctx.isDevOwner) return ctx.reply(`${sessionTheme.string(ctx.sessionPhone, 'dev', '⛔ This command is reserved for the developer.')}\n${ctx.FOOTER}`);
        if (plugin.ownerOnly &&!hasSudo) return ctx.reply(`${sessionTheme.string(ctx.sessionPhone, 'owner', '⛔ This command is reserved for the bot owner.')}\n${ctx.FOOTER}`);
        if (plugin.groupOnly &&!isGroup) return ctx.reply(`${sessionTheme.string(ctx.sessionPhone, 'group', '❌ This command can only be used in groups.')}\n${ctx.FOOTER}`);
        if (plugin.privateOnly && isGroup) return ctx.reply(`${sessionTheme.string(ctx.sessionPhone, 'private', '❌ This command can only be used in private chat.')}\n${ctx.FOOTER}`);

        if (plugin.adminOnly &&!isSenderAdmin &&!hasSudo) {
            if (ctx.isGroup) {
                const cached = sock._groupMetaCache?.get(ctx.from);
                const parts = cached?.participants || ctx.groupMeta?.participants || [];
                const sRaw = ctx.sender.split('@')[0].replace(/^0+/, '');
                const pkRaw = (msg.key.participant || '').split('@')[0].replace(/^0+/, '');
                const isAdm = parts.some(p => { const pRaw = (p.id || '').split('@')[0].replace(/^0+/, ''); const lRaw = (p.lid || '').split('@')[0].replace(/^0+/, ''); return (pRaw === sRaw || lRaw === sRaw || pRaw === pkRaw || lRaw === pkRaw) && (p.admin === 'admin' || p.admin === 'superadmin'); });
                if (!isAdm) return ctx.reply(`${sessionTheme.string(ctx.sessionPhone, 'admin', '❌ Group admins only.')}\n${ctx.FOOTER}`);
            } else { return ctx.reply(`❌ *Group admins only.*${settings.FOOTER}`); }
        }
        if (plugin.botAdminNeeded &&!isBotAdmin) {
              let liveBotAdmin = false;
              if (isGroup) {
                  try {
                      const freshMeta = await sock.groupMetadata(from);
                      if (!sock._groupMetaCache) sock._groupMetaCache = new Map();
                      if (!sock._groupMetaCacheTs) sock._groupMetaCacheTs = new Map();
                      sock._groupMetaCache.set(from, freshMeta); sock._groupMetaCacheTs.set(from, Date.now());
                      const freshParts = freshMeta?.participants || [];
                      const botRawId = (sock.user?.id || '').split(':')[0].split('@')[0].replace(/^0+/, '');
                      const botLidId = (sock.user?.lid || '').split(':')[0].split('@')[0].replace(/^0+/, '');
                      const botCanon = botRawId + '@s.whatsapp.net';
                      liveBotAdmin = freshParts.some(p => { if (!p || (p.admin!== 'admin' && p.admin!== 'superadmin')) return false; const pNum = (p.id || '').split('@')[0].split(':')[0].replace(/^0+/, ''); const pLid = (p.lid || '').split('@')[0].split(':')[0].replace(/^0+/, ''); return p.id === botCanon || pNum === botRawId || (botLidId && pLid === botLidId) || (botLidId && pNum === botLidId) || (botRawId && pLid === botRawId); });
                  } catch {}
              }
              if (!liveBotAdmin) return ctx.reply(`${sessionTheme.string(ctx.sessionPhone, 'botAdmin', '❌ Make me a group admin first.')}\n${ctx.FOOTER}`);
          }

        if (!hasSudo) { const key = `${sender}:${rawCmd}`; const last = getRateLimit(key); if (last && Date.now() - last < COOLDOWN_MS) return; setRateLimit(key, Date.now()); }

        if (plugin.waitReact!== false) ctx.react('⏳').catch(() => {});
        await plugin.execute(sock, msg, args, ctx);
        if (plugin.waitReact!== false) ctx.react('✅').catch(() => {});

    } catch (err) {
        const errMsg = err?.message || String(err);
        if (!errMsg.includes('Connection Closed') &&!errMsg.includes('rate-overlimit') &&!errMsg.includes('not-authorized')) {
            console.error('[Handler] Error:', errMsg.slice(0, 150));
        }
        try {
            if (msg?.key?.remoteJid &&!errMsg.includes('Connection Closed')) {
                await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${errMsg.slice(0, 80)}${settings.FOOTER}` }, { quoted: msg });
            }
        } catch {}
    }
}

module.exports = { handleMessage };