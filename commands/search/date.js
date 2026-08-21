module.exports = { name: 'date', aliases: ['calendar','today','currentdate'], category: 'search', desc: 'Current date and calendar info', usage: '†date [timezone?]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const tz=args[0]||'UTC';
        try {
            const now=new Date();
            const fmt=Intl.DateTimeFormat('en-US',{timeZone:tz,weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(now);
            const week=Math.ceil(((now-new Date(now.getFullYear(),0,1))/86400000+1)/7);
            const doy=Math.ceil((now-new Date(now.getFullYear(),0,1))/86400000)+1;
            ctx.reply(`\`『 📅 DATE 』\`\n*╭──────────────────⊷*\n*┋ 📅* ${fmt}\n*┋ 🗓️ Week:* ${week}\n*┋ 📊 Day:* ${doy}/365\n*┋ 🌍 TZ:* ${tz}\n*╰──────────────────⊷*${s.FOOTER}`);
        } catch{ctx.reply(`❌ Invalid timezone: \`${tz}\`${s.FOOTER}`);}
    }
};
