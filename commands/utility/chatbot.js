'use strict';

const db = require('../../lib/db');
const { wasSentByBot } = require('../../lib/sentTracker');
const { askProviderWithFallback } = require('../ai/ai');
const { sendInteractiveList } = require('../../lib/baileysHelper');

const PERSONALITIES = {
    warm: {
        label: 'ᴡᴀʀᴍ 🌸',
        instruction: 'Use a warm, friendly, encouraging tone.',
    },
    savage: {
        label: 'sᴀᴠᴀɢᴇ 😤',
        instruction: 'Use a sharp, witty, sarcastic tone without being abusive or hateful.',
    },
    cold: {
        label: 'ᴄᴏʟᴅ 🧊',
        instruction: 'Use a concise, calm, clinical tone.',
    },
    deadly: {
        label: 'ᴅᴇᴀᴅʟʏ ☠️',
        instruction: 'Use a dark, dramatic Madara-inspired tone while remaining safe and respectful.',
    },
};

const PROVIDERS = ['openai', 'grok', 'claude'];
const GLOBAL_GROUPS_KEY = 'groups';

function getKey(ctx) {
    // The remote JID is stable for both sides of a private chat.  `sender`
    // can change between PN and LID forms, which was why DM toggles appeared
    // to work but later messages were ignored.
    return ctx.from;
}

function stripDevice(jid) {
    return String(jid || '').split(':')[0].split('@')[0];
}

function matchesBot(jid, sock) {
    const id = stripDevice(jid);
    const pn = stripDevice(sock.user?.id);
    const lid = stripDevice(sock.user?.lid);
    return Boolean(id && ((pn && id === pn) || (lid && id === lid)));
}

function textFromMessage(ctx) {
    return String(ctx.body || '').trim();
}

function quotedText(ctx) {
    try { return String(ctx.getQuotedText?.() || '').trim(); } catch { return ''; }
}

function cleanMention(text, sock) {
    let result = String(text || '');
    for (const jid of [sock.user?.id, sock.user?.lid]) {
        const number = stripDevice(jid);
        if (number) result = result.replace(new RegExp(`@${number}\\b`, 'g'), '');
    }
    return result.trim();
}

function selectedTone(key) {
    return PERSONALITIES[db.get('chatbot_mode', key, 'warm')]
        ? db.get('chatbot_mode', key, 'warm')
        : 'warm';
}

function selectedProvider(key) {
    const provider = db.get('chatbot_provider', key, process.env.DEFAULT_AI_PROVIDER || 'grok');
    return PROVIDERS.includes(provider) ? provider : 'grok';
}

function groupResponseEnabled() {
    return db.get('chatbot_global', GLOBAL_GROUPS_KEY, true) !== false;
}

function isReplyToBot(msg, sock) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
        || msg.message?.imageMessage?.contextInfo
        || msg.message?.videoMessage?.contextInfo
        || msg.message?.conversation?.contextInfo;
    return matchesBot(contextInfo?.participant, sock)
        || matchesBot(contextInfo?.remoteJid, sock);
}

async function handleChatbot(sock, msg, ctx) {
    const { from, body, isGroup } = ctx;
    if (msg.key.fromMe && wasSentByBot(msg.key.id)) return false;

    const key = getKey(ctx);
    if (isGroup && !groupResponseEnabled()) return false;
    if (!db.get('chatbot', key, false)) return false;

    const botTagged = (ctx.getMentions?.() || []).some(jid => matchesBot(jid, sock));
    const repliedToBot = isReplyToBot(msg, sock);
    if (isGroup && !botTagged && !repliedToBot) return false;

    const input = cleanMention(textFromMessage(ctx) || quotedText(ctx), sock);
    if (!input) return false;

    const tone = selectedTone(key);
    const provider = selectedProvider(key);
    try {
            const answer = await askProviderWithFallback(provider, input, tone);
        return ctx.reply({ text: `🤖 *${PERSONALITIES[tone].label}*\n\n${answer.slice(0, 6000)}` });
    } catch (error) {
        console.error(`[chatbot:${provider}]`, error.message);
        return ctx.reply(`❌ ᴄʜᴀᴛʙᴏᴛ ᴄᴏᴜʟᴅ ɴᴏᴛ ʀᴇsᴘᴏɴᴅ: ${String(error.message).slice(0, 240)}`);
    }
}

async function listGroups(sock, msg, ctx) {
    if (!ctx.isOwner) return ctx.reply('❌ ᴏɴʟʏ ᴛʜᴇ ʙᴏᴛ ᴏᴡɴᴇʀ ᴄᴀɴ ᴍᴀɴᴀɢᴇ ᴛʜᴇ ɢʀᴏᴜᴘ ʟɪsᴛ.');
    let groups = {};
    try { groups = await sock.groupFetchAllParticipating(); } catch {
        return ctx.reply('❌ ᴄᴏᴜʟᴅ ɴᴏᴛ ʟᴏᴀᴅ ᴛʜᴇ ɢʀᴏᴜᴘ ʟɪsᴛ.');
    }
    const entries = Object.entries(groups).slice(0, 100);
    if (!entries.length) return ctx.reply('📭 ɴᴏ ɢʀᴏᴜᴘs ғᴏᴜɴᴅ.');

    try {
        return await sendInteractiveList(sock, ctx.from, {
            body: '🤖 ᴄʜᴏᴏsᴇ ᴀ ɢʀᴏᴜᴘ ᴛᴏ ᴛᴏɢɢʟᴇ ᴄʜᴀᴛʙᴏᴛ',
            footer: 'ᴛᴀᴘ ᴀ ɢʀᴏᴜᴘ ᴛᴏ ᴇɴᴀʙʟᴇ ᴏʀ ᴅɪsᴀʙʟᴇ ɪᴛ',
            btnTitle: '📋 ɢʀᴏᴜᴘ ʟɪsᴛ',
            sections: [{
                title: 'ɢʀᴏᴜᴘs',
                rows: entries.map(([jid, group]) => ({
                    title: String(group.subject || jid).slice(0, 60),
                    description: db.get('chatbot', jid, false) ? 'ᴄʜᴀᴛʙᴏᴛ ᴏɴ' : 'ᴄʜᴀᴛʙᴏᴛ ᴏғғ',
                    rowId: `chatbot_group_${encodeURIComponent(jid)}`,
                })),
            }],
        }, msg);
    } catch {
        return ctx.reply(entries.map(([jid, group]) =>
            `${group.subject || jid}: ${db.get('chatbot', jid, false) ? 'ᴏɴ' : 'ᴏғғ'}`
        ).join('\n'));
    }
}

async function handleInteractive(sock, msg, ctx, selectedId) {
    if (!String(selectedId || '').startsWith('chatbot_group_')) return false;
    let groupJid = '';
    try { groupJid = decodeURIComponent(String(selectedId).replace('chatbot_group_', '')); } catch {}
    if (!groupJid.endsWith('@g.us')) return true;
    if ((!ctx.isGroup && !ctx.isOwner) || (ctx.isGroup && ctx.from !== groupJid)) {
        await ctx.reply('❌ ᴛʜɪs ɢʀᴏᴜᴘ ᴄᴀɴ ᴏɴʟʏ ʙᴇ ᴄᴏɴᴛʀᴏʟʟᴇᴅ ғʀᴏᴍ ᴛʜᴇ ɢʀᴏᴜᴘ ᴏʀ ʙʏ ᴛʜᴇ ᴏᴡɴᴇʀ.');
        return true;
    }
    const enabled = !db.get('chatbot', groupJid, false);
    db.set('chatbot', groupJid, enabled);
    await ctx.reply(`🤖 ᴄʜᴀᴛʙᴏᴛ ${enabled ? 'ᴇɴᴀʙʟᴇᴅ' : 'ᴅɪsᴀʙʟᴇᴅ'} ғᴏʀ ᴛʜᴀᴛ ɢʀᴏᴜᴘ.`);
    return true;
}

module.exports = {
    name: 'chatbot',
    aliases: ['chat', 'cb', 'togglechatbot', 'chatbotmode'],
    category: 'utility',
    desc: 'ᴜsᴇ ᴀɪ ᴡʜᴇɴ ᴛᴀɢɢᴇᴅ ᴏʀ ʀᴇᴘʟɪᴇᴅ ᴛᴏ',
    usage: '†chatbot on|off|mode|provider|groups|response|status',

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const sub = String(args[0] || 'status').toLowerCase();
        const key = getKey(ctx);

        if (sub === 'on' || sub === 'off') {
            const enabled = sub === 'on';
            db.set('chatbot', key, enabled);
            return ctx.reply(
                `🤖 *ᴄʜᴀᴛʙᴏᴛ: ${enabled ? 'ᴏɴ' : 'ᴏғғ'}*\n\n` +
                (enabled ? 'ᴛᴀɢ ᴍᴇ ᴏʀ ʀᴇᴘʟʏ ᴛᴏ ᴍʏ ᴍᴇssᴀɢᴇs ᴀɴᴅ ɪ ᴡɪʟʟ ʀᴇsᴘᴏɴᴅ.' : 'ɪ ᴡɪʟʟ ɴᴏᴛ ʀᴇsᴘᴏɴᴅ ᴡɪᴛʜ ᴀᴜᴛᴏᴍᴀᴛɪᴄ ᴀɪ ʀᴇᴘʟɪᴇs.') +
                `\n\nᴛᴏɴᴇ: ${PERSONALITIES[selectedTone(key)].label}${s.FOOTER}`
            );
        }

        if (sub === 'mode' || sub === 'tone') {
            const tone = String(args[1] || '').toLowerCase();
            if (!PERSONALITIES[tone]) {
                return ctx.reply(`❌ ᴜsᴇ: ${s.prefix}chatbot mode warm|savage|cold|deadly${s.FOOTER}`);
            }
            db.set('chatbot_mode', key, tone);
            return ctx.reply(`✅ ᴄʜᴀᴛʙᴏᴛ ᴛᴏɴᴇ sᴇᴛ ᴛᴏ ${PERSONALITIES[tone].label}.${s.FOOTER}`);
        }

        if (sub === 'provider') {
            const provider = String(args[1] || '').toLowerCase();
            if (!PROVIDERS.includes(provider)) return ctx.reply(`❌ ᴜsᴇ: ${s.prefix}chatbot provider openai|grok|claude${s.FOOTER}`);
            db.set('chatbot_provider', key, provider);
            return ctx.reply(`✅ ᴄʜᴀᴛʙᴏᴛ ᴘʀᴏᴠɪᴅᴇʀ sᴇᴛ ᴛᴏ ${provider}.${s.FOOTER}`);
        }

        if (sub === 'list' || (sub === 'groups' && ['list', ''].includes(args[1] || ''))) {
            return listGroups(sock, msg, ctx);
        }

        if (sub === 'response' || sub === 'groups') {
            const value = String(args[1] || '').toLowerCase();
            if (!['on', 'off'].includes(value)) {
                return ctx.reply(`❌ ᴜsᴇ: ${s.prefix}chatbot response on|off${s.FOOTER}`);
            }
            db.set('chatbot_global', GLOBAL_GROUPS_KEY, value === 'on');
            return ctx.reply(`✅ ɢʀᴏᴜᴘ ᴀɪ ʀᴇsᴘᴏɴsᴇs ᴀʀᴇ ${value === 'on' ? 'ᴏɴ' : 'ᴏғғ'} ғᴏʀ ᴀʟʟ ɢʀᴏᴜᴘs.${s.FOOTER}`);
        }

        if (sub === 'group') {
            const value = String(args[2] || args[1] || '').toLowerCase();
            if (ctx.isGroup && (!value || ['on', 'off'].includes(value))) {
                const enabled = value === 'on';
                db.set('chatbot', ctx.from, enabled);
                return ctx.reply(`✅ ᴄʜᴀᴛʙᴏᴛ ɪs ${enabled ? 'ᴏɴ' : 'ᴏғғ'} ɪɴ ᴛʜɪs ɢʀᴏᴜᴘ.${s.FOOTER}`);
            }
            return listGroups(sock, msg, ctx);
        }

        const enabled = db.get('chatbot', key, false);
        return ctx.reply(
            `🤖 *ᴄʜᴀᴛʙᴏᴛ sᴛᴀᴛᴜs*\n\n` +
            `sᴛᴀᴛᴜs: ${enabled ? 'ᴏɴ' : 'ᴏғғ'}\n` +
            `ᴛᴏɴᴇ: ${PERSONALITIES[selectedTone(key)].label}\n` +
            `ᴘʀᴏᴠɪᴅᴇʀ: ${selectedProvider(key)}\n` +
            `ɢʀᴏᴜᴘ ʀᴇsᴘᴏɴsᴇs: ${groupResponseEnabled() ? 'ᴏɴ' : 'ᴏғғ'}\n\n` +
            `${s.prefix}chatbot on|off\n` +
            `${s.prefix}chatbot mode warm|savage|cold|deadly\n` +
            `${s.prefix}chatbot provider openai|grok|claude\n` +
            `${s.prefix}chatbot groups list\n` +
            `${s.prefix}chatbot response on|off${s.FOOTER}`
        );
    },

    handleChatbot,
    handleInteractive,
};