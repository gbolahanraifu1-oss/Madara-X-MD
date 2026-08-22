'use strict';

// MadaraEye safety handlers. The uploaded crash/flood payloads are intentionally
// not executed. These command names remain registered so they fail safely.
module.exports = {
    name: 'vampreply',
    aliases: ['xzreply', 'samsungcrash', 'iosinvisibleforce', 'functionforceprivate', 'homecrash', 'vidxnullv2'],
    category: 'misc',
    desc: 'MadaraEye safety-disabled test payload',
    usage: '.vampreply',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const command = ctx.rawCmd || 'madaraeye';
        return ctx.reply(
            '🛡️ MadaraEye: .' + command + ' is disabled for safety.\n\n' +
            'Crash payloads, malformed oversized messages, broadcast relays, and spam loops are not executed.'
        );
    },
};
