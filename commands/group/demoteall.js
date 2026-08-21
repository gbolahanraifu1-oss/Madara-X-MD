module.exports = {
    name: 'demoteall',
    aliases: ['removeadminall'],
    category: 'group',
    desc: 'Demote all admins (keeps bot and owner safe)',
    usage: '†demoteall',
    groupOnly: true, ownerOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const meta = await sock.groupMetadata(ctx.from);

        // Get bot JID in all possible formats (handles @s.whatsapp.net and @lid)
        const botRaw   = (sock.user?.id || '').split(':')[0].split('@')[0].replace(/^0+/, '');
        const botLidRaw = (sock.user?.lid || '').split('@')[0].replace(/^0+/, '');
        const ownerRaw = s.ownerNumber.replace(/[^0-9]/g, '').replace(/^0+/, '');

        const isSafe = (jid) => {
            const raw = jid.split('@')[0].replace(/^0+/, '');
            return raw === botRaw || raw === botLidRaw || raw === ownerRaw;
        };

        const admins = meta.participants.filter(p =>
            (p.admin === 'admin' || p.admin === 'superadmin') && !isSafe(p.id || p.lid || '')
        ).map(p => p.id);

        if (!admins.length) return ctx.reply(`✅ No admins to demote.${s.FOOTER}`);

        await ctx.react('⏳');
        const chunk = (arr, n) => Array.from({length: Math.ceil(arr.length/n)}, (_, i) => arr.slice(i*n, i*n+n));
        for (const batch of chunk(admins, 5)) {
            try { await sock.groupParticipantsUpdate(ctx.from, batch, 'demote'); } catch {}
            await new Promise(r => setTimeout(r, 1000));
        }
        ctx.reply(`✅ Demoted *${admins.length}* admin(s). Bot and owner kept safe.${s.FOOTER}`);
    }
};
