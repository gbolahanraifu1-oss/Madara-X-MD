const db = require('../../lib/db');
module.exports = { name: 'unban', aliases: ['unbanuser','removeBan'], category: 'group', desc: 'Unban a previously banned user', usage: '†unban @user',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const mentions=ctx.getMentions?.()??[];
        let target=mentions[0]; if(!target&&args[0]) target=args[0].replace(/[^0-9]/g,'')+'@s.whatsapp.net';
        if(!target) return ctx.reply(`❌ Tag a user to unban.${s.FOOTER}`);
        const key=`bans_${ctx.from}`; const bans=db.get('bans',key,[]);
        const idx=bans.indexOf(target); if(idx===-1) return ctx.reply(`❌ @${target.split('@')[0]} is not banned.${s.FOOTER}`,{mentions:[target]});
        bans.splice(idx,1); db.set('bans',key,bans);
        ctx.reply(`✅ @${target.split('@')[0]} has been *unbanned*.${s.FOOTER}`,{mentions:[target]});
    }
};
