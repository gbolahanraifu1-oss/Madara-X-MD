const db = require('../../lib/db');
module.exports = { name: 'badwords', aliases: ['badwordfilter','profanityfilter2'], category: 'misc', desc: 'Toggle bad word filter for group', usage: '†badwords [on|off]',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const sub=(args[0]||'').toLowerCase(); const key=`bw_${ctx.from}`;
        if(sub==='on'){db.set('badwords',key,{enabled:true});return ctx.reply(`✅ Bad word filter *enabled*.${s.FOOTER}`);}
        if(sub==='off'){db.set('badwords',key,{enabled:false});return ctx.reply(`❌ Bad word filter *disabled*.${s.FOOTER}`);}
        const cfg=db.get('badwords',key,{enabled:false});
        ctx.reply(`⚙️ Bad word filter: ${cfg.enabled?'✅ ON':'❌ OFF'}\n\`${s.prefix}badwords on/off\`${s.FOOTER}`);
    }
};
