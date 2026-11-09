'use strict';

const db = require('../../lib/db');
const { menuBox } = require('../../lib/menuBox');
const theme = require('../../lib/sessionTheme');
const { resolveLid, cacheLidMappings } = require('../../lib/context');

function normId(jid) {
    return String(jid || '')
        .split('@')[0]
        .split(':')[0]
        .replace(/^0+/, '');
}

function isLidJid(jid) {
    return String(jid || '').toLowerCase().endsWith('@lid');
}

function isPhoneJid(jid) {
    return String(jid || '').includes('@s.whatsapp.net');
}

function onlyDigits(s) {
    return String(s || '').replace(/[^0-9]/g, '');
}

function isLikelyPhone(num) {
    const n = onlyDigits(num);
    return n.length >= 8 && n.length <= 15;
}

function sameIdentity(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    return normId(a) === normId(b);
}

function getSudoList(sessionPhone) {
    return db.getSession(sessionPhone, 'config', 'sudo', []) || [];
}

function setSudoList(sessionPhone, list) {
    db.setSession(sessionPhone, 'config', 'sudo', list);
}

/** Normalize list entries to unique jids (string) */
function cleanList(list) {
    const out = [];
    const seen = new Set();
    for (const j of list || []) {
        const id = String(j || '').trim();
        if (!id || !id.includes('@')) continue;
        const key = normId(id) + (isLidJid(id) ? '@lid' : '@s');
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(id);
    }
    return out;
}

async function lidToPhone(sock, lidJid) {
    if (!lidJid) return null;
    const lid = isLidJid(lidJid) ? lidJid : normId(lidJid) + '@lid';

    try {
        const pn = await sock.signalRepository?.lidMapping?.getPNForLID?.(lid);
        if (pn) return pn;
    } catch {}

    try {
        const pn = await sock.signalRepository?.lidMapping?.getPNForLID?.(normId(lid) + '@lid');
        if (pn) return pn;
    } catch {}

    // Cache from group metadata
    try {
        const n = normId(lid);
        const fromCache = resolveLid(n);
        if (fromCache && isLikelyPhone(fromCache) && fromCache !== n) {
            return fromCache + '@s.whatsapp.net';
        }
    } catch {}

    return null;
}

async function phoneToLid(sock, phoneJid) {
    const phone = isPhoneJid(phoneJid)
        ? phoneJid
        : onlyDigits(phoneJid) + '@s.whatsapp.net';
    try {
        const lid = await sock.signalRepository?.lidMapping?.getLIDForPN?.(phone);
        if (lid) return lid;
    } catch {}
    return null;
}

async function enrichFromGroup(sock, ctx, rawJid) {
    const ids = new Set([String(rawJid)]);
    let phone = null;
    let lid = null;

    if (isLidJid(rawJid)) lid = rawJid;
    if (isPhoneJid(rawJid) || isLikelyPhone(rawJid)) {
        phone = isPhoneJid(rawJid) ? rawJid : onlyDigits(rawJid) + '@s.whatsapp.net';
    }

    const scan = (participants) => {
        try { cacheLidMappings(participants || []); } catch {}
        for (const p of participants || []) {
            const pId = String(p.id || '');
            const pLid = String(p.lid || '');
            if (
                sameIdentity(pId, rawJid) ||
                sameIdentity(pLid, rawJid) ||
                (phone && sameIdentity(pId, phone)) ||
                (phone && sameIdentity(pLid, phone))
            ) {
                if (isPhoneJid(pId)) phone = pId;
                if (pLid && isLidJid(pLid)) lid = pLid;
                else if (isLidJid(pId)) lid = pId;
                if (p.lid) lid = p.lid.endsWith('@lid') ? p.lid : String(p.lid).split('@')[0] + '@lid';
            }
        }
    };

    if (ctx.isGroup) {
        if (ctx.groupMeta?.participants) scan(ctx.groupMeta.participants);
        try {
            const meta = await sock.groupMetadata(ctx.from);
            scan(meta.participants || []);
        } catch {}
    }

    if (lid && !phone) phone = await lidToPhone(sock, lid);
    if (phone && !lid) lid = await phoneToLid(sock, phone);

    if (phone) ids.add(phone);
    if (lid) ids.add(lid);

    return {
        ids: [...ids].filter(Boolean),
        phone: phone && isPhoneJid(phone) ? phone : null,
        lid: lid && isLidJid(lid) ? lid : (isLidJid(rawJid) ? rawJid : null),
    };
}

/** Pretty label for list: phone if known, else LID tag */
async function formatEntry(sock, jid) {
    const id = String(jid);
    if (isPhoneJid(id) && isLikelyPhone(normId(id))) {
        return { jid: id, label: '+' + normId(id), mention: id };
    }
    if (isLidJid(id)) {
        const pn = await lidToPhone(sock, id);
        if (pn && isLikelyPhone(normId(pn))) {
            return {
                jid: id,
                label: '+' + normId(pn) + '  (lid)',
                mention: pn,
                phone: pn,
            };
        }
        return {
            jid: id,
            label: 'LID ' + normId(id).slice(0, 8) + '…',
            mention: id,
        };
    }
    return { jid: id, label: normId(id), mention: id };
}

module.exports = {
    name: 'sudo',
    aliases: ['addadmin', 'grantaccess', 'trusted'],
    category: 'system',
    desc: 'Grant/revoke sudo (LID-first, shows phone when resolvable)',
    usage: '.sudo add @user | .sudo remove @user | .sudo list',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const sessionPhone = ctx.sessionPhone;
        if (!sessionPhone) {
            return ctx.reply('❌ No session on this bot.' + s.FOOTER);
        }

        const themed = (key) => theme.string(sessionPhone, key, '');
        const sub = (args[0] || 'list').toLowerCase();
        const mentions = ctx.getMentions?.() || [];

        let rawTarget = mentions[0] || null;
        if (!rawTarget && args[1]) {
            const d = onlyDigits(args[1]);
            if (d) rawTarget = d + '@s.whatsapp.net';
            else if (String(args[1]).includes('@')) rawTarget = args[1];
        }

        let sudoList = cleanList(getSudoList(sessionPhone));

        if (sub === 'add') {
            if (!rawTarget) {
                return ctx.reply(
                    '❌ Tag someone in the group (best method):\n' +
                    '`' + s.prefix + 'sudo add @user`\n\n' +
                    'Or number (may fail if WA only uses LID):\n' +
                    '`' + s.prefix + 'sudo add 234xxxxxxxxxx`' +
                    s.FOOTER
                );
            }

            const enriched = await enrichFromGroup(sock, ctx, rawTarget);
            // Prefer storing LID (what WA sends on messages) + phone if known
            const toAdd = [];
            if (enriched.lid) toAdd.push(enriched.lid);
            if (enriched.phone) toAdd.push(enriched.phone);
            if (!toAdd.length) toAdd.push(rawTarget);

            let added = 0;
            for (const j of toAdd) {
                if (!sudoList.some((x) => sameIdentity(x, j))) {
                    sudoList.push(j);
                    added++;
                }
            }
            sudoList = cleanList(sudoList);
            setSudoList(sessionPhone, sudoList);

            if (!added) {
                return ctx.reply('⚠️ Already sudo on this session.' + s.FOOTER);
            }

            const fmt = await formatEntry(sock, enriched.lid || enriched.phone || rawTarget);
            const lines = [
                '✅ *' + (themed('sudo') || 'Sudo granted') + '* (this session)',
                fmt.label,
            ];
            if (enriched.lid) lines.push('ID: `' + enriched.lid + '`');
            if (enriched.phone) lines.push('Number: `' + normId(enriched.phone) + '`');
            lines.push('_Matched by WhatsApp ID (LID/phone)._');

            return ctx.reply(
                lines.join('\n') + s.FOOTER,
                { mentions: [fmt.mention].filter(Boolean) }
            );
        }

        if (sub === 'remove' || sub === 'revoke') {
            if (!rawTarget) {
                return ctx.reply(
                    '❌ Tag user or pass id/number.\n`' +
                    s.prefix + 'sudo remove @user`' + s.FOOTER
                );
            }

            const enriched = await enrichFromGroup(sock, ctx, rawTarget);
            const keys = new Set(
                [rawTarget, enriched.lid, enriched.phone, ...enriched.ids]
                    .filter(Boolean)
                    .map(normId)
            );

            const before = sudoList.length;
            sudoList = sudoList.filter((j) => !keys.has(normId(j)));
            if (sudoList.length === before) {
                return ctx.reply('❌ Not in this session sudo list.' + s.FOOTER);
            }

            setSudoList(sessionPhone, sudoList);
            return ctx.reply(
                '✅ *' + (themed('sudo remove') || 'Sudo revoked') + '*' + s.FOOTER
            );
        }

        if (sub === 'list') {
            setSudoList(sessionPhone, sudoList);
            if (!sudoList.length) {
                return ctx.reply(
                    '📋 *Sudo (this session):* None\n\n' +
                    'Best: `' + s.prefix + 'sudo add @user` in a group' +
                    s.FOOTER
                );
            }

            // Dedupe display by normId (lid+phone same person once)
            const shown = new Set();
            const lines = [];
            const mentionList = [];
            let i = 1;
            for (const j of sudoList) {
                const k = normId(j);
                if (shown.has(k)) continue;
                // if we also have phone for same person, formatEntry prefers phone label
                const fmt = await formatEntry(sock, j);
                shown.add(k);
                if (fmt.phone) shown.add(normId(fmt.phone));
                lines.push(i + '. ' + fmt.label);
                if (isLidJid(j)) lines.push('    `' + j + '`');
                if (fmt.phone) lines.push('    `+' + normId(fmt.phone) + '`');
                mentionList.push(fmt.mention);
                i++;
            }

            return ctx.reply(
                '👑 *Sudo Users (' + (i - 1) + ')* — this session\n\n' +
                lines.join('\n') + s.FOOTER,
                { mentions: mentionList.filter(Boolean) }
            );
        }

        return ctx.reply(
            menuBox('👑', 'sᴜᴅᴏ', [
                '`' + s.prefix + 'sudo add @user` — Grant (stores LID)',
                '`' + s.prefix + 'sudo remove @user` — Revoke',
                '`' + s.prefix + 'sudo list` — List (phone if known)',
            ]) + s.FOOTER
        );
    },
};