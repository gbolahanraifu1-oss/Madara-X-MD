'use strict';

const deviceCache = new Map();

// UPDATED SIGNATURES FOR WA 2026
function getDeviceName(id) {
    const signatures = {
        '3EB0': '🍎 iPhone / iOS',
        '3A': '🤖 Android Phone',
        'A5F': '🤖 Android Phone',
        'A57': '🤖 Android Phone', // NEW 2026
        'A3F': '🤖 Android Phone',
        'A7B': '🤖 Android Phone', // NEW 2026
        'BAE5': '💻 WhatsApp Web / Desktop',
        'BAE6': '💻 WhatsApp Web / Desktop',
        '5EB0': '📱 iPad / iOS Tablet',
        '3F': '🏢 Business API',
        '1A': '📞 KaiOS / Feature Phone',
        'E3B': '🤖 Android Business' // NEW 2026
    };

    for (const [prefix, name] of Object.entries(signatures)) {
        if (id.startsWith(prefix)) return name;
    }
    return null;
}

function getContextInfo(message) {
    const queue = [message?.message];
    const seen = new Set();
    while (queue.length) {
        const node = queue.shift();
        if (!node || typeof node!== 'object' || seen.has(node)) continue;
        seen.add(node);
        if (node.contextInfo) return node.contextInfo;
        for (const value of Object.values(node)) {
            if (value && typeof value === 'object') queue.push(value);
        }
    }
    return {};
}

function getPlatformFromMsg(msg) {
    // Try to get platform from message object
    try {
        const platform = msg.message?.deviceSentMessage?.device ||
                         msg.message?.messageContextInfo?.device ||
                         msg.userAgent?.platform;
        if (platform) return platform;
    } catch {}
    return null;
}

function cleanMessageId(value) {
    return String(value || '').replace(/\s+/g, '').trim();
}

function getLidOrJid(jid) {
    if (!jid) return 'unknown';
    const num = String(jid).split('@')[0].split(':')[0];
    return num.length > 10? num : 'unknown';
}

module.exports = {
    name: 'device',
    aliases: ['deviceinfo', 'msgdevice', 'dv'],
    category: 'system',
    desc: 'Detect the likely WhatsApp device from a message',
    usage: '.device (or reply to a message)',
    waitReact: false,

    async execute(sock, msg, args, ctx) {
        const contextInfo = getContextInfo(msg);
        const quotedId = cleanMessageId(contextInfo.stanzaId);
        const suppliedId = cleanMessageId(args.join(''));
        const messageId = suppliedId || quotedId || cleanMessageId(msg.key?.id);
        const targetJid = contextInfo.participant || contextInfo.remoteJid || msg.key?.participant || msg.key?.remoteJid || ctx.sender;

        const targetNumber = getLidOrJid(targetJid);
        const deviceSlot = String(targetJid).match(/:(\d+)@/)?.[1] || '0';
        const cacheKey = targetNumber + '@s.whatsapp.net';

        let device = '❓ Unknown Device';
        let source = 'fallback';

        // 1. CHECK MESSAGE ID FIRST - MOST RELIABLE NOW
        if (messageId) {
            const sig3 = messageId.slice(0, 3).toUpperCase();
            const sig4 = messageId.slice(0, 4).toUpperCase();
            device = getDeviceName(sig4) || getDeviceName(sig3) || device;
            if (device!== '❓ Unknown Device') source = 'message ID signature';
        }

        // 2. TRY PLATFORM FROM MSG OBJECT
        if (device === '❓ Unknown Device') {
            const platform = getPlatformFromMsg(msg);
            if (platform) {
                device = platform.includes('android')? '🤖 Android Phone'
                       : platform.includes('ios')? '🍎 iPhone / iOS'
                       : platform.includes('web')? '💻 WhatsApp Web'
                       : device;
                if (device!== '❓ Unknown Device') source = 'message platform';
            }
        }

        // 3. TRY CACHE
        if (device === '❓ Unknown Device' && deviceCache.has(cacheKey)) {
            device = deviceCache.get(cacheKey);
            source = 'device cache';
        }

        // 4. CACHE IT
        if (!device.includes('Unknown') && cacheKey) {
            deviceCache.set(cacheKey, device);
        }

        // 5. ADD GUESS FOR NEW IDS
        if (device.includes('Unknown') && messageId) {
            const sig = messageId.slice(0, 3).toUpperCase();
            if (sig.startsWith('A')) device = '🤖 Android Phone (New WA)';
            if (sig.startsWith('B')) device = '💻 WhatsApp Web (New WA)';
            if (sig.startsWith('3E')) device = '🍎 iPhone (New WA)';
            if (!device.includes('Unknown')) source = 'heuristic guess';
        }

        await ctx.reply(
            `${device} *WhatsApp Device Info*\n\n` +
            `👤 *User:* ${targetNumber}\n` +
            `🆔 *Message ID:* ${messageId || 'Unavailable'}\n` +
            `🔎 *ID Signature:* ${messageId? messageId.slice(0, 4).toUpperCase() : 'N/A'}\n` +
            `💻 *Device:* *${device}*\n` +
            `📟 *Slot:* ${deviceSlot}\n` +
            `📌 *Source:* ${source}\n\n` +
            `_WA 2026 update: A57/A7B/E3B = New Android. Detection improved_` +
            ctx.FOOTER
        );
    },
};

module.exports.getDeviceName = getDeviceName;
module.exports.deviceCache = deviceCache;