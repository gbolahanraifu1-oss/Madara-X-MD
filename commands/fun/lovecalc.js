module.exports = { name: 'lovecalc', aliases: ['lovecalculator','lovetest'], category: 'fun', desc: 'Love calculator (fun)', usage: '†lovecalc [name1] [name2]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const n1=args[0]||'You'; const n2=args.slice(1).join(' ')||'Someone';
        const seed=(n1+n2).toLowerCase().split('').reduce((a,c)=>a+c.charCodeAt(0),0);
        const score=seed%101; const emoji=score>80?'💞':score>60?'💕':score>40?'🙂':score>20?'😐':'💔';
        ctx.reply(`${emoji} *Love Calculator:*\n\n*${n1}* ❤️ *${n2}*\n\n❤️ Score: *${score}%*\n${'❤️'.repeat(Math.round(score/10))}${'🤍'.repeat(10-Math.round(score/10))}${s.FOOTER}`);
    }
};
