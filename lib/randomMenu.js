'use strict';

/**
 * Pick a random menu design and render it.
 * Used by Abyss / Pain "Menu" quick-reply buttons (id: madara_menu_random).
 *
 * IMPORTANT: this must never fall back to commands/system/menu.execute().
 * Pain is the default skin, so menu.execute() renders Pain again and the
 * button appears to do nothing. The fallback is the stock menu instead.
 */

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
    // skip self-loop skins so random always lands on a full menu
    return Boolean(n) && n !== 'abyss' && n !== 'pain' && n !== 'default' && n !== 'madara-menu-pack';
}

async function renderRandomMenu(sock, msg, ctx) {
    const menuEngine = require('./menuEngine');
    let pool = [];
    try {
        pool = (menuEngine.listDesigns() || []).filter(isPickable);
    } catch (_) {}

    // Fallback: pack list if the scanner returned nothing usable
    if (!pool.length) {
        try {
            const pack = require('../assets/designs/madara-menu-pack.js');
            if (Array.isArray(pack.DESIGNS)) pool = pack.DESIGNS.filter(isPickable);
        } catch (_) {}
    }

    // Try up to 3 random designs; if they all fail, send the stock menu.
    const shuffled = [...new Set(pool)].sort(() => Math.random() - 0.5);
    for (const pick of shuffled.slice(0, 3)) {
        try {
            await menuEngine.render(sock, msg, [], pick, ctx);
            return;
        } catch (e) {
            console.error('[randomMenu] render failed for', pick, e.message);
        }
    }

    return sendStock(sock, msg, ctx);
}

module.exports = { renderRandomMenu };
