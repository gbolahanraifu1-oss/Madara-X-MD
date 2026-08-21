module.exports = { name: 'roll', aliases: ['dice','rolldice','diceroll'], category: 'fun', desc: 'Roll dice (1d6 default, supports NdM)', usage: '†roll [NdM?] e.g. †roll 2d6',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const inp=args[0]||'1d6';
        const m=inp.match(/^(\d+)d(\d+)$/i);
        const count=m?Math.min(parseInt(m[1]),10):1; const sides=m?Math.min(parseInt(m[2]),100):6;
        const rolls=Array.from({length:count},()=>Math.floor(Math.random()*sides)+1);
        const total=rolls.reduce((a,b)=>a+b,0);
        ctx.reply(`🎲 *Dice Roll (${inp}):*\n\n🎯 Rolls: ${rolls.join(', ')}\n${count>1?`📊 Total: *${total}*\n`:''}✨ Result: *${rolls[0]}*${count>1?` (sum: ${total})`:''}${s.FOOTER}`);
    }
};
