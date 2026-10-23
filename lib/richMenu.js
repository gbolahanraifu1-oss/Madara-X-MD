'use strict';
const settings = require('../settings');
const {
    CATEGORY_META,
    getMenuCategoryCatalog,
    getCategoryCounts,
} = require('./menuCategories');

async function sendRichMenu(sock, jid, data, quoted) {
    const { header } = data;
    const s = settings; 
    const categories = getMenuCategoryCatalog();
    const counts = getCategoryCounts();
    
    // Build text with categories listed
    let text = `*${header?.title || "MADARA X-MD MENU"}*\n\n`;
    text += header?.description || "Tap a category below to view commands 👇\n\n";
    text += `*Available Categories:*\n`;
    Object.entries(categories).forEach(([key, m]) => {
        text += `${m.e} ${m.l} — ${counts[key] || 0}\n`;
    });
    text += `\n_Use the category menu below, or send .categorymenu <category>._`;

    // WhatsApp supports at most three legacy reply buttons.
    const buttons = [
        { buttonId: `madara_cat_system`, buttonText: { displayText: "⚙️ SYSTEM" }, type: 1 },
        { buttonId: `madara_cat_group`, buttonText: { displayText: "👥 GROUP" }, type: 1 },
        { buttonId: `madara_cat_more`, buttonText: { displayText: "📂 CATEGORIES" }, type: 1 },
    ];

    await sock.sendMessage(jid, {
        text: text,
        footer: `© Powered by ${s.botName}`, // no channel here anymore
        buttons: buttons,
        headerType: 1
    }, { quoted });
}
module.exports = {
    sendRichMenu,
    CAT: CATEGORY_META,
    getMenuCategoryCatalog,
    getCategoryCounts,
};