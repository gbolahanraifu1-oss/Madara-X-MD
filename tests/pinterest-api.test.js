'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    safePinterestUrl,
    extractPinterestPinId,
    resolvePinterestPinId,
    normalizePinterestPin,
    searchPinterestPins,
    getPinterestPin,
} = require('../lib/pinterestApi');

test('Pinterest URL parsing rejects untrusted hosts and extracts numeric pin IDs', () => {
    assert.equal(extractPinterestPinId('https://www.pinterest.com/pin/title--123456789012345/'), '123456789012345');
    assert.equal(safePinterestUrl('http://pinterest.com/pin/123456789/').protocol, 'https:');
    assert.throws(() => safePinterestUrl('https://example.com/pin/123456789/'), /Only Pinterest/);
});

test('pin normalization selects a safe image and progressive MP4 stream', () => {
    const pin = normalizePinterestPin({
        id: '123456789012345',
        type: 'pin',
        title: 'Test pin',
        images: {
            '236x': { url: 'https://i.pinimg.com/236x/test.jpg', width: 236, height: 300 },
            orig: { url: 'https://i.pinimg.com/originals/test.jpg', width: 1000, height: 1200 },
            bad: { url: 'https://example.com/unsafe.jpg', width: 5000, height: 5000 },
        },
        videos: {
            video_list: {
                hls: { url: 'https://v.pinimg.com/videos/m3u8/test.m3u8', width: 2000 },
                mp4: { url: 'https://v1.pinimg.com/videos/test.mp4', width: 720 },
            },
        },
    });
    assert.equal(pin.imageUrl, 'https://i.pinimg.com/originals/test.jpg');
    assert.equal(pin.videoUrl, 'https://v1.pinimg.com/videos/test.mp4');
});

test('Pinterest search and direct pin reads parse the live resource response shape', async () => {
    const originalFetch = global.fetch;
    const requests = [];
    const pinData = {
        id: '123456789012345',
        type: 'pin',
        title: 'Example pin',
        images: { orig: { url: 'https://i.pinimg.com/originals/example.jpg', width: 1000, height: 1200 } },
    };
    global.fetch = async input => {
        const url = new URL(String(input));
        requests.push(url);
        const payload = url.pathname.includes('BaseSearchResource')
            ? { results: [{ id: 'story', type: 'story' }, pinData] }
            : pinData;
        return { ok: true, status: 200, json: async () => ({ resource_response: { status: 'success', data: payload } }) };
    };

    try {
        const results = await searchPinterestPins('anime wallpaper', 4);
        assert.equal(results.length, 1);
        assert.equal(results[0].id, pinData.id);
        const pin = await getPinterestPin(`https://www.pinterest.com/pin/${pinData.id}/`);
        assert.equal(pin.imageUrl, pinData.images.orig.url);
        assert.ok(requests[0].pathname.includes('BaseSearchResource'));
        assert.ok(requests[1].pathname.includes('PinResource'));
    } finally {
        global.fetch = originalFetch;
    }
});

test('Pinterest short links only follow redirects that stay on Pinterest', async () => {
    const originalFetch = global.fetch;
    let calls = 0;
    global.fetch = async () => {
        calls++;
        return {
            status: 302,
            headers: { get: () => 'https://www.pinterest.com/pin/123456789012345/' },
            body: { cancel: async () => {} },
        };
    };
    try {
        assert.equal(await resolvePinterestPinId('https://pin.it/example'), '123456789012345');
        assert.equal(calls, 1);
    } finally {
        global.fetch = originalFetch;
    }

    global.fetch = async () => ({
        status: 302,
        headers: { get: () => 'https://example.com/pin/123456789012345/' },
        body: { cancel: async () => {} },
    });
    try {
        await assert.rejects(resolvePinterestPinId('https://pin.it/example'), /Only Pinterest/);
    } finally {
        global.fetch = originalFetch;
    }
});
