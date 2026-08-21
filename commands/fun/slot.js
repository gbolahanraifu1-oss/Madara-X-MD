module.exports = { name: 'slot', aliases: ['slotmachine','slots','casino'], category: 'fun', desc: 'Spin the slot machine', usage: '†slot',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings;
        const symbols=['🍒','🍋','🔔','⭐','💎','🍀','🎰','7️⃣'];
        const spin=()=>symbols[Math.floor(Math.random()*symbols.length)];
        const r=[spin(),spin(),spin()];
        const win=r[0]===r[1]&&r[1]===r[2];
        const two=r[0]===r[1]||r[1]===r[2]||r[0]===r[2];
        let result=''; let msg2='';
        if(win){result='🎉 JACKPOT! All three match!';msg2='You won big! 💰';}
        else if(two){result='✨ Two matching! Almost!';msg2='So close! Try again!';}
        else{result='💀 No match. Better luck next time!';msg2='The slots were not in your favor.';}
        ctx.reply(`🎰 *Slot Machine:*\n\n[ ${r[0]} | ${r[1]} | ${r[2]} ]\n\n${result}\n_${msg2}_${s.FOOTER}`);
    }
};
