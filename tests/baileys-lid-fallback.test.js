'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const patcherPromise = import('../scripts/patch-baileys-lid.js');

const decoderFixture = [
    '"use strict";',
    'async function decode(repository, user, sender, author, stanza, e2eType, content, WABinary_1) {',
    '    let msgBuffer;',
    '    switch (e2eType) {',
    "        case 'skmsg':",
    '            msgBuffer = await repository.decryptGroupMessage({',
    '                group: sender,',
    '                authorJid: author,',
    '                msg: content',
    '            })',
    '            break',
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

test('patches direct and group decrypt paths once and outputs valid decoder JavaScript', async () => {
    const { patchSource } = await patcherPromise;
    const patched = patchSource(decoderFixture);
    assert.equal(patchSource(patched), patched);
    assert.match(patched, /__madaraDecryptWithIdentityFallback/);
    assert.match(patched, /__madaraDecryptGroupMessageWithIdentityFallback/);
    assert.doesNotThrow(() => new Function(patched));
});

test('keeps DM identity fallback working', async () => {
    const { decryptWithIdentityFallback } = await patcherPromise;
    const calls = [];
    const repository = { decryptMessage: async ({ jid }) => { calls.push(jid); if (calls.length === 1) throw new Error('Bad MAC'); return 'cleartext'; } };
    const result = await decryptWithIdentityFallback(repository, '123@lid', { attrs: { sender_pn: '123@s.whatsapp.net' } }, 'msg', Buffer.from('ciphertext'), jid => jid.endsWith('@lid'));
    assert.equal(result, 'cleartext');
    assert.deepEqual(calls, ['123@lid', '123@s.whatsapp.net']);
});

test('retries a group sender-key decrypt with the participant alternate identity', async () => {
    const { decryptGroupMessageWithIdentityFallback } = await patcherPromise;
    const calls = [];
    const repository = { decryptGroupMessage: async request => { calls.push(request); if (calls.length === 1) throw new Error('Bad MAC'); return Buffer.from('cleartext'); } };
    const result = await decryptGroupMessageWithIdentityFallback(repository, '120363000@g.us', '123@s.whatsapp.net', { attrs: { participant_lid: '777@lid' } }, Buffer.from('ciphertext'), jid => jid.endsWith('@lid'));
    assert.equal(result.toString(), 'cleartext');
    assert.equal(calls[0].group, '120363000@g.us');
    assert.deepEqual(calls.map(call => call.authorJid), ['123@s.whatsapp.net', '777@lid']);
});

test('uses the raw LID participant when the stanza marks LID addressing', async () => {
    const { decryptGroupMessageWithIdentityFallback } = await patcherPromise;
    const seen = [];
    const repository = { decryptGroupMessage: async request => { seen.push(request.authorJid); if (seen.length === 1) throw new Error('Bad MAC'); return 'ok'; } };
    const result = await decryptGroupMessageWithIdentityFallback(repository, '120363000@g.us', '123@s.whatsapp.net', { attrs: { addressing_mode: 'lid', participant: '777@lid' } }, Buffer.from('ciphertext'), jid => jid.endsWith('@lid'));
    assert.equal(result, 'ok');
    assert.deepEqual(seen, ['123@s.whatsapp.net', '777@lid']);
});

test('does not retry a group decrypt without an alternate participant identity', async () => {
    const { decryptGroupMessageWithIdentityFallback } = await patcherPromise;
    const originalError = new Error('Bad MAC');
    let calls = 0;
    const repository = { decryptGroupMessage: async () => { calls++; throw originalError; } };
    await assert.rejects(() => decryptGroupMessageWithIdentityFallback(repository, '120363000@g.us', '123@s.whatsapp.net', { attrs: {} }, Buffer.from('ciphertext'), jid => jid.endsWith('@lid')), error => error === originalError);
    assert.equal(calls, 1);
});

test('preserves the first group decrypt error when the alternate also fails', async () => {
    const { decryptGroupMessageWithIdentityFallback } = await patcherPromise;
    const originalError = new Error('Bad MAC');
    let calls = 0;
    const repository = { decryptGroupMessage: async () => { calls++; throw calls === 1 ? originalError : new Error('No sender key'); } };
    await assert.rejects(() => decryptGroupMessageWithIdentityFallback(repository, '120363000@g.us', '123@s.whatsapp.net', { attrs: { participant_lid: '777@lid' } }, Buffer.from('ciphertext'), jid => jid.endsWith('@lid')), error => error === originalError);
    assert.equal(calls, 2);
});

test('adds the group fallback to a decoder already patched for direct messages', async () => {
    const { patchSource } = await patcherPromise;
    const directOriginal = [
        "        case 'pkmsg':",
        "        case 'msg':",
        '            msgBuffer = await repository.decryptMessage({',
        '                jid: user,',
        '                type: e2eType,',
        '                ciphertext: content',
        '            })',
        '            break',
    ].join('\n');
    const directPatched = [
        "        case 'pkmsg':",
        "        case 'msg':",
        '            msgBuffer = await __madaraDecryptWithIdentityFallback(repository, user, stanza, e2eType, content, WABinary_1.isLidUser);',
        '            break;',
    ].join('\n');
    const partial = decoderFixture.replace(directOriginal, directPatched).replace('"use strict";', '"use strict";' + String.fromCharCode(10) + 'const __madaraDecryptWithIdentityFallback = async function prior() {};');
    assert.ok(partial.includes('msgBuffer = await __madaraDecryptWithIdentityFallback'));
    assert.ok(!partial.includes('msgBuffer = await repository.decryptMessage'));
    const finished = patchSource(partial);
    assert.match(finished, /__madaraDecryptGroupMessageWithIdentityFallback/);
    assert.equal(patchSource(finished), finished);
    assert.doesNotThrow(() => new Function(finished));
});

test('fails closed if a pinned Baileys decrypt block no longer matches', async () => {
    const { patchSource } = await patcherPromise;
    assert.throws(() => patchSource('"use strict";\nmodule.exports = {};'), /did not match/);
});

test('uses the phone-number alternate when the primary group author is a LID', async () => {
    const { decryptGroupMessageWithIdentityFallback } = await patcherPromise;
    const seen = [];
    const repository = { decryptGroupMessage: async request => { seen.push(request.authorJid); if (seen.length === 1) throw new Error('Bad MAC'); return 'ok'; } };
    const result = await decryptGroupMessageWithIdentityFallback(repository, '120363000@g.us', '777@lid', { attrs: { participant_pn: '123@s.whatsapp.net' } }, Buffer.from('ciphertext'), jid => jid.endsWith('@lid'));
    assert.equal(result, 'ok');
    assert.deepEqual(seen, ['777@lid', '123@s.whatsapp.net']);
});
