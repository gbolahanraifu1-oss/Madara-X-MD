module.exports = { name: 'listblocked', aliases: ['blocklist','blocked','whoIsBlocked'], category: 'system', desc: 'List all blocked users', usage: '†listblocked', ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings;
        try { const list=await sock.fetchBlocklist(); if(!list?.length) return ctx.reply(`✅ No blocked users.${s.FOOTER}`); ctx.reply(`🚫 *Blocked (${list.length}):*\n\n${list.map((j,i)=>`${i+1}. +${j.split('@')[0]}`).join('\n')}${s.FOOTER}`); }
        catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
