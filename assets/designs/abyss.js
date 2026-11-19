'use strict';

async function render(sock, msg, args, skinId, ctx) {
    var s = ctx.settings || {};
    var prefix = s.prefix || '.';

    var url = "https://wsrv.nl/?url=files.catbox.moe/2prt24.jpg&w=144&h=144&fit=cover&output=jpg&q=60";
    var r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    var buf = Buffer.from(await r.arrayBuffer());

    await sock.sendMessage(ctx.from, {
        caption: "╭━➲ MADARA X-MD ━╮\nChoose an option below.",
        location: {
            degreesLatitude: 0,
            degreesLongitude: 0,
            name: "MADARA X-MD • Abyss",
            address: "Type " + prefix + "menu for all commands",
            jpegThumbnail: buf
        },
        buttons: [
            // Opens a random menu skin from the design pool
            { id: "madara_menu_random", text: "☰ Menu" },
            { id: prefix + "deploy", text: "🌐 Deploy" }
        ],
        footer: "MADARA X-MD • Abyss"
    }, { quoted: msg });
}

module.exports = {
    id: 'abyss',
    name: 'Abyss',
    render: render
};
