const db = require('../../lib/db');
const axios = require('axios');
module.exports = { name: 'storycontinue', aliases: ['continuestory','groupstory','addstory'], category: 'fun', desc: 'Continue a group story interactively', usage: '†storycontinue start | †storycontinue [your part]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const sub=(args[0]||'').toLowerCase(); const key=`story_${ctx.from}`;
        if (sub==='stop'||sub==='end') { db.del('story',key); return ctx.reply(`📖 Story ended.${s.FOOTER}`); }
        if (sub==='start') {
            const openers=['Once upon a time in a digital city far away...','It was a dark and stormy night when the message arrived...','Nobody expected the robot to walk into the café...'];
            const opening=openers[Math.floor(Math.random()*openers.length)];
            db.set('story',key,{parts:[opening],active:true});
            return ctx.reply(`📖 *Group Story Started!*\n\n_${opening}_\n\nContinue with \`${s.prefix}storycontinue [your part]\`${s.FOOTER}`);
        }
        const addition=args.join(' ');
        if (!addition) return ctx.reply(`❌ Add to the story: \`${s.prefix}storycontinue [your part]\`\nStart: \`${s.prefix}storycontinue start\`${s.FOOTER}`);
        const story=db.get('story',key,null);
        if (!story?.active) return ctx.reply(`❌ No active story. Use \`${s.prefix}storycontinue start\`${s.FOOTER}`);
        story.parts.push(`@${ctx.sender.split('@')[0]}: ${addition}`);
        db.set('story',key,story);
        const last3=story.parts.slice(-3).join('\n\n');
        ctx.reply(`📖 *Story Continues... (${story.parts.length} parts)*\n\n${last3}\n\nYour turn! \`${s.prefix}storycontinue [next part]\`${s.FOOTER}`,{mentions:[ctx.sender]});
    }
};
