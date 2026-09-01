'use strict';

const { askProvider } = require('../commands/ai/ai');

async function aiQuery(prompt, options = {}) {
    const provider = ['openai', 'grok', 'claude'].includes(options.provider)
        ? options.provider
        : (process.env.DEFAULT_AI_PROVIDER || 'openai');
    return askProvider(provider, prompt, options.tone || 'warm');
}

module.exports = { aiQuery };