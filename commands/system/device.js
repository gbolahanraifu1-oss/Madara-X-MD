'use strict';

function getContextInfo(message) {
    const content = message?.message || {};
    for (const value of Object.values(content)) {
        if (!value || typeof value !== 'object') continue;
        if (value.contextInfo) return value.contextInfo;
        if (value.message?.contextInfo) return value.message.contextInfo;
    }
    return {};
}

function deviceFromMessageId(messageId) {
    const id = String(messageId || '').toUpperCase();
    if (id.startsWith('3EB0')) return 'iPhone / iOS';
    if (id.startsWith('3A')) return 'Android';
    if (id.startsWith('BAE5')) return 'WhatsApp Web / Desktop';
    return 'Unknown';
}

function cleanMessageId(value) {
    return String(value || '').replace(/\s+/g, '').trim();
}

module.exports = {
    name: 'device',
    aliases: ['deviceinfo', 'msgdevice'],
    category: 'system',
    desc: 'Detect the likely WhatsApp device from a message ID',
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
        const device = deviceFromMessageId(messageId);
        const source = suppliedId ? 'message ID argument'
            : quotedId ? 'quoted message'
            : 'current message';

        await ctx.reply(
            '📱 *WhatsApp Device Info*\n\n'
            + '👤 User: *' + targetNumber + '*\n'
            + '🆔 Message ID: *' + (messageId || 'Unavailable') + '*\n'
            + '🔎 ID signature: *' + (messageId ? messageId.slice(0, 4).toUpperCase() : 'N/A') + '*\n'
            + '💻 Likely device: *' + device + '*\n'
            + (deviceSlot ? '📟 JID device slot: *' + deviceSlot + '*\n' : '')
            + '📌 Source: ' + source + '\n\n'
            + '_The platform is inferred from WhatsApp\'s message-ID signature and may be unknown for newer formats._'
            + ctx.FOOTER,
        );
    },
};
