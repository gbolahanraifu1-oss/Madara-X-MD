// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  PM BLOCKER
// Blocks non-owner users who message the bot privately, when enabled.
// (Group only mode is best paired with a single prefix.)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const db = require('../../lib/db');
const { menuBox } = require('../../lib/menuBox');

function normaliseNumber(jid) {
    return String(jid || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

function countryCodes() {
    return db.get('settings', 'pmBlockCountryCodes', []);
}

function cleanCodes(values) {
    return [...new Set(values.flatMap(value =>
        String(value || '').split(',').map(code => code.replace(/[^0-9]/g, ''))
    ).filter(code => code.length >= 1 && code.length <= 4))];
}

// ── Auto-handler called from handler.js on every private message ─────────
async function checkPmBlock(sock, from, sender, msg, ctx) {
    try {
        if (msg.key.fromMe) return false;
        if (from?.endsWith('@g.us')) return false; // groups are never blocked
        if (ctx?.isOwner) return false;

        const enabled = db.get('settings', 'pmblocker', false);
        const number = normaliseNumber(sender);
        const countryMatch = countryCodes().some(code => number.startsWith(code));
        if (!enabled && !countryMatch) return false;
        const allowlist = db.get('settings', 'pmAllowlist', []);
        if (allowlist.map(normaliseNumber).includes(number)) return false;

        // Block before sending the notice: a country rule must take effect
        // on the first private message, not on the next one.
        await sock.updateBlockStatus(sender, 'block').catch(() => {});
        await sock.sendMessage(
            from,
            {
                text: `*Hello @${number}, messaging the bot privately is currently disabled. You have been blocked from using the bot.*`,
                mentions: [sender],
            },
            { quoted: msg }
        ).catch(() => {});
        return true;
    } catch (err) {
        console.error('[pmblocker] error:', err.message);
        return false;
    }
}

// ── Command plugin ────────────────────────────────────────
module.exports = {
    name: 'pmblocker',
    aliases: ['pmblock'],
    category: 'misc',
    desc: 'Block non-owner users who DM the bot privately',
    usage: '†pmblocker on|off|country|list',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on') {
            db.set('settings', 'pmblocker', true);
            return ctx.reply(menuBox('✅', 'ᴘᴍʙʟᴏᴄᴋᴇʀ', [
                'ᴘᴍ ʙʟᴏᴄᴋᴇʀ ᴇɴᴀʙʟᴇᴅ',
                'ɴᴏɴ-ᴏᴡɴᴇʀ ᴘʀɪᴠᴀᴛᴇ ᴍᴇssᴀɢᴇs ᴡɪʟʟ ʙᴇ ʙʟᴏᴄᴋᴇᴅ',
                countryCodes().length ? `ᴄᴏᴜɴᴛʀʏ ʀᴜʟᴇs: ${countryCodes().join(', ')}` : 'ɴᴏ ᴄᴏᴜɴᴛʀʏ ʀᴜʟᴇs sᴇᴛ',
            ]) + s.FOOTER);
        }
        if (sub === 'off') {
            db.set('settings', 'pmblocker', false);
            return ctx.reply(menuBox('❌', 'ᴘᴍʙʟᴏᴄᴋᴇʀ', [
                'ᴘᴍ ʙʟᴏᴄᴋᴇʀ ᴅɪsᴀʙʟᴇᴅ',
                countryCodes().length ? 'ᴄᴏᴜɴᴛʀʏ ʀᴜʟᴇs ʀᴇᴍᴀɪɴ ᴀᴄᴛɪᴠᴇ' : 'ɴᴏ ᴄᴏᴜɴᴛʀʏ ʀᴜʟᴇs ᴀᴄᴛɪᴠᴇ',
            ]) + s.FOOTER);
        }

        if (['country', 'code', 'countrycode', 'add'].includes(sub)) {
            const codes = cleanCodes(args.slice(1));
            if (!codes.length) {
                return ctx.reply(menuBox('🌍', 'ᴘᴍʙʟᴏᴄᴋᴇʀ', [
                    `${s.prefix}pmblocker country 234`,
                    `${s.prefix}pmblocker country 234,1`,
                    'ᴜsᴇ ᴄᴏᴜɴᴛʀʏ ᴄᴏᴅᴇs ᴡɪᴛʜᴏᴜᴛ +',
                ]) + s.FOOTER);
            }
            const merged = cleanCodes([...countryCodes(), ...codes]);
            db.set('settings', 'pmBlockCountryCodes', merged);
            return ctx.reply(menuBox('🌍', 'ᴘᴍʙʟᴏᴄᴋᴇʀ', [
                `ᴀᴜᴛᴏ-ʙʟᴏᴄᴋ ᴄᴏᴜɴᴛʀʏ ᴄᴏᴅᴇs: ${merged.join(', ')}`,
                'ᴍᴀᴛᴄʜɪɴɢ ᴘʀɪᴠᴀᴛᴇ ᴅᴍs ᴀʀᴇ ʙʟᴏᴄᴋᴇᴅ ɪᴍᴍᴇᴅɪᴀᴛᴇʟʏ',
            ]) + s.FOOTER);
        }

        if (sub === 'remove' || sub === 'del' || sub === 'delete') {
            const remove = new Set(cleanCodes(args.slice(1)));
            const remaining = countryCodes().filter(code => !remove.has(code));
            db.set('settings', 'pmBlockCountryCodes', remaining);
            return ctx.reply(menuBox('🗑️', 'ᴘᴍʙʟᴏᴄᴋᴇʀ', [
                `ʀᴇᴍᴏᴠᴇᴅ: ${[...remove].join(', ') || 'ɴᴏɴᴇ'}`,
                `ᴀᴄᴛɪᴠᴇ ᴄᴏᴜɴᴛʀʏ ᴄᴏᴅᴇs: ${remaining.join(', ') || 'ɴᴏɴᴇ'}`,
            ]) + s.FOOTER);
        }

        const cur = db.get('settings', 'pmblocker', false);
        return ctx.reply(menuBox('🚫', 'ᴘᴍʙʟᴏᴄᴋᴇʀ', [
            `ᴘᴍ ʙʟᴏᴄᴋᴇʀ: ${cur ? 'ᴏɴ' : 'ᴏғғ'}`,
            `ᴄᴏᴜɴᴛʀʏ ᴄᴏᴅᴇs: ${countryCodes().join(', ') || 'ɴᴏɴᴇ'}`,
            `${s.prefix}pmblocker on|off`,
            `${s.prefix}pmblocker country 234`,
            `${s.prefix}pmblocker remove 234`,
        ]) + s.FOOTER);
    }
};
module.exports.checkPmBlock = checkPmBlock;
