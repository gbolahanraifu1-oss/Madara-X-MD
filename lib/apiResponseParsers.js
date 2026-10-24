'use strict';

function decodeXml(value) {
    return String(value || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, String.fromCharCode(34)).replace(/&apos;/g, String.fromCharCode(39));
}

function xmlTag(block, name) {
    const re = new RegExp('<' + name + '[^>]*>([\\s\\S]*?)<\\/' + name + '>', 'i');
    return decodeXml(block.match(re)?.[1] || '').trim();
}

function parseNewsRss(xml, limit = 5) {
    const items = String(xml || '').match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) || [];
    return items.slice(0, limit).map(block => ({ title: xmlTag(block, 'title'), link: xmlTag(block, 'link') }))
        .filter(item => item.title && /^https?:\/\//i.test(item.link));
}

function parseDetectedLanguage(data) {
    const code = typeof data?.[2] === 'string' ? data[2].trim() : '';
    if (!code) return null;
    const fallbackNames = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', ru: 'Russian', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', ar: 'Arabic', pt: 'Portuguese', hi: 'Hindi', yo: 'Yoruba', ig: 'Igbo', ha: 'Hausa', sw: 'Swahili', it: 'Italian', nl: 'Dutch', tr: 'Turkish', uk: 'Ukrainian', bn: 'Bengali', fa: 'Persian', vi: 'Vietnamese', th: 'Thai' };
    let name = fallbackNames[code] || code;
    try { const displayName = new Intl.DisplayNames(['en'], { type: 'language' }).of(code); if (displayName && displayName.toLowerCase() !== code.toLowerCase()) name = displayName; } catch (_) {}
    return { code, name };
}

function parseRomanization(data) {
    const segments = Array.isArray(data?.[0]) ? data[0] : [];
    const parts = segments.map(segment => Array.isArray(segment) && typeof segment[3] === 'string' ? segment[3].trim() : '')
        .filter(Boolean);
    return parts.join(' ').trim() || null;
}

module.exports = { decodeXml, parseNewsRss, parseDetectedLanguage, parseRomanization };
