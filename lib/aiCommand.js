'use strict';

const db = require('./db');
const { aiQuery, generateImage } = require('./ai');

function createAiCommand({ name, aliases = [], description, instruction }) {
    return {
        name,
        aliases,
        category: 'ai',
        desc: description || `ᴜsᴇs ᴀɪ ғᴏʀ ${name}`,
        usage: `†${name} your request`,
        async execute(sock, msg, args, ctx) {
            const prompt = (args.join(' ').trim() || String(ctx.getQuotedText?.() || '').trim());
            if (!prompt) return ctx.reply(`❌ ᴜsᴀɢᴇ: ${ctx.prefix}${name} your request${ctx.FOOTER}`);

            const tone = db.get('chatbot_mode', ctx.from, 'warm');
                const provider = db.get('chatbot_provider', ctx.from, process.env.DEFAULT_AI_PROVIDER || 'grok');
            try {
                const answer = await aiQuery(
                    `${instruction || `Help with this ${name} request.`}\n\nUser request:\n${prompt}`,
                    { provider, tone }
                );
                return ctx.reply(`🤖 *${name}*\n\n${String(answer).slice(0, 6000)}${ctx.FOOTER}`);
            } catch (error) {
                console.error(`[ai:${name}]`, error.message);
                return ctx.reply(`❌ ᴀɪ ʀᴇǫᴜᴇsᴛ ғᴀɪʟᴇᴅ: ${String(error.message).slice(0, 300)}${ctx.FOOTER}`);
            }
        },
    };
}

module.exports = { createAiCommand };

function createImageCommand({ name, aliases = [], description, usage }) {
    return {
        name,
        aliases,
        category: 'ai',
        desc: description || 'ɢᴇɴᴇʀᴀᴛᴇ ᴀɴ ᴀɪ ɪᴍᴀɢᴇ',
        usage: usage || `†${name} image prompt`,
        async execute(sock, msg, args, ctx) {
            const prompt = args.join(' ').trim();
            if (!prompt) return ctx.reply(`❌ ᴜsᴀɢᴇ: ${ctx.prefix}${name} image prompt${ctx.FOOTER}`);
            await ctx.react('🎨');
            try {
                const image = await generateImage(prompt);
                return sock.sendMessage(ctx.from, {
                    image,
                    caption: `🎨 *${prompt}*${ctx.FOOTER}`,
                }, { quoted: msg });
            } catch (error) {
                console.error(`[ai:${name}]`, error.message);
                return ctx.reply(`❌ ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛɪᴏɴ ғᴀɪʟᴇᴅ: ${String(error.message).slice(0, 300)}${ctx.FOOTER}`);
            }
        },
    };
}

module.exports.createImageCommand = createImageCommand;