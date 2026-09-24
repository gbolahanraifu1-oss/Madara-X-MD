'use strict';
const settings = require('../settings');
const { buildCtx } = require('./context');
const { getCommand } = require('./loader');
const { getRateLimit, setRateLimit } = require('./ratelimit');
const { menuBox } = require('./menuBox');

function safeRequire(mod){
  try { return require(mod); } catch(e){
    console.warn('[handler] could not load:', mod, '—', e.message);
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
const sessionTheme = safeRequire('./sessionTheme');
const groupresponseMod = safeRequire('../commands/system/response');

const isAntilink = antilinkMod.isAntilink || (() => false);
const isAntidelete = antideleteMod.isAntidelete || (() => false);
const storeMessage = antideleteMod.storeMessage || (() => {});
const isAntistatusmention = antistatusMod.isAntistatusmention || (() => false);
const checkMutedUser = muteuserMod.checkMutedUser || (() => false);
const handleAfk = afkMod.handleAfk || (() => {});
const handleChatbot = chatbotMod.handleChatbot || (() => false);
const handleChatbotInteractive = chatbotMod.handleInteractive || (() => false);
const handleGroupMentionDetect = agmMod.handleGroupMentionDetect || (() => false);
const trackMessage = topmembersMod.trackMessage || (() => {});
const checkPmBlock = pmblockerMod.checkPmBlock || (() => false);
const checkGroupSpam = santigroupspamMod.checkGroupSpam || (() => false);
const checkSavedMessage = getmsgMod.checkSavedMessage || (() => false);
const checkBadword = antibadwordMod.checkBadword || (() => false);
const checkSpamCooldown = spamcooldownMod.checkSpamCooldown || (() => false);
const handleThemeText = sessionTheme.handlePendingText || (() => false);
const enforceTheme = sessionTheme.enforce || (() => false);
const shouldIgnoreGroup = groupresponseMod.shouldIgnoreGroup || (() => false);
const isResponseControl = groupresponseMod.isControlCommand || (() => false);
const isResponseInteractive = groupresponseMod.isInteractiveControlMessage || (() => false);
const handleResponseInteractive = groupresponseMod.handleInteractive || (() => false);

const COOLDOWN_MS = 1500;
const { CAT } = require('../commands/system/menu');

function getStickerKey(stkMsg){
  if(!stkMsg) return null;
  try{
    const sha = stkMsg.fileSha256;
    if(sha){
      if(typeof sha === 'string') return sha;
      if(Buffer.isBuffer(sha)) return sha.toString('hex');
      if(sha instanceof Uint8Array) return Buffer.from(sha).toString('hex');
      if(sha.type === 'Buffer' && Array.isArray(sha.data)) return Buffer.from(sha.data).toString('hex');
      if(typeof sha === 'object') return Buffer.from(Object.values(sha)).toString('hex');
    }
    const enc = stkMsg.fileEncSha256;
    if(enc){
      if(typeof enc === 'string') return 'enc:' + enc;
      if(Buffer.isBuffer(enc)) return 'enc:' + enc.toString('hex');
      if(enc instanceof Uint8Array) return 'enc:' + Buffer.from(enc).toString('hex');
      if(enc.type === 'Buffer' && Array.isArray(enc.data)) return 'enc:' + Buffer.from(enc.data).toString('hex');
    }
    return null;
  } catch { return null; }
}

async function handleMessage(sock, msg){
  try{
    let ctx;
    try { ctx = await buildCtx(sock, msg); }
    catch(ctxErr){
      console.error('[handler] ctx build error:', ctxErr.message);
      try { await sock.sendMessage(msg.key.remoteJid, { text: `❌ Internal error. Try again.` }, { quoted: msg }); } catch {}
      return;
    }

    if(sessionTheme.isThemePromptMessage && sessionTheme.isThemePromptMessage(sock, msg)) return;

    // category carousel tap (old list)
    {
      const body = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
      if(body){
        try{
          const hit = Object.entries(CAT).find(([, m]) => m.l === body);
          if(hit){
            const menuCmd = require('../commands/system/menu');
            await menuCmd.sendCategoryMenu(sock, msg, ctx, hit[0]);
            return;
          }
        } catch(e){ console.error('[handler] category carousel tap error:', e.message); }
      }
    }

    if(ctx.isGroup && shouldIgnoreGroup(ctx) &&!(ctx.isCmd && isResponseControl(ctx.rawCmd)) &&!isResponseInteractive(msg)) return;

    const { from, sender, isCmd, rawCmd, args, isGroup, isOwner, isSenderAdmin, isBotAdmin } = ctx;
    const commandMode = ctx.commandMode;
    const s = ctx.settings;

    if(isGroup) setImmediate(() => storeMessage(from, msg));
    if(isGroup &&!msg.key.fromMe) setImmediate(() => trackMessage(from, sender));
    if(!isGroup){ if(await checkPmBlock(sock, from, sender, msg, ctx)) return; }

    if(isGroup){
      if(await checkMutedUser(sock, from, sender, msg)) return;
      if(await handleGroupMentionDetect(sock, from, sender, msg)) return;
      if(await isAntistatusmention(sock, from, sender, msg)) return;
      if(await isAntilink(sock, from, sender, msg, ctx)) return;
      if(antispamLib.checkSpam && await antispamLib.checkSpam(sock, from, sender, msg, ctx)) return;
      if(await checkGroupSpam(sock, from, sender, msg, ctx)) return;
      if(await checkBadword(sock, from, sender, msg, ctx)) return;
      if(await checkSpamCooldown(sock, from, sender, msg, ctx)) return;
      if(groupstatusMod.checkGroupStatusLink && await groupstatusMod.checkGroupStatusLink(sock, from, sender, msg, ctx)) return;
    }

    try { await handleAfk(sock, msg, ctx); } catch(e){ console.error('[handler] afk error:', e.message); }
    if(await isAntidelete(sock, msg)) return;

    if(isGroup &&!isCmd && wordgameMod.handleWordGame){ if(await wordgameMod.handleWordGame(sock, msg, ctx)) return; }
    if(isGroup && roastbattleMod.handleTurn){ if(await roastbattleMod.handleTurn(sock, msg, ctx)) return; }

    if(!isCmd && filesMod.handlePendingText){
      try { if(await filesMod.handlePendingText(sock, msg, ctx)) return; }
      catch(e){ console.error('[handler] files.handlePendingText error:', e.message); }
    }

    try { if(await handleThemeText(sock, msg, ctx)) return; }
    catch(e){ console.error('[handler] theme selection error:', e.message); }

    try { if(await enforceTheme(sock, msg, ctx)) return; }
    catch(e){ console.error('[handler] theme gate error:', e.message); }

    if(!isCmd &&!msg.key.fromMe){
      try { if(await handleChatbot(sock, msg, ctx)) return; }
      catch(e){ console.error('[handler] chatbot error:', e.message); }
    }

    if(!isCmd){
      try{
        const db = require('./db');
        const taught = db.get('taught', 'responses', {});
        const bodyLow = ctx.body.toLowerCase().trim();
        if(taught[bodyLow]) return await sock.sendMessage(ctx.from, { text: taught[bodyLow] }, { quoted: msg });
      } catch {}
    }

    if(!isCmd){
      try { if(await checkSavedMessage(sock, from, sender, msg, ctx)) return; }
      catch(e){ console.error('[handler] getmsg error:', e.message); }
    }

    // sticker cmd trigger
    const incomingSticker = msg.message?.stickerMessage;
    if(incomingSticker){
      const stickerKey = getStickerKey(incomingSticker);
      if(stickerKey){
        try{
          const db = require('./db');
          const binds = db.get('stickercmds', 'bindings', {});
          let bound = binds[stickerKey];
          if(!bound){
            for(const [k,v] of Object.entries(binds)){
              try{
                const asHex = Buffer.from(k, 'base64').toString('hex');
                if(asHex === stickerKey){
                  bound = v;
                  delete binds[k];
                  binds[stickerKey] = v;
                  db.set('stickercmds', 'bindings', binds);
                  break;
                }
              } catch {}
            }
          }
          if(bound?.cmd){
            const plugin = getCommand(bound.cmd);
            if(plugin){
              if(commandMode === 'private' &&!isOwner) return;
              const rlKey = `${sender}:sticker:${bound.cmd}`;
              const last = getRateLimit(rlKey);
              if(last && Date.now() - last < COOLDOWN_MS) return;
              setRateLimit(rlKey, Date.now());
              ctx.react('⚡').catch(()=>{});
              ctx.isStickerTrigger = true;
              const ctxInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.stickerMessage?.contextInfo;
              const repliedTo = ctxInfo?.participant || ctxInfo?.remoteJid;
              if(repliedTo &&!repliedTo.endsWith('@g.us')){
                ctx._stickerTarget = repliedTo;
                const origGetMentions = ctx.getMentions.bind(ctx);
                ctx.getMentions = () => { const fromMsg = origGetMentions(); return fromMsg.length? fromMsg : [repliedTo]; };
                try{
                  if(!msg.message.extendedTextMessage) msg.message.extendedTextMessage = { contextInfo: {} };
                  msg.message.extendedTextMessage.contextInfo.mentionedJid = [repliedTo];
                  const stickerCtx = msg.message?.stickerMessage?.contextInfo;
                  if(stickerCtx?.quotedMessage){
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
        } catch(e){ console.error('[handler] sticker trigger error:', e.message); }
      }
    }

    // ── INTERACTIVE RESPONSE HANDLER (button + nativeflow + list) ──
    const interactiveResp = msg.message?.interactiveResponseMessage;
    const buttonResp = msg.message?.buttonsResponseMessage || msg.message?.templateButtonReplyMessage;
    if(interactiveResp || buttonResp){
      try{
        const nativeFlow = interactiveResp?.nativeFlowResponseMessage;
        const params = nativeFlow?.paramsJson? JSON.parse(nativeFlow.paramsJson) : {};
        const selectedId = params.id || buttonResp?.selectedButtonId || buttonResp?.selectedId || buttonResp?.selectedDisplayText || '';
        if(!selectedId) return;
        console.log('[button clicked]', selectedId);

        if(selectedId.startsWith('group_response_')){ if(await handleResponseInteractive(sock, msg, ctx, selectedId)) return; }
        if(selectedId.startsWith('chatbot_group_')){ if(await handleChatbotInteractive(sock, msg, ctx, selectedId)) return; }
        if(selectedId.startsWith('madara_theme_')){ if(await handleThemeText(sock, msg, ctx)) return; }

        if(selectedId === 'madara_back_menu' || selectedId === '.menu'){
          const { execute } = require('../commands/system/menu');
          await execute(sock, msg, [], ctx);
          return;
        }

        if(selectedId.startsWith('madara_cat_')){
          const catKey = selectedId.replace('madara_cat_', '');
          if(catKey === 'channel'){
            await sock.sendMessage(ctx.from, {
              text: menuBox('📢','official channel',[
                `*Name:* ${s.botName}`,
                `*Brand:* ${s.botBrand}`,
                ``,
                `_Follow for updates, new commands, and bot news!_`,
              ]) + s.FOOTER,
              contextInfo:{
                forwardingScore:1, isForwarded:true,
                forwardedNewsletterMessageInfo:{ newsletterJid: s.newsletterJid || '120363424626346173@newsletter', newsletterName: `${s.botName} | ${s.botBrand}`, serverMessageId:-1 }
              }
            }, { quoted: msg });
            return;
          }
          const menuCmd = require('../commands/system/menu');
          await menuCmd.sendCategoryMenu(sock, msg, ctx, catKey);
          return;
        }

        if(selectedId === 'madara_channel'){
          await sock.sendMessage(ctx.from, {
            text: menuBox('📢','official channel',[
              `*Name:* ${s.botName}`,
              `*Brand:* ${s.botBrand}`,
              ``,
              `_Follow for updates, new commands, and bot news!_`,
            ]) + s.FOOTER,
            contextInfo:{
              forwardingScore:1, isForwarded:true,
              forwardedNewsletterMessageInfo:{ newsletterJid: s.newsletterJid || '120363424626346173@newsletter', newsletterName: `${s.botName} | ${s.botBrand}`, serverMessageId:-1 }
            }
          }, { quoted: msg });
          return;
        }

        // ---- APEX FIX: if id is a plain command name like "grouplist", execute it ----
        if(selectedId &&!selectedId.startsWith('madara_') &&!selectedId.startsWith('group_') &&!selectedId.startsWith('chatbot_')){
          const synth = {...msg, message: { conversation: `${s.prefix}${selectedId}` } };
          await handleMessage(sock, synth);
          return;
        }

      } catch(e){ console.error('[handler] interactive response error:', e.message); }
      return;
    }

    const listResp = msg.message?.listResponseMessage;
    if(listResp){
      const rowId = listResp.singleSelectReply?.selectedRowId || '';
      if(!rowId) return;
      console.log('[list clicked]', rowId);
      if(rowId.startsWith('group_response_')){ try{ if(await handleResponseInteractive(sock, msg, ctx, rowId)) return; } catch(e){ console.error('[handler] group response list error:', e.message); } }
      if(rowId.startsWith('chatbot_group_')){ try{ if(await handleChatbotInteractive(sock, msg, ctx, rowId)) return; } catch(e){ console.error('[handler] chatbot list response error:', e.message); } }
      if(rowId.startsWith('madara_theme_')){ try{ if(await handleThemeText(sock, msg, ctx)) return; } catch(e){ console.error('[handler] theme list response error:', e.message); } }

      if(rowId.startsWith('madara_cat_')){
        const catKey = rowId.replace('madara_cat_', '');
        try{ const menuCmd = require('../commands/system/menu'); await menuCmd.sendCategoryMenu(sock, msg, ctx, catKey); }
        catch(e){ console.error('[handler] list response error:', e.message); }
        return;
      }
      if(rowId === 'madara_channel'){
        await sock.sendMessage(ctx.from, {
          text: menuBox('📢','official channel',[
            `*Name:* ${s.botName}`,
            `*Brand:* ${s.botBrand}`,
            ``,
            `_Follow for updates, new commands, and bot news!_`,
          ]) + s.FOOTER,
          contextInfo:{
            forwardingScore:1, isForwarded:true,
            forwardedNewsletterMessageInfo:{ newsletterJid: s.newsletterJid || '120363424626346173@newsletter', newsletterName: `${s.botName} | ${s.botBrand}`, serverMessageId:-1 }
          }
        }, { quoted: msg });
        return;
      }
      if(rowId.startsWith('madara_cmd_')){
        const cmdName = rowId.replace('madara_cmd_', '');
        try{
          const synthMsg = {...msg, message: { conversation: `${s.prefix}${cmdName}` } };
          await handleMessage(sock, synthMsg);
        } catch(e){ console.error('[handler] command list response error:', e.message); }
      }

      // apex same fallback
      if(rowId &&!rowId.startsWith('madara_') &&!rowId.startsWith('group_') &&!rowId.startsWith('chatbot_')){
        const synth = {...msg, message: { conversation: `${s.prefix}${rowId}` } };
        await handleMessage(sock, synth);
      }
      return;
    }

    if(!isCmd ||!rawCmd) return;
    let plugin = getCommand(rawCmd);
    if(!plugin) return;

    function normJid(jid){ return (jid||'').split('@')[0].split(':')[0].replace(/^0+/,''); }
    let hasSudo = isOwner;
    if(!hasSudo){
      try{
        const db = require('./db');
        const sudoList = db.get('system','sudo',[]);
        const sndNorm = normJid(sender);
        hasSudo = sudoList.some(s2 => s2 === sender || normJid(s2) === sndNorm);
      } catch {}
    }
    if(commandMode === 'private' &&!hasSudo) return;

    if(plugin.devOnly &&!ctx.isDevOwner) return ctx.reply(`${sessionTheme.string(ctx.sessionPhone,'dev','⛔ This command is reserved for the developer.')}\n${ctx.FOOTER}`);
    if(plugin.ownerOnly &&!hasSudo) return ctx.reply(`${sessionTheme.string(ctx.sessionPhone,'owner','⛔ This command is reserved for the bot owner.')}\n${ctx.FOOTER}`);
    if(plugin.groupOnly &&!isGroup) return ctx.reply(`${sessionTheme.string(ctx.sessionPhone,'group','❌ This command can only be used in groups.')}\n${ctx.FOOTER}`);
    if(plugin.privateOnly && isGroup) return ctx.reply(`${sessionTheme.string(ctx.sessionPhone,'private','❌ This command can only be used in private chat.')}\n${ctx.FOOTER}`);

    if(plugin.adminOnly &&!isSenderAdmin &&!hasSudo){
      if(ctx.isGroup){
        const cached = sock._groupMetaCache?.get(ctx.from);
        const parts = cached?.participants || ctx.groupMeta?.participants || [];
        const sRaw = ctx.sender.split('@')[0].replace(/^0+/,'');
        const pRaw = (msg.key.participant || '').split('@')[0].replace(/^0+/,'');
        const isAdm = parts.some(p=>{
          const pRaw2 = (p.id || '').split('@')[0].replace(/^0+/,'');
          const lRaw = (p.lid || '').split('@')[0].replace(/^0+/,'');
          return (pRaw2===sRaw || lRaw===sRaw || pRaw2===pRaw || lRaw===pRaw) && (p.admin==='admin' || p.admin==='superadmin');
        });
        if(!isAdm) return ctx.reply(`${sessionTheme.string(ctx.sessionPhone,'admin','❌ Group admins only.')}\n${ctx.FOOTER}`);
      } else {
        return ctx.reply(`❌ *Group admins only.*${settings.FOOTER}`);
      }
    }

    if(plugin.botAdminNeeded &&!isBotAdmin){
      let liveBotAdmin = false;
      if(isGroup){
        try{
          const freshMeta = await sock.groupMetadata(from);
          if(!sock._groupMetaCache) sock._groupMetaCache = new Map();
          if(!sock._groupMetaCacheTs) sock._groupMetaCacheTs = new Map();
          sock._groupMetaCache.set(from, freshMeta);
          sock._groupMetaCacheTs.set(from, Date.now());
          const freshParts = freshMeta?.participants || [];
          const botRawId = (sock.user?.id || '').split(':')[0].split('@')[0].replace(/^0+/,'');
          const botLidId = (sock.user?.lid || '').split(':')[0].split('@')[0].replace(/^0+/,'');
          const botCanon = botRawId + '@s.whatsapp.net';
          liveBotAdmin = freshParts.some(p=>{
            if(!p || (p.admin!=='admin' && p.admin!=='superadmin')) return false;
            const pNum = (p.id||'').split('@')[0].split(':')[0].replace(/^0+/,'');
            const pLid = (p.lid||'').split('@')[0].split(':')[0].replace(/^0+/,'');
            return p.id===botCanon || pNum===botRawId || (botLidId && pLid===botLidId) || (botLidId && pNum===botLidId) || (botRawId && pLid===botRawId);
          });
        } catch {}
      }
      if(!liveBotAdmin) return ctx.reply(`${sessionTheme.string(ctx.sessionPhone,'botAdmin','❌ Make me a group admin first.')}\n${ctx.FOOTER}`);
    }

    if(!hasSudo){
      const key = `${sender}:${rawCmd}`;
      const last = getRateLimit(key);
      if(last && Date.now() - last < COOLDOWN_MS) return;
      setRateLimit(key, Date.now());
    }

    if(plugin.waitReact!== false) ctx.react('⏳').catch(()=>{});
    await plugin.execute(sock, msg, args, ctx);
    if(plugin.waitReact!== false) ctx.react('✅').catch(()=>{});

  } catch(err){
    const errMsg = err?.message || String(err);
    if(!errMsg.includes('connection closed') &&!errMsg.includes('rate-overlimit') &&!errMsg.includes('not-authorized')){
      console.error('[handler] error:', errMsg.slice(0,150));
    }
    try{
      if(msg?.key?.remoteJid &&!errMsg.includes('connection closed')){
        await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${errMsg.slice(0,80)}${settings.FOOTER}` }, { quoted: msg });
      }
    } catch {}
  }
}

module.exports = { handleMessage };