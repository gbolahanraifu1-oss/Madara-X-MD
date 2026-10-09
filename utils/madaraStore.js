'use strict';

const loadedScraper = require('google-play-scraper');
const gplay = loadedScraper.default || loadedScraper;
const recentSearches = new Map();
const LANG = process.env.PLAYSTORE_LANG || 'en';
const COUNTRY = process.env.PLAYSTORE_COUNTRY || 'us';

function clean(value, limit = 500) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function escapeText(value) {
    return clean(value).replace(/[\\*_`]/g, '\\$&');
}

function playUrl(appId) {
    return `https://play.google.com/store/apps/details?id=${encodeURIComponent(appId)}&hl=${LANG}&gl=${COUNTRY}`;
}

function extractAppId(input) {
    const value = String(input || '').trim();
    try {
        const url = new URL(value);
        if (url.hostname.endsWith('play.google.com')) return url.searchParams.get('id') || '';
    } catch (_) {}
    const match = value.match(/(?:^|[?&])id=([A-Za-z0-9._-]+)/i);
    if (match) return match[1];
    return /^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_-]+)+$/.test(value) ? value : '';
}

function normalizeApp(app) {
    if (!app?.appId) return null;
    return {
        ...app,
        appId: String(app.appId),
        title: clean(app.title || app.appId, 120),
        developer: clean(app.developer || 'Unknown developer', 100),
        url: app.url || playUrl(app.appId),
    };
}

async function searchApps(term, num = 5) {
    const result = await gplay.search({ term: clean(term, 120), num, lang: LANG, country: COUNTRY });
    return (Array.isArray(result) ? result : []).map(normalizeApp).filter(Boolean);
}

async function getApp(appId) {
    const app = normalizeApp(await gplay.app({ appId, lang: LANG, country: COUNTRY }));
    if (!app) throw new Error('Google Play returned no app details');
    return app;
}

async function resolveApp(args, context) {
    const raw = args.join(' ').trim();
    if (!raw) throw new Error('provide an app name, package name, Play Store link, or search result number');
    const session = recentSearches.get(`${context.from || ''}:${context.sender || ''}`);
    if (args.length === 1 && session && /^\d+$/.test(args[0])) {
        const selected = session[Number(args[0]) - 1];
        if (selected) return getApp(selected.appId);
    }
    const directId = extractAppId(raw);
    if (directId) return getApp(directId);
    const results = await searchApps(raw, 3);
    if (!results.length) throw new Error('no Google Play apps found');
    return getApp(results[0].appId);
}

function categoryId(value) {
    const key = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
    return /^[A-Z_]+$/.test(key) ? key : '';
}

async function runAction(action, context) {
    const { args = [], reply, from, sender, prefix = '.', database, phoneNumber } = context;
    try {
        if (action === 'search') {
            const term = args.join(' ').trim();
            if (!term) return reply(`Usage: ${prefix}playstore <app name>`);
            const apps = await searchApps(term);
            recentSearches.set(`${from || ''}:${sender || ''}`, apps);
            return reply(apps.length
                ? `🛍️ *GOOGLE PLAY RESULTS*\n\n${apps.map((app, i) => `${i + 1}. *${escapeText(app.title)}* · ${escapeText(app.developer)}\n${app.url}`).join('\n\n')}`
                : 'No Google Play apps found.');
        }
        if (action === 'info' || action === 'download' || action === 'qr' || action === 'size' || action === 'updates') {
            const app = await resolveApp(args.filter(arg => !/^v?\d+(?:\.\d+)+$/i.test(arg)), context);
            if (action === 'download') return reply(`Official listing for *${escapeText(app.title)}*:\n${app.url}\n\nInstallation must be confirmed manually on your device.`);
            if (action === 'qr') {
                const image = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(app.url)}`;
                if (context.sock?.sendMessage) return context.sock.sendMessage(from, { image: { url: image }, caption: `Scan to open ${app.url}` }, { quoted: context.msg });
                return reply(app.url);
            }
            if (action === 'size') return reply(`📦 *${escapeText(app.title)}*\nSize: ${escapeText(app.size || 'Not published')}\nAndroid: ${escapeText(app.androidVersionText || 'Varies by device')}\n${app.url}`);
            if (action === 'updates') return reply(`🔄 *${escapeText(app.title)}*\nVersion: ${escapeText(app.version || 'Not published')}\nUpdated: ${app.updated ? new Date(app.updated).toLocaleDateString('en-US') : 'Not published'}\n${app.url}`);
            return reply(`📱 *${escapeText(app.title)}*\nDeveloper: ${escapeText(app.developer)}\nPackage: \`${app.appId}\`\nRating: ${app.scoreText || 'N/A'}★\nInstalls: ${escapeText(app.installs || 'Not published')}\nCategory: ${escapeText(app.genre || 'Not published')}\n\n${escapeText(app.summary || app.description || 'No summary published.')}\n\n${app.url}`);
        }
        if (action === 'compare') {
            const separator = args.findIndex(arg => /^(vs|versus)$/i.test(arg));
            if (separator < 1 || separator >= args.length - 1) return reply(`Usage: ${prefix}appcompare <app one> vs <app two>`);
            const [left, right] = await Promise.all([resolveApp(args.slice(0, separator), context), resolveApp(args.slice(separator + 1), context)]);
            return reply(`⚖️ *${escapeText(left.title)} vs ${escapeText(right.title)}*\nRating: ${left.scoreText || 'N/A'}★ vs ${right.scoreText || 'N/A'}★\n${left.url}\n${right.url}`);
        }
        if (action === 'category' || action === 'top') {
            const category = categoryId(args.join(' '));
            const apps = await gplay.list({ collection: gplay.collection.TOP_FREE, category: category || undefined, num: 5, lang: LANG, country: COUNTRY });
            return reply((apps || []).map((app, i) => `${i + 1}. ${escapeText(app.title)} · ${escapeText(app.developer)}`).join('\n') || 'No apps returned.');
        }
        if (action === 'reviews' || action === 'alternatives') {
            const app = await resolveApp(args, context);
            if (action === 'reviews') {
                const result = await gplay.reviews({ appId: app.appId, num: 5, lang: LANG, country: COUNTRY });
                const reviews = Array.isArray(result) ? result : result?.data || [];
                return reply(reviews.length ? reviews.slice(0, 5).map((review, i) => `${i + 1}. ${'★'.repeat(Number(review.score) || 0)} ${escapeText(review.text || review.title || '')}`).join('\n\n') : 'No public reviews returned.');
            }
            const apps = await gplay.similar({ appId: app.appId, num: 5, lang: LANG, country: COUNTRY });
            return reply((apps || []).slice(0, 5).map((item, i) => `${i + 1}. ${escapeText(item.title)} · ${escapeText(item.developer)}\n${item.url || playUrl(item.appId)}`).join('\n\n') || 'No alternatives returned.');
        }
        if (action === 'collection') {
            const user = database?.data?.users?.[phoneNumber];
            const collections = user?.appCollections || {};
            const operation = String(args[0] || 'list').toLowerCase();
            const name = String(args[1] || '').trim().toLowerCase();
            if (operation === 'list') return reply(Object.keys(collections).length ? Object.keys(collections).join('\n') : 'No saved app collections.');
            if (operation === 'delete' || operation === 'remove') {
                if (!collections[name]) return reply('Collection not found.');
                delete collections[name];
                database?.save?.('users');
                return reply(`Deleted collection ${name}.`);
            }
            if (operation === 'show' || operation === 'view') {
                const items = collections[name];
                return reply(items ? items.map(item => `${escapeText(item.title)}\n${item.url}`).join('\n\n') || 'Collection is empty.' : 'Collection not found.');
            }
            if (operation === 'create' || operation === 'add') {
                const app = await resolveApp(args.slice(2), context);
                if (!database?.data?.users?.[phoneNumber]) return reply('App collections are unavailable for this session.');
                if (!user.appCollections) user.appCollections = {};
                if (!user.appCollections[name]) user.appCollections[name] = [];
                user.appCollections[name].push({ appId: app.appId, title: app.title, url: app.url });
                user.appCollections[name] = user.appCollections[name].slice(0, 50);
                database.save?.('users');
                return reply(`Saved ${escapeText(app.title)} to ${name}.`);
            }
            return reply(`Usage: ${prefix}appcollection list | create <name> <app> | show <name> | delete <name>`);
        }
        if (action === 'apkscan') return reply('APK scanning is not available in this build. Do not install APKs unless you trust their source.');
        return reply('Unknown Google Play action.');
    } catch (error) {
        console.error(`[APPSTORE ${action}]`, error.message);
        return reply(`❌ Store request failed: ${error.message}`);
    }
}

module.exports = { runAction, extractAppId, categoryId, searchApps, getApp };