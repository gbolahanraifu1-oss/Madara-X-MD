# 💣 MADARA X-MD
### Powered by MADARA X-MD INC. | © 2026 MADARA X-MD INC. †

A commercial-grade, plugin-based WhatsApp multi-device bot with 300+ commands and Telegram pairing.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Start bot
npm start
```

---

## 🌐 Web Pairing (MADARA X-MD website)

The bot ships with `pairApi.js` — a built-in HTTP API that lets the
[MADARA X-MD pairing website](https://madaraxmd.vercel.app) generate codes for users.

**Wire it once in `index.js`** (add these two lines near the top, after your
`startSession` function is defined):

```js
const pairApi = require('./pairApi');
pairApi.init(async (phone) => {
    try { return await startSession(phone, null); }
    catch (e) { console.error('[WebPair] startSession error:', e.message); return null; }
});
```

**Endpoints** (default port **24823**):

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/health` | Health check |
| `POST` | `/warm` | Pre-warms the WhatsApp socket while the user types their number |
| `GET`  | `/pair?phone=234…` | Returns `{ code, phone, ms }` |

**Port:** Default is `24823`. Override with `WEB_PORT=…` in `.env`.

**Make sure port 24823 is open/exposed on your host** (Railway, Render, VPS)
so the website can reach it.

---

## 📱 Telegram Pairing (alternative)

1. Get a bot token from [@BotFather](https://t.me/BotFather) on Telegram
2. Add `TELEGRAM_BOT_TOKEN=your_token` to `.env`
3. Start the bot
4. Open your Telegram bot → tap **Pair WhatsApp**
5. Enter your phone number → get pairing code
6. Open WhatsApp → Linked Devices → Link with phone number
7. Enter the code → Done!

---

## 🔌 Plugin System

Each command is a self-contained plugin file:

```js
// commands/category/mycommand.js
module.exports = {
    name: 'mycommand',
    aliases: ['mc', 'cmd'],
    category: 'system',
    desc: 'What this command does',
    usage: '†mycommand [args]',
    ownerOnly: false,
    groupOnly: false,
    adminOnly: false,
    botAdminNeeded: false,

    async execute(sock, msg, args, ctx) {
        await ctx.reply('Hello from my command!');
    }
};
```

**To add a command:** Drop a `.js` file in any `commands/` subfolder. Bot auto-loads on restart.

**To disable a command:** Rename the file to `.js.disabled` or delete it.

---

## 📁 Structure

```
MADARA X-MD_XMD_PRO/
├── index.js              — Main entry, session management
├── settings.js           — Bot configuration
├── .env                  — Your secrets (never commit this)
├── lib/
│   ├── loader.js         — Auto plugin loader
│   ├── handler.js        — Message router
│   ├── context.js        — ctx helper for plugins
│   ├── telegram.js       — Telegram pairing bridge
│   ├── db.js             — JSON database
│   └── ratelimit.js      — Rate limiter
├── commands/
│   ├── system/           — Core bot commands
│   ├── group/            — Group management
│   ├── media/            — Downloaders
│   ├── converter/        — Media converters
│   ├── sticker/          — Sticker tools
│   ├── ai/               — AI commands
│   ├── fun/              — Entertainment
│   ├── search/           — Search & info
│   ├── utility/          — Productivity
│   ├── misc/             — Miscellaneous
│   └── finance/          — Crypto & finance
├── data/                 — Database files (auto-created)
├── sessions/             — Session files (auto-created)
└── temp/                 — Temp media files (auto-cleaned)
```

---

## ⚙️ Default Prefix

The default prefix is `†` — change it with `†prefix [new]` or set `PREFIX=.` in `.env`

---

## 🛡️ Permissions

| Flag | Description |
|------|-------------|
| `ownerOnly: true` | Only bot owner can use |
| `groupOnly: true` | Only works in groups |
| `privateOnly: true` | Only works in DMs |
| `adminOnly: true` | Only group admins |
| `botAdminNeeded: true` | Bot must be group admin |

---

## 📞 Support

- WhatsApp Channel: **☆MADARA X-MD INC.**
- TikTok: **@madaraxmd_official**
- Powered by: **MADARA X-MD INC.**
