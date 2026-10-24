'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseNewsRss, parseDetectedLanguage, parseRomanization } = require('../lib/apiResponseParsers');
const { escapeXml, wrapQuoteText } = require('../lib/quoteImage');

test('Google News RSS parser decodes titles and keeps valid links', () => {
    const xml = '<rss><channel><item><title><![CDATA[Title & More]]></title><link>https://example.com/a?x=1&amp;y=2</link></item></channel></rss>';
    assert.deepEqual(parseNewsRss(xml), [{ title: 'Title & More', link: 'https://example.com/a?x=1&y=2' }]);
});

test('language detector extracts language code and readable name', () => {
    assert.deepEqual(parseDetectedLanguage([[['Hello']], null, 'ru']), { code: 'ru', name: 'Russian' });
    assert.equal(parseDetectedLanguage([]), null);
});

test('romanization extracts Google response text', () => {
    assert.equal(parseRomanization([[['Hello', 'Привет', null, null, 10], [null, null, null, 'Privet']]]), 'Privet');
});

test('quote text is escaped and wrapped safely', () => {
    assert.equal(escapeXml('<script>&\"'), '&lt;script&gt;&amp;&quot;');
    assert.deepEqual(wrapQuoteText('one two three four five', 10), ['one two', 'three four', 'five']);
});

test('Google News parser rejects malformed links', () => {
    assert.deepEqual(parseNewsRss('<item><title>bad</title><link>javascript:alert(1)</link></item>'), []);
});
 