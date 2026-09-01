'use strict';

const axios = require('axios');
const { askProvider } = require('../commands/ai/ai');

async function aiQuery(prompt, options = {}) {
    const provider = ['openai', 'grok', 'claude'].includes(options.provider)
        ? options.provider
        : (process.env.DEFAULT_AI_PROVIDER || 'openai');
    return askProvider(provider, prompt, options.tone || 'warm');
}

function openAIKey() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY is not configured');
    return key;
}

async function generateImage(prompt) {
    const res = await axios.post('https://api.openai.com/v1/images/generations', {
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
    }, {
        headers: { Authorization: `Bearer ${openAIKey()}`, 'Content-Type': 'application/json' },
        timeout: 90000,
    });
    const item = res.data?.data?.[0];
    if (item?.b64_json) return Buffer.from(item.b64_json, 'base64');
    if (item?.url) {
        const image = await axios.get(item.url, { responseType: 'arraybuffer', timeout: 60000 });
        return Buffer.from(image.data);
    }
    throw new Error('No image returned by OpenAI');
}

async function analyzeImage(buffer, mimeType, prompt) {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        max_tokens: 700,
        messages: [{
            role: 'user',
            content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${buffer.toString('base64')}` } },
            ],
        }],
    }, {
        headers: { Authorization: `Bearer ${openAIKey()}`, 'Content-Type': 'application/json' },
        timeout: 60000,
    });
    return res.data?.choices?.[0]?.message?.content || 'No response.';
}

async function transcribeAudio(filePath) {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', require('fs').createReadStream(filePath), 'audio.wav');
    form.append('model', 'whisper-1');
    const res = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
        headers: { ...form.getHeaders(), Authorization: `Bearer ${openAIKey()}` },
        timeout: 90000,
    });
    return res.data?.text || '';
}

module.exports = { aiQuery, generateImage, analyzeImage, transcribeAudio };