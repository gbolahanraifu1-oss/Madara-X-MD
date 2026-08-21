'use strict';
const axios=require('axios');
module.exports={name:'pokedex',aliases:['pokemon','poke','pkdex'],category:'utility',desc:'sᴇᴀʀᴄʜ ᴘᴏᴋéᴍᴏɴ',usage:'†pokedex <name>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=(args[0]||'pikachu').toLowerCase();
try{const r=await require('axios').get('https://pokeapi.co/api/v2/pokemon/'+q);
const p=r.data;const types=p.types.map(t=>t.type.name).join(', ');
await sock.sendMessage(ctx.from,{image:{url:p.sprites.other['official-artwork'].front_default||p.sprites.front_default},
caption:'🎮 *'+p.name.toUpperCase()+'*\n\n📊 ʜᴘ: '+p.stats[0].base_stat+'\n⚔️ ᴀᴛᴋ: '+p.stats[1].base_stat+'\n🛡️ ᴅᴇғ: '+p.stats[2].base_stat+'\n🏃 sᴘᴅ: '+p.stats[5].base_stat+'\n🌟 ᴛʏᴘᴇ: '+types+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ ᴘᴏᴋéᴍᴏɴ ɴᴏᴛ ғᴏᴜɴᴅ.'+s.FOOTER);}}};
