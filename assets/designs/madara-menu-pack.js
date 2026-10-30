'use strict';

const fs = require('fs');
const path = require('path');
const settings = require('../../settings');

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

const MENU_IMG = path.join(process.cwd(), 'assets', 'menuimage.jpg');
const MENU_VID = path.join(process.cwd(), 'assets', 'menuvideo.mp4');

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

function buildCaption(key, ctx, categoryMap) {
    const style = STYLES[key] || STYLES.nor;
    const d = getData(ctx, categoryMap);
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
            lines.push(`${style.item} \( {d.prefix} \){command.name}`);
        }
        lines.push('');
    }

    lines.push(style.bottom, `✦ ${d.total} MADARA commands online ✦`);
    return lines.join('\n');
}

async function renderDesign(key, sock, msg, args, skinId, ctx, categoryMap) {
    const caption = buildCaption(key, ctx, categoryMap);
    const footer = ctx.settings?.FOOTER || settings.FOOTER || '';
    const body = caption + footer;
    const quoted = msg ? { quoted: msg } : {};

    // Custom media from setmenuimage / setmenuvideo takes priority
    if (fs.existsSync(MENU_IMG)) {
        await sock.sendMessage(ctx.from, {
            image: fs.readFileSync(MENU_IMG),
            caption: body,
        }, quoted);
        return;
    }

    if (fs.existsSync(MENU_VID)) {
        await sock.sendMessage(ctx.from, {
            video: fs.readFileSync(MENU_VID),
            mimetype: 'video/mp4',
            caption: body,
        }, quoted);
        return;
    }

    // Text-only fallback
    await sock.sendMessage(ctx.from, {
        text: body,
        buttons: [{ buttonId: 'madara_back_menu', buttonText: { displayText: '⬅️ BACK TO MENU' }, type: 1 }],
        headerType: 1,
    }, quoted);
}

module.exports = { DESIGNS, buildCaption, renderDesign };