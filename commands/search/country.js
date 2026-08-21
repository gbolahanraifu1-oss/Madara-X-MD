'use strict';
const axios=require('axios');
module.exports={name:'country',aliases:['countryinfo','nation'],category:'search',desc:'sᴇᴀʀᴄʜ ᴄᴏᴜɴᴛʀʏ ɪɴғᴏ',usage:'†country <name>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'country Nigeria'+s.FOOTER);
try{const r=await require('axios').get('https://restcountries.com/v3.1/name/'+encodeURIComponent(q));
const c=r.data[0];
await sock.sendMessage(ctx.from,{image:{url:c.flags.png},
caption:'🌍 *'+c.name.common+'*\n\n🏛️ ᴄᴀᴘɪᴛᴀʟ: '+c.capital?.[0]+'\n👥 ᴘᴏᴘ: '+c.population?.toLocaleString()+'\n🌐 ʀᴇɢɪᴏɴ: '+c.region+'\n💬 ʟᴀɴɢs: '+Object.values(c.languages||{}).join(', ')+'\n💰 ᴄᴜʀʀᴇɴᴄʏ: '+Object.values(c.currencies||{}).map(c2=>c2.name).join(', ')+s.FOOTER},{quoted:msg});}
catch{await ctx.reply('❌ ᴄᴏᴜɴᴛʀʏ ɴᴏᴛ ғᴏᴜɴᴅ.'+s.FOOTER);}}};
