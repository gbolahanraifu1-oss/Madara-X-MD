'use strict';

const PRIMARY_PAIR_SITE_URL = 'https://madaraweb.dpdns.org';
const SECONDARY_PAIR_SITE_URL = 'https://madaraweb.dpdns.org';

function normalizePairSiteUrl(value) {
    return String(value || '').trim().replace(/\/$/, '');
}

function getPairSiteUrls(env = process.env) {
    const configured = [
        PRIMARY_PAIR_SITE_URL,
        SECONDARY_PAIR_SITE_URL,
        ...(String(env.PAIR_SITE_URLS || '').split(',').map(normalizePairSiteUrl)),
        normalizePairSiteUrl(env.PAIR_SITE_URL),
        normalizePairSiteUrl(env.PAIR_SITE_FALLBACK_URL),
    ];
    return [...new Set(configured.filter(Boolean))];
}

module.exports = {
    PRIMARY_PAIR_SITE_URL,
    SECONDARY_PAIR_SITE_URL,
    getPairSiteUrls,
    normalizePairSiteUrl,
};
