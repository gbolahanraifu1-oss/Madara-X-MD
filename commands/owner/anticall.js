'use strict';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  ANTI CALL
// Runtime toggle for auto-rejecting incoming WhatsApp calls — global,
// bot-wide (calls come to the bot's own number, not a specific group).
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const db = require('../../lib/db');

module.exports = {
    name: 'anticall',
    aliases: ['callblock', 'rejectcalls'],
    category: 'owner',
    desc: 'Auto-reject incoming calls to the bot',
    usage: '†anticall on|off|silent on|silent off|msg <text>',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on')  { db.set('settings', 'antiCall', true);  return ctx.reply(`✅ *Anti-Call enabled.* Incoming calls will be rejected.${s.FOOTER}`); }
        if (sub === 'off') { db.set('settings', 'antiCall', false); return ctx.reply(`❌ *Anti-Call disabled.*${s.FOOTER}`); }

        if (sub === 'silent') {
            const sub2 = (args[1] || '').toLowerCase();
            if (sub2 === 'on')  { db.set('settings', 'antiCallSilent', true);  return ctx.reply(`✅ *Silent mode on* — calls rejected with no message.${s.FOOTER}`); }
            if (sub2 === 'off') { db.set('settings', 'antiCallSilent', false); return ctx.reply(`✅ *Silent mode off* — a rejection message will be sent.${s.FOOTER}`); }
        }

        if (sub === 'msg') {
            const text = args.slice(1).join(' ');
            if (!text) return ctx.reply(`❌ Provide the message text.${s.FOOTER}`);
            db.set('settings', 'antiCallMsg', text);
            return ctx.reply(`✅ *Rejection message updated.*${s.FOOTER}`);
        }

        const enabled = db.get('settings', 'antiCall', process.env.ANTI_CALL === 'true');
        const silent  = db.get('settings', 'antiCallSilent', false);
        ctx.reply(
            `⚙️ *Anti-Call:* ${enabled ? '✅ On' : '❌ Off'}\n*Silent:* ${silent ? '✅ On' : '❌ Off'}\n\n` +
            `Usage:\n\`${s.prefix}anticall on\`\n\`${s.prefix}anticall off\`\n\`${s.prefix}anticall silent on|off\`\n\`${s.prefix}anticall msg <text>\`${s.FOOTER}`
        );
    }
};
