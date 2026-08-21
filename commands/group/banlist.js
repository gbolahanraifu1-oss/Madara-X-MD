const db = require('../../lib/db');
module.exports = { name: 'banlist', aliases: ['listbans','banned','bannedlist'], category: 'group', desc: 'List banned users in this group', usage: '†banlist',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const key=`bans_${ctx.from}`; const bans=db.get('bans',key,[]);
        if(!bans.length) return ctx.reply(`✅ No banned users.${s.FOOTER}`);
        ctx.reply(`🚫 *Banned Users (${bans.length}):*\n\n${bans.map((j,i)=>`${i+1}. @${j.split('@')[0]}`).join('\n')}${s.FOOTER}`,{mentions:bans});
    }
};
