'use strict';

/**
 * MADARA AI — core provider stack
 * Primary: Madara AI API (OpenAI-compatible) or xAI Grok
 * Fallback: Claude → (explicit only) OpenAI
 */

const axios = require('axios');

function envFirst(...keys) {
    for (const k of keys) {
        const v = process.env[k];
        if (v && String(v).trim()) return String(v).trim();
    }
    return '';
}

const PROVIDERS = {
    // Madara AI — preferred. Uses dedicated Madara endpoint when set,
    // otherwise the same xAI/Grok credentials (Madara-branded).
    madara: {
        env: 'MADARA_AI_API_KEY',
        envFallbacks: ['XAI_API_KEY', 'GROK_API_KEY'],
        url: () => envFirst('MADARA_AI_URL') || 'https://api.x.ai/v1/chat/completions',
        model: () => envFirst('MADARA_AI_MODEL', 'XAI_MODEL') || 'grok-3-mini',
        kind: 'openai-compat',
    },
    grok: {
        env: 'XAI_API_KEY',
        envFallbacks: ['GROK_API_KEY', 'MADARA_AI_API_KEY'],
        url: () => envFirst('XAI_API_URL') || 'https://api.x.ai/v1/chat/completions',
        model: () => envFirst('XAI_MODEL') || 'grok-3-mini',
        kind: 'openai-compat',
    },
    claude: {
        env: 'ANTHROPIC_API_KEY',
        envFallbacks: [],
        url: () => 'https://api.anthropic.com/v1/messages',
        model: () => envFirst('ANTHROPIC_MODEL') || 'claude-3-5-haiku-20241022',
        kind: 'claude',
    },
    // Kept only for explicit .openai / .chatgpt — never default, never auto-fallback target
    openai: {
        env: 'OPENAI_API_KEY',
        envFallbacks: [],
        url: () => 'https://api.openai.com/v1/chat/completions',
        model: () => envFirst('OPENAI_MODEL') || 'gpt-4o-mini',
        kind: 'openai-compat',
    },
};

const ALIAS_PROVIDER = {
    madara: 'madara',
    madaraai: 'madara',
    mai: 'madara',
    ai: 'madara',
    ask: 'madara',
    askai: 'madara',
    grok: 'grok',
    xai: 'grok',
    claude: 'claude',
    anthropic: 'claude',
    openai: 'openai',
    chatgpt: 'openai',
};

const TONE_INSTRUCTIONS = {
    warm: 'Use a warm, friendly, encouraging tone.',
    savage: 'Use a sharp, witty, sarcastic tone without being abusive or hateful.',
    cold: 'Use a concise, calm, clinical tone.',
    deadly: 'Use a dark, dramatic Madara Uchiha-inspired tone while remaining safe and respectful.',
};

function systemPrompt(tone = 'warm') {
    return (
        'You are Madara AI — the intelligence core of MADARA X-MD, a WhatsApp bot. ' +
        'You speak with quiet confidence, clarity, and purpose. Stay helpful, concise, and safe. ' +
        'Never claim to be OpenAI, ChatGPT, Claude, or Grok unless the user explicitly asks which engine is running. ' +
        'You are Madara AI. ' +
        (TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.warm)
    );
}

function resolveApiKey(config) {
    const primary = process.env[config.env];
    if (primary && String(primary).trim()) return String(primary).trim();
    for (const k of config.envFallbacks || []) {
        const v = process.env[k];
        if (v && String(v).trim()) return String(v).trim();
    }
    return '';
}

function resolveRequest(args, ctx) {
    const alias = ALIAS_PROVIDER[String(ctx.rawCmd || '').toLowerCase()];
    const explicit = ALIAS_PROVIDER[String(args[0] || '').toLowerCase()];
    const rawDefault = String(process.env.DEFAULT_AI_PROVIDER || 'madara').toLowerCase();
    const fallbackDefault = PROVIDERS[rawDefault] ? rawDefault : 'madara';
    const provider = alias || explicit || fallbackDefault;
    const promptArgs = alias ? args : (explicit ? args.slice(1) : args);
    return {
        provider: PROVIDERS[provider] ? provider : 'madara',
        prompt: promptArgs.join(' ').trim(),
    };
}

function quotedPrompt(ctx) {
    try {
        return String(ctx.getQuotedText?.() || '').trim();
    } catch {
        return '';
    }
}

function providerError(error) {
    return error?.response?.data?.error?.message
        || error?.response?.data?.error
        || error?.response?.data?.message
        || (error?.response?.status ? `HTTP ${error.response.status}` : error?.message)
        || 'Unknown provider error';
}

async function askOpenAICompat(config, prompt, tone, apiKey) {
    const response = await axios.post(config.url(), {
        model: config.model(),
        messages: [
            { role: 'system', content: systemPrompt(tone) },
            { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1200,
    }, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        timeout: 45_000,
    });
    return response.data?.choices?.[0]?.message?.content;
}

async function askClaude(config, prompt, tone, apiKey) {
    const response = await axios.post(config.url(), {
        model: config.model(),
        max_tokens: 1200,
        system: systemPrompt(tone),
        messages: [{ role: 'user', content: prompt }],
    }, {
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
        },
        timeout: 45_000,
    });
    const content = response.data?.content;
    if (Array.isArray(content)) {
        return content.map(p => p?.text || '').join('').trim();
    }
    return response.data?.content?.[0]?.text;
}

async function askProvider(provider, prompt, tone = 'warm') {
    const config = PROVIDERS[provider];
    if (!config) throw new Error(`Unknown AI provider: ${provider}`);
    const apiKey = resolveApiKey(config);
    if (!apiKey) {
        const tried = [config.env, ...(config.envFallbacks || [])].join(' / ');
        throw new Error(`${tried} is not set`);
    }
    if (config.kind === 'claude') {
        return askClaude(config, prompt, tone, apiKey);
    }
    return askOpenAICompat(config, prompt, tone, apiKey);
}

/**
 * Fallback chain — Madara-first. OpenAI is NEVER in the automatic chain
 * unless the user explicitly requested the openai provider.
 */
function fallbackChain(preferred) {
    const p = PROVIDERS[preferred] ? preferred : 'madara';
    if (p === 'openai') return ['openai', 'madara', 'grok', 'claude'];
    if (p === 'claude') return ['claude', 'madara', 'grok'];
    if (p === 'grok') return ['grok', 'madara', 'claude'];
    // madara default
    return ['madara', 'grok', 'claude'];
}

async function askProviderWithFallback(provider, prompt, tone = 'warm') {
    const chain = fallbackChain(provider);
    const failures = [];
    for (const candidate of chain) {
        try {
            const text = await askProvider(candidate, prompt, tone);
            if (text && String(text).trim()) return String(text).trim();
            failures.push(`${candidate}: empty response`);
        } catch (error) {
            const detail = providerError(error);
            failures.push(`${candidate}: ${detail}`);
            console.error(`[ai:${candidate}]`, detail);
        }
    }
    throw new Error(failures.join(' | ') || 'All configured AI providers failed.');
}

function providerLabel(provider) {
    if (provider === 'claude') return 'ᴄʟᴀᴜᴅᴇ';
    if (provider === 'grok') return 'ɢʀᴏᴋ';
    if (provider === 'openai') return 'ᴏᴘᴇɴᴀɪ';
    return 'ᴍᴀᴅᴀʀᴀ ᴀɪ';
}

async function execute(sock, msg, args, ctx) {
    const { provider, prompt: suppliedPrompt } = resolveRequest(args, ctx);
    const prompt = suppliedPrompt || quotedPrompt(ctx);
    if (!prompt) {
        return ctx.reply(
            `🔴 *ᴍᴀᴅᴀʀᴀ ᴀɪ*\n\n` +
            `${ctx.prefix}ai your question\n` +
            `${ctx.prefix}madara your question\n` +
            `${ctx.prefix}grok your question\n` +
            `${ctx.prefix}claude your question\n\n` +
            'ʏᴏᴜ ᴄᴀɴ ᴀʟsᴏ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴍᴇssᴀɢᴇ ᴡɪᴛʜ ᴛʜᴇ ᴄᴏᴍᴍᴀɴᴅ.'
        );
    }

    const config = PROVIDERS[provider];
    if (!resolveApiKey(config)) {
        const tried = [config.env, ...(config.envFallbacks || [])].join(' / ');
        return ctx.reply(`❌ ɴᴏ ᴀɪ ᴋᴇʏ ᴄᴏɴғɪɢᴜʀᴇᴅ.\nSet one of: *${tried}*`);
    }

    await ctx.react('🔴').catch(() => {});
    try {
        const answer = await askProviderWithFallback(provider, prompt, 'warm');
        return ctx.reply(`🔴 *${providerLabel(provider)}*\n\n${String(answer).slice(0, 6000)}`);
    } catch (error) {
        const detail = providerError(error);
        console.error(`[ai:${provider}]`, detail);
        return ctx.reply(`❌ ᴍᴀᴅᴀʀᴀ ᴀɪ ғᴀɪʟᴇᴅ: ${String(detail).slice(0, 300)}`);
    }
}

module.exports = {
    name: 'ai',
    aliases: ['ask', 'askai', 'madara', 'madaraai', 'mai', 'grok', 'xai', 'claude', 'anthropic', 'openai', 'chatgpt'],
    category: 'ai',
    desc: 'ᴀsᴋ ᴍᴀᴅᴀʀᴀ ᴀɪ (ɢʀᴏᴋ / ᴄʟᴀᴜᴅᴇ)',
    usage: '.ai your question',
    waitReact: false,
    execute,
    askProvider,
    askProviderWithFallback,
    PROVIDERS,
    systemPrompt,
    providerLabel,
    resolveApiKey,
};
