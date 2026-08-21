module.exports = { name: 'contactsave', aliases: ['savecontact','vcardget','getcontact'], category: 'utility', desc: 'Save contact from vCard or generate one', usage: '†contactsave [name] [number]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const name=args[0]; const num=(args[1]||'').replace(/[^0-9]/g,'');
        if (!name||!num) return ctx.reply(`❌ Usage: \`${s.prefix}contactsave John +2341234567890\`${s.FOOTER}`);
        await ctx.react('📱');
        const vcard=`BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nORG:${s.botName};\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`;
        await sock.sendMessage(ctx.from,{contacts:{displayName:name,contacts:[{vcard}]}},{quoted:msg});
    }
};
