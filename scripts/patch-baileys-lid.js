'use strict';

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import url from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const MARKER = 'const __madaraDecryptWithIdentityFallback =';

export async function decryptWithIdentityFallback(repository, user, stanza, e2eType, content, isLidUser) {
    try {
        return await repository.decryptMessage({ jid: user, type: e2eType, ciphertext: content });
    } catch (originalError) {
        const attrs = stanza && stanza.attrs ? stanza.attrs : {};
        const alternateIdentity = isLidUser(user)
            ? attrs.participant_pn || attrs.sender_pn || attrs.peer_recipient_pn
            : attrs.participant_lid || attrs.sender_lid || attrs.peer_recipient_lid;
        if (!alternateIdentity || alternateIdentity === user) throw originalError;
        try {
            return await repository.decryptMessage({ jid: alternateIdentity, type: e2eType, ciphertext: content });
        } catch {
            throw originalError;
        }
    }
}

const HELPER_SOURCE = MARKER + ' ' + decryptWithIdentityFallback.toString() + ';';
const DECRYPT_BLOCK = /case 'pkmsg':\s*case 'msg':\s*msgBuffer = await repository\.decryptMessage\(\{\s*jid: user,\s*type: e2eType,\s*ciphertext: content\s*\}\)\s*break;?/;
const REPLACEMENT = [
    "case 'pkmsg':",
    "case 'msg':",
    '            msgBuffer = await __madaraDecryptWithIdentityFallback(repository, user, stanza, e2eType, content, WABinary_1.isLidUser);',
    '            break;',
].join('\n');

export function patchSource(source) {
    if (source.includes(MARKER)) return source;
    if (!/^['\"]use strict['\"];?$/m.test(source)) throw new Error('Baileys decoder has an unsupported header.');
    const matches = source.match(new RegExp(DECRYPT_BLOCK.source, 'g')) || [];
    if (matches.length !== 1) throw new Error('Baileys decoder decrypt block did not match pinned version 1.0.8 exactly once.');
    let patched = source.replace(/^(['\"]use strict['\"];?)$/m, match => match + '\n\n' + HELPER_SOURCE);
    patched = patched.replace(DECRYPT_BLOCK, REPLACEMENT);
    return patched;
}

export function patchInstalledBaileys() {
    const packageMain = require.resolve('@dark-yasiya/baileys');
    const decoderPath = path.join(path.dirname(packageMain), 'Utils', 'decode-wa-message.js');
    const original = fs.readFileSync(decoderPath, 'utf8');
    const patched = patchSource(original);
    if (patched === original) return;
    const tempPath = decoderPath + '.madara-' + process.pid + '.tmp';
    try {
        fs.writeFileSync(tempPath, patched, { mode: 0o644 });
        fs.renameSync(tempPath, decoderPath);
    } catch (error) {
        try { fs.rmSync(tempPath, { force: true }); } catch {}
        throw error;
    }
    console.log('[baileys-patch] Applied LID/phone-number decrypt fallback.');
}

const isMain = process.argv[1] && url.fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
    try { patchInstalledBaileys(); }
    catch (error) { console.error('[baileys-patch] Could not patch decoder:', error.message); process.exitCode = 1; }
}
