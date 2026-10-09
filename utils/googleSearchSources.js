'use strict';

const axios = require('axios');

const http = axios.create({
    timeout: 20000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
    },
    validateStatus: () => true,
});

async function ddg(query) {
    try {
        const { status, data } = await http.get('https://api.duckduckgo.com/', {
            params: { q: query, format: 'json', no_html: 1, skip_disambig: 1 },
        });
        if (status !== 200 || !data) return null;
        const results = [];
        const collect = items => {
            for (const item of items || []) {
                if (item.Topics) collect(item.Topics);
                else if (item.FirstURL && item.Text) results.push({
                    title: item.Text.split(' - ')[0],
                    url: item.FirstURL,
                    snippet: item.Text,
                });
                if (results.length >= 8) break;
            }
        };
        collect(data.RelatedTopics);
        for (const item of data.Results || []) {
            if (item.FirstURL && item.Text) results.push({ title: item.Text, url: item.FirstURL, snippet: item.Text });
        }
        return {
            heading: data.Heading || '',
            abstract: data.AbstractText || '',
            source: data.AbstractSource || '',
            url: data.AbstractURL || '',
            image: data.Image ? (data.Image.startsWith('http') ? data.Image : `https://duckduckgo.com${data.Image}`) : '',
            results,
        };
    } catch (_) {
        return null;
    }
}

async function wiki(query) {
    try {
        const search = await http.get('https://en.wikipedia.org/w/api.php', {
            params: { action: 'query', list: 'search', srsearch: query, format: 'json', srlimit: 1, origin: '*' },
        });
        const title = search.data?.query?.search?.[0]?.title;
        if (!title) return null;
        const { status, data } = await http.get(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`,
        );
        if (status !== 200 || !data) return null;
        return {
            title: data.title || title,
            extract: data.extract || '',
            image: data.originalimage?.source || data.thumbnail?.source || '',
            url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        };
    } catch (_) {
        return null;
    }
}

async function ogImage(url) {
    try {
        if (!url || !/^https?:\/\//.test(url)) return '';
        const { status, data } = await http.get(url, { timeout: 12000, maxContentLength: 3000000 });
        if (status !== 200 || typeof data !== 'string') return '';
        const match = data.match(/<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i)
            || data.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
        const image = (match?.[1] || '').replace(/^\/\//, 'https://');
        return /^https?:\/\//.test(image) ? image : '';
    } catch (_) {
        return '';
    }
}

module.exports = { ddg, wiki, ogImage };
