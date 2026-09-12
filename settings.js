// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Settings                          ║
// ╚══════════════════════════════════════════════════════╝

try { require('dotenv').config(); } catch { /* dotenv not installed, using defaults */ }

const settings = {
    botName:         process.env.BOT_NAME          || 'ᴍᴀᴅᴀʀᴀ x-ᴍᴅ',
    botBrand:        'ᴍᴀᴅᴀʀᴀ x-ᴍᴅ',
    // Custom code used by the Telegram/standalone pairing flow.
    // The web pairing API intentionally uses WhatsApp's normal code.
    pairingCode:     process.env.PAIRING_CODE      || 'MADARAMD',
    version:         '1.2.0 𝙱𝙴𝚃𝙰',
    prefix:          process.env.PREFIX            || '.',
    prefixes:        (process.env.PREFIXES || '.,!,#,/').split(','),
    noPrefixMode:    process.env.NO_PREFIX_MODE === 'true' || false,
    ownerNumber:     process.env.OWNER_NUMBER      || '2347062301699',
    ownerName:       process.env.OWNER_NAME        || 'ɢʙᴇxᴄʜᴀɴɢᴇ       ᴍᴀᴅᴀʀᴀ x-ᴍᴅ | ɪɴᴄ.',

    // Vendor number for the Files Shop paid-order system.
    // All paid-file orders (Track ID notifications) are sent here.
    // Falls back to OWNER_NUMBER if not set.
    vendorNumber:    process.env.VENDOR_NUMBER      || process.env.OWNER_NUMBER || '2347062301699',
    telegramToken:   process.env.TELEGRAM_BOT_TOKEN || '',
    commandMode:     process.env.COMMAND_MODE      || 'public',

    // Pairing group — only this group JID is allowed to use †pair
    // Set PAIR_GROUP_JID in .env e.g. 120363XXXXXXXXXX@g.us
    pairGroupJid:    process.env.PAIR_GROUP_JID    || '',

    // Channel
    channelLink:     process.env.CHANNEL_LINK      || 'https://whatsapp.com/channel/0029Vb88OB4545unOuID4H0Q',
    newsletterJid:   process.env.NEWSLETTER_JID    || '120363424626346173@newsletter',
    channelName:     '☆ᴍᴀᴅᴀʀᴀ x-ᴍᴅ | ɪɴᴄ.',

    // Telegram bridge — channel/group links shown as buttons on every menu
    tgChannel1Url:   process.env.TG_CHANNEL_1_URL  || 'https://t.me/your_channel_1',
    tgChannel2Url:   process.env.TG_CHANNEL_2_URL  || '',   // leave empty to hide this button
    tgGroupUrl:      process.env.TG_GROUP_URL      || 'https://t.me/your_support_group',
    tgTutorialUrl:   process.env.TG_TUTORIAL_URL   || 'https://t.me/your_tutorial_video',

    // API Keys
    giphyKey:        process.env.GIPHY_API_KEY     || '',
    openaiKey:       process.env.OPENAI_API_KEY    || '',
    removebgKey:     process.env.REMOVEBG_API_KEY  || '',
    weatherKey:      process.env.WEATHER_API_KEY   || '',
    geminiKey:       process.env.GEMINI_API_KEY    || '',

    // Bot image — place your image at assets/bot_image.jpg
    // Bot image — checked live each time (not cached at startup)
    get botImagePath() {
        const p = require('path');
        const fs = require('fs');
        const candidates = [
            p.join(process.cwd(), 'assets', 'bot_image.jpg'),
            p.join(process.cwd(), 'assets', 'bot_image.png'),
            p.join(process.cwd(), 'assets', 'bot.jpg'),
            p.join(process.cwd(), 'bot_image.jpg'),
            p.join(process.cwd(), 'bot_image.png'),
            p.join(__dirname, 'assets', 'bot_image.jpg'),
            p.join(__dirname, 'assets', 'bot_image.png'),
        ];
        return candidates.find(c => { try { return fs.existsSync(c); } catch { return false; } }) || candidates[0];
    },

    // Branding
    footer:          `\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀᴅᴀʀᴀ x-ᴍᴅ | ɪɴᴄ.*`,
    get FOOTER()     { return this.footer; },

    // Madara Uchiha quote footers — menu/alive/welcome/goodbye each pull a
    // rotating in-character line + branding (see lib/madaraQuotes.js).
    // Pass a userId (e.g. ctx.sender) to get the same no-repeat-twice-in-
    // a-row rotation the menu banner slideshow uses; omit it for plain
    // random (used by call sites with no natural per-user identity).
    footerMenu(userId)     { return require('./lib/madaraQuotes').quoteFooter('menu', userId); },
    footerAlive(userId)    { return require('./lib/madaraQuotes').quoteFooter('alive', userId); },
    footerWelcome(userId)  { return require('./lib/madaraQuotes').quoteFooter('welcome', userId); },
    footerGoodbye(userId)  { return require('./lib/madaraQuotes').quoteFooter('goodbye', userId); },
};

module.exports = settings;
