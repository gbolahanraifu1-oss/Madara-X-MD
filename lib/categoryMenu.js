'use strict';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  CATEGORY MENU HELPER
// Shared formatter for single-category submenus (.toolmenu, .dlmenu,
// etc.) — pulls live from the loader registry (same as .allmenu, so it
// never goes stale) but renders in the bot's actual box layout — the
// same ╭═══〘...〙═══⊷❍ / ┃✰│ style used by .menu — instead of the flat
// "📦 TITLE — count" list .allmenu uses. .allmenu stays flat on purpose
// (700+ entries in box form would be unreadable); single-category lists
// are short enough that the proper layout works fine.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CHUNK_LIMIT = 3500;
const LINE_WIDTH  = 38; // chars of command names per wrapped ┃✰│ line

function sc(str) {
    const m = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'};
    return String(str).toLowerCase().split('').map(c => m[c]||c).join('');
}

// Wraps a flat list of `.cmdname` tokens into ┃✰│-prefixed box lines.
function wrapIntoBoxLines(tokens) {
    const lines = [];
    let current = '';
    for (const tok of tokens) {
        const piece = current ? `${current} • ${tok}` : tok;
        if (piece.length > LINE_WIDTH && current) {
            lines.push(`┃✰│ ${current}`);
            current = tok;
        } else {
            current = piece;
        }
    }
    if (current) lines.push(`┃✰│ ${current}`);
    return lines;
}

/**
 * @param {string} realCategory  the actual folder/category key in the loader (e.g. 'utility')
 * @param {string} displayTitle  friendly title shown in the box header (e.g. 'TOOLS / UTILITY')
 * @param {string} prefix        command prefix, e.g. '.'
 * @returns {string[]|null}      one or more message chunks ready to send, or null if empty
 */
function buildCategoryMenu(realCategory, displayTitle, prefix) {
    const { getCategories } = require('./loader');
    const categories = getCategories();
    const plugins = (categories.get(realCategory) || [])
        .filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i)
        .sort((a, b) => a.name.localeCompare(b.name));

    if (!plugins.length) return null;

    const tokens = plugins.map(p => `\`${prefix}${p.name}\``);

    const buildBox = (bodyLines, pageTag = '') => {
        const header = `╭═══〘 ${displayTitle} 〙═══⊷❍\n┃✰│${sc(String(plugins.length))} ᴄᴏᴍᴍᴀɴᴅs${pageTag}\n┃✰│──────────●●►\n`;
        const footer = `\n╰──────────────────`;
        return header + bodyLines.join('\n') + footer;
    };

    // Fit as many wrapped lines as possible per message before chunking.
    const allLines = wrapIntoBoxLines(tokens);
    const messages = [];
    let currentLines = [];
    for (const line of allLines) {
        const trial = buildBox([...currentLines, line]);
        if (trial.length > CHUNK_LIMIT && currentLines.length) {
            messages.push(currentLines);
            currentLines = [line];
        } else {
            currentLines.push(line);
        }
    }
    if (currentLines.length) messages.push(currentLines);

    return messages.map((lines, i) =>
        buildBox(lines, messages.length > 1 ? ` (${i + 1}/${messages.length})` : '')
    );
}

module.exports = { buildCategoryMenu };
