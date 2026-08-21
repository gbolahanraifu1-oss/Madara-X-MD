const { menuBox } = require('../../lib/menuBox');
module.exports = { name: 'profile', aliases: ['userprofile','myprofile','whoami'], category: 'utility', desc: 'Show user profile info', usage: '†profile [@user?]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const m=ctx.getMentions?.()??[];
        const target=m[0]||ctx.sender;
        try {
            const pp=await sock.profilePictureUrl(target,'image').catch(()=>'No profile picture');
            const status=await sock.fetchStatus(target).catch(()=>({status:'No status'}));
            ctx.reply(menuBox('👤', 'ᴘʀᴏғɪʟᴇ', [
                `*Number:* @${target.split('@')[0]}`,
                `*Status:* ${status?.status||'N/A'}`,
                `*Photo:* ${typeof pp==='string'&&pp.startsWith('http')?'Available':'Not available'}`,
            ]) + s.FOOTER, {mentions:[target]});
        } catch(e){ctx.reply(`❌ Could not fetch profile: ${e.message}${s.FOOTER}`);}
    }
};
