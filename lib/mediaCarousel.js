'use strict';

async function sendImageCarousel({ sock, msg, from, images, title = 'MADARA IMAGE STUDIO', caption = '', footer = 'MADARA X-MD' }) {
    const buffers = (Array.isArray(images)? images : [images]).filter(Boolean);
    if (!buffers.length) throw new Error('No image was generated.');

    const baileys = sock._baileys || require('@itsliaaa/baileys');

    // get prefix if you have it, else.
    const prefix = sock?.prefix || global?.prefix || '.';
    const prompt = (caption || '').trim();
    // WA quick_reply id max ~ 100 chars, trim prompt
    const againId = `${prefix}img ${prompt}`.slice(0, 90) || `${prefix}img`;

    const cards = [];
    for (let i = 0; i < buffers.length; i++) {
        const imageMessage = (
            await baileys.generateWAMessageContent(
                { image: buffers[i] },
                { upload: sock.waUploadToServer }
            )
        ).imageMessage;

        cards.push({
            header: {
                title: `${title} ${i + 1}/${buffers.length}`.slice(0, 60),
                subtitle: '',
                imageMessage,
                hasMediaAttachment: true
            },
            body: {
                text: (caption || `Image ${i + 1}`).slice(0, 300)
            },
            footer: {
                text: footer
            },
            nativeFlowMessage: {
                buttons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🔁 Generate again',
                            id: againId
                        })
                    }
                ],
                messageParamsJson: '{}'
            }
        });
    }

    const msgContent = baileys.generateWAMessageFromContent(
        from,
        {
            interactiveMessage: {
                header: { hasMediaAttachment: false },
                body: { text: '\u200b' },
                footer: { text: footer },
                carouselMessage: { cards },
                contextInfo: {}
            }
        },
        { messageId: msg?.key?.id || msg?.id }
    );

    const additionalNodes = [
        {
            tag: 'biz',
            attrs: {},
            content: [
                {
                    tag: 'interactive',
                    attrs: { type: 'native_flow', v: '1' },
                    content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
                }
            ]
        }
    ];

    await sock.relayMessage(from, msgContent.message, { additionalNodes });
    return msgContent;
}

module.exports = { sendImageCarousel };