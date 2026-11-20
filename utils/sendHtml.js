'use strict';

const crypto = require('crypto');
const { readFile, stat } = require('fs/promises');
const { generateWAMessageFromContent } = require('@itsliaaa/baileys');

const cache = new Map();

async function loadHtml(file) {
    const m = (await stat(file)).mtimeMs;
    const hit = cache.get(file);
    if (hit && hit.m === m) return hit.t;
    const t = (await readFile(file, 'utf8')).trim();
    cache.set(file, { m, t });
    return t;
}

function buildPayload(html) {
    return Buffer.from(JSON.stringify({
        __typename: 'GenAIUnifiedResponse',
        response_id: crypto.randomUUID(),
        sections: [{
            __typename: 'GenAIUnifiedResponseSection',
            view_model: {
                __typename: 'GenAISingleLayoutViewModel',
                primitive: {
                    __typename: 'FOAHtmlPrimitiveDemoDONOTUSE',
                    trusted_sources: [],
                    payload: html,
                },
            },
        }],
    })).toString('base64');
}

/**
 * Send a local HTML file as GenAI rich response (interactive HTML games).
 * @param {{ sock: any, jid: string, file: string, quoted?: any }} opts
 */
async function sendHtml({ sock, jid, file, quoted }) {
    if (!sock || !jid) throw new Error('sendHtml: sock and jid required');
    const html = await loadHtml(file);
    if (!html) throw new Error('sendHtml: empty html');

    const data = buildPayload(html);

    const content = {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    unifiedResponse: { data },
                    contextInfo: {
                        isForwarded: true,
                        forwardOrigin: 4,
                    },
                },
            },
        },
    };

    const msg = generateWAMessageFromContent(jid, content, {
        userJid: sock.user?.id,
        quoted: quoted?.message ? quoted : undefined,
    });

    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
    return msg;
}

/**
 * Send raw HTML string (no file).
 */
async function sendHtmlString({ sock, jid, html, quoted }) {
    if (!sock || !jid) throw new Error('sendHtmlString: sock and jid required');
    const payload = String(html || '').trim();
    if (!payload) throw new Error('sendHtmlString: empty html');

    const data = buildPayload(payload);

    const content = {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    unifiedResponse: { data },
                    contextInfo: {
                        isForwarded: true,
                        forwardOrigin: 4,
                    },
                },
            },
        },
    };

    const msg = generateWAMessageFromContent(jid, content, {
        userJid: sock.user?.id,
        quoted: quoted?.message ? quoted : undefined,
    });

    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
    return msg;
}

module.exports = { sendHtml, sendHtmlString, loadHtml };
