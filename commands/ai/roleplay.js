const axios = require('axios');
const db = require('../../lib/db');
module.exports = {
    name: 'roleplay', aliases: ['rp','persona','aicharacter'], category: 'ai',
    desc: 'Start AI roleplay mode with a custom persona', usage: '†roleplay [character] | [scenario] | †roleplay stop',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const key = `roleplay_${ctx.from}`;
        if (args[0]?.toLowerCase() === 'stop') { db.del('roleplay', key); return ctx.reply(`🛑 Roleplay ended.${s.FOOTER}`); }
        const parts = ctx.text.split('|').map(p => p.trim());
        const character = parts[0] || 'a helpful assistant';
        const scenario  = parts[1] || 'a casual chat';
        db.set('roleplay', key, { character, scenario, active: true });
        await ctx.react('🎭');
        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`You are roleplaying as: ${character}. Scenario: ${scenario}. Introduce yourself in character.`)}`);
            ctx.reply(`🎭 *Roleplay Started!*\n*Character:* ${character}\n*Scenario:* ${scenario}\n\n${res.data?.data || 'Ready!'}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};
