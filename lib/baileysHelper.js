'use strict';

const { generateWAMessageFromContent, proto } = require('@itsliaaa/baileys');

async function sendInteractiveList(sock, jid, opts = {}, quoted = null) {
    const {
        body = '',
        footer = '',
        btnTitle = '📋 ᴏᴘᴇɴ ᴍᴇɴᴜ',
        sections = [],
        header = {},
    } = opts;

    const buttonParamsJson = JSON.stringify({ title: btnTitle, sections });
    const headerProto = proto.Message.InteractiveMessage.Header.create({
        hasMediaAttachment: false,
        ...header,
    });
    const interactiveMsg = proto.Message.InteractiveMessage.create({
        body: proto.Message.InteractiveMessage.Body.create({ text: body }),
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
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2,
                },
                interactiveMessage: interactiveMsg,
            },
        },
    }, {
        userJid: sock.user?.id,
        quoted,
    });

    await sock.relayMessage(jid, msg.message, {
        messageId: msg.key.id,
        additionalNodes: [{ tag: 'biz', attrs: { bot: '1' } }],
    });
    return msg;
}

module.exports = { sendInteractiveList };