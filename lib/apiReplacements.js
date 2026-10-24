'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const { parseNewsRss, parseDetectedLanguage, parseRomanization } = require('./apiResponseParsers');

const TIMEOUT = 15000;
const browserHeaders = { 'User-Agent': 'Mozilla/5.0 (compatible; MadaraXMD/1.2)' };
const appHeaders = { 'User-Agent': 'Madara-X-MD/1.2 (https://github.com/gbolahanraifu1-oss/Madara-X-MD)' };

function cleanQuery(value) {
    const query = String(value || '').trim().slice(0, 300);
    if (!query) throw new Error('A search query is required.');
    return query;
}

async function searchCommonsImages(query, limit = 4) {
    const q = cleanQuery(query);
    const { data } = await axios.get('https://commons.wikimedia.org/w/api.php', {
        params: { action: 'query', generator: 'search', gsrsearch: 'filetype:bitmap ' + q, gsrnamespace: 6, gsrlimit: Math.min(10, Math.max(1, limit)), prop: 'imageinfo', iiprop: 'url|mime', iiurlwidth: 800, format: 'json' },
        headers: appHeaders, timeout: TIMEOUT,
    });
    const pages = Object.values(data?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
    return pages.map(page => {
        const image = page.imageinfo?.[0];
        return image ? { title: String(page.title || '').replace(/^File:/, ''), url: image.thumburl || image.url } : null;
    }).filter(item => item && /^https:\/\//i.test(item.url || ''));
}

async function searchNews(query, limit = 5) {
    const q = cleanQuery(query);
    const { data } = await axios.get('https://news.google.com/rss/search', {
        params: { q, hl: 'en-NG', gl: 'NG', ceid: 'NG:en' }, headers: browserHeaders, timeout: TIMEOUT,
    });
    return parseNewsRss(data, limit);
}

async function searchLyrics(query) {
    const q = cleanQuery(query);
    const { data } = await axios.get('https://lrclib.net/api/search', {
        params: { q }, headers: appHeaders, timeout: TIMEOUT,
    });
    const record = (Array.isArray(data) ? data : []).find(item => item && (item.plainLyrics || item.syncedLyrics));
    if (!record) return null;
    return { title: record.trackName || q, artist: record.artistName || '', lyrics: record.plainLyrics || record.syncedLyrics || '' };
}

async function searchStickerPacks(query, limit = 5) {
    const q = cleanQuery(query);
    const { data } = await axios.get('https://getstickerpack.com/stickers', { params: { query: q }, headers: browserHeaders, timeout: TIMEOUT });
    const $ = cheerio.load(data);
    const seen = new Set();
    const packs = [];
    $('a[href^="/stickers/"]').each((_, element) => {
        const title = $(element).text().replace(/\s+/g, ' ').trim();
        const path = $(element).attr('href');
        if (!title || !path || seen.has(path)) return;
        seen.add(path);
        packs.push({ name: title, link: new URL(path, 'https://getstickerpack.com').href });
    });
    return packs.slice(0, Math.min(10, Math.max(1, limit)));
}

async function googleTranslateData(query, romanize = false) {
    const q = cleanQuery(query);
    const suffix = romanize ? '&dt=rm' : '';
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t' + suffix + '&q=' + encodeURIComponent(q);
    const { data } = await axios.get(url, { headers: browserHeaders, timeout: TIMEOUT });
    return data;
}

async function detectLanguage(query) {
    return parseDetectedLanguage(await googleTranslateData(query, false));
}

async function transliterate(query) {
    return parseRomanization(await googleTranslateData(query, true));
}

module.exports = { searchCommonsImages, searchNews, searchLyrics, searchStickerPacks, detectLanguage, transliterate };
