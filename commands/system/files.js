'use strict';
const fs=require('fs'),path=require('path');
const{CATEGORIES,PLATFORM_CATS,FREE_CATEGORIES,listFiles,catDir,findSensitivity,getFreebies,listPaidFiles,getPrice,mimeLabel}=require('../../lib/fileStore');
const{menuBox}=require('../../lib/menuBox');
if(!global._filesState)global._filesState=new Map();
const E={sensitivity:'🎯',macro:'⚡',headshots:'💀',proxy:'🌐',vvipproxy:'👑',config:'⚙️',freebies:'🎁'};

function sendFile(sock,from,msg,fp,label){
  const buf=fs.readFileSync(fp),mime=mimeLabel(fp),fn=path.basename(fp);
  return sock.sendMessage(from,{document:buf,mimetype:mime,fileName:fn,caption:'📁 *'+label+'*\n\n📎 ғɪʟᴇ: '+fn+'\n\n_— ᴍᴀᴅᴀʀᴀ x-ᴍᴅ ғɪʟᴇ sᴛᴏʀᴇ_'},{quoted:msg});
}

// ── Pending-reply handler (device model / platform choice) ────────────────
// IMPORTANT: this is called directly from lib/handler.js for PLAIN, non-
// prefixed text messages. handler.js returns early on `!isCmd` before any
// command's execute() ever runs, so a plain "Android" reply would never
// have reached this file's execute() — that was the actual bug behind
// ".files" never responding to the device/platform prompt. Now handler.js
// calls handlePendingText() for every non-command message BEFORE that
// early return, regardless of prefix.
async function handlePendingText(sock,msg,ctx){
  const id=ctx.sender;
  const state=global._filesState.get(id);
  if(!state||Date.now()>=state.expires)return false;

  const reply=(msg.message?.extendedTextMessage?.text||msg.message?.conversation||'').trim();
  if(!reply)return false;

  const s=ctx.settings;

  if(state.step==='await_model'){
    global._filesState.delete(id);
    const fp=findSensitivity(reply);
    if(!fp){await ctx.reply(menuBox('❌','sᴇɴsɪᴛɪᴠɪᴛʏ ɴᴏᴛ ғᴏᴜɴᴅ',[
      `ɴᴏ ᴍᴀᴛᴄʜ ғᴏʀ *${reply}*`,
      `_ᴛʀʏ: Samsung A12, Infinix Note 10, iPhone 12_`,
    ])+s.FOOTER);return true;}
    await sendFile(sock,ctx.from,msg,fp,'🎯 sᴇɴsɪᴛɪᴠɪᴛʏ — '+reply);
    return true;
  }

  if(state.step==='await_platform'){
    global._filesState.delete(id);
    const plat=(/iphone|ios/i.test(reply))?'iphone':'android';
    const files=listPaidFiles(state.cat,plat);
    if(!files.length){await ctx.reply(menuBox('❌',state.cat.toUpperCase(),[
      `ɴᴏ ғɪʟᴇ ᴀᴠᴀɪʟᴀʙʟᴇ ғᴏʀ *${plat.toUpperCase()}* ʏᴇᴛ.`,
    ])+s.FOOTER);return true;}

    const lines=files.map(f=>`🆔 \`${f.id}\` — ${f.filename} — 💰 ${f.price}`);
    lines.push('');
    lines.push(`💳 _${s.prefix}buyfile <ID>_`);
    lines.push(`_ᴇ.ɢ. ${s.prefix}buyfile ${files[0].id}_`);
    lines.push('');
    lines.push('⚠️ _ᴘᴀɪᴅ ғɪʟᴇs ᴀʀᴇ ɴᴏᴛ sᴇɴᴛ ᴀᴜᴛᴏ — ᴠᴇɴᴅᴏʀ ᴡɪʟʟ ᴄᴏɴᴛᴀᴄᴛ ʏᴏᴜ ᴀғᴛᴇʀ ᴏʀᴅᴇʀɪɴɢ._');
    await ctx.reply(menuBox(E[state.cat]||'📦',`${state.cat.toUpperCase()} — ${plat.toUpperCase()}`,lines)+s.FOOTER);
    return true;
  }
  return false;
}

module.exports={name:'files',aliases:['filestore','ff','fffiles'],category:'system',
desc:'ᴍᴀᴅᴀʀᴀ ғɪʟᴇ sʜᴏᴘ — ғʀᴇᴇ + ᴘᴀɪᴅ ғɪʟᴇs',usage:'†files [category]',waitReact:false,
handlePendingText,
async execute(sock,msg,args,ctx){
  const s=ctx.settings,sub=args[0]?.toLowerCase(),id=ctx.sender;

  // ── main menu ────────────────────────────────────────────────────────
  if(!sub){
    const lines=CATEGORIES.map(c=>{
      const free=FREE_CATEGORIES.includes(c);
      const cnt=c==='sensitivity'?listFiles(catDir(c)).length
        :c==='freebies'?listFiles(catDir(c)).length
        :listPaidFiles(c,'iphone').length+listPaidFiles(c,'android').length;
      const tag=free?'ғʀᴇᴇ':'ᴘᴀɪᴅ — '+getPrice(c);
      return `${E[c]||'📦'} _${s.prefix}files ${c}_ — ${cnt} (${tag})`;
    });
    lines.push('');
    lines.push(`💳 _${s.prefix}buyfile <ID>_ — ᴏʀᴅᴇʀ ᴀ ᴘᴀɪᴅ ғɪʟᴇ`);
    return ctx.reply(menuBox('📁','ғɪʟᴇ sʜᴏᴘ',lines)+s.FOOTER);
  }

  if(!CATEGORIES.includes(sub))return ctx.reply(menuBox('❌','ᴜɴᴋɴᴏᴡɴ ᴄᴀᴛᴇɢᴏʀʏ',[
    `ᴀᴠᴀɪʟᴀʙʟᴇ: ${CATEGORIES.join(', ')}`,
  ])+s.FOOTER);

  // ── free: freebies ───────────────────────────────────────────────────
  if(sub==='freebies'){
    const fbs=getFreebies();
    if(!fbs.length)return ctx.reply(menuBox('🎁','ғʀᴇᴇʙɪᴇs',[
      'ɴᴏ ғʀᴇᴇʙɪᴇs ᴀᴠᴀɪʟᴀʙʟᴇ ᴛᴏᴅᴀʏ. ᴄʜᴇᴄᴋ ʙᴀᴄᴋ ʟᴀᴛᴇʀ!',
    ])+s.FOOTER);
    await ctx.reply(menuBox('🎁','ғʀᴇᴇʙɪᴇs',[`sᴇɴᴅɪɴɢ ${fbs.length} ғɪʟᴇ(s)...`])+s.FOOTER);
    for(const fp of fbs)await sendFile(sock,ctx.from,msg,fp,'🎁 ғʀᴇᴇʙɪᴇ');
    return;
  }

  // ── free: sensitivity ────────────────────────────────────────────────
  if(sub==='sensitivity'){
    if(!listFiles(catDir('sensitivity')).length)return ctx.reply(menuBox('🎯','sᴇɴsɪᴛɪᴠɪᴛʏ',[
      'ɴᴏ sᴇɴsɪᴛɪᴠɪᴛʏ ғɪʟᴇs ʏᴇᴛ.',
    ])+s.FOOTER);
    global._filesState.set(id,{step:'await_model',cat:'sensitivity',expires:Date.now()+120000});
    return ctx.reply(menuBox('🎯','sᴇɴsɪᴛɪᴠɪᴛʏ ғɪʟᴇs',[
      'ʀᴇᴘʟʏ ᴡɪᴛʜ ʏᴏᴜʀ *ᴅᴇᴠɪᴄᴇ ᴍᴏᴅᴇʟ*',
      '_ᴇ.ɢ. Samsung A12, Infinix Note 10, iPhone 12_',
    ])+s.FOOTER);
  }

  // ── paid categories — never send the file, only take an order ────────
  if(PLATFORM_CATS.includes(sub)){
    const ai=listPaidFiles(sub,'iphone').length,an=listPaidFiles(sub,'android').length;
    if(!ai&&!an)return ctx.reply(menuBox(E[sub]||'📦',sub.toUpperCase(),[
      'ɴᴏ ғɪʟᴇs ᴀᴠᴀɪʟᴀʙʟᴇ ʏᴇᴛ.',
    ])+s.FOOTER);
    global._filesState.set(id,{step:'await_platform',cat:sub,expires:Date.now()+120000});
    return ctx.reply(menuBox(E[sub]||'📦',`${sub.toUpperCase()} — ᴘᴀɪᴅ (${getPrice(sub)})`,[
      'ʀᴇᴘʟʏ ᴡɪᴛʜ ʏᴏᴜʀ ᴘʟᴀᴛғᴏʀᴍ:',
      '🤖 *Android*',
      '🍎 *iPhone*',
    ])+s.FOOTER);
  }
}};
