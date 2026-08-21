// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Menu Banner Slideshow              ║
// ║   Every .menu call picks a random banner image.     ║
// ║   Global per-user tracking ensures the SAME user     ║
// ║   never gets the same banner twice in a row —        ║
// ║   regardless of which chat/group they call it from.  ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const fs   = require('fs');
const path = require('path');

const BANNER_DIR = path.join(process.cwd(), 'assets', 'menu_banners');
const VALID_EXT  = ['.jpg', '.jpeg', '.png', '.webp'];

// ── Cache the banner list so we don't hit the filesystem every call ───────
let _bannerCache = null;
let _cacheTime   = 0;
const CACHE_TTL  = 60_000; // re-scan folder at most once a minute

function listBanners() {
    const now = Date.now();
    if (_bannerCache && (now - _cacheTime) < CACHE_TTL) return _bannerCache;

    try {
        const files = fs.readdirSync(BANNER_DIR)
            .filter(f => VALID_EXT.includes(path.extname(f).toLowerCase()))
            .map(f => path.join(BANNER_DIR, f));
        _bannerCache = files;
        _cacheTime   = now;
        return files;
    } catch {
        _bannerCache = [];
        _cacheTime   = now;
        return [];
    }
}

// ── Global, in-memory, per-user "last banner shown" tracker ───────────────
// Keyed by sender JID, NOT by chat — so it's truly global across every
// group/DM the bot is in, exactly as requested.
const _lastShown = new Map();

/**
 * Returns a random banner path for this user, guaranteed to differ from
 * whatever banner they were shown last time (if more than one exists).
 */
function getRandomBanner(userId) {
    const banners = listBanners();
    if (!banners.length) return null;
    if (banners.length === 1) return banners[0]; // nothing else to pick from

    const last = _lastShown.get(userId);
    let pick;
    do {
        pick = banners[Math.floor(Math.random() * banners.length)];
    } while (pick === last);

    _lastShown.set(userId, pick);
    return pick;
}

module.exports = { getRandomBanner, listBanners, BANNER_DIR };
