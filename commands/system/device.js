'use strict';

// Baileys does not expose a Puppeteer page or a guaranteed full handset
// user-agent for every incoming message. Cache the best device label available
// for the participant and fall back to WhatsApp message-ID signatures.
const deviceCache = new Map();

// Extract a model name from a browser-style user agent when one is present.
function getFullDeviceName(userAgent) {
    if (!userAgent) return 'Unknown Device';

    const match = String(userAgent).match(/\(([^)]+)\)/);
    if (match) {
        const parts = match[1].split(';');
        for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i].trim();
            if (!part || part.includes('Android') || part.includes('iPhone OS') ||
                part.includes('Windows') || part.includes('Mac OS')) continue;
            if (part.includes('Build/')) return part.split('Build/')[0].trim();
            return part;
        }
        return match[1];
    }
    return String(userAgent);
}

function getContextInfo(message) {
    const queue = [message?.message];
    const seen = new Set();

    while (queue.length) {
        const node = queue.shift();
        if (!node || typeof node !== 'object' || seen.has(node)) continue;
        seen.add(node);
        if (node.contextInfo) return node.contextInfo;
        for (const value of Object.values(node)) {
            if (value && typeof value === 'object') queue.push(value);
        }
    }
    return {};
}

function getMessageUserAgent(message) {
    const contextInfo = getContextInfo(message);
    const candidates = [
        message?.userAgent,
        message?.message?.userAgent,
        message?.message?.messageContextInfo?.userAgent,
        message?.message?.deviceSentMessage?.userAgent,
        contextInfo?.userAgent,
    ];
    return candidates.find(value => typeof value === 'string' && value.trim()) || '';
}

function deviceFromMessageId(messageId) {
    const id = String(messageId || '').toUpperCase();
    if (id.startsWith('3EB0')) return 'iPhone / iOS';
    if (id.startsWith('3A')) return 'Android';
    // WhatsApp has started emitting A5F* IDs for Android messages.
    if (id.startsWith('A5F')) return 'Android';
    if (id.startsWith('BAE5')) return 'WhatsApp Web / Desktop';
    return 'Unknown Device';
}

function cleanMessageId(value) {
    return String(value || '').replace(/\s+/g, '').trim();
}

function cacheKeyForJid(jid) {
    const value = String(jid || '');
    const number = value.split('@')[0].split(':')[0].replace(/\D/g, '');
    return number ? (number + '@s.whatsapp.net') : '';
}

module.exports = {
    name: 'device',
    aliases: ['deviceinfo', 'msgdevice'],
    category: 'system',
    desc: 'Detect the likely WhatsApp device from a message',
    usage: '.device (or reply to a message)',
    waitReact: false,

    async execute(sock, msg, args, ctx) {
        const contextInfo = getContextInfo(msg);
        const quotedId = cleanMessageId(contextInfo.stanzaId);
        const suppliedId = cleanMessageId(args.join(''));
        const messageId = suppliedId || quotedId || cleanMessageId(msg.key?.id);
        const targetJid = contextInfo.participant
            || contextInfo.remoteJid
            || msg.key?.participant
            || msg.key?.remoteJid
            || '';
        const targetNumber = String(targetJid).split('@')[0].split(':')[0] || 'unknown';
        const deviceSlot = String(targetJid).match(/:(\d+)@/)?.[1];
        const cacheKey = cacheKeyForJid(targetJid);
        const cachedDevice = cacheKey ? deviceCache.get(cacheKey) : null;
        const userAgent = getMessageUserAgent(msg);
        const detectedDevice = userAgent
            ? getFullDeviceName(userAgent)
            : deviceFromMessageId(messageId);
        const device = cachedDevice || detectedDevice;
        const cacheHit = Boolean(cachedDevice);

        if (!cachedDevice && cacheKey && device !== 'Unknown Device') {
            deviceCache.set(cacheKey, device);
        }

        const source = cacheHit ? 'device cache'
            : userAgent ? 'message user-agent'
            : suppliedId ? 'message ID argument'
            : quotedId ? 'quoted message ID'
            : 'current message ID';

        await ctx.reply(
            '📱 *WhatsApp Device Info*\n\n'
            + '👤 User: *' + targetNumber + '*\n'
            + '🆔 Message ID: *' + (messageId || 'Unavailable') + '*\n'
            + '🔎 ID signature: *' + (messageId ? messageId.slice(0, 4).toUpperCase() : 'N/A') + '*\n'
            + '💻 Device: *' + device + '*\n'
            + (deviceSlot ? '📟 JID device slot: *' + deviceSlot + '*\n' : '')
            + '📌 Source: ' + source + '\n\n'
            + '_Full model names are used only when Baileys provides a browser-style user-agent; otherwise the device is inferred from the WhatsApp message ID._'
            + ctx.FOOTER,
        );
    },
};

module.exports.getFullDeviceName = getFullDeviceName;
module.exports.deviceCache = deviceCache;
