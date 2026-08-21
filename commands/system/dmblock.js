module.exports = {
    name: 'dmblock',
    aliases: ['dmblocker'],
    category: 'system',
    desc: 'Block DMs from strangers',
    usage: '†dmblock on/off',
    ownerOnly: true,
    
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const mode = args[0]?.toLowerCase();

        if (!mode || !['on', 'off'].includes(mode)) {
            return ctx.reply(`
╔═══════════════════════════════╗
║  🚫 DM BLOCKER                ║
╚═══════════════════════════════╝

${s.PREFIX}dmblock on   - Enable
${s.PREFIX}dmblock off  - Disable

When ON: Auto-blocks strangers/new contacts
Blocked users can request permission

${s.FOOTER}`);
        }

        if (mode === 'on') {
            ctx.reply(`✓ *DM Blocker activated*\n\n🚫 Strangers will be auto-blocked${s.FOOTER}`);
        } else {
            ctx.reply(`✓ *DM Blocker deactivated*${s.FOOTER}`);
        }
    }
};
