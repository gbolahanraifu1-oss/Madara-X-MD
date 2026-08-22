// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Pair Manager                      ║
// ║   Shared session registry used by index.js,         ║
// ║   pairApi.js, and the †pair command plugin.          ║
// ╚══════════════════════════════════════════════════════╝

'use strict';

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
    isJidBroadcast,
} = require('@itsliaaa/baileys');

const pino     = require('pino');
const fs       = require('fs');
const path     = require('path');
const settings = require('../settings');
const sessionTheme = require('./sessionTheme');

// ── Silence noisy Baileys internals ───────────────────────────────────────
const _NOISE = ['Decrypted message with closed session','recv window','noise','setting recv window'];
const _cLog  = console.log;
const _cWarn = console.warn;
console.log  = (...a) => { const s = a.join(' '); if (_NOISE.some(p => s.includes(p))) return; _cLog(...a); };
console.warn = (...a) => { const s = a.join(' '); if (_NOISE.some(p => s.includes(p))) return; _cWarn(...a); };

// ── Session registry (shared singleton) ───────────────────────────────────
const activeSessions = new Map();

const SESSIONS_ROOT = path.join(process.cwd(), 'sessions');
if (!fs.existsSync(SESSIONS_ROOT)) fs.mkdirSync(SESSIONS_ROOT, { recursive: true });

// ── Baileys version cache ──────────────────────────────────────────────────
let _baileysVersion = null;
async function getBaileysVersion() {
    if (_baileysVersion) return _baileysVersion;
    try {
        const { version } = await fetchLatestBaileysVersion();
        _baileysVersion = version;
        return version;
    } catch {
        _baileysVersion = [2, 3000, 1019898477];
        return _baileysVersion;
    }
}

// ── getPairingCode ─────────────────────────────────────────────────────────
function getPairingCode(sock, phone) {
    return new Promise((resolve, reject) => {
        const TIMEOUT_MS = 65_000;
        let settled = false;

        const settle = (err, code) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            try { sock.ev.off('connection.update', onUpdate); } catch {}
            if (err) reject(err);
            else resolve(code);
        };

        const timer = setTimeout(() =>
            settle(new Error('Timed out — WhatsApp did not send a QR in 65 s.')),
            TIMEOUT_MS,
        );

        const onUpdate = ({ qr, connection } = {}) => {
            if (qr) {
                sock.requestPairingCode(phone)
                    .then(c => {
                        if (!c) return settle(new Error('WhatsApp returned an empty code.'));
                        const formatted = c.match(/.{1,4}/g)?.join('-') || c;
                        settle(null, formatted);
                    })
                    .catch(e => settle(e));
                return;
            }
            if (connection === 'open')
                settle(new Error('Session already connected. Clear it first.'));
            if (connection === 'close')
                settle(new Error('Socket closed before pairing code was issued. Try again.'));
        };

        sock.ev.on('connection.update', onUpdate);
    });
}

// ── clearSession ───────────────────────────────────────────────────────────
async function clearSession(phone) {
    const session = activeSessions.get(phone);
    if (!session) return false;
    if (session.sock?._ka) clearInterval(session.sock._ka);
    try { session.sock?.end?.(); } catch {}
    activeSessions.delete(phone);
    
    // Remove MadaraEye instance
    if (global.madaraEyeInstances?.has(phone)) {
        global.madaraEyeInstances.delete(phone);
    }
    
    const sessionDir = path.join(SESSIONS_ROOT, phone);
    try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch {}
    return true;
}

// ── Helper: Attach MadaraEye to socket ────────────────────────────────────
function attachMadaraEyeToSock(sock, phone) {
    try {
        const { MadaraEye } = require('./madaraEye');
        const eye = new MadaraEye(sock);
        if (!global.madaraEyeInstances) {
            global.madaraEyeInstances = new Map();
        }
        global.madaraEyeInstances.set(phone, eye);
        console.log(`[${phone}] 👁️ MadaraEye activated`);
        return eye;
    } catch (e) {
        console.error(`[${phone}] MadaraEye activation error:`, e.message);
        return null;
    }
}

// ── startSession ───────────────────────────────────────────────────────────
async function startSession(phone, tgChatId = null) {
    if (activeSessions.has(phone)) {
        const s = activeSessions.get(phone);
        if (s.connected === true) {
            // Ensure MadaraEye is attached even for existing sessions
            if (s.sock && !global.madaraEyeInstances?.has(phone)) {
                attachMadaraEyeToSock(s.sock, phone);
            }
            return s.sock;
        }
    }

    const sessionDir = path.join(SESSIONS_ROOT, phone);
    fs.mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const version = await getBaileysVersion();

    const sock = makeWASocket({
        version,
        logger:               pino({ level: 'silent' }),
        printQRInTerminal:    false,
        browser:              Browsers.macOS('Safari'),
        auth: {
            creds: state.creds,
            keys:  makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        syncFullHistory:        false,
        downloadHistory:        false,
        markOnlineOnConnect:    false,
        keepAliveIntervalMs:    25_000 + Math.floor(Math.random() * 10_000),
        connectTimeoutMs:       60_000,
        defaultQueryTimeoutMs:  30_000,
        retryRequestDelayMs:    3_000 + Math.floor(Math.random() * 2_000),
        maxMsgRetryCount:       3,
        generateHighQualityLinkPreview: false,
        getMessage: async () => undefined,
        options: {
            agent: (() => {
                try {
                    const https = require('https');
                    return new https.Agent({ keepAlive: true, maxSockets: 1 });
                } catch { return undefined; }
            })(),
        },
    });

    sock._sessionPhone = phone;
    activeSessions.set(phone, { sock, tgChatId, retries: 0, connected: false });

    // ── Attach MadaraEye immediately after socket creation ────────────────
    attachMadaraEyeToSock(sock, phone);

    // ── Track every message the bot itself sends ──────────────────────────
    const { trackSent } = require('./sentTracker');
    const _origSendMessage = sock.sendMessage.bind(sock);
    sock.sendMessage = async (...args) => {
        if (args[1] && typeof args[1] === 'object') {
            if (typeof args[1].text === 'string') args[1] = { ...args[1], text: sessionTheme.format(phone, args[1].text) };
            if (typeof args[1].caption === 'string') args[1] = { ...args[1], caption: sessionTheme.format(phone, args[1].caption) };
        }
        const result = await _origSendMessage(...args);
        if (result?.key?.id) trackSent(result.key.id);
        return result;
    };

    sock.ev.on('creds.update', saveCreds);

    // ── Silva auto-features ────────────────────────────────────────────────
    try {
        const { startMadaraFeatures } = require('./madaraFeatures');
        startMadaraFeatures(sock, settings);
    } catch (e) {
        console.error('[MadaraFeatures] load error:', e.message);
    }

    // ── Network error / ECONNRESET fast-reconnect ─────────────────────────
    const _fastReconnect = () => {
        const sess = activeSessions.get(phone) || {};
        if (!sess.sock || sess.sock.ws?.readyState !== 1) return;
        console.log(`[${phone}] Network error — fast reconnect in 3s`);
        if (sock._ka) { clearInterval(sock._ka); sock._ka = null; }
        sess.sock      = null;
        sess.connected = false;
        activeSessions.set(phone, sess);
        setTimeout(() => startSession(phone, tgChatId), 3_000);
    };

    sock.ev.on('CB:xmlstreamend', _fastReconnect);
    try { sock.ws?.on('error', (e) => {
        if (['ECONNRESET','ETIMEDOUT','ENOTFOUND','EPIPE'].some(c => e.message?.includes(c)))
            _fastReconnect();
    }); } catch {}

    // ── Contact sync ──────────────────────────────────────────────────────
    const contactsFile = path.join(sessionDir, 'contacts.json');
    function saveContacts(list) {
        if (!list?.length) return;
        let existing = {};
        try { if (fs.existsSync(contactsFile)) existing = JSON.parse(fs.readFileSync(contactsFile, 'utf8')); } catch {}
        const before = Object.keys(existing).length;
        list.forEach(c => {
            if (c?.id && (c.id.endsWith('@s.whatsapp.net') || c.id.endsWith('@lid')))
                existing[c.id] = { id: c.id, name: c.notify || c.name || '' };
        });
        if (Object.keys(existing).length > before)
            fs.writeFileSync(contactsFile, JSON.stringify(existing));
    }
    sock.ev.on('messaging-history.set', ({ contacts, chats }) => {
        if (contacts?.length) saveContacts(contacts);
        if (chats?.length)    saveContacts(chats.map(c => ({ id: c.id, name: c.name || '' })));
    });
    sock.ev.on('contacts.set',    d => saveContacts(Array.isArray(d) ? d : (d?.contacts || [])));
    sock.ev.on('contacts.upsert', d => saveContacts(Array.isArray(d) ? d : []));
    sock.ev.on('contacts.update', d => saveContacts(Array.isArray(d) ? d : []));

    // ── Connection events ──────────────────────────────────────────────────
    let { pairingBridge } = (() => { try { return require('./telegram'); } catch { return {}; } })();

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'open') {
            const session = activeSessions.get(phone) || {};
            session.retries = 0;
            sock._connectedAt = Math.floor(Date.now() / 1000);
            activeSessions.set(phone, { ...session, sock, tgChatId, connected: true });

            // ── Re-attach MadaraEye after reconnect ──────────────────────
            attachMadaraEyeToSock(sock, phone);

            const num = sock.user.id.split(':')[0];

            if (!sessionTheme.get(phone) && !sock._themePromptSent) {
                sock._themePromptSent = true;
                const themeJid = `${num}@s.whatsapp.net`;
                setTimeout(() => sessionTheme.themePrompt({ reply: text => sock.sendMessage(themeJid, { text }) }).catch(() => {}), 800);
            }

            if (sock._ka) clearInterval(sock._ka);
            let _presenceTick = 0;
            sock._ka = setInterval(async () => {
                try {
                    if (!sock.ws || sock.ws.readyState !== 1) return;
                    _presenceTick++;
                    if (_presenceTick % 3 === 0) {
                        await sock.sendPresenceUpdate('available');
                        const stayMs = 3_000 + Math.random() * 5_000;
                        setTimeout(async () => {
                            try { await sock.sendPresenceUpdate('unavailable'); } catch {}
                        }, stayMs);
                    }
                    if (_presenceTick % 7 === 0 && sock.user?.id) {
                        const selfJid = sock.user.id.replace(/:\d+/, '') + '@s.whatsapp.net';
                        try {
                            await sock.sendPresenceUpdate('composing', selfJid);
                            await new Promise(r => setTimeout(r, 1_500 + Math.random() * 2_000));
                            await sock.sendPresenceUpdate('paused', selfJid);
                        } catch {}
                    }
                } catch (e) {
                    if (e.message?.includes('Connection Closed') || e.message?.includes('not connected'))
                        clearInterval(sock._ka);
                }
            }, 50_000 + Math.floor(Math.random() * 30_000));

            const flagFile = path.join(sessionDir, '.connected');
            if (!fs.existsSync(flagFile)) {
                try { fs.writeFileSync(flagFile, Date.now().toString()); } catch {}
                try {
                    const _jid = `${num}@s.whatsapp.net`;
                    // FIXED: No forwardingScore, no isForwarded spam flag
                    const _channelCtx = settings.newsletterJid ? {
                        isForwarded: false,
                        forwardedNewsletterMessageInfo: { newsletterJid: settings.newsletterJid, newsletterName: settings.channelName || settings.botName, serverMessageId: -1 },
                    } : {};
                    await sock.sendMessage(_jid, {
                        audio: { url: 'https://files.catbox.moe/t2v01y.mp3' },
                        mimetype: 'audio/mpeg', ptt: true,
                        waveform: [100,80,60,100,40,90,70,100,50,80,100,60,90,40,100],
                        fileName: 'wake_up_to_reality',
                        contextInfo: { mentionedJid: [_jid], externalAdReply: { title: '👁️ MADARA EYE SPEAKS...', body: '"Wake up to reality..."', thumbnailUrl: 'https://files.catbox.moe/8324jm.jpg', sourceUrl: settings.newsletterJid ? `https://whatsapp.com/channel/${settings.newsletterJid}` : 'https://github.com', mediaType: 1, renderLargerThumbnail: true }, ..._channelCtx },
                    });
                    const _caption =
                        `\`『 👁️ MADARA EYE 』\`\n` +
                        `*╭───────────────────⊷*\n` +
                        `*┋ ⬡* ✅ Successfully *Paired!*\n` +
                        `*┋ ⬡* 📱 Number: *+${num}*\n` +
                        `*┋ ⬡* 🏷️ Version: *v${settings.version}*\n` +
                        `*┋ ⬡* ⚡ Prefix: *${settings.prefix}*\n` +
                        `*┋ ⬡* 👁️ Mode: *${settings.publicMode ? 'Public' : 'Private'}*\n` +
                        `*╰───────────────────⊷*\n\n` +
                        `_"Those who cannot acknowledge themselves will eventually fail."_\n` +
                        `— *Madara Uchiha* 👁️\n\n` +
                        `Type *${settings.prefix}menu* to see all commands 🚀\n\n` +
                        `> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ MADARA X-MD INC.*`;
                    const _imgPath = settings.botImagePath;
                    if (fs.existsSync(_imgPath)) {
                        await sock.sendMessage(_jid, { image: fs.readFileSync(_imgPath), caption: _caption, contextInfo: _channelCtx });
                    } else {
                        await sock.sendMessage(_jid, { image: { url: 'https://files.catbox.moe/8324jm.jpg' }, caption: _caption, contextInfo: _channelCtx });
                    }
                } catch {}
            }

            if (tgChatId) pairingBridge?.markConnected?.(tgChatId, num);

            if (settings.newsletterJid) {
                try {
                    await sock.newsletterFollow(settings.newsletterJid);
                    console.log(`[${phone}] ✅ Followed newsletter ${settings.newsletterJid}`);
                } catch (e) {
                    if (!e.message?.includes('already') && !e.message?.includes('not-found') && !e.message?.includes('400')) {
                        console.log(`[${phone}] Newsletter follow skipped: ${e.message}`);
                    }
                }
            }

        } else if (connection === 'close') {
            if (sock._ka) { clearInterval(sock._ka); sock._ka = null; }
            const session = activeSessions.get(phone) || {};
            const code    = lastDisconnect?.error?.output?.statusCode;

            if (code === DisconnectReason.loggedOut || code === 401) {
                activeSessions.delete(phone);
                if (global.madaraEyeInstances?.has(phone)) {
                    global.madaraEyeInstances.delete(phone);
                }
                try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch {}
                if (tgChatId) pairingBridge?.markLoggedOut?.(tgChatId);
                return;
            }

            session.retries = (session.retries || 0) + 1;
            activeSessions.set(phone, { ...session, sock: null, connected: false });

            if (session.retries > 15) {
                session.retries = 0;
                activeSessions.set(phone, { ...session, sock: null, connected: false });
                setTimeout(() => {
                    if (!activeSessions.has(phone)) return;
                    startSession(phone, tgChatId);
                }, 10 * 60 * 1000);
                if (tgChatId) pairingBridge?.markDisconnected?.(tgChatId, 'Max retries reached');
                return;
            }

            const errMsg   = lastDisconnect?.error?.message || '';
            const isNetErr = ['ECONNRESET','ETIMEDOUT','EPIPE','ENOTFOUND','EFATAL'].some(c => errMsg.includes(c));
            const _jitter  = Math.random() * 3_000;
            const delay    = isNetErr
                ? 3_000 + _jitter
                : Math.floor(Math.min(6_000 * Math.pow(1.6, session.retries - 1), 90_000) + _jitter);
            console.log(`[${phone}] Reconnecting in ${Math.round(delay/1000)}s (retries: ${session.retries}, isNetErr: ${isNetErr})`);
            setTimeout(() => {
                if (!activeSessions.has(phone)) return;
                startSession(phone, tgChatId);
            }, delay);
        }
    });

    // ── Group participant events ───────────────────────────────────────────
    sock.ev.on('group-participants.update', async (update) => {
        try {
            const { handleGroupParticipantUpdate } = require('./groupevents');
            await handleGroupParticipantUpdate(sock, update);
        } catch {}
    });

    // ── Group join requests ────────────────────────────────────────────────
    sock.ev.on('group.join-request', async (update) => {
        try {
            const { handleJoinRequest } = require('./joinRequests');
            await handleJoinRequest(sock, update);
        } catch {}
    });

    // ── Message handler ────────────────────────────────────────────────────
    const processed = new Set();
    setInterval(() => { if (processed.size > 500) processed.clear(); }, 3 * 60 * 1000);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        try {
            for (const msg of messages) {
                try {
                    if (!msg.message || !msg.key?.id) continue;
                    const from = msg.key.remoteJid;

                    if (from === 'status@broadcast') {
                        if (sock._connectedAt && msg.messageTimestamp &&
                            msg.messageTimestamp < sock._connectedAt - 10) continue;
                        try {
                            require('./statusManager').handleStatusUpdate(sock, msg, phone);
                        } catch (e) {
                            console.error(`[${phone}] Status handler error:`, e.message);
                        }
                        continue;
                    }

                    if (type !== 'notify') continue;
                    if (!from || isJidBroadcast(from)) continue;
                    if (msg.key.id.startsWith('BAE5') && msg.key.id.length === 16) continue;
                    if (processed.has(msg.key.id)) continue;

                    if (sock._connectedAt && msg.messageTimestamp &&
                        msg.messageTimestamp < sock._connectedAt - 10) continue;

                    processed.add(msg.key.id);
                    if (processed.size > 1000) {
                        const first = processed.values().next().value;
                        processed.delete(first);
                    }

                    const { handleMessage } = require('./handler');
                    handleMessage(sock, msg).catch(e => {
                        if (!e.message?.includes('rate-overlimit') &&
                            !e.message?.includes('not-authorized') &&
                            !e.message?.includes('Connection Closed'))
                            console.error(`[${phone}] Message error:`, e.message);
                    });
                } catch (innerErr) {
                    console.error(`[${phone}] Message loop error:`, innerErr.message);
                }
            }
        } catch (outerErr) {
            console.error(`[${phone}] upsert handler error:`, outerErr.message);
        }
    });

    return sock;
}

// ── Resume all sessions from disk on startup ───────────────────────────────
async function resumeSessions() {
    if (!fs.existsSync(SESSIONS_ROOT)) return;
    const phones = fs.readdirSync(SESSIONS_ROOT).filter(d =>
        fs.existsSync(path.join(SESSIONS_ROOT, d, 'creds.json'))
    );
    if (!phones.length) return;
    console.log(`\n📂 Resuming ${phones.length} session(s): ${phones.join(', ')}\n`);
    for (const phone of phones) {
        try { await startSession(phone, null); } catch (e) {
            console.error(`[${phone}] Resume error:`, e.message);
        }
        await new Promise(r => setTimeout(r, 2_000 + Math.random() * 2_000));
    }
}

module.exports = { activeSessions, startSession, clearSession, getPairingCode, resumeSessions, SESSIONS_ROOT };