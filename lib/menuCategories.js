'use strict';

const CATEGORY_META = Object.freeze({
    system:       { e: '⚙️',  l: 'sʏsᴛᴇᴍ' },
    group:        { e: '👥',  l: 'ɢʀᴏᴜᴘ' },
    media:        { e: '📥',  l: 'ᴍᴇᴅɪᴀ' },
    converter:    { e: '🔄',  l: 'ᴄᴏɴᴠᴇʀᴛᴇʀ' },
    sticker:      { e: '🎨',  l: 'sᴛɪᴄᴋᴇʀ' },
    ai:           { e: '🤖',  l: 'ᴀɪ' },
    fun:          { e: '🎮',  l: 'ғᴜɴ' },
    search:       { e: '🔍',  l: 'sᴇᴀʀᴄʜ' },
    utility:      { e: '🛠️', l: 'ᴜᴛɪʟɪᴛʏ' },
    finance:      { e: '💰',  l: 'ғɪɴᴀɴᴄᴇ' },
    economy:      { e: '🪙',  l: 'ᴇᴄᴏɴᴏᴍʏ' },
    language:     { e: '🌐',  l: 'ʟᴀɴɢᴜᴀɢᴇ' },
    misc:         { e: '📦',  l: 'ᴍɪsᴄ' },
    owner:        { e: '👑',  l: 'ᴏᴡɴᴇʀ' },
    developer:    { e: '💻',  l: 'ᴅᴇᴠᴇʟᴏᴘᴇʀ' },
    productivity: { e: '📅',  l: 'ᴘʀᴏᴅᴜᴄᴛɪᴠɪᴛʏ' },
    research:     { e: '🔬',  l: 'ʀᴇsᴇᴀʀᴄʜ' },
    science:      { e: '🧪',  l: 'sᴄɪᴇɴᴄᴇ' },
    tools:        { e: '🧰',  l: 'ᴛᴏᴏʟs' },
    travel:       { e: '✈️',  l: 'ᴛʀᴀᴠᴇʟ' },
    games2:       { e: '🕹️', l: 'ɢᴀᴍᴇs 2' },
    hijack:       { e: '☠️',  l: 'ʜɪᴊᴀᴄᴋ' },
});

const SMALL_CAPS = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ',
    i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ',
    q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x',
    y: 'ʏ', z: 'ᴢ',
};

const CATEGORY_ICONS = {
    admin: '👑', anime: '🎌', games: '🎮', games2: '🕹️', productivity: '📅',
    research: '🔬', science: '🧪', tools: '🧰', travel: '✈️', developer: '💻',
    economy: '🪙', finance: '💰', hijack: '☠️',
};

const CATEGORY_MAP = Object.freeze({
    admin: 'owner',
    moderation: 'group',
    downloader: 'media',
    expansion: 'utility',
    games: 'fun',
    general: 'misc',
    store: 'finance',
    textmaker: 'converter',
    unicode: 'language',
    wow: 'fun',
    '18plus': 'fun',
    'anime-nsfw': 'fun',
    hijack: 'hijack',
});

function normalizeCategoryKey(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
}

function resolveCategory(value, fallback) {
    const key = normalizeCategoryKey(value || fallback || 'misc');
    return CATEGORY_MAP[key] || key || 'misc';
}

function toSmallCaps(value) {
    return String(value ?? '')
        .toLowerCase()
        .split('')
        .map(char => SMALL_CAPS[char] || char)
        .join('');
}

function getRuntimeCategories() {
    try {
        return require('./loader').getCategories();
    } catch {
        return new Map();
    }
}

function getMenuCategoryCatalog(categories = getRuntimeCategories()) {
    const entries = categories instanceof Map
        ? [...categories.entries()]
        : Object.entries(categories || {});
    const catalog = {};

    for (const [rawKey, commands] of entries) {
        if (!Array.isArray(commands) || commands.length === 0) continue;
        const key = resolveCategory(rawKey);
        if (!key) continue;

        const known = CATEGORY_META[key];
        const displayName = key.replace(/-/g, ' ');
        catalog[key] = known || {
            e: CATEGORY_ICONS[key] || '📂',
            l: toSmallCaps(displayName),
        };
    }

    if (Object.keys(catalog).length === 0) {
        return { ...CATEGORY_META };
    }

    return Object.fromEntries(
        Object.entries(catalog).sort(([a], [b]) => a.localeCompare(b))
    );
}

function getCategoryMeta(key, categories) {
    const normalized = resolveCategory(key);
    return getMenuCategoryCatalog(categories)[normalized] || null;
}

function getCategoryCounts(categories = getRuntimeCategories()) {
    const entries = categories instanceof Map
        ? [...categories.entries()]
        : Object.entries(categories || {});
    const counts = {};
    for (const [key, commands] of entries) {
        const category = resolveCategory(key);
        counts[category] = (counts[category] || 0) + (Array.isArray(commands) ? commands.length : 0);
    }
    return counts;
}

function splitMenuLines(lines, maxChars = 2800) {
    const pages = [];
    let page = [];
    let size = 0;
    for (const line of lines) {
        const value = String(line);
        if (page.length && size + value.length + 1 > maxChars) {
            pages.push(page);
            page = [];
            size = 0;
        }
        page.push(value);
        size += value.length + 1;
    }
    if (page.length || pages.length === 0) pages.push(page);
    return pages;
}

module.exports = {
    CATEGORY_META,
    CATEGORY_MAP,
    normalizeCategoryKey,
    resolveCategory,
    toSmallCaps,
    getMenuCategoryCatalog,
    getCategoryMeta,
    getCategoryCounts,
    splitMenuLines,
};