'use strict';

/**
 * MADARA image carousel
 * Prefer @itsliaaa/baileys high-level `cards` payload.
 * Falls back to interactiveMessage.carouselMessage + biz native_flow nodes.
 */

function resolveBaileys(sock) {
    return sock?._baileys || require('@itsliaaa/baileys');
}

function resolvePrefix(sock, msg) {
    return msg?.prefix || sock?.prefix || global?.prefix || '.';
}

/** Normalize one image input → Buffer | { url } usable by baileys */
function normalizeImage(img) {
    if (!img) return null;
    if (Buffer.isBuffer(img)) return img;
    if (typeof img === 'string') {
        if (/^https?:\/\//i.test(img)) return { url: img };
        return img; // local path string
    }
    if (typeof img === 'object') {
        if (Buffer.isBuffer(img.data)) return img.data;
        if (Buffer.isBuffer(img.buffer)) return img.buffer;
        if (img.url) return { url: String(img.url) };
        if (img.path) return String(img.path);
    }
    return null;
}

async function buildImageMessage(baileys, sock, image) {
    const media = normalizeImage(image);
    if (!media) throw new Error('Invalid image input');

    const content = await baileys.generateWAMessageContent(
        { image: media },
        { upload: sock.waUploadToServer }
    );
    return content.imageMessage;
}

function cardButtons({ againCmd, viewCmd, index, total }) {
    const buttons = [
        {
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: '🔄 Generate again',
                id: againCmd,
            }),
        },
    ];
    if (viewCmd) {
        buttons.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: '✨ Variation',
                id: viewCmd,
            }),
        });
    }
    // Keep max 2–3 actions per card for clean UI
    if (total > 1) {
        buttons.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: `📷 ${index + 1}/${total}`,
                id: `${againCmd} #${index + 1}`,
            }),
        });
    }
    return buttons.slice(0, 3);
}

/**
 * High-level path (itsliaaa/baileys cards API)
 */
async function sendViaCardsApi({ sock, from, buffers, title, caption, footer, againCmd, quoted }) {
    const cards = buffers.map((img, i) => ({
        image: normalizeImage(img),
        title: `${title} · ${i + 1}/${buffers.length}`.slice(0, 60),
        caption: (caption || '').slice(0, 300) || undefined,
        footer: footer || 'MADARA X-MD',
        nativeFlow: [
            { text: '🔄 Again', id: againCmd },
            ...(caption
                ? [{ text: '✨ Variation', id: `${againCmd} variation` }]
                : []),
        ],
    }));

    const payload = {
        text: title,
        footer: footer || 'MADARA X-MD · swipe for more',
        cards,
    };

    const opts = {};
    if (quoted?.key) opts.quoted = quoted;

    return sock.sendMessage(from, payload, opts);
}

/**
 * Low-level path (interactiveMessage + carouselMessage)
 */
async function sendViaInteractive({
    sock, msg, from, buffers, title, caption, footer, againCmd, baileys,
}) {
    const cards = [];
    for (let i = 0; i < buffers.length; i++) {
        const imageMessage = await buildImageMessage(baileys, sock, buffers[i]);
        cards.push({
            header: {
                title: `${title} · ${i + 1}/${buffers.length}`.slice(0, 60),
                hasMediaAttachment: true,
                imageMessage,
            },
            body: {
                text: (caption || `Image ${i + 1} of ${buffers.length}`).slice(0, 300),
            },
            footer: {
                text: (footer || 'MADARA X-MD').slice(0, 60),
            },
            nativeFlowMessage: {
                buttons: cardButtons({
                    againCmd,
                    viewCmd: caption ? `${againCmd} variation` : null,
                    index: i,
                    total: buffers.length,
                }),
                messageParamsJson: JSON.stringify({
                    from: 'madara-carousel',
                    index: i,
                    total: buffers.length,
                }),
            },
        });
    }

    const interactiveMessage = {
        body: { text: title },
        footer: { text: footer || 'MADARA X-MD · swipe →' },
        carouselMessage: {
            cards,
            messageVersion: 1,
        },
    };

    const msgContent = baileys.generateWAMessageFromContent(
        from,
        { interactiveMessage },
        {
            userJid: sock.user?.id,
            quoted: msg?.message ? msg : undefined,
        }
    );

    const additionalNodes = [{
        tag: 'biz',
        attrs: {},
        content: [{
            tag: 'interactive',
            attrs: { type: 'native_flow', v: '1' },
            content: [{
                tag: 'native_flow',
                attrs: { v: '9', name: 'carousel_card_metadata' },
            }],
        }],
    }];

    await sock.relayMessage(from, msgContent.message, {
        messageId: msgContent.key.id,
        additionalNodes,
    });
    return msgContent;
}

/**
 * @param {object} opts
 * @param {any} opts.sock
 * @param {any} [opts.msg] quoted source
 * @param {string} opts.from jid
 * @param {Array<Buffer|string|{url:string}>} opts.images
 * @param {string} [opts.title]
 * @param {string} [opts.caption]
 * @param {string} [opts.footer]
 * @param {boolean} [opts.forceLowLevel] skip cards API
 */
async function sendImageCarousel({
    sock,
    msg,
    from,
    images,
    title = 'MADARA IMAGE STUDIO',
    caption = '',
    footer = 'MADARA X-MD',
    forceLowLevel = false,
}) {
    const jid = from || msg?.key?.remoteJid;
    if (!sock || !jid) throw new Error('sendImageCarousel: sock and from required');

    const buffers = (Array.isArray(images) ? images : [images])
        .map(normalizeImage)
        .filter(Boolean);

    if (!buffers.length) throw new Error('No image was generated.');

    const baileys = resolveBaileys(sock);
    const prefix = resolvePrefix(sock, msg);
    const prompt = String(caption || '').trim().slice(0, 80);
    const againCmd = prompt ? `${prefix}img ${prompt}` : `${prefix}img`;

    // Single image → plain send (cleaner than 1-card carousel)
    if (buffers.length === 1 && !forceLowLevel) {
        return sock.sendMessage(jid, {
            image: buffers[0],
            caption: [
                `*${title}*`,
                caption ? `\n${caption}` : '',
                `\n_${footer}_`,
            ].filter(Boolean).join(''),
            buttons: [
                { text: '🔄 Generate again', id: againCmd },
            ].filter(Boolean),
        }, { quoted: msg });
    }

    // Prefer high-level cards API
    if (!forceLowLevel) {
        try {
            return await sendViaCardsApi({
                sock,
                from: jid,
                buffers,
                title,
                caption,
                footer,
                againCmd,
                quoted: msg,
            });
        } catch (err) {
            console.warn('[carousel] cards API failed, falling back:', err.message);
        }
    }

    return sendViaInteractive({
        sock,
        msg,
        from: jid,
        buffers,
        title,
        caption,
        footer,
        againCmd,
        baileys,
    });
}

module.exports = { sendImageCarousel, normalizeImage };
