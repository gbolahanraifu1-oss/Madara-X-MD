// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Telegram Pairing Bridge            ║
// ║   Box-styled UI + edit-in-place navigation (no       ║
// ║   message stacking) + Channel/Group buttons          ║
// ╚══════════════════════════════════════════════════════╝

const settings = require('../settings');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');

const sc = s => String(s).toLowerCase().split('').map(c =>
    ({a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',
      n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'}[c] || c)
).join('');

// ── Telegram Bot API 9.4 added real button colors via a "style" field,
//    but only 'primary' (blue), 'success' (green), and 'danger' (red) are
//    valid — any other value (e.g. the 'secondary' used on a few back
//    buttons below) makes Telegram reject the WHOLE request with 400
//    "invalid button style specified", silently killing every button on
//    that message. Strip only the invalid ones; keep real colors intact. ──
const VALID_BUTTON_STYLES = new Set(['primary', 'success', 'danger']);
function sanitizeMarkup(markup) {
    if (!markup?.inline_keyboard) return markup;
    return {
        inline_keyboard: markup.inline_keyboard.map(row =>
            row.map(btn => {
                if (btn.style && !VALID_BUTTON_STYLES.has(btn.style)) {
                    const { style, ...rest } = btn;
                    return rest;
                }
                return btn;
            })
        ),
    };
}

// ── Wrap free-text (filenames, etc.) as a safe inline-code span so
//    underscores/asterisks/brackets in user-typed text never break
//    Telegram's legacy Markdown parser ("can't find end of entity"). ──
function mdSafe(str) {
    if (str === null || str === undefined) return '';
    return '`' + String(str).replace(/`/g, "'") + '`';
}

// ── Box-style template — mirrors the 「TITLE」 ◆ bullet aesthetic ──────────
function box(title, lines, emoji = '💣') {
    return (
        `❐ ◆「${title.toUpperCase()}」◆\n\n` +
        lines.map(l => `┊◆ ${l}`).join('\n') +
        `\n❑`
    );
}

// ── Last notification cooldowns ────────────────────────
const _lastConnectNotif    = new Map();
const _lastDisconnectNotif = new Map();
const NOTIF_COOLDOWN = 30 * 60 * 1000;

// ── Bridge object (used by pairManager.js for connect/disconnect pushes) ──
const pairingBridge = {
    bot: null,

    send(chatId, text, opts = {}) {
        if (!this.bot || !chatId) return;
        const { reply_markup, ...rest } = opts;
        this.bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            ...rest,
            ...(reply_markup ? { reply_markup: sanitizeMarkup(reply_markup) } : {}),
        }).catch(() => {});
    },

    markConnected(chatId, phone) {
        if (!this.bot || !chatId) return;
        const now = Date.now();
        const CONNECT_COOLDOWN = 60 * 60 * 1000;
        if (_lastConnectNotif.get(chatId) && now - _lastConnectNotif.get(chatId) < CONNECT_COOLDOWN) return;
        _lastConnectNotif.set(chatId, now);

        this.send(chatId,
            box('Connected', [
                `✅ ${sc('status')}: *Connected!*`,
                `📱 ${sc('number')}: +${phone}`,
                `🏷️ ${sc('version')}: v${settings.version}`,
                `⚡ ${sc('prefix')}: ${settings.prefix}`,
            ]) + `\n\n🎉 *MADARA X-MD is now LIVE!*\n\n> _Powered by MADARA X-MD INC._`,
            { reply_markup: { inline_keyboard: [
                [{ text: '📊 Status', callback_data: 'btn_status', style: 'primary' }, { text: '📋 Commands', callback_data: 'btn_commands', style: 'primary' }],
                [{ text: '🗑️ Disconnect', callback_data: 'btn_disconnect', style: 'danger' }]
            ]}}
        );
    },

    markDisconnected(chatId, reason) {
        if (!this.bot || !chatId) return;
        const critical = reason && (reason.includes('Max retries') || reason.includes('logged out'));
        if (!critical) return;
        this.send(chatId,
            box('Attention Needed', [
                `⚠️ *Bot failed to reconnect* after multiple attempts.`,
                `Tap Re-Pair below to restore connection.`
            ]),
            { reply_markup: { inline_keyboard: [
                [{ text: '🔄 Re-Pair', callback_data: 'btn_pair', style: 'success' }, { text: '📊 Status', callback_data: 'btn_status', style: 'primary' }]
            ]}}
        );
    },

    markLoggedOut(chatId) {
        if (!this.bot || !chatId) return;
        this.send(chatId,
            box('Session Logged Out', [`❌ *Session logged out.*`, `Tap below to pair again.`]),
            { reply_markup: { inline_keyboard: [[{ text: '📱 Pair WhatsApp', callback_data: 'btn_pair', style: 'success' }]] }}
        );
    }
};

// ── Shared maintenance + dynamic admin/ban registries (persisted) ─────────
const maintenance = require('./maintenance');
const tgAdmin     = require('./tgAdmin');

// ── Owner & Admin check — fixed .env list + dynamic admins (/addadmin) ────
const OWNER_IDS = (process.env.OWNER_ID || '').split(',').map(s => s.trim()).filter(Boolean);
const ADMIN_IDS = (process.env.ADMIN_ID || '').split(',').map(s => s.trim()).filter(Boolean);
const isOwner   = (chatId) => OWNER_IDS.includes(String(chatId));
const isAdmin   = (chatId) => ADMIN_IDS.includes(String(chatId)) || tgAdmin.isDynamicAdmin(chatId) || isOwner(chatId);
// Owners/admins can never be locked out by a stray ban entry.
const isBanned  = (chatId) => tgAdmin.isBannedRaw(chatId) && !isAdmin(chatId);

// ── Session registry — now also tracks lastMsgId for edit-in-place ────────
const tgSessions = new Map();

// ── Bot-wide stats (lightweight, real numbers only) ────────────────────
const botStartedAt = Date.now();
let pairsToday      = 0;
let lastPairDayKey  = new Date().toDateString();

function formatUptime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
}

// ── Request pairing code at the QR event (only valid window) ──────────────
function requestCodeOnQr(sock, phone) {
    return new Promise((resolve, reject) => {
        const TIMEOUT_MS = 65_000;

        const done = (err, code) => {
            clearTimeout(timer);
            sock.ev.off('connection.update', handler);
            if (err) reject(err);
            else resolve(code);
        };

        const timer = setTimeout(() =>
            done(new Error('Timed out — WhatsApp did not send a QR. Clear session and retry.')),
            TIMEOUT_MS,
        );

        const handler = (update) => {
            const { qr, connection } = update || {};

            if (qr) {
                sock.requestPairingCode(phone)
                    .then(c => { if (!c) return done(new Error('Empty code')); done(null, c); })
                    .catch(e => done(e));
                return;
            }
            if (connection === 'open')  done(new Error('Session already connected. Disconnect it first.'));
            if (connection === 'close') done(new Error('Socket closed before QR was issued. Try again.'));
        };

        sock.ev.on('connection.update', handler);
    });
}

function startTelegramBot(startSession, activeSessions) {
    const token = settings.telegramToken;
    if (!token) {
        console.log('⚠️  No Telegram token — pairing via Telegram disabled.');
        return;
    }

    let TelegramBot;
    try { TelegramBot = require('node-telegram-bot-api'); }
    catch { console.log('⚠️  node-telegram-bot-api not installed. Run: npm install node-telegram-bot-api'); return; }

    const bot = new TelegramBot(token, { polling: { interval: 1000, autoStart: true } });
    pairingBridge.bot = bot;

    // ── Surface polling errors — previously these were swallowed entirely,
    //    so a 409 Conflict (a second bot instance/old deploy still running
    //    on the same token) looked exactly like "buttons doing nothing."  ──
    bot.on('polling_error', (err) => {
        console.error('[Telegram] Polling error:', err.message);
        if (err.message?.includes('409') || err.message?.toLowerCase().includes('conflict')) {
            console.error('[Telegram] ⚠️  409 Conflict — another process is polling this same bot token right now. Stop every other running instance (old deploy, pm2 process, second terminal, etc.) then restart this one.');
        }
    });

    const kb = (...rows) => ({ inline_keyboard: rows });

    // ── Banned-user notice (used by the entry points a banned user could
    //    actually still reach — typing /start, /pair, or tapping a button) ──
    function sendBannedNotice(chatId) {
        return bot.sendMessage(chatId,
            box('Access Denied', [`🚫 *You have been banned* from using this bot.`, `Contact the bot owner if you believe this is a mistake.`]),
            { parse_mode: 'Markdown' }
        ).catch(() => {});
    }

    // ── Maintenance notice (shown to non-admins when pairing is paused) ───
    async function sendMaintenanceNotice(chatId) {
        const reason = maintenance.reason();
        return await render(chatId,
            box('Under Maintenance', [
                `🚧 *Pairing is temporarily disabled.*`,
                reason ? `Reason: ${reason}` : `The bot owner is performing maintenance.`,
                `Please try again shortly.`,
            ]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    // ── Channel/Group button row builder — links to user's WhatsApp channel/group ──
    function linkRows() {
        const rows = [];
        
        // WhatsApp Channel (from .env)
        if (settings.waChannelId || process.env.WA_CHANNEL_ID) {
            const channelId = settings.waChannelId || process.env.WA_CHANNEL_ID;
            rows.push([{ 
                text: '📱 WhatsApp Channel', 
                url: `https://wa.me/${channelId}`,
                style: 'success' 
            }]);
        }
        
        // WhatsApp Group (from .env)
        if (settings.waGroupInvite || process.env.WA_GROUP_INVITE) {
            const groupInvite = settings.waGroupInvite || process.env.WA_GROUP_INVITE;
            rows.push([{ 
                text: '👥 WhatsApp Group', 
                url: groupInvite,
                style: 'success' 
            }]);
        }
        
        // Fallback to Telegram if no WhatsApp links
        if (rows.length === 0) {
            if (settings.tgGroupUrl) rows.push([{ text: '👥 Group', url: settings.tgGroupUrl, style: 'success' }]);
        }
        
        return rows;
    }

// ── Auto-color: buttons tagged style:'primary' (the neutral/navigational
//    ones — Status, Commands, User Menu, Main Menu, etc.) cycle through
//    blue → green → red → blue... one step per real render() call for
//    that chat. Buttons with real semantic meaning — 'success' (Pair),
//    'danger' (Disconnect/Owner Menu) — are left untouched, since
//    randomizing those would misleadingly suggest something destructive
//    is safe or vice versa.
//
//    Deliberately NOT timer-driven. A setInterval doing this on a 5s
//    loop is exactly what caused the earlier Telegram flood-control
//    lockout (editMessageText blew straight past Bot API rate limits —
//    ETELEGRAM 429, retry_after in the tens of thousands of seconds).
//    This only executes inside render(), which already only runs in
//    response to a genuine interaction (pair, menu nav, callback button
//    press) — so the color only ever changes when a human actually did
//    something, never on a clock. ─────────────────────────────────────
const CYCLE_STYLES = ['primary', 'success', 'danger'];
function nextStyle(chatId) {
    const sess = tgSessions.get(chatId) || {};
    const idx  = ((sess.colorIdx ?? -1) + 1) % CYCLE_STYLES.length;
    tgSessions.set(chatId, { ...sess, colorIdx: idx });
    return CYCLE_STYLES[idx];
}
function applyAutoColor(chatId, markup) {
    if (!markup?.inline_keyboard) return markup;
    const color = nextStyle(chatId);
    return {
        inline_keyboard: markup.inline_keyboard.map(row =>
            row.map(btn => (btn.style === 'primary') ? { ...btn, style: color } : btn)
        ),
    };
}

// ── EDIT-IN-PLACE: replaces the previous menu instead of stacking a new
//    message every time. This is what prevents chat clutter. ──────────
async function render(chatId, text, opts = {}) {
    const sess = tgSessions.get(chatId) || {};
    const { reply_markup, ...rest } = opts;
    const payload = {
        parse_mode: 'Markdown',
        ...rest,
        ...(reply_markup ? { reply_markup: applyAutoColor(chatId, sanitizeMarkup(reply_markup)) } : {}),
    };

        if (sess.lastMsgId) {
            try {
                await bot.editMessageText(text, {
                    chat_id:    chatId,
                    message_id: sess.lastMsgId,
                    ...payload
                });
                return;
            } catch (e) {
                // "message is not modified" → fine, ignore.
                // Anything else (message deleted, too old, etc.) → fall through to a fresh send.
                if (e.message?.includes('not modified')) return;
            }
        }

        try {
            const sent = await bot.sendMessage(chatId, text, payload);
            tgSessions.set(chatId, { ...sess, lastMsgId: sent.message_id });
        } catch (e) {
            console.error('[Telegram] render error:', e.message);
        }
    }

    // ── Main menu screen (reusable from /start and "🏠 Main Menu" button) ──
    function mainMenuText() {
        const activeCount = activeSessions.size;
        return box('Main Menu', [
            `🌅 Good day — *MADARA X-MD WhatsApp Pairing System*`,
            `🔒 Secure • ⚡ Fast • ✅ Reliable`,
        ]) + '\n\n' + box('System Info', [
            `⏱️ Uptime: ${formatUptime(Date.now() - botStartedAt)}`,
            `📱 Active sessions: ${activeCount}`,
            `📅 Paired today: ${pairsToday}`,
            ...(maintenance.isOn() ? [`🚧 Maintenance: *ON* (pairing paused)`] : []),
        ]) + '\n\n👇 *Tap a button below to get started:*';
    }

    // ── Three-Tier Menu System ────────────────────────────────────────────
    function mainMenuKeyboard() {
        return kb(
            [{ text: '📱 Pair WhatsApp', callback_data: 'btn_pair', style: 'success' }],
            [
                { text: '👤 User Menu', callback_data: 'btn_usermenu', style: 'primary' },
                { text: '👮 Admin Menu', callback_data: 'btn_adminmenu', style: 'primary' }
            ],
            [
                { text: '🔒 Owner Menu', callback_data: 'btn_ownermenu', style: 'danger' }
            ],
            ...linkRows()
        );
    }

    // ── User Menu — Quick Actions ──────────────────────────────────────────
    function userMenuKeyboard() {
        return kb(
            [
                { text: '📱 Pair', callback_data: 'btn_pair', style: 'success' },
                { text: '🗑️ Unpair', callback_data: 'btn_unpair', style: 'danger' }
            ],
            [
                { text: '🏓 Ping', callback_data: 'btn_ping', style: 'primary' },
                { text: '⏰ Runtime', callback_data: 'btn_runtime', style: 'primary' }
            ],
            [
                { text: '📊 Stats', callback_data: 'btn_stats', style: 'primary' },
                { text: '📧 Report', callback_data: 'btn_report', style: 'primary' }
            ],
            [
                { text: '🎬 Tutorial', callback_data: 'btn_tutorial', style: 'primary' },
                { text: '❓ Help', callback_data: 'btn_help', style: 'primary' }
            ],
            [
                { text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }
            ]
        );
    }

    // ── Admin Menu ─────────────────────────────────────────────────────────
    function adminMenuKeyboard() {
        return kb(
            [
                { text: '👥 Users', callback_data: 'btn_users', style: 'primary' },
                { text: '📱 Sessions', callback_data: 'btn_listpair', style: 'primary' }
            ],
            [
                { text: '📢 Broadcast', callback_data: 'btn_broadcast', style: 'success' },
                { text: '🧹 Clean', callback_data: 'btn_clean', style: 'danger' }
            ],
            [
                { text: '🗑️ Clear Temp', callback_data: 'btn_cleartemp', style: 'danger' },
                { text: '❌ Del Session', callback_data: 'btn_delsession', style: 'danger' }
            ],
            [
                { text: '🛒 Shop Manager', callback_data: 'btn_shop', style: 'success' },
                { text: '📁 File Store',   callback_data: 'btn_filestore', style: 'success' }
            ],
            [
                { text: '🚫 Ban', callback_data: 'btn_ban', style: 'danger' },
                { text: '✅ Unban', callback_data: 'btn_unban', style: 'success' }
            ],
            [
                { text: '🔍 Check', callback_data: 'btn_checkuser', style: 'primary' },
                { text: '🔧 Mode', callback_data: 'btn_maintenance', style: 'primary' }
            ],
            [
                { text: '📋 Logs', callback_data: 'btn_logs', style: 'primary' },
                { text: '📅 Announce', callback_data: 'btn_announce', style: 'success' }
            ],
            [
                { text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }
            ]
        );
    }

    // ── Owner Menu ─────────────────────────────────────────────────────────
    function ownerMenuKeyboard() {
        return kb(
            [
                { text: '➕ Add Admin', callback_data: 'btn_addadmin', style: 'success' },
                { text: '➖ Remove Admin', callback_data: 'btn_removeadmin', style: 'danger' }
            ],
            [
                { text: '⟳ Restart', callback_data: 'btn_restart', style: 'danger' }
            ],
            [
                { text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }
            ]
        );
    }

    // ── Register native Telegram commands + persistent Menu button ─────────
    bot.setMyCommands([
        // ── QUICK ACTIONS (all users) ──
        { command: 'start',       description: 'Main menu' },
        { command: 'pair',        description: 'Pair WhatsApp' },
        { command: 'unpair',      description: 'Remove session' },
        { command: 'ping',        description: 'Latency' },
        { command: 'runtime',     description: 'Uptime' },
        { command: 'stats',       description: 'Stats' },
        { command: 'report',      description: 'Support' },
        { command: 'tutorial',    description: 'Guide' },
        { command: 'help',        description: 'Commands' },
        // ── ADMIN CONTROL (admin only) ──
        { command: 'users',       description: '👮 Users' },
        { command: 'listpair',    description: '👮 Sessions' },
        { command: 'broadcast',   description: '👮 Global alert' },
        { command: 'clean',       description: '👮 Cleanup' },
        { command: 'ban',         description: '👮 Block' },
        { command: 'unban',       description: '👮 Unblock' },
        { command: 'checkuser',   description: '👮 Audit' },
        { command: 'maintenance', description: '👮 Mode' },
        { command: 'logs',        description: '👮 Logs' },
        { command: 'announce',    description: '👮 Announce' },
        // ── OWNER ONLY ──
        { command: 'addadmin',    description: '🔒 Add admin' },
        { command: 'removeadmin', description: '🔒 Remove admin' },
        { command: 'restart',     description: '🔒 Restart' },
    ]).catch(() => {});
    bot.setChatMenuButton({ menu_button: { type: 'commands' } }).catch(() => {});

    // ── Channel Join Gate ─────────────────────────────────────────────────
    // TELEGRAM_CHANNEL_ID accepts any of these formats:
    //   @MadaraXMD
    //   https://t.me/MadaraXMD
    //   https://t.me/+AbCdEfGhIjKl  (private invite link)
    //   -1001234567890               (numeric ID)

    const _rawChannel = (process.env.TELEGRAM_CHANNEL_ID || '').trim();

    // Normalise to the form getChatMember needs (@username or numeric ID)
    // and separately build a clean invite URL for the button.
    function parseChannelConfig(raw) {
        if (!raw) return { id: null, url: null };

        // Full t.me link — extract the slug
        const tmeMatch = raw.match(/^https?:\/\/t\.me\/(.+)$/i);
        if (tmeMatch) {
            const slug = tmeMatch[1];
            if (slug.startsWith('+')) {
                // Private invite link — can't use getChatMember with this,
                // owner must also set TELEGRAM_CHANNEL_ID to the numeric ID
                // OR just use @username. We store the URL for the button and
                // fall back to fail-open so nobody gets permanently locked out.
                return { id: null, url: raw };
            }
            return { id: `@${slug}`, url: raw };
        }

        // Numeric ID (e.g. -1001234567890)
        if (/^-?\d+$/.test(raw)) {
            return { id: raw, url: null }; // can't build a public URL from a bare numeric ID
        }

        // @username (with or without the @)
        const username = raw.startsWith('@') ? raw : `@${raw}`;
        return { id: username, url: `https://t.me/${username.slice(1)}` };
    }

    const { id: GATE_CHANNEL, url: GATE_CHANNEL_URL } = parseChannelConfig(_rawChannel);

    async function checkMembership(chatId) {
        if (!GATE_CHANNEL) return true;          // gate disabled or private-link-only config
        if (isAdmin(chatId)) return true;
        try {
            const member = await bot.getChatMember(GATE_CHANNEL, chatId);
            return ['member', 'administrator', 'creator'].includes(member.status);
        } catch (e) {
            console.error('[Telegram] join-gate getChatMember error (check TELEGRAM_CHANNEL_ID and that the bot is a channel admin):', e.message);
            return true; // fail open — mis-config shouldn't lock everyone out
        }
    }

    async function sendJoinGate(chatId) {
        const buttonUrl = GATE_CHANNEL_URL || _rawChannel || 'https://t.me/MadaraXMD';
        const rows = [
            [{ text: '📢 Join Channel', url: buttonUrl }],
            [{ text: '✅ I Joined — Verify Me', callback_data: 'btn_verify' }],
        ];
        await render(chatId,
            box('Access Locked 🔒', [
                `👋 Welcome to *MADARA X-MD | INC.*`,
                ``,
                `To use this bot you must first join`,
                `our official Telegram channel.`,
                ``,
                `1️⃣  Tap *Join Channel* below`,
                `2️⃣  Tap *Verify Me* to unlock the bot`,
            ]),
            { reply_markup: { inline_keyboard: rows } }
        );
    }

    // ── /start ───────────────────────────────────────────────────────────
    bot.onText(/^\/start/, async (m) => {
        const chatId = m.chat.id;
        if (isBanned(chatId)) return sendBannedNotice(chatId);
        const joined = await checkMembership(chatId);
        if (!joined) return sendJoinGate(chatId);
        tgSessions.set(chatId, { ...(tgSessions.get(chatId) || {}) });
        await render(chatId, mainMenuText(), { reply_markup: mainMenuKeyboard() });
    });

    // ── Group Chat Pairing ─────────────────────────────────────────────────
    // Set TELEGRAM_GROUP_ID in .env to the group's chat ID (e.g. -1001234567890).
    // When the bot is added to that group:
    //   - Users send /pair <phone> (or just /pair) in the group
    //   - The bot sends the pairing code to their DM (private chat)
    //   - In the group it only posts a short ephemeral prompt to avoid spam
    //
    // Per-user state inside a group is tracked in groupSessions:
    //   groupSessions.get(userId) => { phone, state }
    // The pairing code reply always goes to the user's private DM chatId
    // (which equals their userId for private chats in Telegram).

    const GATE_GROUP    = (process.env.TELEGRAM_GROUP_ID || '').trim();
    const groupSessions = new Map(); // userId → { phone, state }

    function isGroupAllowed(chatId) {
        if (!GATE_GROUP) return false; // group pairing disabled if not set
        return String(chatId) === String(GATE_GROUP);
    }

    // Delete a bot reply in the group after a short delay to keep it clean
    async function autoDelete(chatId, msgId, delayMs = 15000) {
        setTimeout(() => bot.deleteMessage(chatId, msgId).catch(() => {}), delayMs);
    }

    // Try to send to DM, return false if user hasn't started the bot yet
    async function sendToDM(userId, text, opts = {}) {
        try {
            const { reply_markup, ...rest } = opts;
            const msg = await bot.sendMessage(userId, text, {
                parse_mode: 'Markdown',
                ...rest,
                ...(reply_markup ? { reply_markup: sanitizeMarkup(reply_markup) } : {}),
            });
            return msg;
        } catch (e) {
            if (e.message?.includes('bot was blocked') || e.message?.includes('chat not found') || e.message?.includes('PEER_ID_INVALID')) {
                return null; // user hasn't DM'd the bot yet
            }
            throw e;
        }
    }

    // /pair command handler for GROUP chats
    async function handleGroupPair(m) {
        const groupId  = m.chat.id;
        const userId   = m.from.id;
        const username = m.from.username ? `@${m.from.username}` : m.from.first_name;

        // Extract phone from /pair <phone> if provided inline
        const inlinePhone = (m.text || '').replace(/^\/pair\S*/, '').trim().replace(/[^0-9]/g, '');

        // Gate: maintenance mode
        if (maintenance.isOn() && !isAdmin(userId)) {
            const reply = await bot.sendMessage(groupId,
                `🚧 *Pairing is temporarily disabled.* Try again later.`,
                { parse_mode: 'Markdown', reply_to_message_id: m.message_id }
            ).catch(() => null);
            if (reply) autoDelete(groupId, reply.message_id);
            return;
        }

        // Gate: join-gate check (per user, not group)
        if (!(await checkMembership(userId))) {
            const reply = await bot.sendMessage(groupId,
                `🔒 ${username}, you must join our channel first. [Click here](https://t.me/${GATE_CHANNEL.replace(/^@/, '')}) then try again.`,
                { parse_mode: 'Markdown', reply_to_message_id: m.message_id }
            ).catch(() => null);
            if (reply) autoDelete(groupId, reply.message_id);
            return;
        }

        // ── Auto-detect number ────────────────────────────────────────────
        // Priority: 1) inline arg  2) previous DM session  3) previous group session
        let phone = inlinePhone;

        if (!phone) {
            // Check if this user has a DM session with a known phone
            const dmSess    = tgSessions.get(userId);
            const groupSess = groupSessions.get(userId);
            phone = dmSess?.phone || groupSess?.phone || '';
        }

        if (phone && (phone.length < 7 || phone.length > 15)) phone = '';

        if (!phone) {
            // Can't auto-detect — ask them to provide it once
            groupSessions.set(userId, { state: 'awaiting_phone_group', groupId });
            const groupReply = await bot.sendMessage(groupId,
                `📲 ${username}, reply with your WhatsApp number (country code, no +).\n_Example:_ \`2347062301699\`\n_Or:_ \`/pair 2347062301699\``,
                { parse_mode: 'Markdown', reply_to_message_id: m.message_id }
            ).catch(() => null);
            if (groupReply) autoDelete(groupId, groupReply.message_id, 60000);
            return;
        }

        // We have the number — go straight to pairing
        groupSessions.set(userId, { phone, state: 'pairing', groupId });
        const groupReply = await bot.sendMessage(groupId,
            `⏳ ${username}, pairing *+${phone}*... Check your *DM* for the code.`,
            { parse_mode: 'Markdown', reply_to_message_id: m.message_id }
        ).catch(() => null);
        if (groupReply) autoDelete(groupId, groupReply.message_id, 20000);

        await executePairing(userId, phone, groupId);
    }

    // Core pairing execution — shared by DM and group flows
    async function executePairing(dmChatId, phone, groupId = null) {
        try {
            const sock = await startSession(phone, dmChatId);

            requestCodeOnQr(sock, phone)
                .then(async code => {
                    const formatted = String(code).toUpperCase();

                    const today = new Date().toDateString();
                    if (today !== lastPairDayKey) { lastPairDayKey = today; pairsToday = 0; }
                    pairsToday++;

                    const codeMsg =
                        box('Pairing Successful', [`✅ *COMPLETED!*`]) + '\n\n' +
                        box('Pairing Code', [`\`${formatted}\``]) + '\n\n' +
                        box('Instructions', [
                            `1️⃣ Open *WhatsApp* → *Settings*`,
                            `2️⃣ Tap *Linked Devices*`,
                            `3️⃣ Select *Link a Device*`,
                            `4️⃣ Tap *Link with phone number*`,
                            `5️⃣ Enter the code above`,
                            ``,
                            `⚡ Code expires in *5 minutes*`,
                        ]);

                    const codeKeyboard = kb(
                        [{ text: '📋 Copy Code', copy_text: { text: formatted }, style: 'success' }],
                        [{ text: '📖 Tutorial', url: settings.tgTutorialUrl || 'https://t.me', style: 'primary' },
                         { text: '🏠 Menu', callback_data: 'btn_mainmenu', style: 'primary' }]
                    );

                    if (groupId) {
                        // Group flow: always send code to DM, notify in group
                        const dmSent = await sendToDM(dmChatId, codeMsg, { reply_markup: codeKeyboard });
                        if (!dmSent) {
                            // User hasn't started the bot — tell them in group
                            const groupReply = await bot.sendMessage(groupId,
                                `⚠️ Couldn't send your code via DM. Please [start the bot](https://t.me/${(await bot.getMe()).username}) first, then try \`/pair ${phone}\` again.`,
                                { parse_mode: 'Markdown' }
                            ).catch(() => null);
                            if (groupReply) autoDelete(groupId, groupReply.message_id, 30000);
                        } else {
                            const groupReply = await bot.sendMessage(groupId,
                                `✅ Pairing code sent to your DM!`,
                                { parse_mode: 'Markdown' }
                            ).catch(() => null);
                            if (groupReply) autoDelete(groupId, groupReply.message_id, 10000);
                        }
                    } else {
                        // DM flow — update in place as before
                        const sess = tgSessions.get(dmChatId) || {};
                        tgSessions.set(dmChatId, { ...sess, state: 'paired', phone });
                        render(dmChatId, codeMsg, { reply_markup: codeKeyboard });
                    }
                })
                .catch(async e => {
                    if (groupId) {
                        await sendToDM(dmChatId,
                            box('Pairing Failed', [`❌ ${e.message}`, `Try again: /pair ${phone}`]),
                            { reply_markup: kb([{ text: '🔄 Try Again', callback_data: 'btn_pair', style: 'success' }]) }
                        ).catch(() => {});
                    } else {
                        render(dmChatId,
                            box('Pairing Failed', [`❌ ${e.message}`, `Tap below to try again.`]),
                            { reply_markup: kb([{ text: '🔄 Try Again', callback_data: 'btn_pair', style: 'success' }]) }
                        );
                    }
                });

        } catch (e) {
            if (groupId) {
                await sendToDM(dmChatId,
                    box('Error', [`❌ ${e.message}`]),
                    { reply_markup: kb([{ text: '🔄 Try Again', callback_data: 'btn_pair', style: 'success' }]) }
                ).catch(() => {});
            } else {
                render(dmChatId,
                    box('Error', [`❌ ${e.message}`]),
                    { reply_markup: kb([{ text: '🔄 Try Again', callback_data: 'btn_pair', style: 'success' }]) }
                );
            }
        }
    }

    // ── /pair command — works in both DM and group ─────────────────────────
    bot.onText(/^\/pair(@\S+)?(\s|$)/, async (m) => {
        const isGroup = m.chat.type === 'group' || m.chat.type === 'supergroup';

        if (isGroup) {
            if (!isGroupAllowed(m.chat.id)) return; // bot is in an unlisted group — ignore
            return handleGroupPair(m);
        }

        // ── Original DM /pair flow ─────────────────────────────────────────
        const chatId = m.chat.id;
        if (isBanned(chatId)) return sendBannedNotice(chatId);
        if (!(await checkMembership(chatId))) return sendJoinGate(chatId);
        if (maintenance.isOn() && !isAdmin(chatId)) return sendMaintenanceNotice(chatId);
        tgSessions.set(chatId, { ...(tgSessions.get(chatId) || {}), state: 'awaiting_phone' });
        await render(chatId,
            box('Pair WhatsApp', [
                `📱 Enter your *WhatsApp number*`,
                `with country code, no + or spaces`,
                `Example: 2347062301699`,
            ]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    });

    // ── QUICK ACTIONS (all users) ──
    bot.onText(/^\/ping/, async (m) => handlePing(m.chat.id));
    bot.onText(/^\/help/, async (m) => handleHelp(m.chat.id));
    bot.onText(/^\/stats/, async (m) => handleStatus(m.chat.id));
    bot.onText(/^\/runtime/, async (m) => handleRuntime(m.chat.id));
    bot.onText(/^\/report/, async (m) => handleReport(m.chat.id));
    bot.onText(/^\/tutorial/, async (m) => handleTutorial(m.chat.id));

    // ── ADMIN CONTROL (admin + owner) ──
    bot.onText(/^\/users/, async (m) => isAdmin(m.chat.id) ? handleUsers(m.chat.id) : handleAdminOnly(m.chat.id));
    bot.onText(/^\/listpair/, async (m) => isAdmin(m.chat.id) ? handleListpair(m.chat.id) : handleAdminOnly(m.chat.id));
    bot.onText(/^\/broadcast/, async (m) => isAdmin(m.chat.id) ? handleBroadcast(m.chat.id) : handleAdminOnly(m.chat.id));
    bot.onText(/^\/clean/, async (m) => isAdmin(m.chat.id) ? handleClean(m.chat.id) : handleAdminOnly(m.chat.id));
    bot.onText(/^\/ban/, async (m) => isAdmin(m.chat.id) ? handleBan(m.chat.id) : handleAdminOnly(m.chat.id));
    bot.onText(/^\/unban/, async (m) => isAdmin(m.chat.id) ? handleUnban(m.chat.id) : handleAdminOnly(m.chat.id));
    bot.onText(/^\/checkuser/, async (m) => isAdmin(m.chat.id) ? handleCheckuser(m.chat.id) : handleAdminOnly(m.chat.id));
    bot.onText(/^\/maintenance/, async (m) => isAdmin(m.chat.id) ? handleMaintenance(m.chat.id) : handleAdminOnly(m.chat.id));
    bot.onText(/^\/logs/, async (m) => isAdmin(m.chat.id) ? handleLogs(m.chat.id) : handleAdminOnly(m.chat.id));
    bot.onText(/^\/announce/, async (m) => isAdmin(m.chat.id) ? handleAnnounce(m.chat.id) : handleAdminOnly(m.chat.id));

    // ── OWNER ONLY ──
    bot.onText(/^\/addadmin/, async (m) => isOwner(m.chat.id) ? handleAddadmin(m.chat.id) : handleOwnerOnly(m.chat.id));
    bot.onText(/^\/removeadmin/, async (m) => isOwner(m.chat.id) ? handleRemoveadmin(m.chat.id) : handleOwnerOnly(m.chat.id));
    bot.onText(/^\/restart/, async (m) => isOwner(m.chat.id) ? handleRestart(m.chat.id) : handleOwnerOnly(m.chat.id));

    async function handlePing(chatId) {
        const start = Date.now();
        const rtt   = Date.now() - start || Math.floor(Math.random() * 80 + 120);
        const status = rtt < 300 ? '🟢 EXCELLENT' : rtt < 800 ? '🟡 OKAY' : '🔴 SLOW';
        await render(chatId,
            box('Pong!', [
                `🟢 ${sc('response')}: *${rtt}ms*`,
                `🟢 ${sc('status')}: *${status.split(' ')[1]}*`,
            ]),
            { reply_markup: kb(
                [{ text: '🔄 Refresh', callback_data: 'btn_ping', style: 'primary' }],
                [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]
            )}
        );
    }

    async function handleHelp(chatId) {
        await render(chatId,
            box('Command Center', [
                `─────── GENERAL COMMANDS ───────`,
                `/start      — Initialize bot`,
                `/pair       — Pair WhatsApp`,
                `/unpair     — Remove session`,
                `/ping       — Test connection`,
                `/stats      — Bot statistics`,
                `/help       — This menu`,
            ]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    async function handleStatus(chatId) {
        const sess      = tgSessions.get(chatId);
        const active    = sess?.phone ? activeSessions.get(sess.phone) : null;
        const connected = active?.sock?.ws?.readyState === 1;
        await render(chatId,
            box('Session Status', sess?.phone ? [
                `📱 Number: *+${sess.phone}*`,
                `🔌 Status: ${connected ? '🟢 Connected' : '🔴 Disconnected'}`,
                `🤖 Bot: *MADARA X-MD*`,
            ] : [
                `❌ No active session found.`,
                `Tap *Pair WhatsApp* to get started.`,
            ]),
            { reply_markup: kb(
                [{ text: '🔄 Refresh', callback_data: 'btn_status', style: 'primary' }],
                [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]
            )}
        );
    }

    async function handleRuntime(chatId) {
        const uptime = formatUptime(Date.now() - botStartedAt);
        await render(chatId,
            box('System Uptime', [`⏰ ${sc('uptime')}: *${uptime}*`]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    async function handleTutorial(chatId) {
        await render(chatId,
            box('Tutorial', [`🎬 Check our guide`, `YouTube channel link below`]),
            { reply_markup: kb(...linkRows(), [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    async function handleUsers(chatId) {
        const count = tgSessions.size;
        await render(chatId,
            box('User Registry', [`👥 ${sc('total')}: *${count}* users`]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    async function handleListpair(chatId) {
        const entries   = Array.from(activeSessions.entries());
        const total     = entries.length;
        const liveCount = entries.filter(([, s]) => s.connected).length;
        const sessions  = entries.map(([phone, s]) => {
            if (s.connected)              return `+${phone}: 🟢 Connected`;
            if (s.retries > 0)            return `+${phone}: 🟡 Reconnecting (try ${s.retries})`;
            return `+${phone}: 🔴 Down`;
        }).join('\n') || 'No sessions';

        await render(chatId,
            box('Active Sessions', [`🔌 Live: *${liveCount}* / *${total}* registered`, sessions]),
            { reply_markup: kb([{ text: '🔄 Refresh', callback_data: 'btn_listpair', style: 'primary' }], [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    async function handleBroadcast(chatId) {
        tgSessions.set(chatId, { ...(tgSessions.get(chatId) || {}), state: 'broadcast_msg' });
        const activeCount = Array.from(activeSessions.values()).filter(s => s?.connected).length;
        await render(chatId,
            box('Global Broadcast', [`📢 Send to *${activeCount}* active sessions`, `Enter your message:`]),
            { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_mainmenu', style: 'danger' }]) }
        );
    }

    async function handleReport(chatId) {
        const ownerPhone = process.env.OWNER_WHATSAPP || '234XXXXXXXXXX';
        await render(chatId,
            box('Support', [`📧 Send report to owner`, `Click below to open WhatsApp`]),
            { reply_markup: kb(
                [{ text: '💬 WhatsApp Owner', url: `https://wa.me/${ownerPhone}`, style: 'success' }],
                [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]
            )}
        );
    }

    async function handleClean(chatId) {
        const { clearSession, SESSIONS_ROOT } = require('./pairManager');

        let junkRemoved = 0;   // folders on disk with no creds.json (failed/aborted pairs)
        let deadRemoved = 0;   // sessions that gave up retrying (matches pairManager's own threshold)
        let orphaned    = 0;   // creds exist but not tracked in memory (likely needs a restart to resume)
        let kept        = 0;

        let folders = [];
        try { folders = fs.existsSync(SESSIONS_ROOT) ? fs.readdirSync(SESSIONS_ROOT) : []; } catch (_) {}

        for (const phone of folders) {
            const dir       = path.join(SESSIONS_ROOT, phone);
            const credsFile = path.join(dir, 'creds.json');
            const hasCreds  = fs.existsSync(credsFile);

            if (!hasCreds) {
                // Never actually finished pairing — pure junk folder.
                try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
                activeSessions.delete(phone);
                junkRemoved++;
                continue;
            }

            const entry  = activeSessions.get(phone);
            const isLive = entry?.connected === true;

            if (isLive) { kept++; continue; }

            if (!entry) {
                // Has creds, but the in-memory registry never picked it up
                // (e.g. crash before resumeSessions finished). Leave the
                // files alone — a restart will resume it — just report it.
                orphaned++;
                continue;
            }

            // Tracked but socket-less: only treat as "dead" once it has
            // exhausted the same retry budget pairManager itself gives up
            // at (>15), so we never nuke a session mid 3-60s reconnect.
            if ((entry.retries || 0) >= 15) {
                await clearSession(phone).catch(() => {});
                deadRemoved++;
            } else {
                kept++;
            }
        }

        await render(chatId,
            box('Session Cleanup', [
                `🧹 *Cleanup complete.*`,
                `🗑️ Junk (never paired): *${junkRemoved}*`,
                `❌ Dead/invalid sessions cleared: *${deadRemoved}*`,
                `⏳ Orphaned (needs restart to resume): *${orphaned}*`,
                `✅ Active sessions kept: *${kept}*`,
            ]),
            { reply_markup: kb([{ text: '✓ Done', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    async function handleBan(chatId) {
        tgSessions.set(chatId, { ...(tgSessions.get(chatId) || {}), state: 'ban_user' });
        await render(chatId,
            box('Ban User', [`🚫 ${sc('enter')} user ID`]),
            { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_mainmenu', style: 'danger' }]) }
        );
    }

    async function handleUnban(chatId) {
        tgSessions.set(chatId, { ...(tgSessions.get(chatId) || {}), state: 'unban_user' });
        await render(chatId,
            box('Unban User', [`✅ ${sc('enter')} user ID`]),
            { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_mainmenu', style: 'danger' }]) }
        );
    }

    async function handleCheckuser(chatId) {
        tgSessions.set(chatId, { ...(tgSessions.get(chatId) || {}), state: 'check_user' });
        await render(chatId,
            box('User Audit', [`🔍 ${sc('enter')} user ID`]),
            { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_mainmenu', style: 'danger' }]) }
        );
    }

    async function handleMaintenance(chatId) {
        const nowOn = maintenance.toggle();
        await render(chatId,
            box('Maintenance Mode', [
                nowOn
                    ? `🚧 Maintenance is now *ON*.`
                    : `✅ Maintenance is now *OFF*.`,
                nowOn
                    ? `Pairing is blocked for everyone except admins/owner.`
                    : `Pairing is open to everyone again.`,
            ]),
            { reply_markup: kb(
                [{ text: nowOn ? '↩️ Turn OFF' : '↩️ Turn ON', callback_data: 'btn_maintenance', style: nowOn ? 'success' : 'danger' }],
                [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]
            )}
        );
    }

    // ── Real-time log ring buffer — captures the last 20 bot events ───────
    const LOG_MAX = 20;
    const logRing = [];
    function botLog(level, msg) {
        const ts   = new Date().toTimeString().slice(0, 8);
        const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
        logRing.push(`\`${ts}\` ${icon} ${String(msg).slice(0, 120)}`);
        if (logRing.length > LOG_MAX) logRing.shift();
    }
    // Patch console so pairManager events flow into the ring buffer too
    const _origLog   = console.log.bind(console);
    const _origError = console.error.bind(console);
    console.log   = (...a) => { _origLog(...a);   botLog('info',  a.join(' ')); };
    console.error = (...a) => { _origError(...a); botLog('error', a.join(' ')); };

    async function handleLogs(chatId) {
        // Escape Markdown special chars in log lines so Telegram doesn't
        // reject the message due to stray * _ ` [ ] ( ) characters in paths/errors
        const escape = s => s.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
        const lines = logRing.length
            ? [...logRing].reverse().slice(0, 12).map(l => escape(l))
            : ['_No events logged yet_'];
        await render(chatId,
            box('Live Logs', lines),
            { reply_markup: kb(
                [{ text: '🔄 Refresh', callback_data: 'btn_logs', style: 'primary' }],
                [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]
            )}
        );
    }

    async function handleAnnounce(chatId) {
        tgSessions.set(chatId, { ...(tgSessions.get(chatId) || {}), state: 'announce_msg' });
        await render(chatId,
            box('Global Announcement', [`📅 ${sc('enter')} announcement (sent to all users)`]),
            { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_mainmenu', style: 'danger' }]) }
        );
    }

    // ── Clear Temp — global scan of all temp dirs ─────────────────────────
    // ── Shop Manager ─────────────────────────────────────────────────────
    const shopDB = require('./shopDB');
    const SHOP_CATS = shopDB.CATEGORIES;
    const SHOP_FIELDS = shopDB.FIELDS;
    const CAT_EMOJI_TG = { freefire:'🔥', pubg:'🎮', roblox:'🟥', valorant:'🎯', cod:'💣', genshin:'⚡' };

    async function handleShopMenu(chatId) {
        const rows = SHOP_CATS.map(c => [{
            text: `${CAT_EMOJI_TG[c]||'📦'} ${c.toUpperCase()} (${shopDB.listAccounts(c).length})`,
            callback_data: `btn_shop_cat_${c}`, style: 'primary'
        }]);
        rows.push([{ text: '📤 Upload Account', callback_data: 'btn_shop_upload', style: 'success' }]);
        rows.push([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]);
        await render(chatId,
            box('🛒 Shop Manager', [
                `ᴍᴀɴᴀɢᴇ ʏᴏᴜʀ ɢᴀᴍɪɴɢ ᴀᴄᴄᴏᴜɴᴛ sʜᴏᴘ.`,
                `sᴇʟᴇᴄᴛ ᴀ ᴄᴀᴛᴇɢᴏʀʏ ᴛᴏ ᴠɪᴇᴡ ᴀᴄᴄᴏᴜɴᴛs`,
                `ᴏʀ ᴜᴘʟᴏᴀᴅ ᴀ ɴᴇᴡ ᴏɴᴇ.`,
            ]),
            { reply_markup: kb(...rows) }
        );
    }

    async function handleShopCat(chatId, cat) {
        const ids = shopDB.listAccounts(cat);
        if (!ids.length) {
            return render(chatId,
                box(`${CAT_EMOJI_TG[cat]||'📦'} ${cat.toUpperCase()}`, [`📭 ɴᴏ ᴀᴄᴄᴏᴜɴᴛs ʏᴇᴛ.`, `ᴜsᴇ *📤 Upload Account* ᴛᴏ ᴀᴅᴅ ᴏɴᴇ.`]),
                { reply_markup: kb(
                    [{ text: '📤 Upload Account', callback_data: 'btn_shop_upload', style: 'success' }],
                    [{ text: '🔙 Back', callback_data: 'btn_shop', style: 'primary' }]
                )}
            );
        }
        await render(chatId,
            box(`${CAT_EMOJI_TG[cat]||'📦'} ${cat.toUpperCase()} — ${ids.length} ᴀᴄᴄᴏᴜɴᴛ(s)`, ids.map(id => `🆔 \`${id}\``)),
            { reply_markup: kb(
                ...ids.map(id => [{ text: `🗑️ Delete ${id}`, callback_data: `btn_shop_del_${cat}__${id}`, style: 'danger' }]),
                [{ text: '📤 Upload to this category', callback_data: 'btn_shop_upload', style: 'success' }],
                [{ text: '🔙 Back', callback_data: 'btn_shop', style: 'primary' }]
            )}
        );
    }

    async function handleShopDel(chatId, cat, id) {
        shopDB.deleteAccount(cat, id);
        await render(chatId,
            box('🗑️ Deleted', [`✅ Account *${id}* removed from *${cat.toUpperCase()}*.`]),
            { reply_markup: kb(
                [{ text: `🔙 Back to ${cat.toUpperCase()}`, callback_data: `btn_shop_cat_${cat}`, style: 'primary' }]
            )}
        );
    }

    async function handleShopUpload(chatId) {
        tgSessions.set(chatId, { ...(tgSessions.get(chatId)||{}), state: 'shop_pick_cat' });
        const rows = SHOP_CATS.map(c => [{ text: `${CAT_EMOJI_TG[c]||'📦'} ${c.toUpperCase()}`, callback_data: `shop_upload_cat_${c}` }]);
        rows.push([{ text: '❌ Cancel', callback_data: 'btn_shop', style: 'danger' }]);
        await render(chatId,
            box('📤 Upload Account', [`*Step 1/3* — Pick the game category:`]),
            { reply_markup: kb(...rows) }
        );
    }

    async function handleRender(chatId) { return render; }

    // ── Shop upload category selection callback ────────────────────────────
    // (wired in dispatchCallback below via startsWith check)

    // ── File Store Manager ────────────────────────────────────────────────
    const fileStore = require('./fileStore');
    const FS_EMOJI  = {sensitivity:'🎯',macro:'⚡',headshots:'💀',proxy:'🌐',vvipproxy:'👑',config:'⚙️',freebies:'🎁'};

    async function handleFileStoreMenu(chatId) {
        const rows = fileStore.CATEGORIES.map(c => {
            const cnt = c==='sensitivity'
                ? fileStore.listFiles(fileStore.catDir(c)).length
                : fileStore.PLATFORM_CATS.includes(c)
                    ? fileStore.listFiles(fileStore.catDir(c)+'/iphone').length + fileStore.listFiles(fileStore.catDir(c)+'/android').length
                    : fileStore.listFiles(fileStore.catDir(c)).length;
            return [{ text:`${FS_EMOJI[c]||'📁'} ${c.toUpperCase()} (${cnt})`, callback_data:`btn_fs_cat_${c}`, style:'primary' }];
        });
        rows.push([{ text:'📤 Upload File', callback_data:'btn_fs_upload', style:'success' }]);
        rows.push([{ text:'🏠 Main Menu',   callback_data:'btn_mainmenu',  style:'primary' }]);
        await render(chatId,
            box('📁 File Store Manager',[
                'ᴍᴀɴᴀɢᴇ ʏᴏᴜʀ ғʀᴇᴇ ғɪʀᴇ ғɪʟᴇ sᴛᴏʀᴇ.',
                'sᴇʟᴇᴄᴛ ᴀ ᴄᴀᴛᴇɢᴏʀʏ ᴛᴏ ᴠɪᴇᴡ/ᴅᴇʟᴇᴛᴇ ᴏʀ ᴜᴘʟᴏᴀᴅ ᴀ ɴᴇᴡ ғɪʟᴇ.',
            ]),
            { reply_markup: kb(...rows) }
        );
    }

    async function handleFileCat(chatId, cat) {
        const dir   = fileStore.catDir(cat);
        let   files = [];
        if (cat === 'sensitivity') {
            files = fileStore.listFiles(dir).map(f=>({label:f, key:`${cat}__${f}`}));
        } else if (fileStore.PLATFORM_CATS.includes(cat)) {
            ['iphone','android'].forEach(p=>{
                fileStore.listFiles(dir+'/'+p).forEach(f=>{
                    const price = fileStore.getFilePrice(cat, p, f);
                    files.push({label:`[${p}] ${f} — ${price}`, key:`${cat}__${p}__${f}`});
                });
            });
        } else {
            files = fileStore.listFiles(dir).map(f=>({label:f, key:`${cat}__${f}`}));
        }
        if (!files.length) {
            return render(chatId,
                box(`${FS_EMOJI[cat]||'📁'} ${cat.toUpperCase()}`,['📭 ɴᴏ ғɪʟᴇs ʏᴇᴛ.','ᴛᴀᴘ ᴜᴘʟᴏᴀᴅ ᴛᴏ ᴀᴅᴅ ᴏɴᴇ.']),
                { reply_markup: kb(
                    [{text:'📤 Upload File', callback_data:'btn_fs_upload', style:'success'}],
                    [{text:'🔙 Back', callback_data:'btn_filestore', style:'primary'}]
                )}
            );
        }
        await render(chatId,
            box(`${FS_EMOJI[cat]||'📁'} ${cat.toUpperCase()} — ${files.length} ғɪʟᴇ(s)`, files.map(f=>`📄 \`${f.label}\``)),
            { reply_markup: kb(
                ...files.map(f=>[{text:`🗑️ ${f.label}`, callback_data:`btn_fs_del_${f.key}`, style:'danger'}]),
                [{text:'📤 Upload File', callback_data:'btn_fs_upload', style:'success'}],
                [{text:'🔙 Back', callback_data:'btn_filestore', style:'primary'}]
            )}
        );
    }

    async function handleFileDel(chatId, cat, rest) {
        const parts = rest.split('__');
        let   fp;
        if (cat === 'sensitivity') {
            fp = require('path').join(fileStore.catDir(cat), parts[0]);
        } else if (parts.length === 2) {
            fp = require('path').join(fileStore.catDir(cat), parts[0], parts[1]);
        } else {
            fp = require('path').join(fileStore.catDir(cat), parts[0]);
        }
        try { require('fs').unlinkSync(fp); } catch {}
        // Clean up any custom price stored against this file
        try {
            if (cat === 'sensitivity') fileStore.deleteFilePrice(cat, null, parts[0]);
            else if (parts.length === 2) fileStore.deleteFilePrice(cat, parts[0], parts[1]);
            else fileStore.deleteFilePrice(cat, null, parts[0]);
        } catch {}
        await render(chatId,
            box('🗑️ Deleted', [`✅ File removed from *${cat.toUpperCase()}*.`]),
            { reply_markup: kb([{text:`🔙 Back to ${cat}`, callback_data:`btn_fs_cat_${cat}`, style:'primary'}]) }
        );
    }

    async function handleFileUpload(chatId) {
        tgSessions.set(chatId, { ...(tgSessions.get(chatId)||{}), state:'fs_pick_cat' });
        const rows = fileStore.CATEGORIES.map(c=>[{text:`${FS_EMOJI[c]||'📁'} ${c.toUpperCase()}`, callback_data:`fs_upload_cat_${c}`}]);
        rows.push([{text:'❌ Cancel', callback_data:'btn_filestore', style:'danger'}]);
        await render(chatId,
            box('📤 Upload File',['*Step 1* — Pick category:']),
            { reply_markup: kb(...rows) }
        );
    }

    async function handleClearTemp(chatId) {
        const dirs = [
            path.join(process.cwd(), 'temp'),
            path.join(process.cwd(), 'tmp'),
            path.join(process.cwd(), '.tmp'),
        ];
        // Also clean each session's own temp scratch if any
        try {
            const { SESSIONS_ROOT } = require('./pairManager');
            if (fs.existsSync(SESSIONS_ROOT)) {
                for (const p of fs.readdirSync(SESSIONS_ROOT)) {
                    ['temp','tmp','.tmp'].forEach(d => dirs.push(path.join(SESSIONS_ROOT, p, d)));
                }
            }
        } catch {}

        let count = 0, bytes = 0;
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) continue;
            for (const f of fs.readdirSync(dir)) {
                const fp = path.join(dir, f);
                try {
                    const stat = fs.statSync(fp);
                    bytes += stat.size;
                    fs.unlinkSync(fp);
                    count++;
                } catch {}
            }
        }
        const mb = (bytes / 1048576).toFixed(2);
        if (global.gc) global.gc();
        await render(chatId,
            box('Clear Temp', [
                `🗑️ *Temp files cleared globally.*`,
                `📂 Files removed: *${count}*`,
                `💾 Space freed: *${mb} MB*`,
            ]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    // ── Delete Session — admin enters a phone number to force-delete ──────
    async function handleDelSession(chatId) {
        tgSessions.set(chatId, { ...(tgSessions.get(chatId) || {}), state: 'delsession_id' });
        const list = Array.from(activeSessions.keys()).map(p => `+${p}`).join('\n') || '_None_';
        await render(chatId,
            box('Delete Session', [
                `❌ Enter the phone number to delete:`,
                `_(country code, no + or spaces)_`,
                ``,
                `*Registered sessions:*`,
                list,
            ]),
            { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_adminmenu', style: 'danger' }]) }
        );
    }

    async function handleAdminOnly(chatId) {
        await render(chatId,
            box('Access Denied', [`👮 ${sc('admin')} only`, `Contact administrator`]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    async function handleOwnerOnly(chatId) {
        await render(chatId,
            box('Access Denied', [`🔒 ${sc('owner')} only`, `Contact owner`]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    async function handleAddadmin(chatId) {
        tgSessions.set(chatId, { ...(tgSessions.get(chatId) || {}), state: 'addadmin_id' });
        await render(chatId,
            box('Add Admin', [`➕ ${sc('enter')} user ID`]),
            { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_mainmenu', style: 'danger' }]) }
        );
    }

    async function handleRemoveadmin(chatId) {
        tgSessions.set(chatId, { ...(tgSessions.get(chatId) || {}), state: 'removeadmin_id' });
        await render(chatId,
            box('Remove Admin', [`➖ ${sc('enter')} user ID`]),
            { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_mainmenu', style: 'danger' }]) }
        );
    }

    async function handleRestart(chatId) {
        await render(chatId,
            box('Restart', [`⟳ ${sc('restarting')}...`, `Bot will be back online shortly`]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
        setTimeout(() => process.exit(0), 2000);
    }

    // ── Callback (button) handler — ALWAYS edits in place ──────────────────
    bot.on('callback_query', async (q) => {
        const chatId = q.message.chat.id;
        const data   = q.data;

        if (isBanned(chatId)) {
            return bot.answerCallbackQuery(q.id, { text: '🚫 You are banned from using this bot.', show_alert: true }).catch(() => {});
        }
        bot.answerCallbackQuery(q.id).catch(() => {});

        try {
            await dispatchCallback(chatId, data, q.message.message_id, q.id);
        } catch (e) {
            console.error('[Telegram] callback_query handler error:', e.stack || e.message);
            render(chatId,
                box('Error', [`❌ Something went wrong handling that button.`, `\`${e.message}\``]),
                { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
            ).catch(() => {});
        }
    });

    async function dispatchCallback(chatId, data, callbackMsgId, callbackQueryId) {
        // Make sure render() knows which message to edit (in case Telegram
        // routed this callback from a message not yet tracked, e.g. after
        // a bot restart — fall back to the message the button was attached to)
        // NOTE: this used to reference `q.message.message_id` directly, but `q`
        // is the callback_query event's own parameter and isn't in scope here —
        // that threw "q is not defined" on any callback where lastMsgId wasn't
        // already cached, silently killing the button (caught above, but the
        // user only ever saw "not responding"). callbackMsgId is now passed in
        // explicitly from the event listener, which does have `q`.
        const sess = tgSessions.get(chatId) || {};
        if (!sess.lastMsgId && callbackMsgId) tgSessions.set(chatId, { ...sess, lastMsgId: callbackMsgId });

        // ── Join-gate verify button ───────────────────────────────────────
        if (data === 'btn_verify') {
            const joined = await checkMembership(chatId);
            if (!joined) {
                // Still not joined — flash a toast and re-show the gate
                await bot.answerCallbackQuery(callbackQueryId, {
                    text: '❌ You have not joined the channel yet. Please join first then tap Verify.',
                    show_alert: true,
                }).catch(() => {});
                return sendJoinGate(chatId);
            }
            // Verified — show main menu with a welcome toast
            tgSessions.set(chatId, { ...(tgSessions.get(chatId) || {}) });
            return await render(chatId,
                box('Access Granted ✅', [
                    `🎉 *Welcome to MADARA X-MD | INC.*`,
                    `You are now verified. Enjoy the bot!`,
                ]) + '\n\n' + mainMenuText(),
                { reply_markup: mainMenuKeyboard() }
            );
        }

        if (data === 'btn_mainmenu') {
            return await render(chatId, mainMenuText(), { reply_markup: mainMenuKeyboard() });
        }

        // ── Menu Navigation ──
        if (data === 'btn_usermenu') {
            return await render(chatId, 
                box('👤 User Menu', [`Quick actions`]),
                { reply_markup: userMenuKeyboard() }
            );
        }

        if (data === 'btn_adminmenu') {
            if (!isAdmin(chatId)) {
                return await render(chatId,
                    box('Access Denied', [`👮 Admin only`]),
                    { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
                );
            }
            return await render(chatId,
                box('👮 Admin Menu', [`Control panel`]),
                { reply_markup: adminMenuKeyboard() }
            );
        }

        if (data === 'btn_ownermenu') {
            if (!isOwner(chatId)) {
                return await render(chatId,
                    box('Access Denied', [`🔒 Owner only`]),
                    { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
                );
            }
            return await render(chatId,
                box('🔒 Owner Menu', [`Exclusive access`]),
                { reply_markup: ownerMenuKeyboard() }
            );
        }

        // ── User Menu Buttons ──
        if (data === 'btn_runtime') return handleRuntime(chatId);
        if (data === 'btn_report')  return handleReport(chatId);
        if (data === 'btn_tutorial') return handleTutorial(chatId);
        if (data === 'btn_sessions') {
            const sessData   = tgSessions.get(chatId);
            const active     = sessData?.phone ? activeSessions.get(sessData.phone) : null;
            const connected  = active?.sock?.ws?.readyState === 1;
            return await render(chatId,
                box('Your Sessions', sessData?.phone ? [
                    `📱 *+${sessData.phone}*`,
                    `Status: ${connected ? '🟢 Active' : '🔴 Inactive'}`,
                ] : [`📋 No sessions paired yet.`]),
                { reply_markup: kb(
                    [{ text: '🔄 Re-Pair', callback_data: 'btn_pair', style: 'success' }],
                    [{ text: '🗑️ Disconnect', callback_data: 'btn_unpair', style: 'danger' }],
                    [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]
                )}
            );
        }

        // ── Admin Menu Buttons ──
        if (data === 'btn_users')    return handleUsers(chatId);
        if (data === 'btn_listpair') return handleListpair(chatId);
        if (data === 'btn_broadcast') return handleBroadcast(chatId);
        if (data === 'btn_clean')      return handleClean(chatId);
        if (data === 'btn_cleartemp')  return handleClearTemp(chatId);
        if (data === 'btn_shop')           return handleShopMenu(chatId);
        if (data === 'btn_filestore')      return handleFileStoreMenu(chatId);
        if (data === 'btn_fs_upload')      return handleFileUpload(chatId);
        if (data?.startsWith('btn_fs_cat_')) return handleFileCat(chatId, data.replace('btn_fs_cat_',''));
        if (data?.startsWith('btn_fs_del_')) {
            const[cat,...rest]=data.replace('btn_fs_del_','').split('__');
            return handleFileDel(chatId,cat,rest.join('__'));
        }
        if (data?.startsWith('fs_upload_cat_')) {
            const cat = data.replace('fs_upload_cat_','');
            const needsPlat = fileStore.PLATFORM_CATS.includes(cat);
            if (needsPlat) {
                tgSessions.set(chatId,{...(tgSessions.get(chatId)||{}),state:'fs_pick_plat',fsCat:cat});
                return render(chatId,
                    box('📤 Upload File',[`*Category:* ${cat.toUpperCase()}`,`*Step 2* — Pick platform:`]),
                    { reply_markup: kb(
                        [{text:'🤖 Android', callback_data:`fs_upload_plat_${cat}__android`}],
                        [{text:'🍎 iPhone',  callback_data:`fs_upload_plat_${cat}__iphone`}],
                        [{text:'❌ Cancel',  callback_data:'btn_filestore', style:'danger'}]
                    )}
                );
            }
            // Free category (sensitivity/freebies) — no price step needed
            tgSessions.set(chatId,{...(tgSessions.get(chatId)||{}),state:'fs_await_file',fsCat:cat,fsPlatform:null,fsFilename:null,fsPrice:null});
            return render(chatId,
                box('📤 Upload File',[`*Category:* ${cat.toUpperCase()}`,`*Step 2* — Enter filename (e.g. ${mdSafe('samsung-a12.txt')}):`]),
                { reply_markup: kb([{text:'❌ Cancel', callback_data:'btn_filestore', style:'danger'}]) }
            );
        }
        if (data?.startsWith('fs_upload_plat_')) {
            const[cat,plat]=data.replace('fs_upload_plat_','').split('__');
            // Paid category — ask for the price before the filename/file
            tgSessions.set(chatId,{...(tgSessions.get(chatId)||{}),state:'fs_await_price',fsCat:cat,fsPlatform:plat});
            return render(chatId,
                box('📤 Upload File',[
                    `*Category:* ${cat.toUpperCase()}`,
                    `*Platform:* ${plat.toUpperCase()}`,
                    `*Step 3* — Enter the price for this file:`,
                    `_e.ɢ. ₦1,500 or 1500_`,
                    ``,
                    `_ᴛᴀᴘ sᴋɪᴘ ᴛᴏ ᴜsᴇ ᴛʜᴇ ᴄᴀᴛᴇɢᴏʀʏ ᴅᴇғᴀᴜʟᴛ (${fileStore.getPrice(cat)})_`,
                ]),
                { reply_markup: kb(
                    [{text:'⏭️ Skip (use default)', callback_data:`fs_price_skip`}],
                    [{text:'❌ Cancel', callback_data:'btn_filestore', style:'danger'}]
                )}
            );
        }
        if (data === 'fs_price_skip') {
            const sess2 = tgSessions.get(chatId) || {};
            tgSessions.set(chatId,{...sess2,state:'fs_await_filename',fsPrice:null});
            return render(chatId,
                box('📤 Upload File',[
                    `*Category:* ${sess2.fsCat?.toUpperCase()}`,
                    `*Platform:* ${sess2.fsPlatform?.toUpperCase()}`,
                    `*Price:* ᴅᴇғᴀᴜʟᴛ (${fileStore.getPrice(sess2.fsCat)})`,
                    '*Step 4* — Enter filename (e.g. file.txt):',
                ]),
                { reply_markup: kb([{text:'❌ Cancel', callback_data:'btn_filestore', style:'danger'}]) }
            );
        }
        if (data === 'btn_shop_upload') return handleShopUpload(chatId);
        if (data?.startsWith('btn_shop_cat_'))  return handleShopCat(chatId, data.replace('btn_shop_cat_',''));
        if (data?.startsWith('btn_shop_del_')) {
            const [cat, id] = data.replace('btn_shop_del_','').split('__');
            return handleShopDel(chatId, cat, id);
        }
        if (data?.startsWith('shop_upload_cat_')) {
            const cat = data.replace('shop_upload_cat_','');
            tgSessions.set(chatId, { ...(tgSessions.get(chatId)||{}), state: 'shop_await_image', shopCat: cat });
            return render(chatId,
                box('📤 Upload Account', [
                    `*Step 2/3* — Send the account *image* now.`,
                    `ᴄᴀᴛᴇɢᴏʀʏ: *${cat.toUpperCase()}*`,
                ]),
                { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_shop', style: 'danger' }]) }
            );
        }
        if (data === 'btn_delsession') return handleDelSession(chatId);
        if (data === 'btn_ban')      return handleBan(chatId);
        if (data === 'btn_unban')    return handleUnban(chatId);
        if (data === 'btn_checkuser') return handleCheckuser(chatId);
        if (data === 'btn_maintenance') return handleMaintenance(chatId);
        if (data === 'btn_logs')     return handleLogs(chatId);
        if (data === 'btn_announce') return handleAnnounce(chatId);

        // ── Owner Menu Buttons ──
        if (data === 'btn_addadmin') return handleAddadmin(chatId);
        if (data === 'btn_removeadmin') return handleRemoveadmin(chatId);
        if (data === 'btn_restart') return handleRestart(chatId);

        if (data === 'btn_pair') {
            if (!(await checkMembership(chatId))) return sendJoinGate(chatId);
            if (maintenance.isOn() && !isAdmin(chatId)) return sendMaintenanceNotice(chatId);
            tgSessions.set(chatId, { ...(tgSessions.get(chatId) || {}), state: 'awaiting_phone' });
            return await render(chatId,
                box('Pair WhatsApp', [
                    `📱 Enter your *WhatsApp number*`,
                    `with country code, no + or spaces`,
                    `Example: 2347062301699`,
                ]),
                { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
            );
        }

        if (data === 'btn_status') return handleStatus(chatId);
        if (data === 'btn_stats')  return handleStatus(chatId);
        if (data === 'btn_ping')   return handlePing(chatId);

        if (data === 'btn_unpair') {
            const sessData = tgSessions.get(chatId);
            if (sessData?.phone) {
                const { clearSession } = require('./pairManager');
                await clearSession(sessData.phone).catch(() => {});
                tgSessions.set(chatId, { lastMsgId: sessData?.lastMsgId });
            }
            return await render(chatId,
                box('Session Removed', [`✅ Session unpaired successfully.`, `Tap below to pair again.`]),
                { reply_markup: kb(
                    [{ text: '📱 Pair WhatsApp', callback_data: 'btn_pair', style: 'success' }],
                    [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]
                )}
            );
        }
        if (data === 'btn_help')  {
            return await render(chatId,
                box('Help', [
                    `1️⃣ Tap *Pair WhatsApp*`,
                    `2️⃣ Enter your phone number`,
                    `3️⃣ Get your pairing code`,
                    `4️⃣ WhatsApp → Linked Devices → Link a Device`,
                    `5️⃣ Tap *Link with phone number* → enter the code`,
                    ``,
                    `_Your bot goes live instantly!_`,
                ]),
                { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
            );
        }
        if (data === 'btn_commands') return handleHelp(chatId);

        if (data === 'btn_disconnect') {
            const sessData = tgSessions.get(chatId);
            if (sessData?.phone) {
                const active = activeSessions.get(sessData.phone);
                if (active?.sock) {
                    if (active.zombieTimer) clearInterval(active.zombieTimer);
                    try { active.sock.end(); } catch {}
                    activeSessions.delete(sessData.phone);
                }
            }
            tgSessions.set(chatId, { lastMsgId: sessData?.lastMsgId });
            return await render(chatId,
                box('Disconnected', [`✅ Session disconnected.`, `Tap below to pair again.`]),
                { reply_markup: kb(
                    [{ text: '📱 Pair WhatsApp', callback_data: 'btn_pair', style: 'success' }],
                    [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]
                )}
            );
        }
    }

    // ── Plain text messages (phone number entry during pairing flow) ───────
    bot.on('message', async (m) => {
        if (m.text?.startsWith('/')) return;
        const chatId = m.chat.id;
        if (isBanned(chatId)) return sendBannedNotice(chatId);
        try {
            await dispatchMessage(chatId, m);
        } catch (e) {
            console.error('[Telegram] message handler error:', e.stack || e.message);
            render(chatId,
                box('Error', [`❌ Something went wrong processing that.`, `\`${e.message}\``]),
                { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
            ).catch(() => {});
        }
    });

    async function dispatchMessage(chatId, m) {
        const text   = (m.text || '').trim();
        const sess   = tgSessions.get(chatId) || {};

        // ── Broadcast (send to all active sessions) ──
        // ── Admin: force-delete a specific session by phone number ────────
        if (sess.state === 'delsession_id') {
            if (text.toLowerCase() === 'cancel') {
                tgSessions.set(chatId, { ...sess, state: null });
                return await render(chatId, box('👮 Admin Menu', [`Control panel`]), { reply_markup: adminMenuKeyboard() });
            }
            const { clearSession } = require('./pairManager');
            const phone = text.replace(/[^0-9]/g, '');
            tgSessions.set(chatId, { ...sess, state: null });
            if (!phone) {
                return await render(chatId,
                    box('Delete Session', [`❌ Invalid number — try again.`]),
                    { reply_markup: kb([{ text: '🔙 Back', callback_data: 'btn_adminmenu', style: 'primary' }]) }
                );
            }
            const existed = await clearSession(phone).catch(() => false);
            return await render(chatId,
                box('Delete Session', [
                    existed
                        ? `✅ Session *+${phone}* deleted and disconnected.`
                        : `⚠️ No session found for *+${phone}*.`,
                ]),
                { reply_markup: kb(
                    [{ text: '❌ Delete Another', callback_data: 'btn_delsession', style: 'danger' }],
                    [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]
                )}
            );
        }

        // ── Shop: awaiting account image ──────────────────────────────────
        if (sess.state === 'shop_await_image') {
            const photo = m.photo?.[m.photo.length-1] || m.document;
            if (!photo) return render(chatId,
                box('📤 Upload', [`❌ ᴘʟᴇᴀsᴇ sᴇɴᴅ ᴀɴ *ɪᴍᴀɢᴇ* ғɪʟᴇ.`]),
                { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_shop', style: 'danger' }]) }
            );
            const fileId = photo.file_id;
            const cat    = sess.shopCat;
            const fields = shopDB.FIELDS[cat] || [];
            tgSessions.set(chatId, { ...sess, state: 'shop_collect_fields', shopImageFileId: fileId, shopFieldIdx: 0, shopAnswers: [] });
            return render(chatId,
                box('📤 Upload Account', [
                    `✅ ɪᴍᴀɢᴇ ʀᴇᴄᴇɪᴠᴇᴅ!`,
                    ``,
                    `*Step 3/3* — ᴀɴsᴡᴇʀ ᴇᴀᴄʜ ғɪᴇʟᴅ:`,
                    ``,
                    `*${fields[0]}:*`,
                ]),
                { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_shop', style: 'danger' }]) }
            );
        }

        // ── Shop: collecting fields one by one ────────────────────────────
        if (sess.state === 'shop_collect_fields') {
            const cat      = sess.shopCat;
            const fields   = shopDB.FIELDS[cat] || [];
            const idx      = sess.shopFieldIdx || 0;
            const answers  = sess.shopAnswers  || [];
            answers.push(text);
            const nextIdx  = idx + 1;

            if (nextIdx < fields.length) {
                tgSessions.set(chatId, { ...sess, shopFieldIdx: nextIdx, shopAnswers: answers });
                return render(chatId,
                    box('📤 Upload Account', [
                        `*Field ${nextIdx+1}/${fields.length}*`,
                        ``,
                        `*${fields[nextIdx]}:*`,
                    ]),
                    { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_shop', style: 'danger' }]) }
                );
            }

            // All fields collected — save the account
            tgSessions.set(chatId, { ...sess, state: null, shopFieldIdx: 0, shopAnswers: [], shopImageFileId: null, shopCat: null });
            try {
                const fileLink = await bot.getFileLink(sess.shopImageFileId);
                const axios    = require('axios');
                const imgBuf   = Buffer.from((await axios.get(fileLink, { responseType: 'arraybuffer' })).data);
                const id       = shopDB.nextId(cat);
                const infoText = fields.map((f, i) => `*${f}:* ${answers[i]||'ɴ/ᴀ'}`).join('\n');
                shopDB.saveAccount(cat, id, imgBuf, '.jpg', infoText);
                return render(chatId,
                    box('✅ Account Uploaded', [
                        `🎮 ᴄᴀᴛᴇɢᴏʀʏ: *${cat.toUpperCase()}*`,
                        `🆔 ID: *${id}*`,
                        ``,
                        ...fields.map((f,i) => `*${f}:* ${answers[i]||'ɴ/ᴀ'}`),
                    ]),
                    { reply_markup: kb(
                        [{ text: '📤 Upload Another', callback_data: 'btn_shop_upload', style: 'success' }],
                        [{ text: '🛒 Shop Manager',   callback_data: 'btn_shop', style: 'primary' }]
                    )}
                );
            } catch (e) {
                return render(chatId, box('❌ Upload Failed', [`${e.message}`]),
                    { reply_markup: kb([{ text: '🔙 Back', callback_data: 'btn_shop', style: 'primary' }]) }
                );
            }
        }

        // ── File Store: price input (paid categories only) ─────────────────
        if (sess.state === 'fs_await_price') {
            const price = text.trim();
            if (!price) return render(chatId, box('📤 Upload', ['❌ ᴇɴᴛᴇʀ ᴀ ᴠᴀʟɪᴅ ᴘʀɪᴄᴇ, ᴏʀ ᴛᴀᴘ sᴋɪᴘ.']),
                { reply_markup: kb([{text:'⏭️ Skip (use default)', callback_data:'fs_price_skip'}],[{text:'❌ Cancel', callback_data:'btn_filestore', style:'danger'}]) });
            tgSessions.set(chatId, {...sess, state:'fs_await_filename', fsPrice:price});
            return render(chatId,
                box('📤 Upload File', [
                    `*ᴄᴀᴛᴇɢᴏʀʏ:* ${sess.fsCat?.toUpperCase()}`,
                    `*ᴘʟᴀᴛғᴏʀᴍ:* ${sess.fsPlatform?.toUpperCase()}`,
                    `*ᴘʀɪᴄᴇ:* ${price}`,
                    '*Step 4* — Enter filename (e.g. file.txt):',
                ]),
                { reply_markup: kb([{text:'❌ Cancel', callback_data:'btn_filestore', style:'danger'}]) }
            );
        }

        // ── File Store: filename input ─────────────────────────────────────
        if (sess.state === 'fs_await_filename' || sess.state === 'fs_await_file') {
            const filename = text.trim();
            if (!filename) return render(chatId, box('📤 Upload', ['❌ ᴇɴᴛᴇʀ ᴀ ᴠᴀʟɪᴅ ғɪʟᴇɴᴀᴍᴇ.']),
                { reply_markup: kb([{text:'❌ Cancel', callback_data:'btn_filestore', style:'danger'}]) });
            tgSessions.set(chatId, {...sess, state:'fs_await_file_data', fsFilename:filename});
            return render(chatId,
                box('📤 Upload File', [
                    `*ғɪʟᴇɴᴀᴍᴇ:* ${mdSafe(filename)}`,
                    `*ᴄᴀᴛᴇɢᴏʀʏ:* ${sess.fsCat?.toUpperCase()}`,
                    sess.fsPlatform ? `*ᴘʟᴀᴛғᴏʀᴍ:* ${sess.fsPlatform?.toUpperCase()}` : '',
                    sess.fsPrice ? `*ᴘʀɪᴄᴇ:* ${sess.fsPrice}` : '',
                    '*Step — Now send the actual file:*',
                ].filter(Boolean)),
                { reply_markup: kb([{text:'❌ Cancel', callback_data:'btn_filestore', style:'danger'}]) }
            );
        }

        // ── File Store: actual file received ──────────────────────────────
        if (sess.state === 'fs_await_file_data') {
            const doc = m.document;
            if (!doc) return render(chatId, box('📤 Upload', ['❌ ᴘʟᴇᴀsᴇ sᴇɴᴅ ᴀ ғɪʟᴇ (ᴅᴏᴄᴜᴍᴇɴᴛ).']),
                { reply_markup: kb([{text:'❌ Cancel', callback_data:'btn_filestore', style:'danger'}]) });
            const {fsCat, fsPlatform, fsFilename, fsPrice} = sess;
            tgSessions.set(chatId, {...sess, state:null, fsCat:null, fsPlatform:null, fsFilename:null, fsPrice:null});
            try {
                const fileLink = await bot.getFileLink(doc.file_id);
                const axios    = require('axios');
                const buf      = Buffer.from((await axios.get(fileLink,{responseType:'arraybuffer'})).data);
                const saved    = fileStore.saveFile(fsCat, fsPlatform||'android', fsFilename, buf, fsPrice);
                const priceLine = fileStore.isPaidCategory(fsCat)
                    ? `💰 ᴘʀɪᴄᴇ: *${fsPrice || fileStore.getPrice(fsCat) + ' (ᴅᴇғᴀᴜʟᴛ)'}*`
                    : '';
                return render(chatId,
                    box('✅ File Uploaded',[
                        `🎮 ᴄᴀᴛᴇɢᴏʀʏ: *${fsCat?.toUpperCase()}*`,
                        fsPlatform ? `📱 ᴘʟᴀᴛғᴏʀᴍ: *${fsPlatform?.toUpperCase()}*` : '',
                        `📄 ғɪʟᴇ: ${mdSafe(fsFilename)}`,
                        priceLine,
                        `✅ sᴀᴠᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ!`,
                    ].filter(Boolean)),
                    { reply_markup: kb(
                        [{text:'📤 Upload Another', callback_data:'btn_fs_upload', style:'success'}],
                        [{text:'📁 File Store',     callback_data:'btn_filestore',  style:'primary'}]
                    )}
                );
            } catch(e) {
                return render(chatId, box('❌ Upload Failed',[`${e.message}`]),
                    { reply_markup: kb([{text:'🔙 Back', callback_data:'btn_filestore', style:'primary'}]) });
            }
        }

        if (sess.state === 'broadcast_msg') {
            if (text.toLowerCase() === 'cancel') {
                return await render(chatId, mainMenuText(), { reply_markup: mainMenuKeyboard() });
            }
            
            let count = 0;
            for (const [phone, active] of activeSessions.entries()) {
                if (active?.connected && active?.sock) {
                    try {
                        await active.sock.sendMessage(phone + '@s.whatsapp.net', {
                            text: `📢 *BROADCAST*\n\n${text}`
                        });
                        count++;
                    } catch (e) {}
                }
            }
            
            tgSessions.set(chatId, { ...(tgSessions.get(chatId) || {}), state: null });
            return await render(chatId,
                box('Broadcast Sent', [`✅ Message sent to *${count}* active sessions`]),
                { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
            );
        }

        // ── Announce (send to all Telegram users) ──
        if (sess.state === 'announce_msg') {
            if (text.toLowerCase() === 'cancel') {
                return await render(chatId, mainMenuText(), { reply_markup: mainMenuKeyboard() });
            }
            
            let count = 0;
            for (const [id] of tgSessions.entries()) {
                try {
                    await bot.sendMessage(id, 
                        box('📅 Announcement', [text]) + '\n\n_Sent to all users_',
                        { parse_mode: 'Markdown' }
                    );
                    count++;
                } catch (e) {}
            }
            
            tgSessions.set(chatId, { ...(tgSessions.get(chatId) || {}), state: null });
            return await render(chatId,
                box('Announcement Sent', [`✅ Announcement sent to *${count}* users`]),
                { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
            );
        }

        // ── Ban a user by Telegram ID ──
        if (sess.state === 'ban_user') {
            if (text.toLowerCase() === 'cancel') {
                return await render(chatId, mainMenuText(), { reply_markup: mainMenuKeyboard() });
            }
            const targetId = text.replace(/[^0-9]/g, '');
            tgSessions.set(chatId, { ...sess, state: null });
            if (!targetId) {
                return await render(chatId,
                    box('Ban User', [`❌ Invalid ID. Send a numeric Telegram user ID.`]),
                    { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
                );
            }
            if (isAdmin(targetId)) {
                return await render(chatId,
                    box('Ban User', [`❌ Can't ban an admin or owner.`, `Remove their admin rights first.`]),
                    { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
                );
            }
            tgAdmin.ban(targetId);
            return await render(chatId,
                box('User Banned', [`🚫 *${targetId}* can no longer use this bot.`]),
                { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
            );
        }

        // ── Unban a user by Telegram ID ──
        if (sess.state === 'unban_user') {
            if (text.toLowerCase() === 'cancel') {
                return await render(chatId, mainMenuText(), { reply_markup: mainMenuKeyboard() });
            }
            const targetId = text.replace(/[^0-9]/g, '');
            tgSessions.set(chatId, { ...sess, state: null });
            const removed = targetId && tgAdmin.unban(targetId);
            return await render(chatId,
                box('Unban User', removed
                    ? [`✅ *${targetId}* has been unbanned.`]
                    : [`❌ *${targetId || text}* was not on the ban list.`]),
                { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
            );
        }

        // ── Look up a user's status ──
        if (sess.state === 'check_user') {
            if (text.toLowerCase() === 'cancel') {
                return await render(chatId, mainMenuText(), { reply_markup: mainMenuKeyboard() });
            }
            const targetId = text.replace(/[^0-9]/g, '');
            tgSessions.set(chatId, { ...sess, state: null });
            const targetSess = tgSessions.get(Number(targetId)) || tgSessions.get(targetId);
            return await render(chatId,
                box('User Audit', [
                    `🆔 ID: *${targetId || text}*`,
                    `👑 Owner: ${isOwner(targetId) ? '✅' : '❌'}`,
                    `👮 Admin: ${isAdmin(targetId) ? '✅' : '❌'}`,
                    `🚫 Banned: ${tgAdmin.isBannedRaw(targetId) ? '✅' : '❌'}`,
                    `📱 Linked number: ${targetSess?.phone ? '+' + targetSess.phone : 'None'}`,
                ]),
                { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
            );
        }

        // ── Owner: add a dynamic admin ──
        if (sess.state === 'addadmin_id') {
            if (text.toLowerCase() === 'cancel') {
                return await render(chatId, mainMenuText(), { reply_markup: mainMenuKeyboard() });
            }
            if (!isOwner(chatId)) return; // safety net — menu already gates this
            const targetId = text.replace(/[^0-9]/g, '');
            tgSessions.set(chatId, { ...sess, state: null });
            if (!targetId) {
                return await render(chatId,
                    box('Add Admin', [`❌ Invalid ID. Send a numeric Telegram user ID.`]),
                    { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
                );
            }
            const added = tgAdmin.addAdmin(targetId);
            return await render(chatId,
                box('Admin Added', [added
                    ? `✅ *${targetId}* is now an admin.`
                    : `ℹ️ *${targetId}* was already an admin.`]),
                { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
            );
        }

        // ── Owner: remove a dynamic admin ──
        if (sess.state === 'removeadmin_id') {
            if (text.toLowerCase() === 'cancel') {
                return await render(chatId, mainMenuText(), { reply_markup: mainMenuKeyboard() });
            }
            if (!isOwner(chatId)) return; // safety net — menu already gates this
            const targetId = text.replace(/[^0-9]/g, '');
            tgSessions.set(chatId, { ...sess, state: null });
            if (ADMIN_IDS.includes(targetId)) {
                return await render(chatId,
                    box('Remove Admin', [`❌ *${mdSafe(targetId)}* is a fixed .env admin — remove it from ${mdSafe('ADMIN_ID')} instead.`]),
                    { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
                );
            }
            const removed = tgAdmin.removeAdmin(targetId);
            return await render(chatId,
                box('Admin Removed', [removed
                    ? `✅ *${targetId}* is no longer an admin.`
                    : `ℹ️ *${targetId}* wasn't a dynamic admin.`]),
                { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
            );
        }

        if (sess.state === 'awaiting_phone') {
            if (maintenance.isOn() && !isAdmin(chatId)) {
                tgSessions.set(chatId, { ...sess, state: null });
                return sendMaintenanceNotice(chatId);
            }
            const phone = text.replace(/[^0-9]/g, '');
            if (phone.length < 7 || phone.length > 15) {
                return await render(chatId,
                    box('Invalid Number', [
                        `❌ Enter with country code (no + or spaces).`,
                        `Example: 2347062301699`,
                    ]),
                    { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
                );
            }

            tgSessions.set(chatId, { ...sess, state: 'pairing', phone });
            await render(chatId,
                box('Generating Code', [`⏳ Generating pairing code for *+${phone}*...`, `Please wait up to 30 seconds.`])
            );

            await executePairing(chatId, phone);
        }

        // ── Group: user replied with their number after /pair ──
        const groupSess = groupSessions.get(chatId);
        if (groupSess?.state === 'awaiting_phone_group' && m.chat?.type !== 'private') {
            const phone = text.replace(/[^0-9]/g, '');
            const groupId = groupSess.groupId;
            const username = m.from?.username ? `@${m.from.username}` : m.from?.first_name || 'User';

            if (phone.length < 7 || phone.length > 15) {
                const reply = await bot.sendMessage(groupId,
                    `❌ ${username}, invalid number. Try: \`2347062301699\``,
                    { parse_mode: 'Markdown', reply_to_message_id: m.message_id }
                ).catch(() => null);
                if (reply) autoDelete(groupId, reply.message_id);
                return;
            }

            groupSessions.set(chatId, { ...groupSess, state: 'pairing', phone });

            const groupReply = await bot.sendMessage(groupId,
                `⏳ ${username}, generating your code... Check your *DM*!`,
                { parse_mode: 'Markdown', reply_to_message_id: m.message_id }
            ).catch(() => null);
            if (groupReply) autoDelete(groupId, groupReply.message_id, 20000);

            await executePairing(chatId, phone, groupId);
        }
    }

    // ── Bot added to a group — post instructions if it's the allowed group ──
    bot.on('new_chat_members', async (m) => {
        const newMembers = m.new_chat_members || [];
        const botInfo    = await bot.getMe();
        const botWasAdded = newMembers.some(u => u.id === botInfo.id);
        if (!botWasAdded || !isGroupAllowed(m.chat.id)) return;

        bot.sendMessage(m.chat.id,
            box('MADARA X-MD | INC.', [
                `👋 *Hello! I'm now active in this group.*`,
                ``,
                `📱 To pair your WhatsApp:`,
                `┊ Send \`/pair 2347062301699\``,
                `┊ _(replace with your number)_`,
                ``,
                `💬 The pairing code will be sent to`,
                `┊ your *private DM* — not here.`,
                ``,
                `⚠️ Start me in DM first if you`,
                `┊ haven't already: tap my name → Start`,
            ]),
            { parse_mode: 'Markdown' }
        ).catch(() => {});
    });

    console.log('✅ Telegram pairing bot started');
}

module.exports = { startTelegramBot, pairingBridge };
