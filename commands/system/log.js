const db = require('../../lib/db');
module.exports = { name: 'log', aliases: ['logging','togglelog','cmdlog'], category: 'system', desc: 'Toggle command logging (owner only)', usage: '†log [on|off]', ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const sub=args[0]?.toLowerCase(); const cur=db.get('system','logging',false);
        const next=sub==='on'?true:sub==='off'?false:!cur;
        db.set('system','logging',next);
        ctx.reply(`📋 *Command Logging:* ${next?'✅ Enabled':'❌ Disabled'}${s.FOOTER}`);
    }
};
