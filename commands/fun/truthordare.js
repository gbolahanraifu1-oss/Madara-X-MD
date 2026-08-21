const db = require('../../lib/db');
module.exports = { name: 'truthordare', aliases: ['tod','todgame'], category: 'fun', desc: 'Full Truth or Dare game mode', usage: '†truthordare start | truth | dare | stop',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const sub=(args[0]||'').toLowerCase(); const key=`tod_${ctx.from}`;
        const truths=["What is the most embarrassing thing you've ever done?","Who is your secret crush?","What is your biggest fear?","Have you ever lied to a friend?","What is the weirdest dream you've had?"];
        const dares=["Send a voice note saying 'I love you' to the last person you texted","Do 20 push-ups right now","Text your crush 'hey'","Sing the chorus of your favorite song","Speak in an accent for the next 5 minutes"];
        if (sub==='stop') { db.del('tod',key); return ctx.reply(`🛑 Truth or Dare ended.${s.FOOTER}`); }
        if (sub==='start') { db.set('tod',key,{active:true,scores:{}}); return ctx.reply(`🎭 *Truth or Dare Started!*\nUse \`${s.prefix}truthordare truth\` or \`${s.prefix}truthordare dare\`${s.FOOTER}`); }
        if (sub==='truth') { const q=truths[Math.floor(Math.random()*truths.length)]; return ctx.reply(`🔮 *TRUTH for @${ctx.sender.split('@')[0]}:*\n\n_${q}_${s.FOOTER}`,{mentions:[ctx.sender]}); }
        if (sub==='dare')  { const d=dares[Math.floor(Math.random()*dares.length)]; return ctx.reply(`💥 *DARE for @${ctx.sender.split('@')[0]}:*\n\n_${d}_${s.FOOTER}`,{mentions:[ctx.sender]}); }
        ctx.reply(`🎭 *Truth or Dare:*\n\`${s.prefix}truthordare start/truth/dare/stop\`${s.FOOTER}`);
    }
};
