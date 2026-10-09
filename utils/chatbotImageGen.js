/**
 * chatbotImageGen — shared helper used by the DM chatbot and the group chatbot
 * to detect image-generation intent in a user's message and (if matched) send
 * a generated image through Prexzy's documented image-generation endpoints.
 */
const axios = require('axios');
const { extractImageUrls } = require('./prexzyShape');

const PRIMARY  = 'https://prexzyapis.com/ai/genimage';
const FALLBACK = 'https://prexzyapis.com/ai/genigpt';

// Match common "make me an image" style phrasings and capture the subject.
const TRIGGERS = [
    /(?:generate|create|make|draw|design|render|produce|give\s*me)\s+(?:an?\s+|me\s+(?:an?\s+)?)?(?:image|picture|pic|photo|art|drawing|illustration|painting)\s+(?:of|about|showing|with|for)\s+(.+)/i,
    /(?:image|picture|pic|photo)\s+of\s+(.+)/i,
    /(?:draw|paint|sketch)\s+(?:me\s+)?(.+)/i,
];

function detectImagePrompt(text) {
    if (!text || typeof text !== 'string') return null;
    const t = text.trim();
    for (const re of TRIGGERS) {
        const m = t.match(re);
        if (m && m[1]) {
            const p = m[1].trim().replace(/[.!?]+$/, '');
            if (p.length >= 2 && p.length <= 400) return p;
        }
    }
    return null;
}

async function _fetchImageUrl(endpoint, prompt) {
    try {
        const { data, status } = await axios.get(endpoint, {
            params: { prompt, width: 768, height: 768 },
            timeout: 60000,
            validateStatus: () => true,
        });
        if (status < 200 || status >= 300 || data?.status === false) return null;
        return extractImageUrls(data, 1)[0] || null;
    } catch (_) { return null; }
}

async function generateImageBuffer(prompt) {
    let url = await _fetchImageUrl(PRIMARY, prompt);
    let model = 'Prexzy GenImage';
    if (!url) { url = await _fetchImageUrl(FALLBACK, prompt); model = 'Prexzy GeniGPT'; }
    if (!url) return null;
    try {
        const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
        const buf = Buffer.from(r.data);
        if (!buf || buf.length < 1024) return null;
        return { buffer: buf, model };
    } catch (_) { return null; }
}

/**
 * If `text` looks like an image-gen request, generate and send it. Returns
 * true when handled (caller should skip the normal AI text reply).
 */
async function maybeSendGeneratedImage({ sock, from, msg, text }) {
    const prompt = detectImagePrompt(text);
    if (!prompt) return false;
    try {
        const out = await generateImageBuffer(prompt);
        if (!out) {
            await sock.sendMessage(from, { text: '🎨 I tried to draw that but the image servers refused. Try rewording it?' }, { quoted: msg });
            return true;
        }
        await sock.sendMessage(from, {
            image: out.buffer,
            caption: `🎨 Here you go — _${prompt}_`,
        }, { quoted: msg });
        return true;
    } catch (_) {
        return false;
    }
}

module.exports = { detectImagePrompt, generateImageBuffer, maybeSendGeneratedImage };
