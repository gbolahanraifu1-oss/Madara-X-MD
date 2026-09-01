'use strict';

const db = require('../../lib/db');
const { aiQuery } = require('../../lib/ai');

module.exports = {
    name: 'roastai',
    aliases: ['roast2', 'aiburn'],
    category: 'ai',
    desc: 'ᴀɪ ʀᴏᴀsᴛ',
    usage: '†roastai name or topic',
    async execute(sock, msg, args, ctx) {
        const target = args.join(' ').trim() || ctx.pushName || 'this person';
        try {
            const provider = db.get('chatbot_provider', ctx.from, process.env.DEFAULT_AI_PROVIDER || 'grok');
            const tone = db.get('chatbot_mode', ctx.from, 'savage');
            const answer = await aiQuery(`Roast ${target} in a funny, playful way. Do not use hateful or dangerous abuse.`, { provider, tone });
            return ctx.reply(`🔥 *ᴀɪ ʀᴏᴀsᴛ*\n\n${answer}${ctx.FOOTER}`);
        } catch (error) {
            return ctx.reply(`❌ ᴀɪ ʀᴏᴀsᴛ ғᴀɪʟᴇᴅ: ${error.message}${ctx.FOOTER}`);
        }
    },
};