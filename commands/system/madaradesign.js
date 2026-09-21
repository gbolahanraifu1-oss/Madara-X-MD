'use strict';
module.exports={
 name:'madaradesign',
 aliases:['setmenu','infinite','md','setmenuinfinite'],
 category:'system',
 desc:'switch menu design',
 execute: async (sock,msg,args)=>{
 const from=msg.key.remoteJid;
 const loadDesigns=require('../../lib/designLoader').loadDesigns;
 const pref=require('../../lib/designPref');
 const getUserDesign=pref.getUserDesign||pref.getDesign;
 const setUserDesign=pref.setUserDesign||pref.setDesign;
 const designs=loadDesigns();
 let selected=(args[0]||'').toLowerCase().trim();
 if(selected==='infinite') selected='madara-infinite-tsukuyomi';
 if(selected==='madara'||selected==='tsukuyomi') selected='madara-infinite-tsukuyomi';
 if(selected && designs[selected]){
 setUserDesign(from,selected);
 const mod=designs[selected];
 const title=mod.TITLE||selected;
 await sock.sendMessage(from,{text:'✅ DESIGN SET TO '+title+'\n> Type.menu to see it'},{quoted:msg});
 return;
 }
 const current=getUserDesign(from)||'default';
 let text='*MADARA X-MD -- DESIGN SELECTOR*\n';
 text+='Current: '+current+'\n';
 text+='----------------\n';
 for(const k of Object.keys(designs)){
 const active=k===current?'✅ ':'• ';
 text+=active+k+'\n';
 }
 text+='----------------\n';
 text+='Usage:.setmenu <name>\n';
 text+='Ex:.setmenu infinite';
 await sock.sendMessage(from,{text},{quoted:msg});
 }
};
