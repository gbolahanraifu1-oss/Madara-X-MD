const axios = require('axios'); const db = require('../../lib/db');
module.exports = { name: 'triviahard', aliases: ['hardtrivia','experttrivia'], category: 'fun', desc: 'Hard-mode trivia quiz', usage: '†triviahard | †triviahard [A/B/C/D]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const key=`thrd_${ctx.from}`; const ans=args.join(' ')?.toUpperCase().trim(); const active=db.get('triviahard',key,null);
        if (ans&&active&&['A','B','C','D'].includes(ans)) { const ok=ans===active.cl; db.del('triviahard',key); return ctx.reply(ok?`✅ *Correct! (Hard mode!)* 🎉 Answer: *${active.cl}. ${active.answer}*${s.FOOTER}`:`❌ *Wrong!* Correct: *${active.cl}. ${active.answer}*${s.FOOTER}`); }
        try {
            const res=await axios.get('https://opentdb.com/api.php?amount=1&type=multiple&difficulty=hard');
            const q=res.data?.results?.[0]; if(!q) throw 0;
            const dec=t=>t.replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,'&');
            const choices=[q.correct_answer,...q.incorrect_answers].sort(()=>Math.random()-0.5).map(dec);
            const letters=['A','B','C','D']; const cl=letters[choices.indexOf(dec(q.correct_answer))];
            db.set('triviahard',key,{answer:dec(q.correct_answer),cl});
            ctx.reply(`🧠 *HARD Trivia:*\n\n❓ ${dec(q.question)}\n\n${choices.map((c,i)=>`*${letters[i]}.* ${c}`).join('\n')}\n\n\`${s.prefix}triviahard [A/B/C/D]\`${s.FOOTER}`);
        } catch { ctx.reply(`❌ Could not load question. Try again!${s.FOOTER}`); }
    }
};
