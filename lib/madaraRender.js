'use strict';
const crypto=require('crypto');
const { generateWAMessageFromContent, proto } = require('@itsliaaa/baileys');
function mkCta(label, id){
 return {
 label: label,
 state: 'PENDING',
 kind: 'OTHER',
 tool_call_id: crypto.randomUUID(),
 toast: { label: label, __typename: 'GenAI3PExtWidgetToast' },
 __typename: 'GenAI3PExtWidgetCTA'
 };
}
function getAllCommands(){ try{ const { getCategories } = require('./loader'); const cats=getCategories(); let all=[]; for(const [,map] of cats){ if(map instanceof Map){ for(const cmd of map.values()) all.push(cmd); } else if(Array.isArray(map)){ all=all.concat(map); } } return all; }catch{ return []; } }
function groupByCategory(cmds, order){
 const g={};
 (cmds||[]).forEach(c=>{
 const cat=(c.category||'other').toLowerCase();
 if(!g[cat]) g[cat]=[];
 g[cat].push(c);
 });
 if(Array.isArray(order) && order.length){
 const sorted={};
 order.forEach(k=>{ if(g[k]) sorted[k]=g[k]; });
 Object.keys(g).forEach(k=>{ if(!sorted[k]) sorted[k]=g[k]; });
 return sorted;
 }
 return g;
}
async function renderMadara(sock, from, msg, sections){
 try{
 const data=Buffer.from(JSON.stringify({sections})).toString('base64');
 const content=proto.Message.fromObject({
 messageContextInfo:{deviceListMetadataVersion:2, deviceListMetadata:{}, messageSecret:crypto.randomBytes(32)},
 botForwardedMessage:{message:{richResponseMessage:{messageType:1, submessages:[], unifiedResponse:{data}, contextInfo:{isForwarded:true, forwardingScore:999, forwardOrigin:4}}}}
 });
 const wrapped=generateWAMessageFromContent(from, content, {userJid: sock.user?.id, quoted: msg});
 await sock.relayMessage(from, wrapped.message, {messageId: wrapped.key.id});
 }catch(e){
 console.log('renderMadara error', e.message);
 await sock.sendMessage(from, {text: 'Render error: '+e.message}, {quoted: msg});
 }
}
module.exports={mkCta,getAllCommands,groupByCategory,renderMadara};
