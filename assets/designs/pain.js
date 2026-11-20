'use strict';

const { getCategories } = require('../../lib/loader');

function clockString(ms) {
    var h = Math.floor(ms / 3600000);
    var m = Math.floor(ms / 60000) % 60;
    var s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(function (v) {
        return String(v).padStart(2, '0');
    }).join(':');
}

async function render(sock, msg, args, skinId, ctx) {
    var s = ctx.settings || {};
    var prefix = s.prefix || '.';

    var uptime = clockString(process.uptime() * 1000);
    var now = new Date();
    var date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    var time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    var total = '1688+';
    try {
        var cats = getCategories();
        var n = 0;
        for (var v of cats.values()) n += v.length;
        if (n > 0) total = n + '+';
    } catch (e) {}

    var url = "https://wsrv.nl/?url=files.catbox.moe/2prt24.jpg&w=144&h=144&fit=cover&output=jpg&q=60";
    var r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    var buf = Buffer.from(await r.arrayBuffer());

    var str =
        "\n╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═⊷❍\n" +
        "┃✰│𝙽𝚊𝚖𝚎: ᴍᴀᴅᴀʀᴀ x-ᴍᴅ\n" +
        "┃✰│𝚃𝚘ᴛᴀʟ: " + total + " ғᴇᴀᴛᴜʀᴇs\n" +
        "┃✰│ᴠᴇʀꜱɪᴏɴ: v" + (s.version || '1.0') + "\n" +
        "┃✰│ᴏᴡɴᴇʀ: *" + (s.ownerName || 'Madara') + "*\n" +
        "┃✰│ᴘʀᴇꜰɪx: *" + prefix + "*\n" +
        "┃✰│ᴜᴘᴛɪᴍᴇ: " + uptime + "\n" +
        "┃✰│ᴅᴀᴛᴇ: " + date + "\n" +
        "┃✰│ᴛɪᴍᴇ: " + time + "\n" +
        "╰──────────────────";

    await sock.sendMessage(ctx.from, {
        caption: str,
        location: {
            degreesLatitude: 0,
            degreesLongitude: 0,
            name: "MADARA X-MD • Pain",
            address: "Type " + prefix + "menu for all commands",
            jpegThumbnail: buf
        },
        buttons: [
            { id: "madara_cat_system", text: "⚙️ SYSTEM" },
            { id: "madara_cat_group", text: "👥 GROUP" },
            { id: prefix + "menu", text: "📂 MADARA MENU" }
        ],
        footer: "© Powered by " + (s.botName || 'MADARA X-MD')
    }, { quoted: msg });
}

module.exports = {
    id: 'pain',
    name: 'Pain',
    render: render
};