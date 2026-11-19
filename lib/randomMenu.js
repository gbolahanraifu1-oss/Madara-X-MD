'use strict';

/**
 * Pick a random menu design and render it.
 * Used by Abyss / Pain "Menu" quick-reply buttons (id: madara_menu_random).
 */
async function renderRandomMenu(sock, msg, ctx) {
    const menuEngine = require('./menuEngine');
    let designs = [];
    try {
        designs = menuEngine.listDesigns() || [];
    } catch (_) {}

    // Prefer pack + other skins; skip self-loop skins (abyss/pain) so random always lands on a full menu
    const pool = designs.filter((id) => {
        const n = String(id || '').toLowerCase();
        return n && n !== 'abyss' && n !== 'pain' && n !== 'default';
    });

    // Fallback: pack list if scanner returned empty
    if (!pool.length) {
        try {
            const pack = require('../assets/designs/madara-menu-pack.js');
            if (Array.isArray(pack.DESIGNS)) pool.push(...pack.DESIGNS);
        } catch (_) {}
    }

    if (!pool.length) {
        // Last resort: default menu.js
        const { execute } = require('../commands/system/menu');
        return execute(sock, msg, [], ctx);
    }

    const pick = pool[Math.floor(Math.random() * pool.length)];
    try {
        await menuEngine.render(sock, msg, [], pick, ctx);
    } catch (e) {
        console.error('[randomMenu] render failed for', pick, e.message);
        const { execute } = require('../commands/system/menu');
        return execute(sock, msg, [], ctx);
    }
}

module.exports = { renderRandomMenu };
