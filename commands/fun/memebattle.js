const db = require('../../lib/db');
module.exports = { name: 'memebattle', aliases: ['memevote','memewar'], category: 'fun', desc: 'Meme voting battle between two images', usage: '†memebattle start | vote [1|2]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const sub=(args[0]||'').toLowerCase(); const key=`memebattle_${ctx.from}`;
        if (sub==='start') {
            db.set('memebattle',key,{votes:{1:0,2:0},active:true,voters:[]});
            return ctx.reply(`🥊 *Meme Battle!*\nPost two images and have members vote!\nVote: \`${s.prefix}memebattle vote 1\` or \`${s.prefix}memebattle vote 2\`\nResults: \`${s.prefix}memebattle results\`${s.FOOTER}`);
        }
        if (sub==='vote') {
            const pick=parseInt(args[1]); if (![1,2].includes(pick)) return ctx.reply(`❌ Vote 1 or 2.${s.FOOTER}`);
            const battle=db.get('memebattle',key,null); if (!battle?.active) return ctx.reply(`❌ No battle. \`${s.prefix}memebattle start\`${s.FOOTER}`);
            if (battle.voters.includes(ctx.sender)) return ctx.reply(`❌ Already voted!${s.FOOTER}`);
            battle.votes[pick]++; battle.voters.push(ctx.sender); db.set('memebattle',key,battle);
            return ctx.reply(`✅ Vote for *Meme ${pick}* recorded!${s.FOOTER}`);
        }
        if (sub==='results'||sub==='end') {
            const battle=db.get('memebattle',key,null); if (!battle) return ctx.reply(`❌ No battle found.${s.FOOTER}`);
            battle.active=false; db.set('memebattle',key,battle);
            const winner=battle.votes[1]>battle.votes[2]?'Meme 1':battle.votes[2]>battle.votes[1]?'Meme 2':'It\'s a Tie!';
            return ctx.reply(`🥊 *Meme Battle Results:*\n\n🔵 Meme 1: *${battle.votes[1]}* votes\n🔴 Meme 2: *${battle.votes[2]}* votes\n\n🏆 *Winner: ${winner}*${s.FOOTER}`);
        }
        ctx.reply(`🥊 *Meme Battle:*\n\`${s.prefix}memebattle start/vote [1|2]/results\`${s.FOOTER}`);
    }
};
