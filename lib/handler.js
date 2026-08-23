// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Message Handler / Router          ║
// ╚══════════════════════════════════════════════════════╝

const settings = require('../settings');
const { buildCtx }   = require('./context');
const { getCommand } = require('./loader');
const { getRateLimit, setRateLimit } = require('./ratelimit');

function safeRequire(mod) {
    try { return require(mod); } catch (e) {
        console.warn('[Handler] Could not load:', mod, '—', e.message);
        return {};
    }
}

const antilinkMod   = safeRequire('../commands/group/antilink');
const agmMod        = safeRequire('../commands/group/antigroupmention');
const antideleteMod = safeRequire('../commands/group/antidelete');
const antistatusMod = safeRequire('../commands/group/antistatusmention');
const muteuserMod   = safeRequire('../commands/group/muteuser');
const afkMod        = safeRequire('../commands/utility/afk');
const chatbotMod    = safeRequire('../commands/utility/chatbot');
const topmembersMod = safeRequire('../commands/group/topmembers');
const antispamLib   = safeRequire('./antispam');
const groupstatusMod = safeRequire('../commands/group/groupstatus');
const wordgameMod   = safeRequire('../commands/fun/wordgame');
const roastbattleMod = safeRequire('../commands/fun/roastbattle');
const filesMod       = safeRequire('../commands/system/files');
const pmblockerMod   = safeRequire('../commands/misc/pmblocker');
const santigroupspamMod = safeRequire('../commands/group/santigroupspam');
const getmsgMod      = safeRequire('../commands/misc/getmsg');
const antibadwordMod = safeRequire('../commands/group/antibadword');
const spamcooldownMod = safeRequire('../commands/group/spamcooldown');
const datingMod = safeRequire('./dating');
const sessionTheme = safeRequire('./sessionTheme');

const isAntilink          = antilinkMod.isAntilink           || (() => false);
const isAntiDelete        = antideleteMod.isAntiDelete        || (() => false);
const storeMessage        = antideleteMod.storeMessage        || (() => {});
const isAntiStatusMention = antistatusMod.isAntiStatusMention || (() => false);
const checkMutedUser      = muteuserMod.checkMutedUser        || (() => false);
const handleAfk           = afkMod.handleAfk              || (() => {});
const handleChatbot       = chatbotMod.handleChatbot       || (() => false);
const handleGroupMentionDetect = agmMod.handleGroupMentionDetect || (() => false);
const trackMessage        = topmembersMod.trackMessage        || (() => {});
const checkPmBlock        = pmblockerMod.checkPmBlock          || (() => false);
const checkGroupSpam      = santigroupspamMod.checkGroupSpam    || (() => false);
const checkSavedMessage   = getmsgMod.checkSavedMessage         || (() => false);
const checkBadWord        = antibadwordMod.checkBadWord          || (() => false);
const checkSpamCooldown   = spamcooldownMod.checkSpamCooldown     || (() => false);
const handleDatingText    = datingMod.handlePendingText         || (() => false);
const handleThemeText     = sessionTheme.handlePendingText       || (() => false);
const enforceTheme        = sessionTheme.enforce                  || (() => false);

const COOLDOWN_MS = 1500;

// ── Sticker key helper ─────────────────────────────────────────────────────
function getStickerKey(stkMsg) {
    if (!stkMsg) return null;
    try {
        // Try fileSha256 first (most stable identifier)
        const sha = stkMsg.fileSha256;
        if (sha) {
            if (typeof sha === 'string') return sha; // already a string key
            if (Buffer.isBuffer(sha)) return sha.toString('hex');
            if (sha instanceof Uint8Array) return Buffer.from(sha).toString('hex');
            // Plain object from JSON.parse: {type:'Buffer',data:[...]} or {0:x,1:y,...}
            if (sha.type === 'Buffer' && Array.isArray(sha.data)) return Buffer.from(sha.data).toString('hex');
            if (typeof sha === 'object') return Buffer.from(Object.values(sha)).toString('hex');
        }
        // Fallback: fileEncSha256
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
        try {
            ctx = await buildCtx(sock, msg);
        } catch (ctxErr) {
            // If context build fails, still try to reply with error
            console.error('[Handler] ctx build error:', ctxErr.message);
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Internal error. Try again.`
                }, { quoted: msg });
            } catch {}
            return;
        }

        // ── Session theme must be selected before registration or commands ──
        try { if (await handleThemeText(sock, msg, ctx)) return; }
        catch (e) { console.error('[Handler] Theme selection error:', e.message); }
        try { if (await enforceTheme(sock, msg, ctx)) return; }
        catch (e) { console.error('[Handler] Theme gate error:', e.message); }

        // groupMeta is now TTL-cached in context.js — no manual caching needed here
        const { from, sender, isCmd, rawCmd, args, isGroup, isOwner, isSenderAdmin, isBotAdmin } = ctx;

        // ── Per-session command mode (read from ctx, not global settings) ──
        // ctx.commandMode is resolved per-session in context.js so changing
        // mode for user A never affects user B.
        const commandMode = ctx.commandMode;

        // ── Store messages for anti-delete (fire-and-forget) ──────────
        if (isGroup) setImmediate(() => storeMessage(from, msg));

        // ── Track message count (fire-and-forget) ───────────────────────
        if (isGroup && !msg.key.fromMe) setImmediate(() => trackMessage(from, sender));

        // ── PM Blocker — private messages only ───────────────────────
        if (!isGroup) {
            if (await checkPmBlock(sock, from, sender, msg, ctx)) return;
        }

        // ── Auto-moderation ────────────────────────────────────────────
        if (isGroup) {
            if (await checkMutedUser(sock, from, sender, msg)) return;
            if (await handleGroupMentionDetect(sock, from, sender, msg)) return;
            if (await isAntiStatusMention(sock, from, sender, msg)) return;
            if (await isAntilink(sock, from, sender, msg, ctx)) return;
            if (antispamLib.checkSpam && await antispamLib.checkSpam(sock, from, sender, msg, ctx)) return;
            if (await checkGroupSpam(sock, from, sender, msg, ctx)) return;
            if (await checkBadWord(sock, from, sender, msg, ctx)) return;
            if (await checkSpamCooldown(sock, from, sender, msg, ctx)) return;
            if (groupstatusMod.checkGroupStatusLink && await groupstatusMod.checkGroupStatusLink(sock, from, sender, msg, ctx)) return;
        }
        // ── AFK: clear sender's AFK status + notify if an AFK user is mentioned ──
        // Runs on EVERY message (including commands) so AFK clears the instant
        // the user sends anything, and mention notices fire regardless of isCmd.
        try { await handleAfk(sock, msg, ctx); } catch (e) { console.error('[Handler] AFK error:', e.message); }

        if (await isAntiDelete(sock, msg)) return;

        // ── Word game plain-message handler ────────────────────────────
        if (isGroup && !isCmd && wordgameMod.handleWordGame) {
            if (await wordgameMod.handleWordGame(sock, msg, ctx)) return;
        }
        if (isGroup && roastbattleMod.handleTurn) {
            if (await roastbattleMod.handleTurn(sock, msg, ctx)) return;
        }

        // ── Files shop: plain-text reply to device model / platform prompt ──
        // Must run for non-command messages BEFORE the `!isCmd` early return
        // below, since .files's execute() is never called for plain replies.
        if (!isCmd && filesMod.handlePendingText) {
            try {
                if (await filesMod.handlePendingText(sock, msg, ctx)) return;
            } catch (e) { console.error('[Handler] files.handlePendingText error:', e.message); }
        }

        // ── Dating registration and match selection replies ─────────────
        if (!isCmd) {
            try { if (await handleDatingText(sock, msg, ctx)) return; }
            catch (e) { console.error('[Handler] Dating flow error:', e.message); }
        }

        // ── Chatbot: respond when tagged / replied to (non-command messages) ──
        if (!isCmd) {
            try {
                if (await handleChatbot(sock, msg, ctx)) return;
            } catch (e) { console.error('[Handler] Chatbot error:', e.message); }
        }

        // ── Taught auto-responses ──────────────────────────────────────
        if (!isCmd) {
            try {
                const db       = require('./db');
                const taught   = db.get('taught', 'responses', {});
                const bodyLow  = ctx.body.toLowerCase().trim();
                if (taught[bodyLow])
                    return await sock.sendMessage(ctx.from, { text: taught[bodyLow] }, { quoted: msg });
            } catch {}
        }

        // ── Saved messages (getmsg) ──────────────────────────────────────
        if (!isCmd) {
            try {
                if (await checkSavedMessage(sock, from, sender, msg, ctx)) return;
            } catch (e) { console.error('[Handler] getmsg error:', e.message); }
        }

        // ── Sticker command trigger ────────────────────────────────────
        // Fires when someone sends a sticker that has been bound to a command
        const incomingSticker = msg.message?.stickerMessage;
        if (incomingSticker) {
            const stickerKey = getStickerKey(incomingSticker);
            if (stickerKey) {
                try {
                    const db    = require('./db');
                    const binds = db.get('stickercmds', 'bindings', {});
                    // Exact key match first, then fallback for old base64 keys
                    let bound = binds[stickerKey];
                    if (!bound) {
                        for (const [k, v] of Object.entries(binds)) {
                            try {
                                // Old keys were base64, new ones are hex — try converting
                                const asHex = Buffer.from(k, 'base64').toString('hex');
                                if (asHex === stickerKey) {
                                    bound = v;
                                    // Migrate to new hex key format automatically
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
                            // Mode check — use per-session commandMode
                            if (commandMode === 'private' && !isOwner) return;

                            // Rate limit sticker triggers too
                            const rlKey = `${sender}:sticker:${bound.cmd}`;
                            const last  = getRateLimit(rlKey);
                            if (last && Date.now() - last < COOLDOWN_MS) return;
                            setRateLimit(rlKey, Date.now());

                            // React to show it triggered
                            ctx.react('⚡').catch(() => {});
                            ctx.isStickerTrigger = true;

                            // If sticker was sent as a REPLY to a user's message,
                            // inject that user as a mention so cmds like tag/kick work directly
                            const ctxInfo = msg.message?.extendedTextMessage?.contextInfo
                                         || msg.message?.stickerMessage?.contextInfo;
                            const repliedTo = ctxInfo?.participant || ctxInfo?.remoteJid;
                            if (repliedTo && !repliedTo.endsWith('@g.us')) {
                                // Override getMentions to return the replied-to user
                                ctx._stickerTarget = repliedTo;
                                const origGetMentions = ctx.getMentions.bind(ctx);
                                ctx.getMentions = () => {
                                    const fromMsg = origGetMentions();
                                    return fromMsg.length ? fromMsg : [repliedTo];
                                };
                                // Also patch the message contextInfo so mentions work
                                try {
                                    if (!msg.message.extendedTextMessage) {
                                        msg.message.extendedTextMessage = { contextInfo: {} };
                                    }
                                    msg.message.extendedTextMessage.contextInfo.mentionedJid =
                                        [repliedTo];

                                    // Bridge over the actual quoted MESSAGE CONTENT too —
                                    // not just who sent it. A sticker's own reply-context
                                    // lives at stickerMessage.contextInfo, never at
                                    // extendedTextMessage.contextInfo, so any command that
                                    // reads ctxInfo.quotedMessage (like .ghost checking for
                                    // a replied view-once) always saw nothing when triggered
                                    // via a bound sticker — even though the sticker WAS sent
                                    // as a reply to real content. Without this, .ghost bound
                                    // to a sticker used on a view-once always fell through to
                                    // "no valid target," which is exactly the bug reported.
                                    const stickerCtx = msg.message?.stickerMessage?.contextInfo;
                                    if (stickerCtx?.quotedMessage) {
                                        msg.message.extendedTextMessage.contextInfo.quotedMessage = stickerCtx.quotedMessage;
                                        msg.message.extendedTextMessage.contextInfo.stanzaId      = stickerCtx.stanzaId;
                                        msg.message.extendedTextMessage.contextInfo.participant   = stickerCtx.participant;
                                    }
                                } catch {}
                            }

                            const stickerArgs = bound.args || [];
                            await plugin.execute(sock, msg, stickerArgs, ctx);
                            return;
                        }
                    }
                } catch (e) {
                    console.error('[Handler] Sticker trigger error:', e.message);
                }
            }
        }

        // ── Interactive response compatibility ─────────────────────────────
        // @itsliaaa/baileys native-flow replies arrive in interactiveResponseMessage.
        // Older clients/fallback payloads may arrive as buttonsResponseMessage or
        // templateButtonReplyMessage, so normalize all three forms here.
        const interactiveResp = msg.message?.interactiveResponseMessage;
        const buttonResp = msg.message?.buttonsResponseMessage
            || msg.message?.templateButtonReplyMessage;
        if (interactiveResp || buttonResp) {
            try {
                const nativeFlow = interactiveResp?.nativeFlowResponseMessage;
                const params = nativeFlow?.paramsJson
                    ? JSON.parse(nativeFlow.paramsJson)
                    : {};
                const selectedId = params.id
                    || buttonResp?.selectedButtonId
                    || buttonResp?.selectedId
                    || buttonResp?.selectedDisplayText
                    || '';
                if (selectedId.startsWith('madara_cat_')) {
                    const catKey = selectedId.replace('madara_cat_', '');
                    const menuCmd = require('../commands/system/menu');
                    await menuCmd.sendCategoryMenu(sock, msg, ctx, catKey);
                }
            } catch (e) {
                console.error('[Handler] Interactive response error:', e.message);
            }
            return;
        }

        // ── Legacy listResponseMessage (fallback) ──────────────────────
        const listResp = msg.message?.listResponseMessage;
        if (listResp) {
            const rowId = listResp.singleSelectReply?.selectedRowId || '';
            if (rowId.startsWith('madara_cat_')) {
                const catKey = rowId.replace('madara_cat_', '');
                try {
                    const menuCmd = require('../commands/system/menu');
                    await menuCmd.sendCategoryMenu(sock, msg, ctx, catKey);
                } catch (e) {
                    console.error('[Handler] List response error:', e.message);
                }
            }
            return;
        }

        // ── Must be a prefix command beyond this point ─────────────────
        if (!isCmd || !rawCmd) return;

        // ── Find plugin ────────────────────────────────────────────────
        let plugin = getCommand(rawCmd);
        if (!plugin) return;

        // ── Sudo check — normalize JIDs for LID compatibility ─────────────
        function normJid(jid) { return (jid || '').split('@')[0].split(':')[0].replace(/^0+/, ''); }
        let hasSudo = isOwner;
        if (!hasSudo) {
            try {
                const db       = require('./db');
                const sudoList = db.get('system', 'sudo', []);
                const sndNorm  = normJid(sender);
                hasSudo = sudoList.some(s2 => s2 === sender || normJid(s2) === sndNorm);
            } catch {}
        }

        // ── Mode check — use per-session commandMode ───────────────────
        if (commandMode === 'private' && !hasSudo) return;

        // ── Guards ─────────────────────────────────────────────────────
        // devOnly = real bot owner (OWNER_NUMBER in .env) ONLY. Paired users
        // and sudo entries do NOT count, even though they pass as "owner" for
        // regular ownerOnly commands. Reserved for destructive/sensitive
        // commands (exec, allvars, getfile, shutdown, etc).
        if (plugin.devOnly && !ctx.isDevOwner) {
            return ctx.reply(`${sessionTheme.string(ctx.sessionPhone, 'dev', '⛔ This command is reserved for the developer.')}\n${ctx.FOOTER}`);
        }
        if (plugin.ownerOnly && !hasSudo) {
            return ctx.reply(`${sessionTheme.string(ctx.sessionPhone, 'owner', '⛔ This command is reserved for the bot owner.')}\n${ctx.FOOTER}`);
        }
        if (plugin.groupOnly    && !isGroup)                   return ctx.reply(`${sessionTheme.string(ctx.sessionPhone, 'group', '❌ This command can only be used in groups.')}\n${ctx.FOOTER}`);
        if (plugin.privateOnly  && isGroup)                    return ctx.reply(`${sessionTheme.string(ctx.sessionPhone, 'private', '❌ This command can only be used in private chat.')}\n${ctx.FOOTER}`);
        if (plugin.adminOnly && !isSenderAdmin && !hasSudo) {
            if (ctx.isGroup) {
                // Double-check using raw number comparison against cached participants
                const cached = sock._groupMetaCache?.get(ctx.from);
                const parts  = cached?.participants || ctx.groupMeta?.participants || [];
                const sRaw   = ctx.sender.split('@')[0].replace(/^0+/, '');
                const pkRaw  = (msg.key.participant || '').split('@')[0].replace(/^0+/, '');
                const isAdm  = parts.some(p => {
                    const pRaw = (p.id  || '').split('@')[0].replace(/^0+/, '');
                    const lRaw = (p.lid || '').split('@')[0].replace(/^0+/, '');
                    return (pRaw === sRaw || lRaw === sRaw || pRaw === pkRaw || lRaw === pkRaw) &&
                           (p.admin === 'admin' || p.admin === 'superadmin');
                });
                if (!isAdm) return ctx.reply(`${sessionTheme.string(ctx.sessionPhone, 'admin', '❌ Group admins only.')}\n${ctx.FOOTER}`);
            } else {
                return ctx.reply(`❌ *Group admins only.*${settings.FOOTER}`);
            }
        }
        if (plugin.botAdminNeeded && !isBotAdmin) {
              // Cache may be stale — do a live fetch before rejecting
              let liveBotAdmin = false;
              if (isGroup) {
                  try {
                      const freshMeta = await sock.groupMetadata(from);
                      // Update cache with fresh data
                      if (!sock._groupMetaCache)   sock._groupMetaCache   = new Map();
                      if (!sock._groupMetaCacheTs) sock._groupMetaCacheTs = new Map();
                      sock._groupMetaCache.set(from,   freshMeta);
                      sock._groupMetaCacheTs.set(from, Date.now());

                      const freshParts = freshMeta?.participants || [];
                      const botRawId   = (sock.user?.id || '').split(':')[0].split('@')[0].replace(/^0+/, '');
                      const botLidId   = (sock.user?.lid || '').split(':')[0].split('@')[0].replace(/^0+/, '');
                      const botCanon   = botRawId + '@s.whatsapp.net';

                      liveBotAdmin = freshParts.some(p => {
                          if (!p || (p.admin !== 'admin' && p.admin !== 'superadmin')) return false;
                          const pNum = (p.id  || '').split('@')[0].split(':')[0].replace(/^0+/, '');
                          const pLid = (p.lid || '').split('@')[0].split(':')[0].replace(/^0+/, '');
                          return p.id === botCanon ||
                                 pNum === botRawId ||
                                 (botLidId && pLid === botLidId) ||
                                 (botLidId && pNum === botLidId) ||
                                 (botRawId && pLid === botRawId);
                      });
                  } catch {}
              }
              if (!liveBotAdmin) return ctx.reply(`${sessionTheme.string(ctx.sessionPhone, 'botAdmin', '❌ Make me a group admin first.')}\n${ctx.FOOTER}`);
          }

        // ── Rate limit ─────────────────────────────────────────────────
        if (!hasSudo) {
            const key  = `${sender}:${rawCmd}`;
            const last = getRateLimit(key);
            if (last && Date.now() - last < COOLDOWN_MS) return;
            setRateLimit(key, Date.now());
        }

        // ── Execute ────────────────────────────────────────────────────
        if (plugin.waitReact !== false) ctx.react('⏳').catch(() => {});
        await plugin.execute(sock, msg, args, ctx);
        if (plugin.waitReact !== false) ctx.react('✅').catch(() => {});

    } catch (err) {
        // Catch ALL errors — bot must never stop responding due to a single message
        const errMsg = err?.message || String(err);
        if (!errMsg.includes('Connection Closed') &&
            !errMsg.includes('rate-overlimit') &&
            !errMsg.includes('not-authorized')) {
            console.error('[Handler] Error:', errMsg.slice(0, 150));
        }
        try {
            if (msg?.key?.remoteJid && !errMsg.includes('Connection Closed')) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Error: ${errMsg.slice(0, 80)}${settings.FOOTER}`
                }, { quoted: msg });
            }
        } catch {}
        // Never rethrow — keep the event listener alive
    }
}

module.exports = { handleMessage };
