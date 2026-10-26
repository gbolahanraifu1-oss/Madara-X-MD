'use strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import url from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const MARKER = 'const __madaraDecryptWithIdentityFallback =';
export const GROUP_MARKER = 'const __madaraDecryptGroupMessageWithIdentityFallback =';

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

export async function decryptGroupMessageWithIdentityFallback(repository, group, author, stanza, content, isLidUser) {
    try {
        return await repository.decryptGroupMessage({ group, authorJid: author, msg: content });
    } catch (originalError) {
        const attrs = stanza && stanza.attrs ? stanza.attrs : {};
        const primaryIsLid = Boolean(author && isLidUser(author));
        const alternateAuthor = primaryIsLid
            ? attrs.participant_pn || attrs.sender_pn || attrs.peer_recipient_pn || (attrs.addressing_mode === 'pn' ? attrs.participant : null)
            : attrs.participant_lid || attrs.sender_lid || attrs.peer_recipient_lid || (attrs.addressing_mode === 'lid' && attrs.participant && isLidUser(attrs.participant) ? attrs.participant : null) || (attrs.from && isLidUser(attrs.from) ? attrs.from : null);
        if (!alternateAuthor || alternateAuthor === author) throw originalError;
        try {
            return await repository.decryptGroupMessage({ group, authorJid: alternateAuthor, msg: content });
        } catch {
            throw originalError;
        }
    }
}

const HELPER_SOURCE = MARKER + ' ' + decryptWithIdentityFallback.toString() + ';';
const GROUP_HELPER_SOURCE = GROUP_MARKER + ' ' + decryptGroupMessageWithIdentityFallback.toString() + ';';
const DECRYPT_BLOCK = /case 'pkmsg':\s*case 'msg':\s*msgBuffer = await repository\.decryptMessage\(\{\s*jid: user,\s*type: e2eType,\s*ciphertext: content\s*\}\)\s*break;?/;
const GROUP_DECRYPT_BLOCK = /case 'skmsg':\s*msgBuffer = await repository\.decryptGroupMessage\(\{\s*group: sender,\s*authorJid: author,\s*msg: content\s*\}\)\s*break;?/;
const REPLACEMENT = [
    "case 'pkmsg':",
    "case 'msg':",
    '            msgBuffer = await __madaraDecryptWithIdentityFallback(repository, user, stanza, e2eType, content, WABinary_1.isLidUser);',
    '            break;',
].join('\n');
const GROUP_REPLACEMENT = [
    "case 'skmsg':",
    '            msgBuffer = await __madaraDecryptGroupMessageWithIdentityFallback(repository, sender, author, stanza, content, WABinary_1.isLidUser);',
    '            break;',
].join('\n');
const STRICT_HEADERS = new Set(["'use strict';", "'use strict'", '"use strict";', '"use strict"']);

export function patchSource(source) {
    const needsDirect = !source.includes(MARKER);
    const needsGroup = !source.includes(GROUP_MARKER);
    if (!needsDirect && !needsGroup) return source;
    const firstLine = source.split(/\r?\n/, 1)[0].trim();
    if (!STRICT_HEADERS.has(firstLine)) throw new Error('Baileys decoder has an unsupported header.');
    if (needsDirect && (source.match(new RegExp(DECRYPT_BLOCK.source, 'g')) || []).length !== 1) throw new Error('Baileys decoder direct decrypt block did not match pinned version 1.0.8 exactly once.');
    if (needsGroup && (source.match(new RegExp(GROUP_DECRYPT_BLOCK.source, 'g')) || []).length !== 1) throw new Error('Baileys decoder group decrypt block did not match pinned version 1.0.8 exactly once.');
    const helpers = [];
    if (needsDirect) helpers.push(HELPER_SOURCE);
    if (needsGroup) helpers.push(GROUP_HELPER_SOURCE);
    const firstLineEnd = source.indexOf('\n');
    if (firstLineEnd < 0) throw new Error('Baileys decoder has no line break after its strict header.');
    let patched = source.slice(0, firstLineEnd + 1) + '\n' + helpers.join('\n\n') + '\n' + source.slice(firstLineEnd + 1);
    if (needsDirect) patched = patched.replace(DECRYPT_BLOCK, REPLACEMENT);
    if (needsGroup) patched = patched.replace(GROUP_DECRYPT_BLOCK, GROUP_REPLACEMENT);
    return patched;
}

export function patchInstalledBaileys() {
    const packageMain = require.resolve('@itsliaaa/baileys');
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
    console.log('[baileys-patch] Applied direct and group LID/phone-number decrypt fallbacks.');
}

const isMain = process.argv[1] && url.fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
    try { patchInstalledBaileys(); }
    catch (error) { console.error('[baileys-patch] Could not patch decoder:', error.message); process.exitCode = 1; }
}

