'use strict';

const settings = require('../../settings');

// Ported from the linked menu design library. The excluded source-only
// interactive and signature variants are intentionally not included here.
const DESIGNS = [
    'nor', 'neon', 'classy', 'cyber', 'royal', 'ghost', 'matrix', 'samurai',
    'aurora', 'arcade', 'crimson', 'oracle', 'glitch', 'runic', 'obsidian',
    'vapor', 'mirage', 'eclipse', 'phantom', 'monolith', 'relay', 'crysnovax',
    'freeway', 'void', 'titanium', 'inferno', 'codex', 'dark', 'onyx', 'kord',
];

const STYLES = {
    nor:       { title: 'MADARA · PEAK RAIL', top: '◤━━━━━━━━━━━━━━━━━━◥', bottom: '◣━━━━━━━━━━━━━━━━━━◢', item: '▸', section: '┏━', end: '┗━━━━━━━━━━━━━━━━┛' },
    neon:      { title: 'MADARA · NEON', top: '▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰', bottom: '▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱', item: '◇', section: '❰ ✦', end: '❱' },
    classy:    { title: 'M A D A R A   X - M D', top: '┏━━━━━━━━━━━━━━━━━━━━┓', bottom: '┗━━━━━━━━━━━━━━━━━━━━┛', item: '·', section: '❖', end: '━━━━━━━━━━━━━━━━━━━━' },
    cyber:     { title: 'MADARA//CYBER', top: '╔═[', bottom: '╚══════════════════════╝', item: '»', section: '>', end: '╚══════════════════════╝' },
    royal:     { title: 'MADARA · ROYAL COURT', top: '『 ✦', bottom: '『━━━━━━━━━━━━━━━━━━━━』', item: '✦', section: '『 ❦', end: '』' },
    ghost:     { title: 'MADARA · GHOST', top: '╭──────────────╮', bottom: '╰──────────────╯', item: '░', section: '☽', end: '☾' },
    matrix:    { title: 'MADARA :: MATRIX', top: '╔══════════════════════╗', bottom: '╚══════════════════════╝', item: '>', section: '[', end: ']' },
    samurai:   { title: 'MADARA · 侍 SAMURAI', top: '「━━━━━━━━━━━━━━━━━━━━」', bottom: '「━━━━━━━━━━━━━━━━━━━━」', item: '刀', section: '「', end: '」' },
    aurora:    { title: 'MADARA · AURORA', top: '✧･ﾟ: *✧･ﾟ:*', bottom: '*:･ﾟ✧*:･ﾟ✧', item: '✦', section: '╰─', end: '─╯' },
    arcade:    { title: 'MADARA · ARCADE', top: '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓', bottom: '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓', item: '▣', section: '░▒▓', end: '▓▒░' },
    crimson:   { title: 'MADARA · CRIMSON', top: '♦━━━━━━━━━━━━━━━━♦', bottom: '♦━━━━━━━━━━━━━━━━♦', item: '◆', section: '╞', end: '╡' },
    oracle:    { title: 'MADARA · ORACLE', top: '╭─〔 ◉ 〕─╮', bottom: '╰─〔 ◉ 〕─╯', item: '◉', section: '◈', end: '◈' },
    glitch:    { title: 'MADARA · GLITCH', top: '█▓▒░', bottom: '░▒▓█', item: '⟫', section: '⟦', end: '⟧' },
    runic:     { title: 'MADARA · RUNIC', top: '᚛━━━━━━━━━━━━᚜', bottom: '᚛━━━━━━━━━━━━᚜', item: '᛫', section: '᚛', end: '᚜' },
    obsidian:  { title: 'MADARA · OBSIDIAN', top: '■━━━━━━━━━━━━■', bottom: '■━━━━━━━━━━━━■', item: '▪', section: '▰', end: '▰' },
    vapor:     { title: 'MADARA · VAPOR', top: '╭━━━╾╼━━━╮', bottom: '╰━━━╾╼━━━╯', item: '⌁', section: '╾', end: '╼' },
    mirage:    { title: 'MADARA · MIRAGE', top: '〰〰〰〰〰〰〰〰〰', bottom: '〰〰〰〰〰〰〰〰〰', item: '≈', section: '〰', end: '〰' },
    eclipse:   { title: 'MADARA · ECLIPSE', top: '☾━━━━━━━━━━━━☽', bottom: '☽━━━━━━━━━━━━☾', item: '◐', section: '◑', end: '◒' },
    phantom:   { title: 'MADARA · PHANTOM', top: '╔═❀', bottom: '╚═❀', item: '❀', section: '╔', end: '╝' },
    monolith:  { title: 'MADARA · MONOLITH', top: '█', bottom: '█', item: '█', section: '█', end: '█' },
    relay:     { title: 'MADARA · QUICK RELAY', top: '◤━━━━━━━━━━━━━━━━━━━━◥', bottom: '◣━━━━━━━━━━━━━━━━━━━━◢', item: '▸', section: '✦', end: '━━━━━━━━━━━━━━━━━━━━' },
    crysnovax: { title: 'MADARA · CRYSNOVAX', top: '⌘══〔', bottom: '⌘══〔', item: '✧', section: '⌘', end: '〕══⌘' },
    freeway:   { title: 'MADARA · FREEWAY', top: '╔════════════════════╗', bottom: '╚════════════════════╝', item: '🛣', section: '║', end: '║' },
    void:      { title: 'MADARA · VOID', top: '╳━━━━━━━━━━━━━━━━╳', bottom: '╳━━━━━━━━━━━━━━━━╳', item: '∅', section: '╳', end: '╳' },
    titanium:  { title: 'MADARA · TITANIUM', top: '⬡━━━━━━━━━━━━⬡', bottom: '⬡━━━━━━━━━━━━⬡', item: '⬢', section: '⬡', end: '⬡' },
    inferno:   { title: 'MADARA · INFERNO', top: '🔥━━━━━━━━━━━━🔥', bottom: '🔥━━━━━━━━━━━━🔥', item: '🔥', section: '╞', end: '╡' },
    codex:     { title: 'MADARA · CODEX', top: '┌─[ CODEX ]─┐', bottom: '└───────────┘', item: '>', section: '>>', end: '<<' },
    dark:      { title: 'MADARA · DARK', top: '> ┏❐  ⌜', bottom: '> ┗❐ ┈┈┈┈┈┈┈┈┈┈✧', item: '❐', section: '> ━━', end: '━━' },
    onyx:      { title: 'MADARA · ONYX', top: '> ┏❐  ⌜', bottom: '> ┗❐ ┈┈┈┈┈┈┈┈┈┈✧', item: '❐', section: '> ━━', end: '━━' },
    kord:      { title: 'MADARA · KORD', top: '┌────═━┈', bottom: '└───────═━┈┈━═──────┘', item: '│', section: '┏', end: '┕' },
};

function clean(value) {
    return String(value || '').replace(/\r?\n/g, ' ').trim();
}

function getData(ctx, categoryMap) {
    const categories = categoryMap || require('../../lib/loader').getCategories();
    const prefix = ctx.settings?.prefix || settings.prefix || '.';
    const entries = [...categories.entries()]
        .filter(([, commands]) => commands?.length)
        .sort(([a], [b]) => a.localeCompare(b));
    const total = entries.reduce((sum, [, commands]) => sum + commands.length, 0);
    return {
        user: clean(ctx.pushName || ctx.sender?.split('@')[0] || 'User'),
        owner: clean(ctx.settings?.ownerName || settings.ownerName || 'Madara'),
        mode: ctx.isGroup ? 'Group' : 'Private',
        prefix,
        version: clean(ctx.settings?.version || settings.version || 'legacy'),
        total,
        entries,
    };
}

function buildCaption(key, ctx) {
    const style = STYLES[key] || STYLES.nor;
    const d = getData(ctx);
    const lines = [
        style.top,
        `        ✦ ${style.title} ✦`,
        style.bottom,
        `${style.item} User    : ${d.user}`,
        `${style.item} Owner   : ${d.owner}`,
        `${style.item} Mode    : ${d.mode}`,
        `${style.item} Plugins : ${d.total}`,
        `${style.item} Prefix  : ${d.prefix}`,
        `${style.item} Version : ${d.version}`,
        '',
    ];

    for (const [category, commands] of d.entries) {
        const label = String(category || 'misc').toUpperCase();
        lines.push(`${style.section} ${label} · ${commands.length} ${style.end}`);
        for (const command of commands) {
            lines.push(`${style.item} ${d.prefix}${command.name}`);
        }
        lines.push('');
    }

    lines.push(style.bottom, `✦ ${d.total} MADARA commands online ✦`);
    return lines.join('\n');
}

function buildCaptionPages(key, ctx, limit = 3000, categoryMap) {
    const style = STYLES[key] || STYLES.nor;
    const d = getData(ctx, categoryMap);
    const header = [
        style.top,
        `        ✦ ${style.title} ✦`,
        style.bottom,
        `${style.item} User    : ${d.user}`,
        `${style.item} Owner   : ${d.owner}`,
        `${style.item} Mode    : ${d.mode}`,
        `${style.item} Plugins : ${d.total}`,
        `${style.item} Prefix  : ${d.prefix}`,
        `${style.item} Version : ${d.version}`,
        '',
    ];
    const footer = [style.bottom, `✦ ${d.total} MADARA commands online ✦`];
    const body = [];

    for (const [category, commands] of d.entries) {
        const label = String(category || 'misc').toUpperCase();
        body.push(`${style.section} ${label} · ${commands.length} ${style.end}`);
        for (const command of commands) body.push(`${style.item} ${d.prefix}${command.name}`);
        body.push('');
    }

    const target = Math.max(1000, limit - 500);
    const chunks = [];
    let current = [];
    let size = 0;
    for (const line of body) {
        const nextSize = size + line.length + 1;
        if (current.length && nextSize > target) {
            chunks.push(current);
            current = [];
            size = 0;
        }
        current.push(line);
        size += line.length + 1;
    }
    if (current.length || chunks.length === 0) chunks.push(current);

    return chunks.map((chunk, index) => {
        const pageHeader = [...header];
        if (chunks.length > 1) pageHeader[1] += ` · PAGE ${index + 1}/${chunks.length}`;
        const pageLines = [
            ...pageHeader,
            ...chunk,
            ...(index === chunks.length - 1 ? footer : [`_${style.title} · CONTINUED_`]),
        ];
        return pageLines.join('\n');
    });
}

async function renderDesign(key, sock, msg, args, skinId, ctx) {
    const pages = buildCaptionPages(key, ctx);
    const footer = ctx.settings?.FOOTER || settings.FOOTER || '';
    for (let index = 0; index < pages.length; index++) {
        const isLast = index === pages.length - 1;
        const options = index === 0 && msg ? { quoted: msg } : {};
        await sock.sendMessage(ctx.from, {
            text: pages[index] + (isLast ? footer : ''),
            buttons: [{ buttonId: 'madara_back_menu', buttonText: { displayText: '⬅️ BACK TO MENU' }, type: 1 }],
            headerType: 1,
        }, options);
    }
}

module.exports = { DESIGNS, buildCaption, buildCaptionPages, renderDesign };