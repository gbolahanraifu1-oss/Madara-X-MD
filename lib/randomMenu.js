// language: JavaScript, file: lib/randomMenu.js
'use strict';

/**
 * Pick a random menu design and render it.
 * Used by Pain's "MADARA MENU" button (id: madara_menu_random)
 * AND by commands/system/menu.js execute() (the .menu command itself).
 *
 * After a successful render, sends menu_audio.mp3 if it exists.
 * Falls back to sendStockMenu only if all skin renders fail.
 *
 * NEVER falls back to commands/system/menu.execute() — that would
 * re-render pain and make the button look dead.
 */

const fs   = require('fs');
const path = require('path');

var MENU_AUDIO = path.join(process.cwd(), 'assets', 'menu_audio.mp3');

async function maybeSendMenuAudio(sock, from) {
    if (!fs.existsSync(MENU_AUDIO)) return;
    try {
        await sock.sendMessage(from, {
            audio   : fs.readFileSync(MENU_AUDIO),
            mimetype: 'audio/mpeg',
            ptt     : false,
        });
    } catch (e) {
        console.log('[randomMenu] audio send failed:', e.message);
    }
}

async function sendStock(sock, msg, ctx) {
    try {
        const menuCmd = require('../commands/system/menu');
        return await menuCmd.sendStockMenu(sock, msg, [], ctx);
    } catch (e) {
        console.error('[randomMenu] stock menu failed:', e.message);
    }
}

function isPickable(id) {
    const n = String(id || '').toLowerCase();
    // skip skins that would create a loop or are internal-only
    return Boolean(n)
        && n !== 'abyss'
        && n !== 'pain'
        && n !== 'default'
        && n !== 'madara-menu-pack';
}

async function renderRandomMenu(sock, msg, ctx) {
    const menuEngine = require('./menuEngine');
    let pool = [];
    try {
        pool = (menuEngine.listDesigns() || []).filter(isPickable);
    } catch (_) {}

    // Fallback pool: pack DESIGNS array
    if (!pool.length) {
        try {
            const pack = require('../assets/designs/madara-menu-pack.js');
            if (Array.isArray(pack.DESIGNS)) pool = pack.DESIGNS.filter(isPickable);
        } catch (_) {}
    }

    // Try up to 3 random designs
    const shuffled = [...new Set(pool)].sort(() => Math.random() - 0.5);
    for (const pick of shuffled.slice(0, 3)) {
        try {
            await menuEngine.render(sock, msg, [], pick, ctx);
            // Audio after successful skin render
            await maybeSendMenuAudio(sock, ctx.from);
            return;
        } catch (e) {
            console.error('[randomMenu] render failed for', pick, ':', e.message);
        }
    }

    // All skins failed — send stock menu (stock sends its own audio internally)
    return sendStock(sock, msg, ctx);
}

module.exports = { renderRandomMenu };
