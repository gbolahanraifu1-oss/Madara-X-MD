module.exports = {
    name: 'binary', aliases: ['bin','tobinary','binconvert'], category: 'utility',
    desc: 'Convert text to binary or binary to text', usage: '†binary enc [text] | †binary dec [binary]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings; const sub = args[0]?.toLowerCase(); const txt = args.slice(1).join(' ');
        if (!sub || !txt) return ctx.reply(`❌ Usage:\n\`${s.prefix}binary enc Hello\`\n\`${s.prefix}binary dec 01001000\`${s.FOOTER}`);
        if (sub === 'enc') { ctx.reply(`💾 *Binary:*\n\`${txt.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ')}\`${s.FOOTER}`); }
        else if (sub === 'dec') { ctx.reply(`💾 *Text:*\n${txt.split(' ').map(b => String.fromCharCode(parseInt(b,2))).join('')}${s.FOOTER}`); }
        else { ctx.reply(`❌ Use \`enc\` or \`dec\`${s.FOOTER}`); }
    }
};
