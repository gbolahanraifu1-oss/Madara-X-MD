const db = require('../../lib/db');
module.exports = {
    name: 'numberguess', aliases: ['numguess','guessnumber'], category: 'fun',
    desc: 'Guess the number 1–100 in 7 tries', usage: '†numberguess start | [number]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings; const sub=(args[0]||'').toLowerCase(); const key=`numguess_${ctx.sender}`;
        if (sub==='start') {
            db.set('numguess',key,{number:Math.floor(Math.random()*100)+1,attempts:0,max:7,active:true});
            return ctx.reply(`🔢 *Guess 1–100 in 7 tries!*\n\`${s.prefix}numberguess [num]\`${s.FOOTER}`);
        }
        const guess=parseInt(args[0]); if (isNaN(guess)) return ctx.reply(`❌ \`${s.prefix}numberguess start\` or \`${s.prefix}numberguess [1-100]\`${s.FOOTER}`);
        const g=db.get('numguess',key,null); if (!g?.active) return ctx.reply(`❌ No game. \`${s.prefix}numberguess start\`${s.FOOTER}`);
        g.attempts++;
        if (guess===g.number) { g.active=false; db.set('numguess',key,g); return ctx.reply(`🎉 *Correct!* It was *${g.number}* — got it in *${g.attempts}* tries!${s.FOOTER}`); }
        const left=g.max-g.attempts;
        if (left<=0) { g.active=false; db.set('numguess',key,g); return ctx.reply(`💀 *Game Over!* Answer: *${g.number}*${s.FOOTER}`); }
        db.set('numguess',key,g);
        ctx.reply(`${guess<g.number?'📈 Too low!':'📉 Too high!'} Tries left: *${left}*${s.FOOTER}`);
    }
};
