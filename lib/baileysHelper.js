// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Baileys Interactive Message Helper  ║
// ║                                                      ║
// ║   WHY: WhiskeySockets Baileys dropped native support ║
// ║   for interactive buttons. WhatsApp now requires the ║
// ║   'biz' binary node wrapper for them to render.     ║
// ║   Without it, messages are delivered but buttons     ║
// ║   never appear — silently dropped by WA servers.    ║
// ║                                                      ║
// ║   Works in: private DM + group chat                 ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const { generateWAMessageFromContent, proto } = require('@itsliaaa/baileys');

/**
 * Send an interactive single_select list message (button that opens a
 * category picker) with the required biz binary node wrapper.
 *
 * @param {object} sock         - Baileys socket
 * @param {string} jid          - Target JID (chat or group)
 * @param {object} opts
 * @param {string}   opts.body      - Main message text
 * @param {string}   opts.footer    - Footer text
 * @param {string}   opts.btnTitle  - Button label e.g. '📋 ᴏᴘᴇɴ ᴍᴇɴᴜ'
 * @param {Array}    opts.sections  - sections[] for single_select
 * @param {object}   opts.header    - optional header image/text opts
 * @param {object}  [quoted]        - message to quote
 */
async function sendInteractiveList(sock, jid, opts = {}, quoted = null) {
    const {
        body     = '',
        footer   = '',
        btnTitle = '📋 ᴏᴘᴇɴ ᴍᴇɴᴜ',
        sections = [],
        header   = {},
    } = opts;

    const buttonParamsJson = JSON.stringify({ title: btnTitle, sections });

    // ── Build the message using Baileys proto ──────────────────────────────
    const headerProto = proto.Message.InteractiveMessage.Header.create({
        hasMediaAttachment: false,
        ...header,
    });

    const interactiveMsg = proto.Message.InteractiveMessage.create({
        body:   proto.Message.InteractiveMessage.Body.create({ text: body }),
        footer: proto.Message.InteractiveMessage.Footer.create({ text: footer }),
        header: headerProto,
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            buttons: [{ name: 'single_select', buttonParamsJson }],
        }),
    });

    const msg = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata:        {},
                    deviceListMetadataVersion: 2,
                },
                interactiveMessage: interactiveMsg,
            },
        },
    }, {
        userJid: sock.user?.id,
        quoted,
    });

    // ── relayMessage + biz node — the key ingredient ──────────────────────
    // Without additionalNodes: [{tag:'biz', attrs:{bot:'1'}}], WhatsApp
    // silently drops the interactive content and shows nothing.
    await sock.relayMessage(jid, msg.message, {
        messageId:      msg.key.id,
        additionalNodes: [{
            tag:   'biz',
            attrs: { bot: '1' },
        }],
    });

    return msg;
}

/**
 * Send quick-reply buttons (up to 3) with the biz wrapper.
 *
 * @param {object} sock
 * @param {string} jid
 * @param {object} opts
 * @param {string}   opts.body
 * @param {string}   opts.footer
 * @param {Array}    opts.buttons  - [{ id, text }]
 * @param {object}  [quoted]
 */
async function sendInteractiveButtons(sock, jid, opts = {}, quoted = null) {
    const { body = '', footer = '', buttons = [] } = opts;

    const nativeButtons = buttons.map(b => ({
        name:            'quick_reply',
        buttonParamsJson: JSON.stringify({ display_text: b.text, id: b.id }),
    }));

    const msg = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata:        {},
                    deviceListMetadataVersion: 2,
                },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body:   proto.Message.InteractiveMessage.Body.create({ text: body }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: footer }),
                    header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: nativeButtons,
                    }),
                }),
            },
        },
    }, {
        userJid: sock.user?.id,
        quoted,
    });

    await sock.relayMessage(jid, msg.message, {
        messageId:       msg.key.id,
        additionalNodes: [{ tag: 'biz', attrs: { bot: '1' } }],
    });

    return msg;
}

module.exports = { sendInteractiveList, sendInteractiveButtons };
