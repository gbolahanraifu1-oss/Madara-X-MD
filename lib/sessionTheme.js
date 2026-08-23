'use strict';
const fs=require('fs'),path=require('path'),db=require('./db'),{toSmallCaps}=require('./smallcaps');
const DIR=path.join(process.cwd(),'themes');
const NAMES=['madara','naruto','akatsuki','sharingan','itachi'];
function normalise(name){return String(name||'').toLowerCase().replace(/[^a-z]/g,'');}
function load(name){const n=normalise(name);if(!NAMES.includes(n))return null;try{return JSON.parse(fs.readFileSync(path.join(DIR,n+'.json'),'utf8'));}catch{return null;}}
function get(phone){const n=db.getSession(phone,'config','theme','');return load(n);}
function set(phone,name){const n=normalise(name),t=load(n);if(!t)return null;db.setSession(phone,'config','theme',n);return t;}
function info(phone){return get(phone)?.STRINGS?.global||null;}
function string(phone,key,fallback=''){return info(phone)?.[key]||fallback;}
function footer(phone){return string(phone,'footer')?'
> *'+string(phone,'footer')+'*':'';}
function format(phone,text){return typeof text==='string'?toSmallCaps(text):text;}
function themePrompt(c){return c.reply(toSmallCaps('🎨 *ᴄʜᴏᴏsᴇ ʏᴏᴜʀ ᴍᴀᴅᴀʀᴀ ᴛʜᴇᴍᴇ*\n\n1. *ᴍᴀᴅᴀʀᴀ* — ᴡᴀᴋᴇ ᴜᴘ ᴛᴏ ʀᴇᴀʟɪᴛʏ\n2. *ɴᴀʀᴜᴛᴏ* — ᴡɪʟʟ ᴏғ ғɪʀᴇ\n3. *ᴀᴋᴀᴛsᴜᴋɪ* — sʜᴀᴅᴏᴡs ɪɴ sɪʟᴇɴᴄᴇ\n4. *sʜᴀʀɪɴɢᴀɴ* — ᴛʜᴇ ᴇʏᴇ ᴡᴀᴛᴄʜᴇs\n5. *ɪᴛᴀᴄʜɪ* — ᴛʜᴇ ᴛʀᴜᴛʜ ɪɴ sʜᴀᴅᴏᴡs\n\nʀᴇᴘʟʏ ᴡɪᴛʜ ᴀ ɴᴜᴍʙᴇʀ ᴏʀ ᴛʜᴇᴍᴇ ɴᴀᴍᴇ.'));}
async function handlePendingText(sock,msg,c){if(!c.isPrivate||c.isCmd||!c.body?.trim())return false;const a=c.body.trim().toLowerCase(),map={1:'madara',2:'naruto',3:'akatsuki',4:'sharingan',5:'itachi'},name=map[a]||normalise(a);if(!NAMES.includes(name))return false;const t=set(c.sessionPhone,name);await c.reply(toSmallCaps('✅ *ᴛʜᴇᴍᴇ sᴇᴛ:* '+t.STRINGS.global.botName+'\n\nᴛʜᴇ ᴛʜᴇᴍᴇ ɪs ɴᴏᴡ ᴀᴄᴛɪᴠᴇ ғᴏʀ ᴛʜɪs sᴇssɪᴏɴ.'));return true;}
async function enforce(sock,msg,c){if(!c.isPrivate)return false;const t=get(c.sessionPhone);if(!t){if(c.isCmd&&['theme','themes','settheme'].includes(c.rawCmd))return false;await themePrompt(c);return true;}const d=db.get('dating','data',{}),profile=d.profiles?.[c.sender],pending=d.pending?.[c.sender];if(pending)return false;if(!profile&&c.isCmd&&!['match','mydate','theme','themes','settheme'].includes(c.rawCmd)){await c.reply(toSmallCaps('🔒 *ᴄᴏᴍᴘʟᴇᴛᴇ ʏᴏᴜʀ ᴅᴀᴛɪɴɢ ʀᴇɢɪsᴛʀᴀᴛɪᴏɴ ғɪʀsᴛ.*\n\nᴜsᴇ *'+c.prefix+'match* ᴛᴏ ʙᴇɢɪɴ.'));return true;}if(!profile&&!c.isCmd){await c.reply(toSmallCaps('🔒 *ᴄᴏᴍᴘʟᴇᴛᴇ ʏᴏᴜʀ ᴅᴀᴛɪɴɢ ʀᴇɢɪsᴛʀᴀᴛɪᴏɴ ғɪʀsᴛ.*\n\nᴜsᴇ *'+c.prefix+'match* ᴛᴏ ʙᴇɢɪɴ.'));return true;}return false;}
function list(){return NAMES.slice();}
module.exports={NAMES,load,get,set,footer,format,themePrompt,handlePendingText,enforce,list,info,string};