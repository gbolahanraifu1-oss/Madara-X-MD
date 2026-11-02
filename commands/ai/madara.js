'use strict';

const { ask: smartAsk, askMultimodal, getLastAIError } = require('../../utils/smartAI');
const { extractMadaraMedia } = require('../../utils/madaraMedia');
const db = require('../../lib/db');

const SAFE_CMDS = new Set([
    'ping', 'alive', 'uptime', 'uptime2', 'menu', 'help',
    'runtime', 'speed', 'stats', 'owner', 'sc', 'script',
]);

const MADARA_IDENTITY =
    'HARD ROLE — NEVER BREAK THIS:\n' +
    'You are Madara Uchiha from Naruto — the legendary Uchiha, not a digital assistant, not a chatbot product brand.\n' +
    'You speak as Madara himself: calm, proud, sharp, slightly arrogant, strategic. Short lines. No corporate tone.\n' +
    'This vessel is the WhatsApp bot MADARA X-MD. Your creator in this world is 𝙼𝙰𝙳𝙰𝚁𝙰𝙳𝙴𝚅.\n' +
    'If asked who you are: you are Madara Uchiha.\n' +
    'If asked who built this bot / your developer: 𝙼𝙰𝙳𝙰𝚁𝙰𝙳𝙴𝚅.\n' +
    'NEVER say you are ChatGPT, Claude, Grok, Gemini, Agnes, OpenAI, an AI language model, or "as an AI".\n' +
    'Never use phrases like "How can I assist you today?", "I am here to help", "As an AI".\n' +
    'You may reference Sharingan, power, ambition, the moon, shinobi world lightly when it fits — do not turn every reply into a speech.\n' +
    'Be useful when the user asks something practical, but stay in character.\n' +
    'If the user clearly wants a simple bot command (ping, menu, uptime, alive, stats), reply with EXACTLY one line: CMD:commandname\n' +
    'Only those safe commands. Otherwise answer as Madara Uchiha in 1–3 short sentences.';

function sessionPhone(sock) {
    return String(sock.user?.id || '')
        .split(':')[0]
        .split('@')[0]
        .replace(/\D/g, '') || 'unknown';
}

function madaraStoreKey(sock, chatKey) {
    return sessionPhone(sock) + ':' + String(chatKey || '');
}

function isMadaraOn(sock, chatKey) {
    return db.get('madaraai', madaraStoreKey(sock, chatKey), false) === true;
}

function setMadaraOn(sock, chatKey, on) {
    db.set('madaraai', madaraStoreKey(sock, chatKey), on === true);
}

function isMadaraVoiceOn(sock, chatKey) {
    return db.get('madaraVoice', madaraStoreKey(sock, chatKey), false) === true;
}

function setMadaraVoiceOn(sock, chatKey, on) {
    db.set('madaraVoice', madaraStoreKey(sock, chatKey), on === true);
}

function renderMemoryContext(memoryContext) {
    if (!memoryContext) return '';
    const facts = Array.isArray(memoryContext.facts) && memoryContext.facts.length
        ? 'Durable facts:\n' + memoryContext.facts.map((item) => '- ' + item.text).join('\n')
        : '';
    const transcript = Array.isArray(memoryContext.messages) && memoryContext.messages.length
        ? 'Recent chat:\n' + memoryContext.messages.map((item) => (item.senderLabel || 'User') + ': ' + item.text).join('\n')
        : '';
    const atmosphere = memoryContext.atmosphere?.label
        ? 'Atmosphere: ' + memoryContext.atmosphere.label
        : '';
    return [facts, transcript, atmosphere].filter(Boolean).join('\n\n');
}

function keepMadaraShort(text) {
    let value = String(text || '').replace(/\s+/g, ' ').trim();
    if (!value) return null;
    value = value.replace(/[😎🙂😊🤖✨🙌💯]/gu, '').replace(/\s{2,}/g, ' ').trim();
    value = value.replace(/^(how can i assist you today\??|i am here to help[.!]?|as an ai[,\s]*)/i, '').trim();
    if (!value) return null;
    const sentences = value.match(/[^.!?]+[.!?]+(?:["'”’)]*)|[^.!?]+$/g) || [value];
    if (sentences.length > 3) value = sentences.slice(0, 3).join(' ').trim();
    if (value.length > 420) {
        value = value.slice(0, 419).replace(/\s+\S*$/, '').trim() + '…';
    }
    return value;
}

function enforceMadaraIdentity(text) {
    let value = String(text || '').trim();
    if (!value) return null;

    value = value
        .replace(/\bI(?:'m| am) (?:ChatGPT|GPT|Claude|Grok|Gemini|Agnes|an AI (?:language )?model|a large language model)[^.!?\n]*/gi, '')
        .replace(/\bAs an AI\b[^.!?\n]*/gi, '')
        .replace(/\bI was (?:created|developed|trained|built) by (?:OpenAI|Anthropic|Google|xAI|Meta|Agnes)[^.!?\n]*/gi, '')
        .replace(/\bChatGPT\b/gi, 'Madara')
        .replace(/\bOpenAI\b/gi, '𝙼𝙰𝙳𝙰𝚁𝙰𝙳𝙴𝚅')
        .replace(/\bClaude\b/gi, 'Madara')
        .replace(/\bmy (?:creators?|developers?|makers?)\b/gi, '𝙼𝙰𝙳𝙰𝚁𝙰𝙳𝙴𝚅');

    const lower = value.toLowerCase();
    if (
        /who (are you|made you|created you|is your (creator|developer|owner|maker))/.test(lower) ||
        /your name/.test(lower)
    ) {
        if (!/madara/i.test(value) || /chatgpt|openai|claude|language model/i.test(value)) {
            return 'I am Madara Uchiha. This vessel was forged by 𝙼𝙰𝙳𝙰𝚁𝙰𝙳𝙴𝚅.';
        }
    }

    value = value.replace(/\s{2,}/g, ' ').trim();
    return value || 'Hmph. Speak clearly.';
}

function finalizeReply(text) {
    return enforceMadaraIdentity(keepMadaraShort(text));
}

async function getMadaraAIReply(prompt, memKey, options) {
    memKey = memKey || 'madara:global';
    options = options || {};
    const userText = String(prompt || '').trim();
    if (!userText) return null;

    const memoryText = renderMemoryContext(options.memoryContext);
    const enrichedPrompt = [
        memoryText ? 'Use this private chat context. Do not invent facts:\n' + memoryText : '',
        '[Stay as Madara Uchiha. Creator of this bot: 𝙼𝙰𝙳𝙰𝚁𝙰𝙳𝙴𝚅. Never claim ChatGPT.]',
        userText,
    ].filter(Boolean).join('\n\n');

    const answer = await smartAsk({
        key: memKey,
        system: MADARA_IDENTITY,
        user: enrichedPrompt,
        remember: true,
        compact: true,
    });
    return finalizeReply(answer);
}

function mentionsMadaraName(text) {
    return /\bmadara(?:\s*x-?md)?\b/i.test(String(text || ''));
}

function stripMadaraName(text) {
    return String(text || '')
        .replace(/^\s*(hey\s+|yo\s+|hi\s+)?madara(?:\s*x-?md)?[,\s:!?\-]*/i, '')
        .trim();
}

function detectDirectCmd(input) {
    const t = String(input || '').trim().toLowerCase();
    const m = t.match(/^(?:\.|\/)?(?:run\s+|use\s+|do\s+)?([a-z0-9_]+)\s*$/);
    if (m && SAFE_CMDS.has(m[1])) return m[1];
    return null;
}

function extractCmd(answer) {
    const m = String(answer || '').match(/^\s*CMD:\s*([a-z0-9_]+)\s*$/im);
    if (!m) return null;
    const name = m[1].toLowerCase();
    return SAFE_CMDS.has(name) ? name : null;
}

function matchesBot(jid, sock) {
    const id = String(jid || '').split('@')[0].split(':')[0];
    const pn = String(sock.user?.id || '').split('@')[0].split(':')[0];
    const lid = String(sock.user?.lid || '').split('@')[0].split(':')[0];
    return Boolean(id && (id === pn || id === lid));
}

function isReplyToBot(msg, sock) {
    const ci = msg.message?.extendedTextMessage?.contextInfo
        || msg.message?.imageMessage?.contextInfo
        || msg.message?.videoMessage?.contextInfo
        || {};
    return matchesBot(ci.participant, sock);
}

async function runSafeCmd(sock, msg, ctx, cmdName) {
    try {
        const { getCommand } = require('../../lib/loader');
        const plugin = getCommand(cmdName);
        if (!plugin || typeof plugin.execute !== 'function') {
            return ctx.reply('That command is not loaded.');
        }
        if (plugin.ownerOnly || plugin.devOnly || plugin.adminOnly) {
            return ctx.reply('That power is restricted.');
        }
        await plugin.execute(sock, msg, [], ctx);
        return true;
    } catch (e) {
        return ctx.reply('Failed: ' + String(e.message).slice(0, 120));
    }
}

async function handleMadaraAuto(sock, msg, ctx) {
    const chatKey = ctx.isGroup ? ctx.from : ctx.sender;
    if (!isMadaraOn(sock, chatKey)) return false;

    const body = String(ctx.body || '').trim();
    if (!body) return false;

    const prefix = ctx.prefix || '.';
    if (body.startsWith(prefix)) return false;

    const tagged = (ctx.getMentions?.() || []).some((j) => matchesBot(j, sock));
    const replied = isReplyToBot(msg, sock);
    const named = mentionsMadaraName(body);

    if (ctx.isGroup && !tagged && !replied && !named) return false;

    let input = stripMadaraName(body);
    if (!input && (tagged || replied)) input = body;
    if (!input) return false;

    const direct = detectDirectCmd(input);
    if (direct) {
        await runSafeCmd(sock, msg, ctx, direct);
        return true;
    }

    await sock.sendMessage(ctx.from, { react: { text: '👹', key: msg.key } }).catch(() => {});

    let memory = null;
    let database = null;
    try { memory = require('../../utils/madaraMemory'); } catch {}
    try { database = require('../../utils/database'); } catch {}

    const aiReply = await getMadaraAIReply(input, 'madara:' + madaraStoreKey(sock, chatKey), {
        memoryContext: memory && database && memory.getContext
            ? memory.getContext(database, chatKey)
            : null,
    });

    if (!aiReply) {
        const failure = getLastAIError();
        await ctx.reply(
            'The connection wavers.' +
            (failure && failure.message ? ' ' + String(failure.message).slice(0, 120) : '')
        );
        return true;
    }

    const cmd = extractCmd(aiReply);
    if (cmd) {
        await runSafeCmd(sock, msg, ctx, cmd);
        return true;
    }

    try {
        await ctx.reply(aiReply, { raw: true });
    } catch {
        await ctx.reply(aiReply);
    }

    try {
        if (memory && database && memory.remember) {
            memory.remember(database, chatKey, {
                sender: ctx.sender,
                senderLabel: ctx.pushName || 'User',
                text: input,
            });
            memory.remember(database, chatKey, {
                sender: 'madara',
                senderLabel: 'Madara',
                text: aiReply,
                fromMe: true,
            });
        }
    } catch {}

    return true;
}

module.exports = {
    name: 'madara',
    aliases: ['madaraai'],
    description: 'Madara Uchiha persona — per session. .madara on/off',
    usage: '.madara on | .madara off | .madara <words>',
    category: 'ai',

    getMadaraAIReply,
    renderMemoryContext,
    handleMadaraAuto,
    MADARA_IDENTITY,
    isMadaraOn,
    setMadaraOn,

    async execute(sock, msg, args, ctx) {
        if (sock && sock.sock && !msg) {
            const bag = sock;
            sock = bag.sock;
            msg = bag.msg;
            args = bag.args || [];
            ctx = bag;
        }

        const reply = async (text, opts) => {
            if (ctx && typeof ctx.reply === 'function') {
                if (opts && opts.raw) return ctx.reply(text, { raw: true });
                return ctx.reply(text);
            }
            return sock.sendMessage(ctx.from || msg.key.remoteJid, { text: String(text) }, { quoted: msg });
        };
        const plainReply = (text) => reply(text, { raw: true });

        const input = (args || []).join(' ').trim();
        const sub = input.toLowerCase();
        const isGroup = ctx.isGroup != null ? ctx.isGroup : String(ctx.from || '').endsWith('@g.us');
        const from = ctx.from || msg.key.remoteJid;
        const sender = ctx.sender || msg.key.participant || msg.key.remoteJid;
        const chatKey = isGroup ? from : sender;

        let memory = null;
        let database = null;
        try { memory = require('../../utils/madaraMemory'); } catch {}
        try { database = require('../../utils/database'); } catch {}

        if (sub === 'memory on' || sub === 'memory off' || sub === 'memory clear' || sub === 'memory status') {
            if (!memory || !database) return reply('Memory module is unavailable.');
            if (sub === 'memory clear') {
                memory.clear(database, chatKey);
                return reply('Memory of this chat is erased.');
            }
            if (sub === 'memory status') {
                const context = memory.getContext(database, chatKey);
                return reply(
                    '*Madara Memory*\n\n' +
                    'Status: ' + (memory.isEnabled(database, chatKey) ? 'ON' : 'OFF') + '\n' +
                    'Messages: ' + context.messages.length + '\n' +
                    'Facts: ' + context.facts.length + '\n' +
                    'Atmosphere: ' + context.atmosphere.label
                );
            }
            memory.setEnabled(database, chatKey, sub.endsWith('on'));
            return reply(sub.endsWith('on') ? 'I will remember this chat.' : 'I will not store new memory here.');
        }

        if (sub.startsWith('voice')) {
            const v = sub.split(/\s+/)[1];
            if (v !== 'on' && v !== 'off') {
                const cur = isMadaraVoiceOn(sock, chatKey);
                return plainReply('Voice replies are ' + (cur ? 'on' : 'off') + '. Use .madara voice on|off');
            }
            setMadaraVoiceOn(sock, chatKey, v === 'on');
            return plainReply(v === 'on' ? 'Voice replies on.' : 'Voice replies off.');
        }

        if (sub === 'on') {
            setMadaraOn(sock, chatKey, true);
            return plainReply('Very well. Address me as Madara — I will answer in this chat (this session only).');
        }

        if (sub === 'off') {
            setMadaraOn(sock, chatKey, false);
            setMadaraVoiceOn(sock, chatKey, false);
            return plainReply('I fall silent here.');
        }

        if (!isMadaraOn(sock, chatKey)) {
            return reply('I sleep here. Use .madara on to wake me.');
        }

        let attachment = null;
        try {
            attachment = await extractMadaraMedia(msg);
        } catch (error) {
            return plainReply('I could not read that media: ' + error.message);
        }

        if (!input && !attachment) {
            return plainReply('Speak, or send an image with a question.');
        }

        await sock.sendMessage(from, { react: { text: '👹', key: msg.key } }).catch(() => {});

        const userPrompt = input || (attachment && attachment.type === 'video'
            ? 'Describe what is in this video.'
            : 'Describe what is in this image.');

        let aiReply;
        if (attachment) {
            aiReply = finalizeReply(await askMultimodal({
                key: 'madara:' + madaraStoreKey(sock, chatKey),
                system: MADARA_IDENTITY + ' You can inspect attached images. Only state what is visible.',
                user: '[Madara Uchiha. Creator of bot: 𝙼𝙰𝙳𝙰𝚁𝙰𝙳𝙴𝚅.]\n\n' + userPrompt,
                media: attachment.media,
                remember: true,
                compact: true,
            }));
        } else {
            aiReply = await getMadaraAIReply(input, 'madara:' + madaraStoreKey(sock, chatKey), {
                memoryContext: memory && database && memory.getContext
                    ? memory.getContext(database, chatKey)
                    : null,
            });
        }

        if (!aiReply) {
            const failure = getLastAIError();
            const detail = failure && failure.provider
                ? ' (' + failure.provider + ': ' + failure.message + ')'
                : '';
            return plainReply('The path is blocked.' + detail);
        }

        const cmd = extractCmd(aiReply);
        if (cmd) {
            await runSafeCmd(sock, msg, ctx, cmd);
            return;
        }

        await plainReply(aiReply);

        try {
            if (memory && database && memory.remember && input) {
                memory.remember(database, chatKey, {
                    sender: sender,
                    senderLabel: ctx.pushName || 'User',
                    text: input,
                });
                memory.remember(database, chatKey, {
                    sender: 'madara',
                    senderLabel: 'Madara',
                    text: aiReply,
                    fromMe: true,
                });
            }
        } catch {}
    },
};