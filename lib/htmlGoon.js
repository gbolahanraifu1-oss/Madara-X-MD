'use strict';

const crypto = require('crypto');
const { generateWAMessageFromContent } = require('@itsliaaa/baileys');

async function htmlGoon(sock, jid, html, options = {}) {
    if (!sock || !jid) throw new Error('htmlGoon: sock and jid are required');
    if (typeof html !== 'string' || !html.trim()) {
        throw new Error('htmlGoon: html payload is empty');
    }

    const { forwarded = false, newsletterJid, newsletterName, ...restOptions } = options;

    // Build contextInfo with forward data if requested
    const contextInfo = {
        ...(options.contextInfo || {}),
        ...(forwarded ? {
            isForwarded: true,
            forwardOrigin: 4, // 0-4. 4 = highly forwarded
            forwardedNewsletterMessageInfo: {
                newsletterJid: newsletterJid || "120363xxxxxx@newsletter",
                newsletterName: newsletterName || "MADARA X-MD",
                serverMessageId: 1
            }
        } : {})
    };

    const content = {
        richResponseMessage: {
            messageType: 1,
            unifiedResponse: {
                data: Buffer.from(JSON.stringify({
                    __typename: 'GenAIUnifiedResponse',
                    response_id: crypto.randomUUID(),
                    sections: [{
                        __typename: 'GenAIUnifiedResponseSection',
                        view_model: {
                            __typename: 'GenAISingleLayoutViewModel',
                            primitive: {
                                __typename: 'FOAHtmlPrimitiveDemoDONOTUSE',
                                trusted_sources: [],
                                payload: html.trim(),
                            },
                        },
                    }],
                })).toString('base64'),
            },
            contextInfo, // <-- injected here
        },
    };

    const msg = generateWAMessageFromContent(jid, content, {});
    return sock.relayMessage(jid, msg.message, {
        messageId: msg.key.id,
        ...(restOptions.relay || {}),
    });
}

module.exports = { htmlGoon };