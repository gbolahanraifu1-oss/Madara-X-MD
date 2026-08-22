// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Telegram Pairing Bridge            ║
// ║   Box-styled UI + edit-in-place navigation +        ║
// ║   3-Color Auto-Cycling (Main Menu Only)            ║
// ╚══════════════════════════════════════════════════════╝

const settings = require('../settings');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');

const sc = s => String(s).toLowerCase().split('').map(c =>
    ({a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',
      n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'}[c] || c)
).join('');

// ── 3-Color Auto-Cycling System ──────────────────────────────────────────
const BUTTON_STYLES = ['primary', 'success', 'danger'];
let styleIndex = 0;

function getNextStyle() {
    styleIndex = (styleIndex + 1) % BUTTON_STYLES.length;
    return BUTTON_STYLES[styleIndex];
}

// ── Telegram Bot API 9.4 style validation ────────────────────────────────
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

// ── Wrap free-text as safe inline-code span ──────────────────────────────
function mdSafe(str) {
    if (str === null || str === undefined) return '';
    return '`' + String(str).replace(/`/g, "'") + '`';
}

// ── Box-style template ────────────────────────────────────────────────────
function box(title, lines, emoji = '💣') {
    return (
        `❐ ◆「${title.toUpperCase()}」◆\n\n` +
        lines.map(l => `┊◆ ${l}`).join('\n') +
        `\n❑`
    );
}

// ── Last notification cooldowns ──────────────────────────────────────────
const _lastConnectNotif    = new Map();
const _lastDisconnectNotif = new Map();
const NOTIF_COOLDOWN = 30 * 60 * 1000;

// ── Bridge object ────────────────────────────────────────────────────────
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
                [{ text: '📊 Status', callback_data: 'btn_status', style: 'primary' }, { text: '📋 Commands', callback_data: 'btn_commands', style: 'success' }],
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

// ── Shared maintenance + dynamic admin/ban registries ────────────────────
const maintenance = require('./maintenance');
const tgAdmin     = require('./tgAdmin');

// ── Owner & Admin check ───────────────────────────────────────────────────
const OWNER_IDS = (process.env.OWNER_ID || '').split(',').map(s => s.trim()).filter(Boolean);
const ADMIN_IDS = (process.env.ADMIN_ID || '').split(',').map(s => s.trim()).filter(Boolean);
const isOwner   = (chatId) => OWNER_IDS.includes(String(chatId));
const isAdmin   = (chatId) => ADMIN_IDS.includes(String(chatId)) || tgAdmin.isDynamicAdmin(chatId) || isOwner(chatId);
const isBanned  = (chatId) => tgAdmin.isBannedRaw(chatId) && !isAdmin(chatId);

// ── Session registry ──────────────────────────────────────────────────────
const tgSessions = new Map();

// ── Bot-wide stats ────────────────────────────────────────────────────────
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

// ── Request pairing code at QR event ─────────────────────────────────────
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

    bot.on('polling_error', (err) => {
        console.error('[Telegram] Polling error:', err.message);
        if (err.message?.includes('409') || err.message?.toLowerCase().includes('conflict')) {
            console.error('[Telegram] ⚠️  409 Conflict — another process is polling this same bot token right now. Stop every other running instance (old deploy, pm2 process, second terminal, etc.) then restart this one.');
        }
    });

    // ── kb helper with auto-cycling styles ───────────────────────────────
    const kb = (...rows) => ({
        inline_keyboard: rows.map(row =>
            row.map(btn => {
                if (btn.style) return btn;
                return { ...btn, style: getNextStyle() };
            })
        )
    });

    // ── Screen tracking helper ────────────────────────────────────────────
    async function setScreen(chatId, screenName) {
        const sess = tgSessions.get(chatId) || {};
        tgSessions.set(chatId, { ...sess, screen: screenName });
    }

    // ── Banned-user notice ────────────────────────────────────────────────
    function sendBannedNotice(chatId) {
        return bot.sendMessage(chatId,
            box('Access Denied', [`🚫 *You have been banned* from using this bot.`, `Contact the bot owner if you believe this is a mistake.`]),
            { parse_mode: 'Markdown' }
        ).catch(() => {});
    }

    // ── Maintenance notice ────────────────────────────────────────────────
    async function sendMaintenanceNotice(chatId) {
        const reason = maintenance.reason();
        await setScreen(chatId, 'main');
        return await render(chatId,
            box('Under Maintenance', [
                `🚧 *Pairing is temporarily disabled.*`,
                reason ? `Reason: ${reason}` : `The bot owner is performing maintenance.`,
                `Please try again shortly.`,
            ]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    // ── Channel/Group button row builder ──────────────────────────────────
    function linkRows() {
        const rows = [];
        
        if (settings.waChannelId || process.env.WA_CHANNEL_ID) {
            const channelId = settings.waChannelId || process.env.WA_CHANNEL_ID;
            rows.push([{ 
                text: '📱 WhatsApp Channel', 
                url: `https://wa.me/${channelId}`,
                style: 'success',
            }]);
        }
        
        if (settings.waGroupInvite || process.env.WA_GROUP_INVITE) {
            const groupInvite = settings.waGroupInvite || process.env.WA_GROUP_INVITE;
            rows.push([{ 
                text: '👥 WhatsApp Group', 
                url: groupInvite,
                style: 'success',
            }]);
        }
        
        if (rows.length === 0) {
            if (settings.tgGroupUrl) rows.push([{ text: '👥 Group', url: settings.tgGroupUrl, style: 'success' }]);
        }
        
        return rows;
    }

    // ── EDIT-IN-PLACE render ──────────────────────────────────────────────
    async function render(chatId, text, opts = {}) {
        const sess = tgSessions.get(chatId) || {};
        const { reply_markup, ...rest } = opts;
        const payload = {
            parse_mode: 'Markdown',
            ...rest,
            ...(reply_markup ? { reply_markup: sanitizeMarkup(reply_markup) } : {}),
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

    // ── Main menu screen ──────────────────────────────────────────────────
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

    // ── Menu keyboards with auto-cycling styles ──────────────────────────
    function mainMenuKeyboard() {
        return kb(
            [{ text: '📱 Pair WhatsApp', callback_data: 'btn_pair', style: 'success' }],
            [
                { text: '👤 User Menu', callback_data: 'btn_usermenu', style: getNextStyle() },
                { text: '👮 Admin Menu', callback_data: 'btn_adminmenu', style: getNextStyle() }
            ],
            [
                { text: '🔒 Owner Menu', callback_data: 'btn_ownermenu', style: 'danger' }
            ],
            ...linkRows().map(row => row.map(btn => ({ ...btn, style: getNextStyle() })))
        );
    }

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
                { text: '📁 File Store', callback_data: 'btn_filestore', style: 'success' }
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

    // ── Register native Telegram commands + persistent Menu button ────────
    bot.setMyCommands([
        { command: 'start',       description: 'Main menu' },
        { command: 'pair',        description: 'Pair WhatsApp' },
        { command: 'unpair',      description: 'Remove session' },
        { command: 'ping',        description: 'Latency' },
        { command: 'runtime',     description: 'Uptime' },
        { command: 'stats',       description: 'Stats' },
        { command: 'report',      description: 'Support' },
        { command: 'tutorial',    description: 'Guide' },
        { command: 'help',        description: 'Commands' },
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
        { command: 'addadmin',    description: '🔒 Add admin' },
        { command: 'removeadmin', description: '🔒 Remove admin' },
        { command: 'restart',     description: '🔒 Restart' },
    ]).catch(() => {});
    bot.setChatMenuButton({ menu_button: { type: 'commands' } }).catch(() => {});

    // ── Auto-cycle button colors — ONLY refreshes MAIN MENU ──────────────
    const colorCycleInterval = setInterval(async () => {
        styleIndex = (styleIndex + 1) % BUTTON_STYLES.length;
        
        for (const [chatId, sess] of tgSessions.entries()) {
            if (!sess.lastMsgId) continue;
            // ONLY refresh when user is on main menu (or screen not set yet)
            if (sess.screen && sess.screen !== 'main') continue;
            
            try {
                const freshMarkup = mainMenuKeyboard();
                await bot.editMessageReplyMarkup(sanitizeMarkup(freshMarkup), {
                    chat_id: chatId,
                    message_id: sess.lastMsgId,
                });
            } catch (e) {}
        }
    }, 5000);

    // ── Channel Join Gate ─────────────────────────────────────────────────
    const _rawChannel = (process.env.TELEGRAM_CHANNEL_ID || '').trim();

    function parseChannelConfig(raw) {
        if (!raw) return { id: null, url: null };
        const tmeMatch = raw.match(/^https?:\/\/t\.me\/(.+)$/i);
        if (tmeMatch) {
            const slug = tmeMatch[1];
            if (slug.startsWith('+')) return { id: null, url: raw };
            return { id: `@${slug}`, url: raw };
        }
        if (/^-?\d+$/.test(raw)) return { id: raw, url: null };
        const username = raw.startsWith('@') ? raw : `@${raw}`;
        return { id: username, url: `https://t.me/${username.slice(1)}` };
    }

    const { id: GATE_CHANNEL, url: GATE_CHANNEL_URL } = parseChannelConfig(_rawChannel);

    async function checkMembership(chatId) {
        if (!GATE_CHANNEL) return true;
        if (isAdmin(chatId)) return true;
        try {
            const member = await bot.getChatMember(GATE_CHANNEL, chatId);
            return ['member', 'administrator', 'creator'].includes(member.status);
        } catch (e) {
            console.error('[Telegram] join-gate getChatMember error:', e.message);
            return true;
        }
    }

    async function sendJoinGate(chatId) {
        await setScreen(chatId, 'join_gate');
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
        await setScreen(chatId, 'main');
        await render(chatId, mainMenuText(), { reply_markup: mainMenuKeyboard() });
    });

    // ── Group Chat Pairing ────────────────────────────────────────────────
    const GATE_GROUP    = (process.env.TELEGRAM_GROUP_ID || '').trim();
    const groupSessions = new Map();

    function isGroupAllowed(chatId) {
        if (!GATE_GROUP) return false;
        return String(chatId) === String(GATE_GROUP);
    }

    async function autoDelete(chatId, msgId, delayMs = 15000) {
        setTimeout(() => bot.deleteMessage(chatId, msgId).catch(() => {}), delayMs);
    }

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
                return null;
            }
            throw e;
        }
    }

    async function handleGroupPair(m) {
        const groupId  = m.chat.id;
        const userId   = m.from.id;
        const username = m.from.username ? `@${m.from.username}` : m.from.first_name;
        const inlinePhone = (m.text || '').replace(/^\/pair\S*/, '').trim().replace(/[^0-9]/g, '');

        if (maintenance.isOn() && !isAdmin(userId)) {
            const reply = await bot.sendMessage(groupId,
                `🚧 *Pairing is temporarily disabled.* Try again later.`,
                { parse_mode: 'Markdown', reply_to_message_id: m.message_id }
            ).catch(() => null);
            if (reply) autoDelete(groupId, reply.message_id);
            return;
        }

        if (!(await checkMembership(userId))) {
            const reply = await bot.sendMessage(groupId,
                `🔒 ${username}, you must join our channel first. [Click here](https://t.me/${GATE_CHANNEL.replace(/^@/, '')}) then try again.`,
                { parse_mode: 'Markdown', reply_to_message_id: m.message_id }
            ).catch(() => null);
            if (reply) autoDelete(groupId, reply.message_id);
            return;
        }

        let phone = inlinePhone;
        if (!phone) {
            const dmSess    = tgSessions.get(userId);
            const groupSess = groupSessions.get(userId);
            phone = dmSess?.phone || groupSess?.phone || '';
        }
        if (phone && (phone.length < 7 || phone.length > 15)) phone = '';

        if (!phone) {
            groupSessions.set(userId, { state: 'awaiting_phone_group', groupId });
            const groupReply = await bot.sendMessage(groupId,
                `📲 ${username}, reply with your WhatsApp number (country code, no +).\n_Example:_ \`2347062301699\`\n_Or:_ \`/pair 2347062301699\``,
                { parse_mode: 'Markdown', reply_to_message_id: m.message_id }
            ).catch(() => null);
            if (groupReply) autoDelete(groupId, groupReply.message_id, 60000);
            return;
        }

        groupSessions.set(userId, { phone, state: 'pairing', groupId });
        const groupReply = await bot.sendMessage(groupId,
            `⏳ ${username}, pairing *+${phone}*... Check your *DM* for the code.`,
            { parse_mode: 'Markdown', reply_to_message_id: m.message_id }
        ).catch(() => null);
        if (groupReply) autoDelete(groupId, groupReply.message_id, 20000);

        await executePairing(userId, phone, groupId);
    }

    async function executePairing(dmChatId, phone, groupId = null) {
        try {
            const sock = await startSession(phone, dmChatId);

            requestCodeOnQr(sock, phone)
                .then(async code => {
                    const formatted = code.match(/.{1,4}/g)?.join('-') || code;

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
                        const dmSent = await sendToDM(dmChatId, codeMsg, { reply_markup: codeKeyboard });
                        if (!dmSent) {
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
                        await setScreen(dmChatId, 'code');
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
                        await setScreen(dmChatId, 'main');
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
                await setScreen(dmChatId, 'main');
                render(dmChatId,
                    box('Error', [`❌ ${e.message}`]),
                    { reply_markup: kb([{ text: '🔄 Try Again', callback_data: 'btn_pair', style: 'success' }]) }
                );
            }
        }
    }

    // ── /pair command ─────────────────────────────────────────────────────
    bot.onText(/^\/pair(@\S+)?(\s|$)/, async (m) => {
        const isGroup = m.chat.type === 'group' || m.chat.type === 'supergroup';

        if (isGroup) {
            if (!isGroupAllowed(m.chat.id)) return;
            return handleGroupPair(m);
        }

        const chatId = m.chat.id;
        if (isBanned(chatId)) return sendBannedNotice(chatId);
        if (!(await checkMembership(chatId))) return sendJoinGate(chatId);
        if (maintenance.isOn() && !isAdmin(chatId)) return sendMaintenanceNotice(chatId);
        await setScreen(chatId, 'awaiting_phone');
        await render(chatId,
            box('Pair WhatsApp', [
                `📱 Enter your *WhatsApp number*`,
                `with country code, no + or spaces`,
                `Example: 2347062301699`,
            ]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    });

    // ── QUICK ACTIONS ─────────────────────────────────────────────────────
    bot.onText(/^\/ping/, async (m) => handlePing(m.chat.id));
    bot.onText(/^\/help/, async (m) => handleHelp(m.chat.id));
    bot.onText(/^\/stats/, async (m) => handleStatus(m.chat.id));
    bot.onText(/^\/runtime/, async (m) => handleRuntime(m.chat.id));
    bot.onText(/^\/report/, async (m) => handleReport(m.chat.id));
    bot.onText(/^\/tutorial/, async (m) => handleTutorial(m.chat.id));

    // ── ADMIN CONTROL ─────────────────────────────────────────────────────
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

    // ── OWNER ONLY ────────────────────────────────────────────────────────
    bot.onText(/^\/addadmin/, async (m) => isOwner(m.chat.id) ? handleAddadmin(m.chat.id) : handleOwnerOnly(m.chat.id));
    bot.onText(/^\/removeadmin/, async (m) => isOwner(m.chat.id) ? handleRemoveadmin(m.chat.id) : handleOwnerOnly(m.chat.id));
    bot.onText(/^\/restart/, async (m) => isOwner(m.chat.id) ? handleRestart(m.chat.id) : handleOwnerOnly(m.chat.id));

    // ── Handler functions ────────────────────────────────────────────────
    async function handlePing(chatId) {
        await setScreen(chatId, 'user_action');
        const rtt = Math.floor(Math.random() * 80 + 120);
        await render(chatId,
            box('Pong!', [`🟢 ${sc('response')}: *${rtt}ms*`, `🟢 ${sc('status')}: *EXCELLENT*`]),
            { reply_markup: kb(
                [{ text: '🔄 Refresh', callback_data: 'btn_ping', style: 'primary' }],
                [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]
            )}
        );
    }

    async function handleHelp(chatId) {
        await setScreen(chatId, 'user_action');
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
        await setScreen(chatId, 'user_action');
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
        await setScreen(chatId, 'user_action');
        const uptime = formatUptime(Date.now() - botStartedAt);
        await render(chatId,
            box('System Uptime', [`⏰ ${sc('uptime')}: *${uptime}*`]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    async function handleTutorial(chatId) {
        await setScreen(chatId, 'user_action');
        await render(chatId,
            box('Tutorial', [`🎬 Check our guide`, `YouTube channel link below`]),
            { reply_markup: kb(...linkRows(), [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    async function handleUsers(chatId) {
        await setScreen(chatId, 'admin_action');
        await render(chatId,
            box('User Registry', [`👥 ${sc('total')}: *${tgSessions.size}* users`]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    async function handleListpair(chatId) {
        await setScreen(chatId, 'admin_action');
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
        await setScreen(chatId, 'broadcast_msg');
        tgSessions.set(chatId, { ...(tgSessions.get(chatId) || {}) });
        const activeCount = Array.from(activeSessions.values()).filter(s => s?.connected).length;
        await render(chatId,
            box('Global Broadcast', [`📢 Send to *${activeCount}* active sessions`, `Enter your message:`]),
            { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_mainmenu', style: 'danger' }]) }
        );
    }

    async function handleReport(chatId) {
        await setScreen(chatId, 'user_action');
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
        await setScreen(chatId, 'admin_action');
        const { clearSession, SESSIONS_ROOT } = require('./pairManager');
        let junkRemoved = 0, deadRemoved = 0, orphaned = 0, kept = 0;
        let folders = [];
        try { folders = fs.existsSync(SESSIONS_ROOT) ? fs.readdirSync(SESSIONS_ROOT) : []; } catch (_) {}

        for (const phone of folders) {
            const dir       = path.join(SESSIONS_ROOT, phone);
            const credsFile = path.join(dir, 'creds.json');
            const hasCreds  = fs.existsSync(credsFile);

            if (!hasCreds) {
                try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
                activeSessions.delete(phone);
                junkRemoved++;
                continue;
            }

            const entry  = activeSessions.get(phone);
            const isLive = entry?.connected === true;
            if (isLive) { kept++; continue; }
            if (!entry) { orphaned++; continue; }
            if ((entry.retries || 0) >= 15) {
                await clearSession(phone).catch(() => {});
                deadRemoved++;
            } else { kept++; }
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
        await setScreen(chatId, 'ban_user');
        await render(chatId,
            box('Ban User', [`🚫 ${sc('enter')} user ID`]),
            { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_mainmenu', style: 'danger' }]) }
        );
    }

    async function handleUnban(chatId) {
        await setScreen(chatId, 'unban_user');
        await render(chatId,
            box('Unban User', [`✅ ${sc('enter')} user ID`]),
            { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_mainmenu', style: 'danger' }]) }
        );
    }

    async function handleCheckuser(chatId) {
        await setScreen(chatId, 'check_user');
        await render(chatId,
            box('User Audit', [`🔍 ${sc('enter')} user ID`]),
            { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_mainmenu', style: 'danger' }]) }
        );
    }

    async function handleMaintenance(chatId) {
        await setScreen(chatId, 'admin_action');
        const nowOn = maintenance.toggle();
        await render(chatId,
            box('Maintenance Mode', [
                nowOn ? `🚧 Maintenance is now *ON*.` : `✅ Maintenance is now *OFF*.`,
                nowOn ? `Pairing is blocked for everyone except admins/owner.` : `Pairing is open to everyone again.`,
            ]),
            { reply_markup: kb(
                [{ text: nowOn ? '↩️ Turn OFF' : '↩️ Turn ON', callback_data: 'btn_maintenance', style: nowOn ? 'success' : 'danger' }],
                [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]
            )}
        );
    }

    const LOG_MAX = 20;
    const logRing = [];
    function botLog(level, msg) {
        const ts   = new Date().toTimeString().slice(0, 8);
        const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
        logRing.push(`\`${ts}\` ${icon} ${String(msg).slice(0, 120)}`);
        if (logRing.length > LOG_MAX) logRing.shift();
    }
    const _origLog   = console.log.bind(console);
    const _origError = console.error.bind(console);
    console.log   = (...a) => { _origLog(...a);   botLog('info',  a.join(' ')); };
    console.error = (...a) => { _origError(...a); botLog('error', a.join(' ')); };

    async function handleLogs(chatId) {
        await setScreen(chatId, 'admin_action');
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
        await setScreen(chatId, 'announce_msg');
        await render(chatId,
            box('Global Announcement', [`📅 ${sc('enter')} announcement (sent to all users)`]),
            { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_mainmenu', style: 'danger' }]) }
        );
    }

    async function handleAdminOnly(chatId) {
        await setScreen(chatId, 'admin_action');
        await render(chatId,
            box('Access Denied', [`👮 ${sc('admin')} only`, `Contact administrator`]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    async function handleOwnerOnly(chatId) {
        await setScreen(chatId, 'admin_action');
        await render(chatId,
            box('Access Denied', [`🔒 ${sc('owner')} only`, `Contact owner`]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
    }

    async function handleAddadmin(chatId) {
        await setScreen(chatId, 'addadmin_id');
        await render(chatId,
            box('Add Admin', [`➕ ${sc('enter')} user ID`]),
            { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_mainmenu', style: 'danger' }]) }
        );
    }

    async function handleRemoveadmin(chatId) {
        await setScreen(chatId, 'removeadmin_id');
        await render(chatId,
            box('Remove Admin', [`➖ ${sc('enter')} user ID`]),
            { reply_markup: kb([{ text: '❌ Cancel', callback_data: 'btn_mainmenu', style: 'danger' }]) }
        );
    }

    async function handleRestart(chatId) {
        await setScreen(chatId, 'admin_action');
        await render(chatId,
            box('Restart', [`⟳ ${sc('restarting')}...`, `Bot will be back online shortly`]),
            { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
        );
        setTimeout(() => process.exit(0), 2000);
    }

    // ── Callback handler ──────────────────────────────────────────────────
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
        const sess = tgSessions.get(chatId) || {};
        if (!sess.lastMsgId && callbackMsgId) tgSessions.set(chatId, { ...sess, lastMsgId: callbackMsgId });

        if (data === 'btn_verify') {
            const joined = await checkMembership(chatId);
            if (!joined) {
                await bot.answerCallbackQuery(callbackQueryId, {
                    text: '❌ You have not joined the channel yet. Please join first then tap Verify.',
                    show_alert: true,
                }).catch(() => {});
                return sendJoinGate(chatId);
            }
            await setScreen(chatId, 'main');
            return await render(chatId,
                box('Access Granted ✅', [`🎉 *Welcome to MADARA X-MD | INC.*`, `You are now verified. Enjoy the bot!`]) + '\n\n' + mainMenuText(),
                { reply_markup: mainMenuKeyboard() }
            );
        }

        if (data === 'btn_mainmenu') {
            await setScreen(chatId, 'main');
            return await render(chatId, mainMenuText(), { reply_markup: mainMenuKeyboard() });
        }
        if (data === 'btn_usermenu') {
            await setScreen(chatId, 'user');
            return await render(chatId, box('👤 User Menu', [`Quick actions`]), { reply_markup: userMenuKeyboard() });
        }
        if (data === 'btn_adminmenu') {
            if (!isAdmin(chatId)) return await render(chatId, box('Access Denied', [`👮 Admin only`]), { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) });
            await setScreen(chatId, 'admin');
            return await render(chatId, box('👮 Admin Menu', [`Control panel`]), { reply_markup: adminMenuKeyboard() });
        }
        if (data === 'btn_ownermenu') {
            if (!isOwner(chatId)) return await render(chatId, box('Access Denied', [`🔒 Owner only`]), { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) });
            await setScreen(chatId, 'owner');
            return await render(chatId, box('🔒 Owner Menu', [`Exclusive access`]), { reply_markup: ownerMenuKeyboard() });
        }

        if (data === 'btn_runtime') return handleRuntime(chatId);
        if (data === 'btn_report')  return handleReport(chatId);
        if (data === 'btn_tutorial') return handleTutorial(chatId);
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
                await setScreen(chatId, 'fs_pick_plat');
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
            await setScreen(chatId, 'fs_await_file');
            tgSessions.set(chatId,{...(tgSessions.get(chatId)||{}),state:'fs_await_file',fsCat:cat,fsPlatform:null,fsFilename:null,fsPrice:null});
            return render(chatId,
                box('📤 Upload File',[`*Category:* ${cat.toUpperCase()}`,`*Step 2* — Enter filename (e.g. ${mdSafe('samsung-a12.txt')}):`]),
                { reply_markup: kb([{text:'❌ Cancel', callback_data:'btn_filestore', style:'danger'}]) }
            );
        }
        if (data?.startsWith('fs_upload_plat_')) {
            const[cat,plat]=data.replace('fs_upload_plat_','').split('__');
            await setScreen(chatId, 'fs_await_price');
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
            await setScreen(chatId, 'fs_await_filename');
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
            await setScreen(chatId, 'shop_await_image');
            tgSessions.set(chatId, { ...(tgSessions.get(chatId)||{}), state: 'shop_await_image', shopCat: cat });
            return render(chatId,
                box('📤 Upload Account', [`*Step 2/3* — Send the account *image* now.`, `ᴄᴀᴛᴇɢᴏʀʏ: *${cat.toUpperCase()}*`]),
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
        if (data === 'btn_addadmin') return handleAddadmin(chatId);
        if (data === 'btn_removeadmin') return handleRemoveadmin(chatId);
        if (data === 'btn_restart') return handleRestart(chatId);

        if (data === 'btn_pair') {
            if (!(await checkMembership(chatId))) return sendJoinGate(chatId);
            if (maintenance.isOn() && !isAdmin(chatId)) return sendMaintenanceNotice(chatId);
            await setScreen(chatId, 'awaiting_phone');
            return await render(chatId,
                box('Pair WhatsApp', [`📱 Enter your *WhatsApp number*`, `with country code, no + or spaces`, `Example: 2347062301699`]),
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
            await setScreen(chatId, 'main');
            return await render(chatId,
                box('Session Removed', [`✅ Session unpaired successfully.`, `Tap below to pair again.`]),
                { reply_markup: kb(
                    [{ text: '📱 Pair WhatsApp', callback_data: 'btn_pair', style: 'success' }],
                    [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]
                )}
            );
        }
        if (data === 'btn_help') {
            await setScreen(chatId, 'user_action');
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
            await setScreen(chatId, 'main');
            return await render(chatId,
                box('Disconnected', [`✅ Session disconnected.`, `Tap below to pair again.`]),
                { reply_markup: kb(
                    [{ text: '📱 Pair WhatsApp', callback_data: 'btn_pair', style: 'success' }],
                    [{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]
                )}
            );
        }
    }

    // ── Plain text message handler ────────────────────────────────────────
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

        if (sess.state === 'awaiting_phone') {
            if (maintenance.isOn() && !isAdmin(chatId)) {
                tgSessions.set(chatId, { ...sess, state: null });
                await setScreen(chatId, 'main');
                return sendMaintenanceNotice(chatId);
            }
            const phone = text.replace(/[^0-9]/g, '');
            if (phone.length < 7 || phone.length > 15) {
                return await render(chatId,
                    box('Invalid Number', [`❌ Enter with country code (no + or spaces).`, `Example: 2347062301699`]),
                    { reply_markup: kb([{ text: '🏠 Main Menu', callback_data: 'btn_mainmenu', style: 'primary' }]) }
                );
            }
            tgSessions.set(chatId, { ...sess, state: 'pairing', phone });
            await render(chatId, box('Generating Code', [`⏳ Generating pairing code for *+${phone}*...`, `Please wait up to 30 seconds.`]));
            await executePairing(chatId, phone);
        }

        const groupSess = groupSessions.get(chatId);
        if (groupSess?.state === 'awaiting_phone_group' && m.chat?.type !== 'private') {
            const phone = text.replace(/[^0-9]/g, '');
            const groupId = groupSess.groupId;
            const username = m.from?.username ? `@${m.from.username}` : m.from?.first_name || 'User';
            if (phone.length < 7 || phone.length > 15) {
                const reply = await bot.sendMessage(groupId, `❌ ${username}, invalid number. Try: \`2347062301699\``, { parse_mode: 'Markdown', reply_to_message_id: m.message_id }).catch(() => null);
                if (reply) autoDelete(groupId, reply.message_id);
                return;
            }
            groupSessions.set(chatId, { ...groupSess, state: 'pairing', phone });
            const groupReply = await bot.sendMessage(groupId, `⏳ ${username}, generating your code... Check your *DM*!`, { parse_mode: 'Markdown', reply_to_message_id: m.message_id }).catch(() => null);
            if (groupReply) autoDelete(groupId, groupReply.message_id, 20000);
            await executePairing(chatId, phone, groupId);
        }
    }

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

    console.log('✅ Telegram pairing bot started — main menu colors auto-cycle every 5s');
}

module.exports = { startTelegramBot, pairingBridge };