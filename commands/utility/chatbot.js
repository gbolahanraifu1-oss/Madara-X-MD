// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Chatbot                           ║
// ║   Responds when bot is tagged or replied to          ║
// ╚══════════════════════════════════════════════════════╝

const db       = require('../../lib/db');
const settings = require('../../settings');
const { wasSentByBot } = require('../../lib/sentTracker');

// ── Personality responses ──────────────────────────────────────────────────
const PERSONALITIES = {
    warm: {
        label: 'Warm 🌸',
        greet: ['Hey bestie! 💕 What can I do for you?', 'Hiii! You called? 🌸', 'Heyyy! 😊 What do you need?'],
        unknown: ['Aww I\'m not sure about that 🥺 but I\'m here for you!', 'Hmm I don\'t know, but let\'s figure it out together! 💕', 'I\'m not sure, but you can ask me anything!'],
        bye: ['Take care! 💕', 'See you later bestie! 🌸', 'Bye for now! 😊']
    },
    savage: {
        label: 'Savage 😤',
        greet: ['What do you want? 😤', 'Yeah? Speak fast.', 'You rang? Make it quick. ⚡'],
        unknown: ['Figure it out yourself 😒', 'I don\'t do that. Next question.', 'Not my problem 💅'],
        bye: ['Finally 🙄', 'Took you long enough to leave 💅', 'Bye. Don\'t make it weird.']
    },
    cold: {
        label: 'Cold 🧊',
        greet: ['Yes?', 'What.', 'Processing your request.'],
        unknown: ['Unknown query.', 'Insufficient data.', 'No relevant response found.'],
        bye: ['Acknowledged.', 'Session ended.', 'Goodbye.']
    },
    deadly: {
        label: 'Deadly ☠️',
        greet: ['You dare summon me? ☠️', 'Another soul seeks my attention... 💀', 'Speak before I lose interest. ☠️'],
        unknown: ['Silence is my answer 💀', 'Not worth my time ☠️', 'Unworthy question. Try again.'],
        bye: ['Disappear. ☠️', 'Your time is up 💀', 'Don\'t come back unless you have something worthy.']
    }
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function buildResponse(mode, body) {
    const p   = PERSONALITIES[mode] || PERSONALITIES.warm;
    const low = body.toLowerCase();

    if (!body || low.match(/^(hi|hello|hey|sup|yo|oi|hola|salut|howdy)/)) return pick(p.greet);
    if (low.match(/bye|goodbye|cya|later|gtg/)) return pick(p.bye);

    // Echo meaningful content with personality flavour
    switch (mode) {
        case 'warm':    return `Aww, you said "_${body}_"? That's interesting! 💕 Tell me more?`;
        case 'savage':  return `"_${body}_"? Really? That's what you went with? 😒`;
        case 'cold':    return `Noted: "_${body}". Standby for processing.`;
        case 'deadly':  return `"_${body}_"... Interesting last words. ☠️`;
        default:        return pick(p.greet);
    }
}

// ── Called from handler.js on every non-command message ───────────────────
async function handleChatbot(sock, msg, ctx) {
    const { from, sender, body, isGroup } = ctx;

    // Only skip if THIS exact message is an echo of something the bot itself
    // just sent — not just because fromMe is true (owner's own typed
    // messages also have fromMe:true in a self-bot, and those SHOULD be
    // processed normally, e.g. replying to themselves in self-chat).
    if (msg.key.fromMe && wasSentByBot(msg.key.id)) return false;

    // Check if chatbot is enabled for this group/chat
    const key     = isGroup ? from : sender;
    const enabled = db.get('chatbot', key, false);
    if (!enabled) return false;

    const mode = db.get('chatbot_mode', key, 'warm');

    // ── LID-aware bot identity ──────────────────────────────────────────
    // WhatsApp is rolling out @lid as a privacy ID format that is NOT
    // derived from the phone number — it's a completely separate ID space.
    // sock.user.id is the bot's PN-based JID, sock.user.lid (when present)
    // is its LID-based identity. Mentions/replies in @lid groups will use
    // the LID form, so we must check BOTH to reliably detect a tag/reply.
    const stripDevice = (jid) => (jid || '').split(':')[0].split('@')[0];
    const botPnNum  = stripDevice(sock.user?.id);
    const botLidNum = stripDevice(sock.user?.lid);

    const matchesBot = (jid) => {
        if (!jid) return false;
        const num = stripDevice(jid);
        return (botPnNum && num === botPnNum) || (botLidNum && num === botLidNum);
    };

    const mentions  = ctx.getMentions?.() || [];
    const botTagged = mentions.some(matchesBot);

    // Check if the message is a reply to the bot's message
    const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const fromBotMessage    = matchesBot(quotedParticipant);

    if (!isGroup) {
        // In private chat: always respond if chatbot is ON
    } else {
        // In group: only respond if bot is mentioned or someone replies to bot
        if (!botTagged && !fromBotMessage) return false;
    }

    // Strip the bot's tag (either PN or LID form) from the message
    const cleanBody = body
        .replace(new RegExp(`@${botPnNum}`, 'g'), '')
        .replace(new RegExp(`@${botLidNum}`, 'g'), '')
        .trim();
    const response = await buildResponse(mode, cleanBody || body);

    try {
        await sock.sendMessage(from, {
            text: response,
            mentions: [sender]
        }, { quoted: msg });
    } catch {}

    return true;
}

module.exports = {
    name: 'chatbot',
    aliases: ['cb', 'togglechatbot', 'chatbotmode'],
    category: 'utility',
    desc: 'Toggle chatbot — bot replies when tagged or replied to, with selectable personality',
    usage: '†chatbot [on|off|mode warm|savage|cold|deadly|status]',
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || 'status').toLowerCase();
        const key = ctx.isGroup ? ctx.from : ctx.sender;

        if (sub === 'on') {
            db.set('chatbot', key, true);
            const mode = db.get('chatbot_mode', key, 'warm');
            return ctx.reply(
                `🤖 *Chatbot: ON*\n\n` +
                `Current personality: *${PERSONALITIES[mode]?.label || mode}*\n\n` +
                `_Tag me or reply to my messages and I'll respond!_\n` +
                `Change personality: \`${s.prefix}chatbot mode [warm|savage|cold|deadly]\`${s.FOOTER}`
            );
        }

        if (sub === 'off') {
            db.set('chatbot', key, false);
            return ctx.reply(`🤖 *Chatbot: OFF*\n\n_I'll only respond to commands now._${s.FOOTER}`);
        }

        if (sub === 'mode') {
            const newMode = (args[1] || '').toLowerCase();
            if (!PERSONALITIES[newMode]) return ctx.reply(
                `❌ Unknown personality.\n\nAvailable: *warm* 🌸 | *savage* 😤 | *cold* 🧊 | *deadly* ☠️${s.FOOTER}`
            );
            db.set('chatbot_mode', key, newMode);
            return ctx.reply(
                `🤖 *Chatbot personality set to: ${PERSONALITIES[newMode].label}*\n\n` +
                `_${pick(PERSONALITIES[newMode].greet)}_${s.FOOTER}`
            );
        }

        // Status
        const enabled = db.get('chatbot', key, false);
        const mode    = db.get('chatbot_mode', key, 'warm');
        ctx.reply(
            `🤖 *Chatbot Status*\n\n` +
            `Status: ${enabled ? '✅ ON' : '❌ OFF'}\n` +
            `Personality: *${PERSONALITIES[mode]?.label || mode}*\n\n` +
            `*Personalities:*\n` +
            `• \`warm\` 🌸 — friendly & caring\n` +
            `• \`savage\` 😤 — blunt & sarcastic\n` +
            `• \`cold\` 🧊 — short & robotic\n` +
            `• \`deadly\` ☠️ — dark & intimidating\n\n` +
            `*Commands:*\n` +
            `• \`${s.prefix}chatbot on/off\`\n` +
            `• \`${s.prefix}chatbot mode [personality]\`${s.FOOTER}`
        );
    }
};

module.exports.handleChatbot = handleChatbot;
