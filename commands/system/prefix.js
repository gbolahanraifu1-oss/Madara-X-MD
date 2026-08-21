const db = require('../../lib/db');
module.exports = {
    name: 'prefix',
    aliases: ['setprefix'],
    category: 'system',
    desc: 'Manage prefixes (multi-prefix + no-prefix mode), session-isolated',
    usage:
        '.prefix [new_primary] — set primary prefix\n' +
        '.prefix add [symbol] — add an extra prefix\n' +
        '.prefix remove [symbol] — remove a prefix\n' +
        '.prefix list — show all active prefixes\n' +
        '.prefix noprefix on|off — toggle direct text commands (no symbol needed)',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'list') {
            return ctx.reply(`📋 *Active prefixes:* ${ctx.prefixes.map(p => `\`${p}\``).join(', ')}\n*No-prefix mode:* ${ctx.noPrefixMode ? '✅ ON' : '❌ OFF'}${s.FOOTER}`);
        }

        if (sub === 'add') {
            const p = args[1]?.trim();
            if (!p) return ctx.reply(`❌ Usage: \`${s.prefix}prefix add !\`${s.FOOTER}`);
            const list = [...new Set([...ctx.prefixes, p])];
            db.setSession(ctx.sessionPhone, 'config', 'prefixes', list);
            return ctx.reply(`✅ Added prefix \`${p}\`.\n📋 Now: ${list.map(x => `\`${x}\``).join(', ')}${s.FOOTER}`);
        }

        if (sub === 'remove') {
            const p = args[1]?.trim();
            if (!p) return ctx.reply(`❌ Usage: \`${s.prefix}prefix remove !\`${s.FOOTER}`);
            const list = ctx.prefixes.filter(x => x !== p);
            if (!list.length) return ctx.reply(`❌ Can't remove your last prefix.${s.FOOTER}`);
            db.setSession(ctx.sessionPhone, 'config', 'prefixes', list);
            return ctx.reply(`✅ Removed \`${p}\`.\n📋 Now: ${list.map(x => `\`${x}\``).join(', ')}${s.FOOTER}`);
        }

        if (sub === 'noprefix') {
            const val = (args[1] || '').toLowerCase();
            if (val !== 'on' && val !== 'off') return ctx.reply(`❌ Usage: \`${s.prefix}prefix noprefix on\` or \`off\`${s.FOOTER}`);
            db.setSession(ctx.sessionPhone, 'config', 'noPrefixMode', val === 'on');
            return ctx.reply(
                val === 'on'
                    ? `✅ *No-prefix mode ON.*\nYou can now just type \`ping\`, \`menu\`, \`antilink on\` etc — no symbol needed.\n⚠️ Only EXACT command names trigger — normal chat is unaffected.${s.FOOTER}`
                    : `❌ No-prefix mode OFF. Back to needing a prefix symbol.${s.FOOTER}`
            );
        }

        if (!args[0]) {
            return ctx.reply(
                `📋 *Active prefixes:* ${ctx.prefixes.map(p => `\`${p}\``).join(', ')}\n*No-prefix mode:* ${ctx.noPrefixMode ? '✅ ON' : '❌ OFF'}\n\n` +
                `*Usage:*\n\`${s.prefix}prefix [new]\` — replace primary\n\`${s.prefix}prefix add [x]\`\n\`${s.prefix}prefix remove [x]\`\n\`${s.prefix}prefix list\`\n\`${s.prefix}prefix noprefix on|off\`${s.FOOTER}`
            );
        }

        // Bare `.prefix X` → replace the primary prefix (legacy behavior, kept)
        const newPrefix = args[0].trim().slice(0, 3);
        db.setSession(ctx.sessionPhone, 'config', 'prefix', newPrefix);
        const list = [...new Set([newPrefix, ...ctx.prefixes.filter(p => p !== s.prefix)])];
        db.setSession(ctx.sessionPhone, 'config', 'prefixes', list);
        await ctx.reply(`✅ Primary prefix changed to *${newPrefix}*\n\nUse \`${newPrefix}menu\` to see commands.${s.FOOTER}`);
    }
};
