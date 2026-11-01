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

/** Real phone only: 7–15 digits, reject obvious LID-length garbage when unresolved */
function isRealPhone(num) {
    if (!num || !/^[0-9]{7,15}$/.test(num)) return false;
    // WhatsApp LIDs are often 15+ digit internal ids; Nigerian/mobile lines are typically 10–13 with country code
    if (num.length > 15) return false;
    return true;
}

function toPhoneJid(num) {
    return num + '@s.whatsapp.net';
}

function getSudoList(sessionPhone) {
    return db.getSession(sessionPhone, 'config', 'sudo', []) || [];
}

function setSudoList(sessionPhone, list) {
    db.setSession(sessionPhone, 'config', 'sudo', list);
}

function cleanList(list) {
    const seen = new Set();
    const out = [];
    for (const j of list || []) {
        const n = normNum(j);
        if (!isRealPhone(n)) continue; // drop LIDs / junk
        if (seen.has(n)) continue;
        seen.add(n);
        out.push(toPhoneJid(n));
    }
    return out;
}

async function resolveToPhoneJid(sock, ctx, rawJid) {
    if (!rawJid) return null;

    // Already a plain number argument
    let num = normNum(rawJid);

    // LID cache
    try {
        const resolved = resolveLid(num);
        if (resolved && isRealPhone(resolved)) num = resolved;
    } catch {}

    // Group participants: prefer @s.whatsapp.net id over @lid
    const scanParts = async (participants) => {
        cacheLidMappings(participants || []);
        for (const p of participants || []) {
            const pId = String(p.id || '');
            const pLid = String(p.lid || '');
            if (
                pId === rawJid ||
                pLid === rawJid ||
                normNum(pLid) === normNum(rawJid) ||
                normNum(pId) === normNum(rawJid)
            ) {
                const pNum = normNum(pId);
                if (pId.includes('@s.whatsapp.net') && isRealPhone(pNum)) return pNum;
                const fromCache = resolveLid(normNum(pLid)) || resolveLid(pNum);
                if (fromCache && isRealPhone(fromCache)) return fromCache;
                if (isRealPhone(pNum) && !isLidJid(pId)) return pNum;
            }
        }
        return null;
    };

    if (ctx.isGroup) {
        let hit = null;
        if (ctx.groupMeta?.participants) {
            hit = await scanParts(ctx.groupMeta.participants);
        }
        if (!hit) {
            try {
                const meta = await sock.groupMetadata(ctx.from);
                hit = await scanParts(meta.participants || []);
            } catch {}
        }
        if (hit) num = hit;
    }

    // Quoted participant sometimes has real jid
    try {
        const q = msgParticipant(ctx);
        if (q && normNum(q) === normNum(rawJid)) {
            const qn = normNum(q);
            if (isRealPhone(qn) && String(q).includes('@s.whatsapp.net')) num = qn;
        }
    } catch {}

    if (!isRealPhone(num)) return null;
    // If original was @lid and we never resolved to a different phone, reject
    if (isLidJid(rawJid) && num === normNum(rawJid)) return null;

    return toPhoneJid(num);
}

function msgParticipant(ctx) {
    return ctx.msg?.message?.extendedTextMessage?.contextInfo?.participant || null;
}

module.exports = {
    name: 'sudo',
    aliases: ['addadmin', 'grantaccess', 'trusted'],
    category: 'system',
    desc: 'Grant/revoke sudo per paired session — stores real phone numbers only',
    usage: '.sudo add @user | .sudo remove @user | .sudo list',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const sessionPhone = ctx.sessionPhone;
        if (!sessionPhone) {
            return ctx.reply('❌ No session phone on this bot instance.' + s.FOOTER);
        }

        const themed = (key) => theme.string(sessionPhone, key, '');
        const sub = (args[0] || 'list').toLowerCase();
        const mentions = ctx.getMentions?.() || [];

        let rawTarget = mentions[0] || null;
        if (!rawTarget && args[1]) {
            const digits = String(args[1]).replace(/[^0-9]/g, '');
            if (digits) rawTarget = digits + '@s.whatsapp.net';
        }

        // Always work on cleaned per-session list
        let sudoList = cleanList(getSudoList(sessionPhone));
        setSudoList(sessionPhone, sudoList); // migrate: strip old global LIDs from this session key

        if (sub === 'add') {
            if (!rawTarget) {
                return ctx.reply(
                    '❌ Tag a user or pass a number.\n' +
                    '`' + s.prefix + 'sudo add @user`\n' +
                    '`' + s.prefix + 'sudo add 2348012345678`\n\n' +
                    '_If tag fails (LID), use the full international number._' +
                    s.FOOTER
                );
            }

            const target = await resolveToPhoneJid(sock, ctx, rawTarget);
            if (!target) {
                return ctx.reply(
                    '❌ Could not resolve a *real* phone number (WhatsApp sent a LID).\n' +
                    'Use the number directly:\n' +
                    '`' + s.prefix + 'sudo add 234xxxxxxxxxx`' +
                    s.FOOTER
                );
            }

            const targetNum = normNum(target);
            if (sudoList.some((j) => normNum(j) === targetNum)) {
                return ctx.reply(
                    '⚠️ @' + targetNum + ' already has sudo on this session.' + s.FOOTER,
                    { mentions: [target] }
                );
            }

            sudoList.push(target);
            sudoList = cleanList(sudoList);
            setSudoList(sessionPhone, sudoList);

            return ctx.reply(
                '✅ *' + (themed('sudo') || 'Sudo granted') + '* (this session only)\n' +
                '@' + targetNum + '\n`' + targetNum + '`' + s.FOOTER,
                { mentions: [target] }
            );
        }

        if (sub === 'remove' || sub === 'revoke') {
            if (!rawTarget) {
                return ctx.reply(
                    '❌ Tag a user or pass a number.\n`' +
                    s.prefix + 'sudo remove 234xxxxxxxxxx`' + s.FOOTER
                );
            }

            const target = await resolveToPhoneJid(sock, ctx, rawTarget);
            const targetNum = target ? normNum(target) : normNum(rawTarget);
            if (!isRealPhone(targetNum)) {
                return ctx.reply('❌ Invalid number.' + s.FOOTER);
            }

            const before = sudoList.length;
            sudoList = sudoList.filter((j) => normNum(j) !== targetNum);
            if (sudoList.length === before) {
                return ctx.reply(
                    '❌ `' + targetNum + '` is not in this session sudo list.' + s.FOOTER
                );
            }

            setSudoList(sessionPhone, sudoList);
            return ctx.reply(
                '✅ *' + (themed('sudo') || 'Sudo revoked') + '*\n`' + targetNum + '`' + s.FOOTER,
                { mentions: target ? [target] : [] }
            );
        }

        if (sub === 'list') {
            if (!sudoList.length) {
                return ctx.reply(
                    '📋 *Sudo Users (this session):* None\n\n' +
                    '`' + s.prefix + 'sudo add 234...`' + s.FOOTER
                );
            }

            const list = sudoList
                .map((j, i) => (i + 1) + '. @' + normNum(j) + '\n    `' + normNum(j) + '`')
                .join('\n');

            return ctx.reply(
                '👑 *Sudo Users (' + sudoList.length + ')* — this session\n\n' +
                list + s.FOOTER,
                { mentions: sudoList }
            );
        }

        return ctx.reply(
            menuBox('👑', 'sᴜᴅᴏ', [
                '`' + s.prefix + 'sudo add 234…` — Grant (real number)',
                '`' + s.prefix + 'sudo add @user` — Grant if tag resolves',
                '`' + s.prefix + 'sudo remove 234…` — Revoke',
                '`' + s.prefix + 'sudo list` — List (per session)',
            ]) + s.FOOTER
        );
    },
};