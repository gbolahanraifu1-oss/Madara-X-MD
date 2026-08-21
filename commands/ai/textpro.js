'use strict';
module.exports={name:'textpro',aliases:['stylishtext', 'textdesign'],category:'ai',desc:'ᴄʀᴇᴀᴛᴇ sᴛʏʟɪsʜ ᴛᴇxᴛ ᴀʀᴛ',usage:'†textpro <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
        const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'textpro Madara'+s.FOOTER);
        try{const r=await require('axios').get('https://api.textpro.me/neon?text='+encodeURIComponent(q),{responseType:'arraybuffer',timeout:15000});
        await sock.sendMessage(ctx.from,{image:Buffer.from(r.data),caption:'✨ '+q+s.FOOTER},{quoted:msg});
        }catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};
