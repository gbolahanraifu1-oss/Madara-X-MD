/**
 * Horror AI Command
 * Usage: .horror <prompt>
 */

const axios = require('axios');

module.exports = {
    name: 'horror',
    description: 'Generate a horror story or theme',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const prompt = args.join(' ');
        if (!prompt) {
            return reply('👻 Please provide a theme for the horror AI.\nExample: .horror haunted house');
        }

        try {
            const res = await axios.get('https://prexzyapis.com/ai/ch', {
                params: { q: `Write a short horror story about: ${prompt}` },
                timeout: 15000,
                validateStatus: () => true,
            });
            if (res.status < 200 || res.status >= 300 || res.data?.status === false) {
                throw new Error(`Prexzy returned HTTP ${res.status}`);
            }
            const data = res.data;
            const text = data.response || data.result || data.reply;
            if (!text) throw new Error('Prexzy returned no story text');

            reply(`👻 *Horror Story:* \n\n${text}`);
        } catch (err) {
            console.error('[horror]', err.message);
            reply('❌ Horror AI is currently unavailable.');
        }
    }
};
