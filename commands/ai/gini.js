/**
 * Gini AI Command
 * Usage: .gini <prompt>
 */

const axios = require('axios');

module.exports = {
    name: 'gini',
    description: 'Chat with Gini AI',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const prompt = args.join(' ');
        if (!prompt) {
            return reply('🤖 Please provide a prompt for Gini AI.\nExample: .gini Tell me a joke.');
        }

        try {
            const res = await axios.get('https://prexzyapis.com/ai/ch', {
                params: { q: prompt },
                timeout: 15000,
                validateStatus: () => true,
            });
            if (res.status < 200 || res.status >= 300 || res.data?.status === false) {
                throw new Error(`Prexzy returned HTTP ${res.status}`);
            }
            const data = res.data;
            const text = data.response || data.result || data.reply;
            if (!text) throw new Error('Prexzy returned no response text');

            reply(text);
        } catch (err) {
            console.error('[gini]', err.message);
            reply('❌ Gini AI is currently unavailable.');
        }
    }
};
