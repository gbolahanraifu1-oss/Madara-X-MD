'use strict';
const fs = require('fs');
const { getRandomBanner } = require('../../lib/menuBanner');
const { menuBox } = require('../../lib/menuBox');
const { CAT } = require('../../lib/richMenu');
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('@itsliaaa/baileys');

const _SC = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'Q',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'};
const sc = str => String(str).toLowerCase().split('').map(c=>_SC[c]||c).join('');
const clockString = ms => [Math.floor(ms/3600000),Math.floor(ms/60000)%60,Math.floor(ms/1000)%60].map(v=>String(v).padStart(2,'0')).join(':');

async function sendCategoryMenu(sock, msg, ctx, catKey) {
    const s = ctx.settings;
    catKey = catKey.toLowerCase();
    const m = CAT[catKey];
    if (!m) return ctx.reply(`❌ Unknown category: ${catKey}${s.FOOTER}`);
    const { getCategories } = require('../../lib/loader');
    const cmds = (getCategories().get(catKey) || []).filter((c, i, arr) => arr.findIndex(x => x.name === c.name) === i).sort((a, b) => a.name.localeCompare(b.name));
    if (!cmds.length) return ctx.reply(`📭 No commands found in *${m.l}*.${s.FOOTER}`);
    const lines = cmds.map(c => `*${s.prefix}${c.name}* : ${c.desc || 'No description'}`);
    lines.push(``, `_Use ${s.prefix}help <cmd> for details_`);
    await sock.sendMessage(ctx.from, {
        text: menuBox(m.e, `${m.l.toUpperCase()} ᴄᴏᴍᴀɴᴅs`, lines) + s.FOOTER,
        buttons: [{ buttonId: 'madara_back_menu', buttonText: { displayText: '⬅️ BACK TO MENU' }, type: 1 }],
        headerType: 1
    }, { quoted: msg });
}

function greeting() {
    const h = new Date().getHours();
    if (h < 4) return 'ʜᴀᴘᴘʏ ᴇᴀʀʟʏ ʜᴏᴜʀs ✨';
    if (h < 10) return 'ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ 🥱';
    if (h < 15) return 'ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏɴ 🫠';
    if (h < 18) return 'ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ 🌇';
    return 'ɢᴏᴏᴅ ɴɪɢʜᴛ 🌙';
}

async function execute(sock, msg, args, ctx) {
    // === DESIGN ENGINE - PER SESSION FIX ===
    try{
      const { PREF_FILE, render } = require('../../lib/menuEngine');
      let pref={}; try{pref=JSON.parse(fs.readFileSync(PREF_FILE,'utf8'))}catch{}
      let chatId = msg.chat || ctx.from;
      let senderId = msg.key?.participant || msg.sender || ctx.sender || chatId;

      // PER-SESSION: senderId first, then global default
      let skin = pref[senderId] || pref['default'] || 'default';

      console.log('[MENU DEBUG] senderId',senderId,'skin',skin);

      if(skin!== 'default'){
        try{
          await render(sock,msg,args,skin,ctx);
          return;
        }catch(e){
          console.log('[MENU DEBUG] render error',e);
          await sock.sendMessage(chatId,{text:`❌ Design "${skin}" failed:\n${e.message}`});
          return;
        }
      }
    }catch(e){ console.log('skin outer error',e); }
    // === END DESIGN ENGINE ===

    const s = ctx.settings; const prefix = s.prefix || '.'; const name = ctx.pushName || sc(s.ownerName);
    const uptime = clockString(process.uptime() * 1000); const now = new Date();
    const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const str = `❤️ *_ʜᴇʟʟᴏ ${name}, ${greeting()}!_* 🥳
╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
┃✰│𝙽𝚊𝚖𝚎: ${sc(s.botName)}
┃✰│𝚃𝚘𝚝𝚊𝚕: 700+ ғᴇᴀᴛᴜʀᴇs
┃✰│ᴠᴇʀꜱɪᴏɴ: v${sc(s.version)}
┃✰│ᴏᴡɴᴇʀ: *${sc(s.ownerName)}*
┃✰│ᴘʀᴇꜰɪx: *${prefix}*
┃✰│ᴜᴘᴛɪᴍᴇ: ${uptime}
┃✰│ᴅᴀᴛᴇ: ${date}
┃✰│ᴛɪᴍᴇ: ${time}
╰──────────────────

*Q̲ᴜɪᴄᴋ:* ${prefix}ʙᴏᴛᴍᴇɴᴜ | ${prefix}ɢʀᴏᴜᴘᴍᴇɴᴜ | ${prefix}ᴅʟᴍᴇɴᴜ`;

    let bannerImg = null;
    try {
        const localBanner = getRandomBanner(ctx.sender);
        if (localBanner && fs.existsSync(localBanner))
            bannerImg = await prepareWAMessageMedia({ image: fs.readFileSync(localBanner) }, { upload: sock.waUploadToServer });
    } catch {}

    const rows = Object.keys(CAT).map(k => ({ title: CAT[k].l, description: `View ${CAT[k].l} commands`, id: `madara_cat_${k}` }));
    rows.push({ title: "📢 CHANNEL", description: `Join ${s.botName} channel`, id: "madara_channel" });

    const menuMsg = generateWAMessageFromContent(ctx.from, {
        interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({ text: str }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: `© Powered by ${s.botName}` }),
            header: proto.Message.InteractiveMessage.Header.create({ title: `${sc(s.botName)}`, hasMediaAttachment:!!bannerImg, imageMessage: bannerImg?.imageMessage || undefined }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "⚙️ SYSTEM", id: "madara_cat_system" }) },
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👥 GROUP", id: "madara_cat_group" }) },
                    { name: "single_select", buttonParamsJson: JSON.stringify({ title: "📂 ᴍᴀᴅᴀʀᴀ ᴍᴇɴᴜ", sections: [{ title: "sᴇʟᴇᴄᴛ ᴄᴀᴛᴇɢᴏʀʏ", rows: rows }] }) }
                ]
            })
        })
    }, { quoted: msg });

    await sock.relayMessage(ctx.from, menuMsg.message, {
        messageId: menuMsg.key.id,
        additionalNodes: [{
            tag: "biz", attrs: {},
            content: [{ tag: "interactive", attrs: { type: "native_flow", v: "1" }, content: [{ tag: "native_flow", attrs: { v: "9", name: "mixed" } }] }]
        }]
    });
}

module.exports = { name: 'menu', aliases: ['commands','cmds','help','h','main'], category: 'system', desc: 'sʜᴏᴡ ᴄᴏᴍᴀɴᴅ ᴍᴇɴᴜ', usage: '.menu', waitReact: false, execute, sendCategoryMenu, CAT };