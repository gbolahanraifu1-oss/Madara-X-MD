'use strict';

const db = require('../../lib/db');
const { menuBox } = require('../../lib/menuBox');
const theme = require('../../lib/sessionTheme');
const { resolveLid, cacheLidMappings } = require('../../lib/context');

function normNum(jid) {
    return String(jid || '')
        .split('@')[0]
        .split(':')[0]
        .replace(/[^0-9]/g, '')
        .replace(/^0+/, '');
}

function isLidJid(jid) {
    return String(jid || '').endsWith('@lid');
}

/**
 * Resolve mention/JID to real phone JID: 234xxx@s.whatsapp.net
 */
async function resolveToPhoneJid(sock, ctx, rawJid) {
    if (!rawJid) return null;

    let num = normNum(rawJid);

    try {
        const resolved = resolveLid(num);
        if (resolved && /^[0-9]{7,15}$/.test(resolved)) num = resolved;
    } catch {}

    if (ctx.isGroup && ctx.groupMeta?.participants) {
        try {
            cacheLidMappings(ctx.groupMeta.participants);
            for (const p of ctx.groupMeta.participants) {
                const pId = String(p.id || '');
                const pLid = String(p.lid || '');
                const pNum = normNum(pId);
                const lNum = normNum(pLid);
                if (
                    pId === rawJid ||
                    pLid === rawJid ||
                    lNum === normNum(rawJid) ||
                    pNum === normNum(rawJid)
                ) {
                    if (pId.includes('@s.whatsapp.net') && /^[0-9]{7,15}$/.test(pNum)) {
                        num = pNum;
                        break;
                    }
                    if (/^[0-9]{7,15}$/.test(pNum) && pNum.length >= 10) {
                        num = pNum;
                        break;
                    }
                    const fromCache = resolveLid(lNum) || resolveLid(pNum);
                    if (fromCache && /^[0-9]{7,15}$/.test(fromCache)) {
                        num = fromCache;
                        break;
                    }
                }
            }
        } catch {}
    }

    if (ctx.isGroup && (!num || num.length < 10 || isLidJid(rawJid))) {
        try {
            const meta = await sock.groupMetadata(ctx.from);
            cacheLidMappings(meta.participants || []);
            for (const p of meta.participants || []) {
                const pId = String(p.id || '');
                const pLid = String(p.lid || '');
                if (pId === rawJid || pLid === rawJid || normNum(pLid) === normNum(rawJid)) {
                    const pNum = normNum(pId);
                    if (pId.includes('@s.whatsapp.net') && pNum.length >= 10) {
                        num = pNum;
                        break;
                    }
                }
            }
            const cached = resolveLid(normNum(rawJid));
            if (cached && cached.length >= 10) num = cached;
        } catch {}
    }

    if (!num || num.length < 7) return null;
    if (isLidJid(rawJid) && num === normNum(rawJid) && num.length > 15) return null;

    return num + '@s.whatsapp.net';
}

function normalizeStored(j) {
    const n = normNum(j);
    if (!n) return null;
    let phone = n;
    try {
        const resolved = resolveLid(n);
        if (resolved && resolved.length >= 10) phone = resolved;
    } catch {}
    if (phone.length < 7) return null;
    return phone + '@s.whatsapp.net';
}

function cleanSudoList(list) {
    const seen = new Set();
    const out = [];
    for (const j of list || []) {
        const n = normalizeStored(j);
        if (!n) continue;
        const num = normNum(n);
        if (seen.has(num)) continue;
        seen.add(num);
        out.push(n);
    }
    return out;
}

module.exports = {
    name: 'sudo',
    aliases: ['addadmin', 'grantaccess', 'trusted'],
    category: 'system',
    desc: 'Grant/revoke sudo (elevated) access to a user — they can use owner-level commands',
    usage: '.sudo add @user | .sudo remove @user | .sudo list',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const themed = (key) => theme.string(ctx.sessionPhone, key, '');
        const sub = (args[0] || 'list').toLowerCase();
        const mentions = ctx.getMentions?.() || [];

        let rawTarget = mentions[0] || null;
        if (!rawTarget && args[1]) {
            const digits = String(args[1]).replace(/[^0-9]/g, '');
            if (digits) rawTarget = digits + '@s.whatsapp.net';
        }

        let sudoList = cleanSudoList(db.get('system', 'sudo', []) || []);

        if (sub === 'add') {
            if (!rawTarget) {
                return ctx.reply(
                    '❌ Tag a user or pass a number.\n`' +
                    s.prefix + 'sudo add @user`\n`' +
                    s.prefix + 'sudo add 2348012345678`' +
                    s.FOOTER
                );
            }

            const target = await resolveToPhoneJid(sock, ctx, rawTarget);
            if (!target) {
                return ctx.reply(
                    '❌ Could not resolve a real phone number from that tag (got LID only).\n' +
                    'Use: `' + s.prefix + 'sudo add 234xxxxxxxxxx`' +
                    s.FOOTER
                );
            }

            const targetNum = normNum(target);
            if (sudoList.some((j) => normNum(j) === targetNum)) {
                return ctx.reply(
                    '⚠️ @' + targetNum + ' already has sudo access.' + s.FOOTER,
                    { mentions: [target] }
                );
            }

            sudoList.push(target);
            sudoList = cleanSudoList(sudoList);
            db.set('system', 'sudo', sudoList);

            return ctx.reply(
                '✅ *' + (themed('sudo') || 'Sudo access granted.') + '*\n' +
                '@' + targetNum + ' can now use elevated commands.' + s.FOOTER,
                { mentions: [target] }
            );
        }

        if (sub === 'remove' || sub === 'revoke') {
            if (!rawTarget) {
                return ctx.reply(
                    '❌ Tag a user or pass a number.\n`' +
                    s.prefix + 'sudo remove @user`' +
                    s.FOOTER
                );
            }

            const target = await resolveToPhoneJid(sock, ctx, rawTarget);
            const targetNum = target ? normNum(target) : normNum(rawTarget);

            const before = sudoList.length;
            sudoList = sudoList.filter((j) => normNum(j) !== targetNum);
            if (sudoList.length === before) {
                return ctx.reply(
                    '❌ @' + targetNum + " doesn't have sudo access." + s.FOOTER,
                    { mentions: target ? [target] : [] }
                );
            }

            db.set('system', 'sudo', sudoList);
            return ctx.reply(
                '✅ *' + (themed('sudo') || 'Sudo access revoked.') + '*\n' +
                '@' + targetNum + ' no longer has elevated access.' + s.FOOTER,
                { mentions: target ? [target] : [] }
            );
        }

        if (sub === 'list') {
            // Persist cleaned numbers (strip old LIDs)
            const stored = db.get('system', 'sudo', []) || [];
            if (sudoList.length !== stored.length) {
                db.set('system', 'sudo', sudoList);
            }

            if (!sudoList.length) {
                return ctx.reply(
                    '📋 *Sudo Users:* None\n\nGrant: `' +
                    s.prefix + 'sudo add @user` or `' +
                    s.prefix + 'sudo add 234...`' +
                    s.FOOTER
                );
            }

            const list = sudoList
                .map((j, i) => (i + 1) + '. @' + normNum(j) + '  `' + normNum(j) + '`')
                .join('\n');

            return ctx.reply(
                '👑 *Sudo Users (' + sudoList.length + '):*\n\n' +
                list +
                s.FOOTER,
                { mentions: sudoList }
            );
        }

        return ctx.reply(
            menuBox('👑', 'sᴜᴅᴏ', [
                '`' + s.prefix + 'sudo add @user` — Grant (resolves to real number)',
                '`' + s.prefix + 'sudo add 2348…` — Grant by number',
                '`' + s.prefix + 'sudo remove @user` — Revoke',
                '`' + s.prefix + 'sudo list` — Show sudo users (phone numbers)',
            ]) + s.FOOTER
        );
    },
};