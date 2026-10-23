'use strict';

const BASE_URL = 'https://www.pinterest.com';
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
const HEADERS = {
    'user-agent': USER_AGENT,
    accept: 'application/json, text/javascript, */*, q=0.01',
    'x-requested-with': 'XMLHttpRequest',
    'x-pinterest-pws-handler': 'www/index.js',
    'x-pinterest-source-url': '/',
    referer: `${BASE_URL}/`,
};

function isHostOrSubdomain(hostname, domain) {
    const host = String(hostname || '').toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
}

function safePinterestUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) throw new Error('Provide a Pinterest pin URL.');

    let parsed;
    try {
        parsed = new URL(/^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    } catch {
        throw new Error('That is not a valid Pinterest URL.');
    }
    if (parsed.protocol !== 'https:') parsed.protocol = 'https:';
    if (!isHostOrSubdomain(parsed.hostname, 'pinterest.com') &&
        !isHostOrSubdomain(parsed.hostname, 'pin.it')) {
        throw new Error('Only Pinterest links are supported.');
    }
    return parsed;
}

function extractPinterestPinId(value) {
    const url = value instanceof URL ? value : safePinterestUrl(value);
    const segments = url.pathname.split('/').filter(Boolean);
    for (const segment of segments.reverse()) {
        const match = segment.match(/(?:--)?(\d{5,})$/);
        if (match) return match[1];
    }
    return null;
}

async function resolvePinterestPinId(value) {
    const input = safePinterestUrl(value);
    let pinId = extractPinterestPinId(input);
    if (pinId) return pinId;
    if (!isHostOrSubdomain(input.hostname, 'pin.it')) {
        throw new Error('That Pinterest URL does not point to a pin.');
    }

    let current = input;
    for (let redirects = 0; redirects <= 5; redirects++) {
        const response = await fetch(current, {
            method: 'GET',
            redirect: 'manual',
            headers: { 'user-agent': USER_AGENT },
            signal: AbortSignal.timeout(15000),
        });
        pinId = extractPinterestPinId(current);
        if (pinId) {
            await response.body?.cancel().catch(() => {});
            return pinId;
        }

        const location = response.headers?.get?.('location');
        const redirect = [301, 302, 303, 307, 308].includes(response.status);
        await response.body?.cancel().catch(() => {});
        if (!redirect || !location) break;
        current = safePinterestUrl(new URL(location, current).toString());
        pinId = extractPinterestPinId(current);
        if (pinId) return pinId;
    }
    throw new Error('Could not resolve that Pinterest short link to a pin.');
}

function securePinterestMediaUrl(value) {
    if (typeof value !== 'string') return null;
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || !isHostOrSubdomain(url.hostname, 'pinimg.com')) return null;
        return url.toString();
    } catch {
        return null;
    }
}

function bestImageUrl(images) {
    if (!images || typeof images !== 'object') return null;
    const candidates = Object.entries(images).map(([key, item]) => {
        const url = securePinterestMediaUrl(typeof item === 'string' ? item : item?.url);
        if (!url) return null;
        const width = Number(item?.width) || Number(String(key).match(/^\d+/)?.[0]) || 0;
        const height = Number(item?.height) || 0;
        return { url, score: width * height || width };
    }).filter(Boolean);
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.url || null;
}

function videoEntries(pin) {
    const entries = [];
    const direct = pin?.videos?.video_list;
    if (direct && typeof direct === 'object') entries.push(...Object.values(direct));

    for (const page of pin?.story_pin_data?.pages || []) {
        for (const block of page?.blocks || []) {
            const list = block?.video?.video_list;
            if (list && typeof list === 'object') entries.push(...Object.values(list));
        }
    }
    return entries;
}

function bestVideoUrl(pin) {
    const candidates = videoEntries(pin).map(item => {
        const url = securePinterestMediaUrl(item?.url || item?.url_without_watermark);
        if (!url || !/\.mp4(?:$|[?#])/i.test(url)) return null;
        const quality = Number(item?.width || item?.height || item?.quality || 0);
        return { url, quality };
    }).filter(Boolean);
    candidates.sort((a, b) => b.quality - a.quality);
    return candidates[0]?.url || null;
}

function normalizePinterestPin(pin) {
    if (!pin || typeof pin !== 'object') return null;
    const id = String(pin.id || pin.node_id || '');
    const imageUrl = bestImageUrl(pin.images);
    const videoUrl = bestVideoUrl(pin);
    if (!id || (!imageUrl && !videoUrl)) return null;

    const title = typeof pin.title === 'string'
        ? pin.title
        : pin.title?.format || pin.grid_title || pin.seo_alt_text || pin.description || '';
    return {
        id,
        title: String(title || 'Pinterest pin').replace(/\s+/g, ' ').trim().slice(0, 180),
        imageUrl,
        videoUrl,
        url: `${BASE_URL}/pin/${encodeURIComponent(id)}/`,
    };
}

async function fetchPinterestResource(resourceName, options, sourceUrl) {
    const url = new URL(`/resource/${resourceName}/get/`, BASE_URL);
    url.searchParams.set('source_url', sourceUrl);
    url.searchParams.set('data', JSON.stringify({ options, context: {} }));
    url.searchParams.set('_', String(Date.now()));

    const response = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Pinterest returned HTTP ${response.status}.`);

    const body = await response.json();
    const resource = body?.resource_response;
    if (!resource || (resource.status && resource.status !== 'success')) {
        throw new Error('Pinterest did not return pin data.');
    }
    return resource.data;
}

async function searchPinterestPins(query, limit = 4) {
    const search = String(query || '').trim();
    if (!search) return [];
    const pageSize = Math.min(25, Math.max(1, Number(limit) || 4));
    const data = await fetchPinterestResource(
        'BaseSearchResource',
        { query: search, scope: 'pins', rs: 'typed', page_size: pageSize },
        `/search/pins/?q=${encodeURIComponent(search)}`
    );
    const results = Array.isArray(data) ? data : data?.results || [];
    return results
        .filter(pin => pin?.type !== 'story')
        .map(normalizePinterestPin)
        .filter(Boolean)
        .slice(0, pageSize);
}

async function getPinterestPin(value) {
    const id = await resolvePinterestPinId(value);
    const data = await fetchPinterestResource(
        'PinResource',
        { id, field_set_key: 'auth_web_main_pin', noCache: true },
        `/pin/${id}/`
    );
    const pin = normalizePinterestPin(data);
    if (!pin) throw new Error('No downloadable image or MP4 video was found on that pin.');
    return pin;
}

module.exports = {
    safePinterestUrl,
    extractPinterestPinId,
    resolvePinterestPinId,
    securePinterestMediaUrl,
    bestImageUrl,
    bestVideoUrl,
    normalizePinterestPin,
    searchPinterestPins,
    getPinterestPin,
};
