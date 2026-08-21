'use strict';
const { toggleGreeting, isGreetingOn } = require('../../lib/madaraFeatures');
const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name:'welcome',aliases:['welcometoggle'],category:'group', // 'setwelcome' alias removed — that name belongs to setwelcome.js, was colliding
    desc:'ᴛᴏɢɢʟᴇ ᴡᴇʟᴄᴏᴍᴇ/ɢᴏᴏᴅʙʏᴇ ᴍᴇssᴀɢᴇs',usage:'†welcome on/off',
    groupOnly:true,adminOnly:true,
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,val=args[0]?.toLowerCase();
        if(!val||!['on','off'].includes(val))return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}welcome on/off${s.FOOTER}`);
        toggleGreeting(ctx.from,val==='on');
        await ctx.reply(menuBox(val==='on'?'✅':'❌', 'ᴡᴇʟᴄᴏᴍᴇ/ɢᴏᴏᴅʙʏᴇ', [
            `Messages: *${val.toUpperCase()}*`,
        ]) + s.FOOTER);
    }
};
