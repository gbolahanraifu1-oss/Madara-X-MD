'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { formatTextForFont, formatText, formatOutgoingContent, wrapOutgoingSocket } = require('../lib/outgoingStyle');

test('outgoing text uses the Madara small-caps font and branded box by default', () => {
    const formatted = formatText(null, 'Hello Madara');
    assert.ok(formatted.startsWith('╭─❒ ◈'));
    assert.ok(formatted.includes('ʜᴇʟʟᴏ'));
    assert.ok(formatted.endsWith('╰─⛧ 𝙈𝙖𝙙𝙖𝙧𝙖 𝙓-𝙈𝘿'));
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
