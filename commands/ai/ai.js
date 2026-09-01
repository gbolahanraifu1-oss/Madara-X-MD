'use strict';

const axios = require('axios');

const PROVIDERS = {
    openai: {
        env: 'OPENAI_API_KEY',
        url: 'https://api.openai.com/v1/chat/completions',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    claude: {
        env: 'ANTHROPIC_API_KEY',
        url: 'https://api.anthropic.com/v1/messages',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
    },
    grok: {
        env: 'XAI_API_KEY',
        url: 'https://api.x.ai/v1/chat/completions',
        model: process.env.XAI_MODEL || 'grok-3-mini',
    },
};

const ALIAS_PROVIDER = {
    grok: 'grok',
    xai: 'grok',
    claude: 'claude',
    anthropic: 'claude',
    openai: 'openai',
    chatgpt: 'openai',
};

function resolveRequest(args, ctx) {
    const alias = ALIAS_PROVIDER[String(ctx.rawCmd || '').toLowerCase()];
    const explicit = ALIAS_PROVIDER[String(args[0] || '').toLowerCase()];
    const provider = alias || explicit || String(process.env.DEFAULT_AI_PROVIDER || 'openai').toLowerCase();
    const promptArgs = alias ? args : (explicit ? args.slice(1) : args);
    return { provider: PROVIDERS[provider] ? provider : 'openai', prompt: promptArgs.join(' ').trim() };
}

function quotedPrompt(ctx) {
    try {
        return String(ctx.getQuotedText?.() || '').trim();
    } catch {
        return '';
    }
}

async function askOpenAI(config, prompt) {
    const response = await axios.post(config.url, {
        model: config.model,
        messages: [
            { role: 'system', content: 'You are Madara AI. Be helpful, concise, and safe.' },
            { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1200,
    }, {
        headers: { Authorization: `Bearer ${process.env[config.env]}` },
        timeout: 45_000,
    });
    return response.data?.choices?.[0]?.message?.content;
}

async function askClaude(config, prompt) {
    const response = await axios.post(config.url, {
        model: config.model,
        max_tokens: 1200,
        system: 'You are Madara AI. Be helpful, concise, and safe.',
        messages: [{ role: 'user', content: prompt }],
    }, {
        headers: {
            'x-api-key': process.env[config.env],
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
        timeout: 45_000,
    });
    return response.data?.content?.map(part => part.text || '').join('').trim();
}

async function execute(sock, msg, args, ctx) {
    const { provider, prompt: suppliedPrompt } = resolveRequest(args, ctx);
    const prompt = suppliedPrompt || quotedPrompt(ctx);
    if (!prompt) {
        return ctx.reply(
            `🤖 *ᴀɪ ᴜsᴀɢᴇ*\n\n` +
            `${ctx.prefix}ai your question\n` +
            `${ctx.prefix}grok your question\n` +
            `${ctx.prefix}claude your question\n\n` +
            'ʏᴏᴜ ᴄᴀɴ ᴀʟsᴏ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴍᴇssᴀɢᴇ ᴡɪᴛʜ ᴛʜᴇ ᴄᴏᴍᴍᴀɴᴅ.'
        );
    }

    const config = PROVIDERS[provider];
    if (!process.env[config.env]) {
        return ctx.reply(`❌ ${config.env} ɪs ɴᴏᴛ sᴇᴛ ɪɴ ʀᴇᴘʟɪᴛ sᴇᴄʀᴇᴛs.`);
    }

    await ctx.react('🤔').catch(() => {});
    try {
        const answer = provider === 'claude'
            ? await askClaude(config, prompt)
            : await askOpenAI(config, prompt);
        if (!answer) throw new Error('The provider returned an empty response.');
        const label = provider === 'claude' ? 'ᴄʟᴀᴜᴅᴇ' : provider === 'grok' ? 'ɢʀᴏᴋ' : 'ᴏᴘᴇɴᴀɪ';
        return ctx.reply(`🤖 *${label}*\n\n${String(answer).slice(0, 6000)}`);
    } catch (error) {
        const detail = error.response?.data?.error?.message || error.response?.data?.message || error.message;
        console.error(`[ai:${provider}]`, detail);
        return ctx.reply(`❌ ᴀɪ ʀᴇǫᴜᴇsᴛ ғᴀɪʟᴇᴅ: ${String(detail).slice(0, 300)}`);
    }
}

module.exports = {
    name: 'ai',
    aliases: ['ask', 'askai', 'grok', 'xai', 'claude', 'anthropic', 'openai', 'chatgpt'],
    category: 'ai',
    desc: 'ᴀsᴋ ᴏᴘᴇɴᴀɪ, ɢʀᴏᴋ, ᴏʀ ᴄʟᴀᴜᴅᴇ',
    usage: '†ai your question',
    waitReact: false,
    execute,
};