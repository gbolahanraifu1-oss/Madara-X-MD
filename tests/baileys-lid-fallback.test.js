'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { patchSource, decryptWithIdentityFallback } = require('../scripts/patch-baileys-lid');

const decoderFixture = [
    '"use strict";',
    'async function decode(repository, user, stanza, e2eType, content, WABinary_1) {',
    '    let msgBuffer;',
    '    switch (e2eType) {',
    "        case 'pkmsg':",
    "        case 'msg':",
    '            msgBuffer = await repository.decryptMessage({',
    '                jid: user,',
    '                type: e2eType,',
    '                ciphertext: content',
    '            })',
    '            break',
    '    }',
    '    return msgBuffer;',
    '}',
].join('\n');

test('patches the pinned decoder once and produces valid JavaScript', () => {
    const patched = patchSource(decoderFixture);
    assert.equal(patchSource(patched), patched);
    assert.match(patched, /participant_pn/);
    assert.match(patched, /participant_lid/);
    assert.doesNotThrow(() => new Function(patched));
});

test('retries one failed LID decrypt using the stanza phone-number identity', async () => {
    const calls = [];
    const repository = { decryptMessage: async ({ jid }) => { calls.push(jid); if (calls.length === 1) throw new Error('Bad MAC'); return Buffer.from('cleartext'); } };
    const result = await decryptWithIdentityFallback(repository, '123@lid', { attrs: { sender_pn: '123@s.whatsapp.net' } }, 'msg', Buffer.from('ciphertext'), jid => jid.endsWith('@lid'));
    assert.equal(result.toString(), 'cleartext');
    assert.deepEqual(calls, ['123@lid', '123@s.whatsapp.net']);
});

test('does not retry without an alternate identity and preserves the original error', async () => {
    const originalError = new Error('Bad MAC');
    let calls = 0;
    const repository = { decryptMessage: async () => { calls++; throw originalError; } };
    await assert.rejects(() => decryptWithIdentityFallback(repository, '123@lid', { attrs: {} }, 'msg', Buffer.from('ciphertext'), jid => jid.endsWith('@lid')), error => error === originalError);
    assert.equal(calls, 1);
});

test('preserves the original decrypt error if the alternate identity also fails', async () => {
    const originalError = new Error('Bad MAC');
    let calls = 0;
    const repository = { decryptMessage: async () => { calls++; throw calls === 1 ? originalError : new Error('No session'); } };
    await assert.rejects(() => decryptWithIdentityFallback(repository, '123@lid', { attrs: { sender_pn: '123@s.whatsapp.net' } }, 'msg', Buffer.from('ciphertext'), jid => jid.endsWith('@lid')), error => error === originalError);
    assert.equal(calls, 2);
});

test('fails closed if the installed decoder no longer matches the pinned source shape', () => {
    assert.throws(() => patchSource('"use strict";\nmodule.exports = {};'), /unsupported|did not match/);
});
