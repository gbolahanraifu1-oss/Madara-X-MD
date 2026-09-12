'use strict';

const crypto = require('crypto');
const { generateWAMessageFromContent } = require('@itsliaaa/baileys');

// Sends a tappable "copy to clipboard" WhatsApp UI element — same schema
// as htmlGoon.js/richMenu.js. Deliberately restricted to short text values
// (pairing codes, etc), sent as a normal message from the bot's own JID.
// NO botForwardedMessage/isForwarded/forwardOrigin — see htmlGoon.js for why.
async function sendCopyButton(sock, jid, text, options = {}) {
    const value = String(text || '').trim();
    if (!value) throw new Error('sendCopyButton: empty text value');

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
                            __typename: 'GenAIAddonActionLayoutViewModel',
                            addon_action_type: 'COPY_TO_CLIPBOARD',
                            addon_action_alignment: 'END',
                            primitives: [{
                                __typename: 'GenAIMarkdownTextUXPrimitive',
                                text: value,
                                inline_entities: [],
                            }],
                        },
                    }],
                })).toString('base64'),
            },
            contextInfo: options.contextInfo || {},
        },
    };

    const msg = generateWAMessageFromContent(jid, content, {});
    return sock.relayMessage(jid, msg.message, {
        messageId: msg.key.id,
        ...(options.relay || {}),
    });
}

module.exports = { sendCopyButton };
