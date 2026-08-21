const db = require('../../lib/db');
module.exports = {
    name: 'chatmemory', aliases: ['memory','aichatsave','persistai'], category: 'ai',
    desc: 'Toggle persistent AI chat memory', usage: '†chatmemory [on|off|clear]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const sub = args[0]?.toLowerCase();
        const key = `chatmem_${ctx.sender}`;
        if (sub === 'clear') { db.del('chatmemory', key); return ctx.reply(`🗑️ Chat memory cleared.${s.FOOTER}`); }
        if (sub === 'on')  { db.set('chatmemory', key, { enabled: true, history: [] }); return ctx.reply(`✅ AI chat memory *enabled*.${s.FOOTER}`); }
        if (sub === 'off') { db.set('chatmemory', key, { enabled: false, history: [] }); return ctx.reply(`❌ AI chat memory *disabled*.${s.FOOTER}`); }
        const mem = db.get('chatmemory', key, { enabled: false, history: [] });
        ctx.reply(`🧠 *Chat Memory:* ${mem.enabled ? '✅ On' : '❌ Off'}\n📝 Stored: ${mem.history?.length || 0} messages\n\n\`${s.prefix}chatmemory on/off/clear\`${s.FOOTER}`);
    }
};
