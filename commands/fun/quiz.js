const axios = require('axios'); const db = require('../../lib/db');
module.exports = { name: 'quiz', aliases: ['generalquiz','quizme','gk'], category: 'fun', desc: 'General knowledge quiz', usage: '†quiz | †quiz [A/B/C/D]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const key=`quiz_${ctx.from}`; const ans=args.join(' ')?.toUpperCase().trim(); const active=db.get('quiz',key,null);
        if (ans&&active&&['A','B','C','D'].includes(ans)) { const ok=ans===active.correctLetter; db.del('quiz',key); return ctx.reply(ok?`✅ *Correct!* 🎉 Answer: *${active.correctLetter}. ${active.answer}*${s.FOOTER}`:`❌ *Wrong!* Correct: *${active.correctLetter}. ${active.answer}*${s.FOOTER}`); }
        try {
            const res=await axios.get('https://opentdb.com/api.php?amount=1&type=multiple&difficulty=medium');
            const q=res.data?.results?.[0]; if(!q) throw 0;
            const dec=t=>t.replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
            const choices=[q.correct_answer,...q.incorrect_answers].sort(()=>Math.random()-0.5).map(dec);
            const letters=['A','B','C','D']; const cl=letters[choices.indexOf(dec(q.correct_answer))];
            db.set('quiz',key,{answer:dec(q.correct_answer),correctLetter:cl});
            ctx.reply(`🧠 *Quiz:*\n\n❓ ${dec(q.question)}\n\n${choices.map((c,i)=>`*${letters[i]}.* ${c}`).join('\n')}\n\n\`${s.prefix}quiz [A/B/C/D]\`${s.FOOTER}`);
        } catch { ctx.reply(`❌ Could not load question. Try again!${s.FOOTER}`); }
    }
};
