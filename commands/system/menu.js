// language: JavaScript, file: commands/system/menu.js
'use strict';
/*
 * MADARA X-MD — .menu command
 *
 * This file is now a thin dispatcher:
 *   .menu → renderRandomMenu() (same as pressing the MADARA MENU button in pain)
 *   .menu stock → sendStockMenu() (interactive category list, for debugging)
 *
 * The old full menu logic has been moved to menu2.js (preserved for reference/fixing).
 * All exports (sendStockMenu, sendCategoryMenu, etc.) are re-exported from menu2.js
 * so other files that require them (randomMenu, handler) continue to work.
 */

const fs   = require('fs');
const path = require('path');

// ── Re-export everything from menu2.js so dependents don't break ──
// menu2.js has sendStockMenu, sendCategoryMenu, sendCategoryDirectory, etc.
let _menu2 = null;
function menu2() {
    if (!_menu2) _menu2 = require('./menu2');
    return _menu2;
}

// ── Proxy-export the named exports callers depend on ──
function sendStockMenu(sock, msg, args, ctx) {
    return menu2().sendStockMenu(sock, msg, args, ctx);
}
function sendCategoryMenu(sock, msg, ctx, catKey) {
    return menu2().sendCategoryMenu(sock, msg, ctx, catKey);
}
function sendCategoryDirectory(sock, msg, ctx) {
    return menu2().sendCategoryDirectory(sock, msg, ctx);
}

// ── maybeSendMenuAudio (kept here so execute can call it after randommenu) ──
var MENU_AUDIO = path.join(process.cwd(), 'assets', 'menu_audio.mp3');
async function maybeSendMenuAudio(sock, from) {
    if (!fs.existsSync(MENU_AUDIO)) return;
    try {
        await sock.sendMessage(from, {
            audio   : fs.readFileSync(MENU_AUDIO),
            mimetype: 'audio/mpeg',
            ptt     : false
        });
    } catch (e) {
        console.log('[menu] audio send failed:', e.message);
    }
}

// ── Main execute ──
async function execute(sock, msg, args, ctx) {
    // .menu stock → show stock interactive category list (debug / fallback)
    if (args && String(args[0] || '').toLowerCase() === 'stock') {
        return sendStockMenu(sock, msg, args, ctx);
    }

    // .menu → renderRandomMenu() — same behaviour as pressing the MADARA MENU button
    try {
        const { renderRandomMenu } = require('../../lib/randomMenu');
        await renderRandomMenu(sock, msg, ctx);
        // Send audio after random menu renders (randomMenu itself doesn't send audio)
        await maybeSendMenuAudio(sock, ctx.from);
        return;
    } catch (e) {
        console.log('[menu] renderRandomMenu failed → stock fallback:', e.message);
    }

    // Last resort: stock menu
    return sendStockMenu(sock, msg, args, ctx);
}

module.exports = {
    name    : 'menu',
    aliases : ['commands', 'cmds', 'help', 'h', 'main'],
    category: 'system',
    desc    : 'sʜᴏᴡ ᴄᴏᴍᴀɴᴅ ᴍᴇɴᴜ',
    usage   : '.menu',
    waitReact: false,
    execute,
    sendStockMenu,
    sendCategoryMenu,
    sendCategoryDirectory,
    // Keep splitMenuLines and CAT available for anything that imports them
    get splitMenuLines() { return menu2().splitMenuLines; },
    get CAT()           { return menu2().CAT; },
};
