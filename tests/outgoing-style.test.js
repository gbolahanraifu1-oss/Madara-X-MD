'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { formatTextForFont, applyBoxStyle, formatText, formatOutgoingContent, wrapOutgoingSocket } = require('../lib/outgoingStyle');
const database = require('../utils/database');
const boxStyleCommand = require('../commands/system/boxstyle');

test('outgoing text uses the Madara small-caps font and MenuBox by default', () => {
    const formatted = formatText(null, 'Hello Madara');
    assert.ok(formatted.startsWith('╭═══〘'));
    assert.ok(formatted.includes('┃✰│ʜᴇʟʟᴏ ᴍᴀᴅᴀʀᴀ'));
    assert.ok(formatted.endsWith('╰──────────────────'));
});

test('boxstyle command selects persisted MenuBox or StyleBox per session', async () => {
    const phone = '__outgoing_box_style_test__';
    const originalUser = database.data.users[phone];
    const hadOwnSave = Object.prototype.hasOwnProperty.call(database, 'save');
    const originalSave = database.save;
    const replies = [];
    database.save = () => {};
    delete database.data.users[phone];
    const ctx = {
        sessionPhone: phone,
        settings: { prefix: '.', FOOTER: '' },
        reply: async text => replies.push(text),
    };
    try {
        assert.equal(database.getBoxStyle(phone), 'menuBox');
        assert.ok(formatText(phone, 'Hello').startsWith('╭═══〘'));
        await boxStyleCommand.execute(null, null, ['styleBox'], ctx);
        assert.equal(database.getBoxStyle(phone), 'styleBox');
        assert.ok(formatText(phone, 'Hello').startsWith('╭─❒ ◈'));
        await boxStyleCommand.execute(null, null, ['default'], ctx);
        assert.equal(database.getBoxStyle(phone), 'menuBox');
        assert.ok(formatText(phone, 'Hello').startsWith('╭═══〘'));
        await boxStyleCommand.execute(null, null, [], ctx);
        assert.match(replies.at(-1), /Current: \*menuBox\*/);
        await boxStyleCommand.execute(null, null, ['unknown'], ctx);
        assert.equal(database.getBoxStyle(phone), 'menuBox');
        assert.equal(database.setBoxStyle(phone, 'unknown'), false);
    } finally {
        if (hadOwnSave) database.save = originalSave;
        else delete database.save;
        if (originalUser === undefined) delete database.data.users[phone];
        else database.data.users[phone] = originalUser;
    }
});

test('custom fonts preserve URLs and inline code', () => {
    const input = 'Open https://example.com and \x60someCode\x60 then run .ping';
    const formatted = formatTextForFont(input, 2);
    assert.ok(formatted.includes('https://example.com'));
    assert.ok(formatted.includes('\x60someCode\x60'));
    assert.ok(formatted.includes('𝐎𝐩𝐞𝐧'));
});

test('already boxed menu text does not receive a second outer box', () => {
    const formatted = formatText(null, '╭═══ Madara menu ═══\nHello');
    assert.equal((formatted.match(/╭/g) || []).length, 1);
});

test('text and captions sent directly by commands are branded', async () => {
    const sent = [];
    const sock = { sendMessage: async (...args) => { sent.push(args); return { ok: true }; } };
    const image = Buffer.from('x');
    const payload = formatOutgoingContent(null, { text: 'hello', caption: 'image caption', image });
    assert.ok(payload.text.includes('ʜᴇʟʟᴏ'));
    assert.ok(payload.caption.includes('ɪᴍᴀɢᴇ ᴄᴀᴘᴛɪᴏɴ'));
    assert.equal(payload.image, image);
    await wrapOutgoingSocket(sock, null).sendMessage('chat', { text: 'hello' });
    assert.ok(sent[0][1].text.includes('ʜᴇʟʟᴏ'));
});
