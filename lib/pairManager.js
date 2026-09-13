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
const _sessionStarts = new Map();

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
function formatPairingCode(code) {
    const clean = String(code || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
    return clean.match(/.{1,4}/g)?.join('-') || clean;
}

function getPairingCode(sock, phone, mode = 'normal') {
    return new Promise((resolve, reject) => {
        const TIMEOUT_MS = 65_000;
        let settled = false;
        const pairingMode = String(mode || 'normal').toLowerCase();

        if (!['normal', 'custom'].includes(pairingMode)) {
            reject(new Error('Pairing mode must be normal or custom.'));
            return;
        }

        if (pairingMode === 'custom' && !/^[a-z0-9]{8}$/i.test(String(settings.pairingCode || ''))) {
            reject(new Error('PAIRING_CODE must be exactly 8 letters or numbers.'));
            return;
        }

        // Keep the auth directory while a freshly issued code is still
        // waiting to be entered.  A terminal close during this window can
        // otherwise race the pairing flow and delete the very session being
        // paired.
        sock._pairingInProgress = true;

        const settle = (err, code) => {
            if (settled) return;
            settled = true;
            if (err) sock._pairingInProgress = false;
            clearTimeout(timer);
            try { sock.ev.off('connection.update', onUpdate); } catch {}
            if (err) reject(err);
            else resolve(code);
        };

        const timer = setTimeout(() =>
            settle(new Error('Timed out — WhatsApp did not send a QR in 65 s.')),
            TIMEOUT_MS,
        );

        let requested = false;
        const onUpdate = ({ qr, connection } = {}) => {
            if (qr) {
                if (requested) return;
                requested = true;
                const pairingRequest = pairingMode === 'custom'
                    ? sock.requestPairingCode(phone, String(settings.pairingCode).toUpperCase())
                    : sock.requestPairingCode(phone);

                pairingRequest
                    .then(c => {
                        if (!c) return settle(new Error('WhatsApp returned an empty code.'));
                        settle(null, formatPairingCode(c));
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
    if (session.reconnectTimer) clearTimeout(session.reconnectTimer);
    try { session.sock?.end?.(); } catch {}
    activeSessions.delete(phone);

    const sessionDir = path.join(SESSIONS_ROOT, phone);
    try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch {}
    return true;
}

// ── startSession ───────────────────────────────────────────────────────────
async function startSession(phone, tgChatId = null) {
    const inFlight = _sessionStarts.get(phone);
    if (inFlight) return inFlight;

    if (activeSessions.has(phone)) {
        const s = activeSessions.get(phone);
        // A scheduled retry must not leave an old timer racing a new socket.
        if (s.reconnectTimer) {
            clearTimeout(s.reconnectTimer);
            s.reconnectTimer = null;
            activeSessions.set(phone, s);
        }
        const socketOpen = s.sock?.ws?.readyState === 1;
        if (s.sock && s.connected === true && (socketOpen || !s.sock.ws)) {
            s.connected = true;
            return s.sock;
        }
    }

    const promise = _createSession(phone, tgChatId);
    _sessionStarts.set(phone, promise);
    try { return await promise; }
    finally {
        if (_sessionStarts.get(phone) === promise) _sessionStarts.delete(phone);
    }
}

async function _createSession(phone, tgChatId = null) {

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
        keepAliveIntervalMs:    25_000,
        connectTimeoutMs:       60_000,
        defaultQueryTimeoutMs:  30_000,
        retryRequestDelayMs:    3_000,
        maxMsgRetryCount:       3,
        generateHighQualityLinkPreview: false,
        getMessage: async () => undefined,
    });

    sock._sessionPhone = phone;
    activeSessions.set(phone, { sock, tgChatId, retries: 0, connected: false });

    // ── Track every message the bot itself sends ──────────────────────────
    const { trackSent } = require('./sentTracker');
    const _origSendMessage = sock.sendMessage.bind(sock);
    // Raw sender for values that must remain copyable (pairing codes).
    sock._sendRawMessage = _origSendMessage;
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
            const current = activeSessions.get(phone);
            // A delayed event from a socket that was intentionally replaced
            // must not resurrect that old connection.
            if (!current || current.sock !== sock) return;
            const session = current;
            sock._pairingInProgress = false;
            if (session.reconnectTimer) clearTimeout(session.reconnectTimer);
            session.reconnectTimer = null;
            session.retries = 0;
            session.disconnectedSince = null;
            sock._connectedAt = Math.floor(Date.now() / 1000);
            activeSessions.set(phone, { ...session, sock, tgChatId, connected: true });

            // `phone` is the number used for pairing and is the most reliable
            // self-chat target.  `sock.user.id` may be a device-qualified JID
            // and newer WhatsApp clients may expose a separate LID.
            const num = String(phone).replace(/[^0-9]/g, '') ||
                sock.user?.id?.split(':')[0]?.split('@')[0] || '';
            const themeJid = `${num}@s.whatsapp.net`;

            if (!sessionTheme.get(phone) && !sock._themePromptSent && !sessionTheme.isPending(phone)) {
                sock._themePromptSent = true;
                setTimeout(() => {
                    if (activeSessions.get(phone)?.sock !== sock || !sock.user) return;
                    // Use the plain-text fallback during startup.  Native
                    // interactive lists are not rendered by every WhatsApp
                    // client, and a failed relay used to leave new pairings
                    // with no visible theme prompt at all.
                    sessionTheme.themePrompt({
                        sock,
                        sessionPhone: phone,
                        reply: text => sock.sendMessage(themeJid, { text }),
                    }).then(() => {
                        console.log(`[${phone}] Theme selection prompt sent to ${themeJid}`);
                    }).catch(e => {
                        sock._themePromptSent = false;
                        console.error(`[${phone}] Theme prompt failed:`, e.message);
                    });
                }, 800);
            }

            const flagFile = path.join(sessionDir, '.connected');
            if (!fs.existsSync(flagFile)) {
                try { fs.writeFileSync(flagFile, Date.now().toString()); } catch {}
                try {
                    const _jid = themeJid;
                    // FIXED: No forwardingScore spam flag
                    const _channelCtx = settings.newsletterJid ? {
                        isForwarded: true,
                        forwardingScore: 1,
                        forwardedNewsletterMessageInfo: { newsletterJid: settings.newsletterJid, newsletterName: settings.channelName || settings.botName, serverMessageId: -1 },
                    } : {};
                    // ── MADARA X-MD BRANDING (restored) ──────────────────
                    await sock.sendMessage(_jid, {
                        audio: { url: 'https://files.catbox.moe/t2v01y.mp3' },
                        mimetype: 'audio/mpeg', ptt: true,
                        waveform: [100,80,60,100,40,90,70,100,50,80,100,60,90,40,100],
                        fileName: 'wake_up_to_reality',
                        contextInfo: { mentionedJid: [_jid], externalAdReply: { title: '🔴 MADARA UCHIHA SPEAKS...', body: '"Wake up to reality..."', thumbnailUrl: 'https://files.catbox.moe/8324jm.jpg', sourceUrl: settings.newsletterJid ? `https://whatsapp.com/channel/${settings.newsletterJid}` : 'https://github.com', mediaType: 1, renderLargerThumbnail: true }, ..._channelCtx },
                    });
                    const _caption =
                        `\`『 💣 ${settings.botName} 』\`\n` +
                        `*╭───────────────────⊷*\n` +
                        `*┋ ⬡* ✅ Successfully *Paired!*\n` +
                        `*┋ ⬡* 📱 Number: *+${num}*\n` +
                        `*┋ ⬡* 🏷️ Version: *v${settings.version}*\n` +
                        `*┋ ⬡* ⚡ Prefix: *${settings.prefix}*\n` +
                        `*┋ ⬡* 👁️ Mode: *${settings.publicMode ? 'Public' : 'Private'}*\n` +
                        `*╰───────────────────⊷*\n\n` +
                        `_"Those who cannot acknowledge themselves will eventually fail."_\n` +
                        `— *Madara Uchiha* 🔴\n\n` +
                        `Type *${settings.prefix}menu* to see all commands 🚀\n\n` +
                        settings.footer;
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
            const current = activeSessions.get(phone);
            // clearSession() removes the registry entry before ending the
            // socket. Ignore that socket's delayed close event instead of
            // scheduling an unwanted reconnect.
            if (!current || current.sock !== sock) return;
            const session = current;
            const code    = lastDisconnect?.error?.output?.statusCode;

            const terminalDisconnect = typeof code === 'number' && [
                DisconnectReason.loggedOut,
                DisconnectReason.badSession,
                // 440 means another client/socket replaced this connection.
                // Keep valid credentials so a transient duplicate process does
                // not force the owner to pair the number again.
                DisconnectReason.multideviceMismatch,
                401, 411, 440, 500,
            ].filter(value => typeof value === 'number').includes(code);

            if (terminalDisconnect) {
                // Never remove a session while a pairing code is active.
                // The next explicit pairing attempt can reuse this auth
                // directory without colliding with the current flow.
                if (sock._pairingInProgress) {
                    activeSessions.set(phone, { ...session, sock: null, connected: false });
                    if (tgChatId) pairingBridge?.markDisconnected?.(tgChatId, 'Pairing interrupted; session kept');
                    return;
                }
                activeSessions.delete(phone);
                try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch {}
                if (tgChatId) pairingBridge?.markLoggedOut?.(tgChatId);
                return;
            }

            session.retries = (session.retries || 0) + 1;
            if (!session.disconnectedSince) session.disconnectedSince = Date.now();
            activeSessions.set(phone, { ...session, sock: null, connected: false });

            // ── 30-minute give-up: if this session has been continuously
            // disconnected/retrying for 30+ minutes with no successful
            // reconnect in between, stop the endless retry loop instead of
            // silently cycling forever. Clean it up the same way a genuine
            // logout is cleaned up, but notify with a message that makes
            // clear this was a network failure, not the user unlinking the
            // device — those two cases previously looked identical to the
            // owner (both just "gone"), which is exactly the "don't know if
            // it dropped or logged out" confusion this fixes. ────────────
            const disconnectedMs = Date.now() - session.disconnectedSince;
            if (disconnectedMs > 30 * 60 * 1000) {
                console.log(`[${phone}] Giving up after 30+ min of disconnection (network, not logout) — cleaning up session.`);
                activeSessions.delete(phone);
                try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch {}
                if (tgChatId) pairingBridge?.markDisconnected?.(tgChatId, 'Disconnected 30+ min (network) — please re-pair, this was NOT a logout');
                return;
            }

            if (session.retries > 15) {
                session.retries = 0;
                activeSessions.set(phone, { ...session, sock: null, connected: false });
                const reconnectTimer = setTimeout(() => {
                    if (!activeSessions.has(phone)) return;
                    const current = activeSessions.get(phone);
                    if (current?.reconnectTimer !== reconnectTimer) return;
                    current.reconnectTimer = null;
                    activeSessions.set(phone, current);
                    startSession(phone, tgChatId).catch(() => {});
                }, 10 * 60 * 1000);
                session.reconnectTimer = reconnectTimer;
                // Keep the closed socket out of the registry while retrying.
            activeSessions.set(phone, { ...session, sock: null, connected: false });
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
            if (session.reconnectTimer) clearTimeout(session.reconnectTimer);
            const reconnectTimer = setTimeout(() => {
                if (!activeSessions.has(phone)) return;
                const current = activeSessions.get(phone);
                if (current?.reconnectTimer !== reconnectTimer) return;
                current.reconnectTimer = null;
                activeSessions.set(phone, current);
                startSession(phone, tgChatId).catch(() => {});
            }, delay);
            session.reconnectTimer = reconnectTimer;
            // Keep the closed socket out of the registry while retrying.
            activeSessions.set(phone, { ...session, sock: null, connected: false });
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

                    // Messages sent from the paired phone to its own chat can
                    // arrive as `append`, while normal incoming messages use
                    // `notify`. Process recent self-chat append messages even
                    // when a client omits the fromMe flag.
                    const ownNumbers = new Set([
                        phone,
                        sock.user?.id?.split(':')[0]?.split('@')[0],
                        sock.user?.lid?.split(':')[0]?.split('@')[0],
                    ].filter(Boolean).map(v => String(v).replace(/[^0-9]/g, '')));
                    const fromNumber = String(from || '').split('@')[0].split(':')[0]
                        .replace(/[^0-9]/g, '');
                    const isSelfChat = ownNumbers.has(fromNumber);
                    if (type !== 'notify' && !(type === 'append' && (msg.key.fromMe || isSelfChat))) continue;
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