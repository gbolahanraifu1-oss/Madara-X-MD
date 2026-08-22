// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Context Helper                    ║
// ╚══════════════════════════════════════════════════════╝

const { downloadMediaMessage } = require('@itsliaaa/baileys');
const settings = require('../settings');
const db       = require('./db');
const sessionTheme = require('./sessionTheme');

// ── Global LID → Phone number cache ──────────────────────
// Populated every time we see a group participant list
// so we can resolve LID JIDs back to phone numbers
const _lidCache = new Map(); // lid_num → phone_num
function cacheLidMappings(participants) {
    for (const p of participants || []) {
        const phone = (p.id  || '').split('@')[0].split(':')[0];
        const lid   = (p.lid || '').split('@')[0].split(':')[0];
        if (phone && lid && lid !== phone) {
            _lidCache.set(lid, phone);
            _lidCache.set(phone, phone); // also map phone→phone for uniformity
        }
    }
}
function resolveLid(num) {
    return _lidCache.get(num) || num;
}

async function buildCtx(sock, msg) {
    const from      = msg.key.remoteJid;
    const isGroup   = from.endsWith('@g.us');
    const isPrivate = !isGroup;
    const fromMe    = msg.key.fromMe;
    const sender    = fromMe ? sock.user.id.split(':')[0] + '@s.whatsapp.net'
                             : (msg.key.participant || from);

    // ── Per-session settings ──────────────────────────────
    // sock._sessionPhone is set in index.js when the session is created.
    // All mutable bot settings (prefix, commandMode) are read from the
    // session-scoped DB so that user A changing their prefix never
    // affects user B.
    const sessionPhone  = sock._sessionPhone || null;
    const prefix        = db.getSession(sessionPhone, 'config', 'prefix',      settings.prefix);
    const prefixes      = db.getSession(sessionPhone, 'config', 'prefixes',    settings.prefixes || [settings.prefix]);
    const noPrefixMode  = db.getSession(sessionPhone, 'config', 'noPrefixMode', settings.noPrefixMode || false);
    const commandMode   = db.getSession(sessionPhone, 'config', 'commandMode', settings.commandMode);

    // Raw text extraction
    const body = msg.message?.conversation
        || msg.message?.extendedTextMessage?.text
        || msg.message?.imageMessage?.caption
        || msg.message?.videoMessage?.caption
        || msg.message?.documentMessage?.caption
        || '';

    // ── Multi-prefix detection — body just needs to start with ANY of them ──
    const matchedPrefix = prefixes.find(p => body.startsWith(p));
    let isCmd  = !!matchedPrefix;
    let rawCmd = isCmd ? body.slice(matchedPrefix.length).trim().split(/\s+/)[0].toLowerCase() : '';
    let args   = isCmd ? body.slice(matchedPrefix.length + rawCmd.length).trim().split(/\s+/).filter(Boolean) : [];

    // ── No-prefix mode — if ON and no prefix matched, check if the first
    //    word is itself a registered command name/alias (e.g. typing
    //    "ping" or "menu" directly, no "." needed). Avoids false positives
    //    by requiring an EXACT command match, not just any text. ──────────
    if (!isCmd && noPrefixMode && body.trim()) {
        const firstWord = body.trim().split(/\s+/)[0].toLowerCase();
        try {
            const { getCommand } = require('./loader');
            if (getCommand(firstWord)) {
                isCmd  = true;
                rawCmd = firstWord;
                args   = body.trim().slice(firstWord.length).trim().split(/\s+/).filter(Boolean);
            }
        } catch {}
    }

    const text = args.join(' ');

    // Quoted message
    const quoted     = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
          || msg.message?.stickerMessage?.contextInfo?.quotedMessage
          || msg.message?.imageMessage?.contextInfo?.quotedMessage
          || msg.message?.videoMessage?.contextInfo?.quotedMessage
          || null;
    const quotedType = quoted ? Object.keys(quoted)[0] : null;

    // Detect media type in current or quoted message
    const msgContent = msg.message || {};
    const _qMsg      = quoted || {};
    const mediaType  =
        (msgContent.imageMessage   || _qMsg.imageMessage)   ? 'image'   :
        (msgContent.videoMessage   || _qMsg.videoMessage)   ? 'video'   :
        (msgContent.audioMessage   || _qMsg.audioMessage)   ? 'audio'   :
        (msgContent.stickerMessage || _qMsg.stickerMessage) ? 'sticker' :
        (msgContent.documentMessage|| _qMsg.documentMessage)? 'document': null;

    const hasMedia   = !!mediaType;
    const isSticker  = mediaType === 'sticker';

    // Group metadata (cached)
    let groupMeta = null;
    let isSenderAdmin = false;
    let isBotAdmin    = false;

    // ── Normalize JID helper — handles @s.whatsapp.net and @lid ──────
    function normNum(jid) {
        if (!jid) return '';
        // Strip suffix, strip device part (:4), strip leading zeros
        return jid.split('@')[0].split(':')[0].replace(/^0+/, '');
    }

    if (isGroup) {
        try {
            // TTL cache: only fetch groupMetadata every 5 minutes per group
            // This dramatically reduces API calls and speeds up response time
            const now     = Date.now();
            const TTL     = 5 * 60 * 1000; // 5 minutes
            const cacheKey = from;
            if (!sock._groupMetaCache)    sock._groupMetaCache    = new Map();
            if (!sock._groupMetaCacheTs)  sock._groupMetaCacheTs  = new Map();

            const cached   = sock._groupMetaCache.get(cacheKey);
            const cachedTs = sock._groupMetaCacheTs.get(cacheKey) || 0;

            if (cached && (now - cachedTs) < TTL) {
                groupMeta = cached;
            } else {
                try {
                    groupMeta = await sock.groupMetadata(from);
                    sock._groupMetaCache.set(cacheKey, groupMeta);
                    sock._groupMetaCacheTs.set(cacheKey, now);
                } catch {
                    groupMeta = cached || null; // use stale cache if fetch fails
                }
            }
            const participants = groupMeta?.participants || [];
            const botRaw  = sock.user.id || '';
            const botNum  = normNum(botRaw);
            const botLid  = normNum(sock.user.lid || '');
            const sndNum  = normNum(sender);
            const sndLid  = normNum(msg.key.participant || '');

            const isAdminParticipant = (p) =>
                p.admin === 'admin' || p.admin === 'superadmin';

            const matchesBot = (p) => {
                  const pNum = normNum(p.id);
                  const pLid = normNum(p.lid || '');

                  // Build canonical bot JID: strip device suffix (:4) → 234xxx@s.whatsapp.net
                  const botCanonical = botNum + '@s.whatsapp.net';

                  // 1. Direct JID match (most reliable — covers pairing-code sessions)
                  if (p.id === botCanonical) return true;
                  if (p.id === botRaw) return true;

                  // 2. Normalised phone number match
                  if (pNum && botNum && pNum === botNum) return true;

                  // 3. LID-based matches (Business / Linked Device accounts)
                  if (botLid) {
                      if (pLid && pLid === botLid) return true;
                      if (pNum  && pNum === botLid) return true;
                  }

                  // 4. Reverse: bot's phone stored in participant's lid field
                  if (botNum && pLid && pLid === botNum) return true;

                  return false;
              };

            const matchesSender = (p) => {
                // Strip everything after @ for raw number comparison
                const pRaw  = (p.id  || '').split('@')[0].replace(/^0+/, '');
                const plRaw = (p.lid || '').split('@')[0].replace(/^0+/, '');
                const sRaw  = sender.split('@')[0].replace(/^0+/, '');
                const pkRaw = (msg.key.participant || '').split('@')[0].replace(/^0+/, '');

                return pRaw  === sRaw   ||  // p.id raw == sender raw
                       plRaw === sRaw   ||  // p.lid raw == sender raw
                       pRaw  === pkRaw  ||  // p.id raw == participant raw
                       plRaw === pkRaw  ||  // p.lid raw == participant raw
                       p.id  === sender ||  // exact match
                       (msg.key.participant && p.id === msg.key.participant); // exact key match
            };

            // Populate LID cache from fresh participant data
            cacheLidMappings(participants);

            isBotAdmin    = participants.some(p => matchesBot(p)    && isAdminParticipant(p));
            isSenderAdmin = participants.some(p => matchesSender(p) && isAdminParticipant(p));
        } catch {}
    }

    // Owner check — resolves LID to phone via live cache
    const ownerNum   = settings.ownerNumber.replace(/[^0-9]/g, '');
    const senderNum  = normNum(sender);
    const sessionNum = normNum(sock.user?.id || '');
    const sessionLid = normNum(sock.user?.lid || '');
    const rawParticipant = msg.key.participant || '';
    const partNum    = normNum(rawParticipant);
    
    // Paired user's phone (the person who paired this bot instance)
    const pairedPhone = normNum(sessionPhone || '');

    // Resolve LID → real phone using the cache populated from groupMetadata
    const resolvedSenderNum = resolveLid(senderNum);
    const resolvedPartNum   = resolveLid(partNum);

    const isOwner = fromMe
        || senderNum          === ownerNum
        || resolvedSenderNum  === ownerNum
        || resolvedPartNum    === ownerNum
        || senderNum          === sessionNum
        || partNum            === sessionNum
        // Paired user = external owner (anyone who paired the bot)
        || (pairedPhone && senderNum === pairedPhone)
        || (pairedPhone && resolvedSenderNum === pairedPhone)
        // LID match: sender's LID = session's LID → they ARE the session owner
        || (sessionLid && senderNum === sessionLid)
        || (sessionLid && partNum   === sessionLid);

    // ── Dev/real-owner check — ONLY the OWNER_NUMBER from .env ───────────
    // Does NOT include paired users or session numbers. Used by shutdown,
    // restart, and other destructive commands that should never be exposed
    // to regular paired users even if they are "owners" of their session.
    const isDevOwner = senderNum         === ownerNum
        || resolvedSenderNum             === ownerNum
        || resolvedPartNum               === ownerNum
        || fromMe;

    // ── Helper methods ─────────────────────────────────
    const reply = (content) => {
        if (typeof content === 'string') {
            return sock.sendMessage(from, { text: sessionTheme.format(sessionPhone, content) }, { quoted: msg });
        }
        if (content?.text) content = { ...content, text: sessionTheme.format(sessionPhone, content.text) };
        return sock.sendMessage(from, content, { quoted: msg });
    };

    const react = (emoji) =>
        sock.sendMessage(from, { react: { text: emoji, key: msg.key } });

    const send = (content) => {
        if (typeof content === 'string') {
            return sock.sendMessage(from, { text: sessionTheme.format(sessionPhone, content) });
        }
        return sock.sendMessage(from, content);
    };

    const sendWithFooter = (text) =>
        reply(`${text}${sessionTheme.footer(sessionPhone) || settings.FOOTER}`);

    const replyWithFooter = (text) =>
        reply(`${text}${settings.FOOTER}`);

    const downloadMedia = async (typeOverride = null) => {
        // Build the actual target message (quoted takes priority)
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let targetMsg = msg;
        if (ctxInfo?.quotedMessage) {
            targetMsg = {
                key: { remoteJid: from, id: ctxInfo.stanzaId, participant: ctxInfo.participant },
                message: ctxInfo.quotedMessage,
            };
        }
        return downloadMediaMessage(targetMsg, 'buffer', {}, {
            logger: undefined,
            reuploadRequest: sock.updateMediaMessage,
        });
    };

    const getMentions = () => {
        return msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
            || msg.message?.imageMessage?.contextInfo?.mentionedJid
            || [];
    };

    const getQuotedText = () => {
        if (!quoted) return '';
        return quoted.conversation
            || quoted.extendedTextMessage?.text
            || quoted.imageMessage?.caption
            || quoted.videoMessage?.caption
            || '';
    };

    // Build a session-aware settings proxy so commands that read
    // ctx.settings.prefix / ctx.settings.commandMode always get the
    // correct per-session value rather than the global singleton.
    const sessionSettings = new Proxy(settings, {
        get(target, prop) {
            if (prop === 'prefix')      return prefix;
            if (prop === 'commandMode') return commandMode;
            if (prop === 'FOOTER') return sessionTheme.footer(sessionPhone) || target.FOOTER;
            return target[prop];
        },
        set(target, prop, value) {
            // Redirect mutable per-session fields to the session DB.
            // This prevents old code that does `ctx.settings.prefix = x`
            // from accidentally mutating the shared global object.
            if (prop === 'prefix') {
                db.setSession(sessionPhone, 'config', 'prefix', value);
                return true;
            }
            if (prop === 'commandMode') {
                db.setSession(sessionPhone, 'config', 'commandMode', value);
                return true;
            }
            target[prop] = value;
            return true;
        },
    });

    return {
        // Core
        sock, msg, from, sender, body, prefix,
        isCmd, rawCmd, args, text,
        isGroup, isPrivate, fromMe,
        isOwner, isDevOwner, isSenderAdmin, isBotAdmin,
        groupMeta,

        // Sender display name — WhatsApp pushName, falls back to phone number
        pushName: msg.pushName || sender.split('@')[0] || 'User',

        // Per-session config
        commandMode,
        sessionPhone, prefixes, noPrefixMode,

        // Media detection
        mediaType, hasMedia, isSticker,

        // Quoted
        quoted, quotedType,
        getQuotedText,

        // Methods
        reply, send, react, replyWithFooter, sendWithFooter,
        downloadMedia, getMentions,

        // Settings shortcut — session-aware proxy
        settings: sessionSettings,
        FOOTER: sessionTheme.footer(sessionPhone) || settings.FOOTER,
    };
}

module.exports = { buildCtx, resolveLid, cacheLidMappings, _lidCache };
