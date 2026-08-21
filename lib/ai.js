// ── Multi-provider AI helper (fallback chain) ──────────────────────────────
async function aiQuery(prompt) {
    const axios = require('axios');
    const providers = [
        // Provider 1: Pollinations AI (free, no key)
        async () => {
            const res = await axios.get(
                `https://text.pollinations.ai/${encodeURIComponent(prompt)}`,
                { timeout: 15000 }
            );
            if (typeof res.data === 'string' && res.data.trim()) return res.data.trim();
            throw new Error('empty');
        },
        // Provider 2: API Ninja AI (free tier)
        async () => {
            const res = await axios.post('https://api.api-ninjas.com/v1/ai/query',
                { text: prompt },
                { headers: { 'X-Api-Key': 'demo' }, timeout: 12000 }
            );
            if (res.data?.answer) return res.data.answer;
            throw new Error('empty');
        },
        // Provider 3: siputzx fallback (may still work for some prompts)
        async () => {
            const res = await axios.get(
                `https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(prompt)}`,
                { timeout: 12000 }
            );
            const t = res.data?.data || res.data?.result;
            if (t) return t;
            throw new Error('empty');
        },
    ];
    for (const fn of providers) {
        try { return await fn(); } catch {}
    }
    throw new Error('All AI providers failed. Try again later.');
}
module.exports = { aiQuery };