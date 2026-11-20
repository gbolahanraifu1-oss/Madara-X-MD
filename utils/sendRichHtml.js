'use strict';

const crypto = require('crypto');
const { readFile, stat } = require('fs/promises');
const { sendRichHtml } = require('./genaiRich');

const cache = new Map();

async function loadHtml(file) {
    const m = (await stat(file)).mtimeMs;
    const hit = cache.get(file);
    if (hit && hit.m === m) return hit.t;
    const t = (await readFile(file, 'utf8')).trim();
    cache.set(file, { m, t });
    return t;
}

/**
 * Send a local HTML file as GenAI rich response.
 * @param {{ sock: any, jid: string, file: string, quoted?: any }} opts
 */
async function sendHtml({ sock, jid, file, quoted }) {
    const html = await loadHtml(file);
    return sendRichHtml({
        sock,
        jid,
        quoted,
        html,
        interactive: true,   // keep the full interactive surface
    });
}

module.exports = { sendHtml, loadHtml };