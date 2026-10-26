'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
    normalizeCategoryKey,
    resolveCategory,
    getMenuCategoryCatalog,
    getCategoryCounts,
    splitMenuLines,
} = require('../lib/menuCategories');
const apex = require('../assets/designs/madara-apex');
const menuPack = require('../assets/designs/madara-menu-pack');
const { createTelegramPairingState } = require('../lib/telegramPairing');
const { resolveDesignPreference } = require('../lib/designPreference');
const { listCommandFiles } = require('../lib/commandFiles');

test('menu categories normalize aliases and include every live category', () => {
    assert.equal(normalizeCategoryKey(' Science & Research '), 'science-research');
    assert.equal(resolveCategory('Admin'), 'owner');
    assert.equal(resolveCategory('Games'), 'fun');

    const live = new Map([
        ['owner', [{ name: 'ban' }]],
        ['developer', [{ name: 'debug' }]],
        ['economy', [{ name: 'balance' }, { name: 'daily' }]],
        ['science', [{ name: 'periodic' }]],
    ]);
    const catalog = getMenuCategoryCatalog(live);
    const counts = getCategoryCounts(live);
    assert.deepEqual(Object.keys(catalog), ['developer', 'economy', 'owner', 'science']);
    assert.equal(counts.economy, 2);
    assert.equal(catalog.developer.e, '💻');
});

test('command discovery includes nested category folders', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'madara-commands-'));
    const nested = path.join(directory, 'expansion', 'developer');
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(directory, 'expansion', 'top.js'), 'module.exports = {};');
    fs.writeFileSync(path.join(nested, 'debug.js'), 'module.exports = {};');
    try {
        const files = listCommandFiles(directory);
        assert.equal(files.length, 2);
        assert.ok(files.some(file =>
            file.relativePath === path.join('expansion', 'developer', 'debug.js') &&
            file.fallbackCategory === 'developer'
        ));
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

test('repository command scan discovers each nested expansion category', () => {
    const root = path.join(__dirname, '..', 'commands');
    const files = listCommandFiles(root);
    const folders = new Set(files.map(file => file.fallbackCategory));
    for (const category of ['ai', 'developer', 'finance', 'games2', 'productivity', 'research', 'science', 'travel']) {
        assert.ok(folders.has(category), `nested category ${category} was not discovered`);
    }
    assert.ok(files.some(file => file.relativePath.startsWith(path.join('expansion', 'developer') + path.sep)));
});

test('category command lines paginate without losing entries', () => {
    const lines = Array.from({ length: 100 }, (_, index) => `.command-${index}`);
    const pages = splitMenuLines(lines, 200);
    assert.ok(pages.length > 1);
    assert.ok(pages.every(page => page.join('\n').length <= 200));
    assert.deepEqual(pages.flat(), lines);
});

test('Apex builds menu sections for all categories within WhatsApp row limits', () => {
    const live = new Map();
    for (let index = 0; index < 26; index++) {
        live.set(`category-${index}`, [{ name: `command-${index}`, desc: 'test command' }]);
    }

    const built = apex.buildMadaraDesign(null, null, { categoriesMap: live });
    const rows = built.sections.flatMap(section => section.rows);
    assert.equal(rows.length, 26);
    assert.ok(built.sections.every(section => section.rows.length <= 10));
    assert.equal(new Set(rows.map(row => row.id)).size, 26);
    const tableNames = built.widget.createSurface.components
        .filter(component => component.component === 'Text')
        .map(component => component.text);
    for (let index = 0; index < 26; index++) {
        assert.ok(rows.some(row => row.id === `madara_cat_category-${index}`));
        assert.ok(tableNames.includes(`category-${index}`));
    }
});

test('every menu design sends the full command list in one message', async () => {
    const categories = new Map([
        ['developer', Array.from({ length: 120 }, (_, index) => ({ name: `dev-command-${index}-extended` }))],
        ['science', Array.from({ length: 100 }, (_, index) => ({ name: `science-command-${index}-extended` }))],
    ]);
    const ctx = {
        from: 'test-chat',
        settings: { prefix: '.', ownerName: 'Owner', version: 'test', FOOTER: 'footer-once' },
        pushName: 'Tester',
        sender: '12345@s.whatsapp.net',
        isGroup: false,
    };
    const msg = { key: { id: 'quoted-message' } };
    for (const design of menuPack.DESIGNS) {
        const sent = [];
        const sock = { sendMessage: async (...args) => { sent.push(args); } };
        await menuPack.renderDesign(design, sock, msg, [], design, ctx, categories);
        assert.equal(sent.length, 1, `${design} should send one message`);
        const [chat, payload, options] = sent[0];
        assert.equal(chat, 'test-chat');
        assert.equal(options.quoted, msg);
        assert.ok(payload.text.length > 3000, `${design} should contain the complete long list`);
        for (const name of ['dev-command-0-extended', 'dev-command-119-extended', 'science-command-0-extended', 'science-command-99-extended']) {
            assert.ok(payload.text.includes(`.${name}`), `${design} omitted ${name}`);
        }
        assert.ok(payload.text.endsWith('footer-once'));
        assert.ok(!payload.text.includes('PAGE '));
        assert.ok(!payload.text.includes('CONTINUED'));
    }
});

test('Telegram pairing state defaults on and persists toggles', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'madara-pairing-'));
    const state = createTelegramPairingState(path.join(directory, 'state.json'));
    try {
        assert.equal(state.isEnabled(), true);
        assert.equal(state.setEnabled(false), false);
        assert.equal(state.isEnabled(), false);
        assert.equal(state.toggle(), true);
        assert.equal(state.isEnabled(), true);
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

test('a per-user default menu choice overrides a global skin', () => {
    assert.equal(
        resolveDesignPreference({ default: 'madara-apex', user123: 'default' }, 'user123'),
        'default'
    );
    assert.equal(resolveDesignPreference({ default: 'madara-apex' }, 'other'), 'madara-apex');
});
