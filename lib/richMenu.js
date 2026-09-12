'use strict';
const settings = require('../settings');

const CAT = {
    system: {e:'⚙️', l:'sʏsᴛᴇᴍ'}, group: {e:'👥', l:'ɢʀᴏᴜᴘ'}, media: {e:'📥', l:'ᴍᴇᴅɪᴀ'},
    converter: {e:'🔄', l:'ᴄᴏɴᴠᴇʀᴛᴇʀ'}, sticker: {e:'🎨', l:'sᴛɪᴄᴋᴇʀ'}, ai: {e:'🤖', l:'ᴀɪ'},
    fun: {e:'🎮', l:'ғᴜɴ'}, search: {e:'🔍', l:'sᴇᴀʀᴄʜ'}, utility: {e:'🛠️',l:'ᴜᴛɪʟɪᴛʏ'},
    finance: {e:'💰', l:'ғɪɴᴀɴᴄᴇ'}, language: {e:'🌐', l:'ʟᴀɴɢᴜᴀɢᴇ'}, misc: {e:'📦', l:'ᴍɪsᴄ'},
    owner: {e:'👑', l:'ᴏᴡɴᴇʀ'},
};

async function sendRichMenu(sock, jid, data, quoted) {
    const { header } = data;
    const s = settings; 
    
    // Build text with categories listed
    let text = `*${header?.title || "MADARA X-MD MENU"}*\n\n`;
    text += header?.description || "Tap a category below to view commands 👇\n\n";
    text += `*Available Categories:*\n`;
    Object.entries(CAT).forEach(([key, m]) => {
        text += `${m.e} ${m.l}\n`;
    });
    text += `\n_Use the button below to navigate_`;

    // MAX 3 BUTTONS FOR WA. So we put: 2 categories + Channel + More
    const buttons = [
        { buttonId: `madara_cat_system`, buttonText: { displayText: "⚙️ SYSTEM" }, type: 1 },
        { buttonId: `madara_cat_group`, buttonText: { displayText: "👥 GROUP" }, type: 1 },
        { buttonId: `madara_cat_more`, buttonText: { displayText: "📂 CATEGORIES" }, type: 1 }, // opens list
        { buttonId: `madara_channel`, buttonText: { displayText: "📢 JOIN CHANNEL" }, type: 1 }
    ];

    await sock.sendMessage(jid, {
        text: text,
        footer: `© Powered by ${s.botName}`, // no channel here anymore
        buttons: buttons,
        headerType: 1
    }, { quoted });
}
module.exports = { sendRichMenu, CAT }; // ADD CAT