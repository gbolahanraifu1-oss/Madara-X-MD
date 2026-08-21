const db = require('../../lib/db');

// ── Built-in default toxic-word set (used alongside each group's custom
// list). Kept intentionally generic — group admins extend it with
// `.antibadword add <word>` for anything language/community-specific.
const DEFAULT_WORDS = [
    'fuck', 'bitch', 'asshole', 'bastard', 'dick', 'nigga', 'cunt', 'whore',
];

function buildRegex(words) {
    if (!words.length) return null;
    const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(`\\b(${escaped.join('|')})\\b`, 'i');
}

// ── Auto-handler called from handler.js ──────────────────
async function checkBadWord(sock, from, sender, msg, ctx) {
    try {
        if (!from?.endsWith('@g.us')) return false;
        if (msg.key.fromMe) return false;

        const key = `badwords_${from}`;
        const cfg = db.get('antibadword', key, { enabled: false, words: [] });
        if (!cfg.enabled) return false;

        const body = ctx?.body || msg.message?.conversation
            || msg.message?.extendedTextMessage?.text || '';
        if (!body) return false;

        const words = [...DEFAULT_WORDS, ...(cfg.words || [])];
        const re    = buildRegex(words);
        if (!re || !re.test(body)) return false;

        // Skip admins
        if (ctx?.isSenderAdmin) return false;

        const isBotAdmin = ctx?.isBotAdmin ?? false;

        await sock.sendMessage(from, {
            text: `🚫 *Bad word detected!*\n@${sender.split('@')[0]}, please keep the chat clean.${isBotAdmin ? '' : '\n\n_Bot isn\u2019t admin, so the message couldn\u2019t be removed._'}`,
            mentions: [sender],
        }, { quoted: msg }).catch(() => {});

        if (isBotAdmin) {
            try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
        }

        return true;
    } catch (err) {
        console.error('[antibadword] error:', err.message);
        return false;
    }
}

module.exports = {
    name: 'antibadword',
    aliases: ['antibad', 'badwordfilter', 'profanityfilter'],
    category: 'group',
    desc: 'Toggle bad word filter with custom word list',
    usage: '†antibadword [on|off] | †antibadword add [word] | †antibadword list',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const sub = args[0]?.toLowerCase();
        const key = `badwords_${ctx.from}`;
        const cfg = db.get('antibadword', key, { enabled: false, words: [] });
        if (sub === 'on') { cfg.enabled = true; db.set('antibadword', key, cfg); return ctx.reply(`✅ Bad word filter *enabled*.${s.FOOTER}`); }
        if (sub === 'off') { cfg.enabled = false; db.set('antibadword', key, cfg); return ctx.reply(`❌ Bad word filter *disabled*.${s.FOOTER}`); }
        if (sub === 'add') {
            const word = args.slice(1).join(' ').toLowerCase();
            if (!word) return ctx.reply(`❌ Provide a word to add.${s.FOOTER}`);
            if (!cfg.words.includes(word)) cfg.words.push(word);
            db.set('antibadword', key, cfg);
            return ctx.reply(`✅ Added *"${word}"* to bad word list.${s.FOOTER}`);
        }
        if (sub === 'remove') {
            const word = args.slice(1).join(' ').toLowerCase();
            cfg.words = cfg.words.filter(w => w !== word);
            db.set('antibadword', key, cfg);
            return ctx.reply(`✅ Removed *"${word}"*.${s.FOOTER}`);
        }
        if (sub === 'list') {
            if (!cfg.words.length) return ctx.reply(`📋 No custom bad words set.${s.FOOTER}`);
            return ctx.reply(`📋 *Bad Words:*\n${cfg.words.map((w,i) => `${i+1}. ${w}`).join('\n')}${s.FOOTER}`);
        }
        ctx.reply(`⚙️ *Anti-Badword:* ${cfg.enabled ? '✅ On' : '❌ Off'}\n*Words:* ${cfg.words.length}\n\nUsage:\n\`${s.prefix}antibadword on/off\`\n\`${s.prefix}antibadword add [word]\`\n\`${s.prefix}antibadword list\`${s.FOOTER}`);
    }
};
module.exports.checkBadWord = checkBadWord;
