module.exports = { name: 'status', aliases: ['setstatus','botstatus','mystatus'], category: 'utility', desc: 'View WhatsApp status or set bot status text', usage: '†status [text?]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const text=args.join(' ');
        if (!text) return ctx.reply(`💬 *Bot Status:*\n${s.botName} is online and ready!\n\nSet status: \`${s.prefix}status [text]\`${s.FOOTER}`);
        if (!ctx.isOwner) return ctx.reply(`❌ Only owner can change bot status.${s.FOOTER}`);
        try {
            await sock.updateProfileStatus(text);
            ctx.reply(`✅ Bot status updated to: _${text}_${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
