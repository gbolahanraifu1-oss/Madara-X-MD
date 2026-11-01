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
 * Resolve any mention/JID to a real phone number JID: 234xxx@s.whatsapp.net
 * Uses group participant list + LID cache so @lid tags become real numbers.
 */
async function resolveToPhoneJid(sock, ctx, rawJid) {
    if (!rawJid) return null;

    let num = normNum(rawJid);

    // Prefer LID cache from context
    try {
        const resolved = resolveLid(num);
        if (resolved && /^[0-9]{7,15}$/.test(resolved)) num = resolved;
    } catch {}

    // If still looks like LID-only, scan group participants for phone mapping
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
                    // Prefer real @s.whatsapp.net id
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

    // Fresh metadata fetch if still unresolved and in group
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

    // Explicit number argument already digits-only
    if (!num && argsDigits) num = argsDigits;

    if (!num || num.length < 7) return null;
    // Reject pure LID-looking short/weird values if we never resolved
    if (isLidJid(rawJid) && num === normNum(rawJid) && num.length > 15) {
        // very long numeric LID not resolved to phone — fail rather than store LID
        return null;
    }

    return num + '@s.whatsapp.net';
}

module.exports = {
    name: 'sudo',
    aliases: ['addadmin', 'grantaccess', 'trusted'],
    category: 'system',
    desc: 'Grant/revoke sudo (elevated) access to a user — they can use owner-level commands',
    usage: '†sudo add @user | †sudo remove @user | †sudo list',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const themed = (key) => theme.string(ctx.sessionPhone, key, '');
        const sub = (args[0] || 'list').toLowerCase();
        const mentions = ctx.getMentions?.() || [];

        // Prefer mention; else digits from args[1]
        let rawTarget = mentions[0] || null;
        if (!rawTarget && args[1]) {
            const digits = String(args[1]).replace(/[^0-9]/g, '');
            if (digits) rawTarget = digits + '@s.whatsapp.net';
        }

        let sudoList = db.get('system', 'sudo', []) || [];
        // Normalize any old LID entries on list view / ops
        const normalizeStored = (j) => {
            const n = normNum(j);
            if (!n) return null;
            // If stored as lid, try resolve
            const resolved = resolveLid(n);
            const phone = (resolved && resolved.length >= 10) ? resolved : n;
            if (phone.length < 7) return null;
            return phone + '@s.whatsapp.net';
        };

        if (sub === 'add') {
            if (!rawTarget) {
                return ctx.reply(
                    `❌ Tag a user or pass a number.\n\`\( {s.prefix}sudo add @user\`\n\` \){s.prefix}sudo add 2348012345678\`${s.FOOTER}`
                );
            }

            const target = await resolveToPhoneJid(sock, ctx, rawTarget);
            if (!target) {
                return ctx.reply(
                    `❌ Could not resolve a real phone number from that tag (got LID only).\n` +
                    `Use: \`\( {s.prefix}sudo add 234xxxxxxxxxx\` \){s.FOOTER}`
                );
            }

            const targetNum = normNum(target);
            const already = sudoList.some((j) => normNum(j) === targetNum);
            if (already) {
                return ctx.reply(
                    `⚠️ @\( {targetNum} already has sudo access. \){s.FOOTER}`,
                    { mentions: [target] }
                );
            }

            // Store REAL number only
            sudoList.push(target);
            // Dedupe by number
            const seen = new Set();
            sudoList = sudoList
                .map(normalizeStored)
                .filter(Boolean)
                .filter((j) => {
                    const n = normNum(j);
                    if (seen.has(n)) return false;
                    seen.add(n);
                    return true;
                });

            db.set('system', 'sudo', sudoList);
            return ctx.reply(
                `✅ *${themed('sudo') || 'Sudo access granted.'}*\n` +
                `@\( {targetNum} ( \){targetNum}) can now use elevated commands.${s.FOOTER}`,
                { mentions: [target] }
            );
        }

        if (sub === 'remove' || sub === 'revoke') {
            if (!rawTarget) {
                return ctx.reply(
                    `❌ Tag a user or pass a number.\n\`\( {s.prefix}sudo remove @user\` \){s.FOOTER}`
                );
            }

            const target = await resolveToPhoneJid(sock, ctx, rawTarget);
            const targetNum = target ? normNum(target) : normNum(rawTarget);

            const before = sudoList.length;
            sudoList = sudoList.filter((j) => normNum(j) !== targetNum);
            if (sudoList.length === before) {
                return ctx.reply(
                    `❌ @\( {targetNum} doesn't have sudo access. \){s.FOOTER}`,
                    { mentions: target ? [target] : [] }
                );
            }

            db.set('system', 'sudo', sudoList);
            return ctx.reply(
                `✅ *${themed('sudo') || 'Sudo access revoked.'}*\n` +
                `@\( {targetNum} no longer has elevated access. \){s.FOOTER}`,
                { mentions: target ? [target] : [] }
            );
        }

        if (sub === 'list') {
            // Clean list to phone JIDs
            const cleaned = [];
            const seen = new Set();
            for (const j of sudoList) {
                const n = normalizeStored(j);
                if (!n) continue;
                const num = normNum(n);
                if (seen.has(num)) continue;
                seen.add(num);
                cleaned.push(n);
            }
            if (cleaned.length !== sudoList.length) {
                db.set('system', 'sudo', cleaned);
                sudoList = cleaned;
            }

            if (!sudoList.length) {
                return ctx.reply(
                    `📋 *Sudo Users:* None\n\nGrant: \`\( {s.prefix}sudo add @user\` or \` \){s.prefix}sudo add 234...\`${s.FOOTER}`
                );
            }

            const list = sudoList
                .map((j, i) => `\( {i + 1}. @ \){normNum(j)}  \`${normNum(j)}\``)
                .join('\n');

            return ctx.reply(
                `👑 *Sudo Users (\( {sudoList.length}):*\n\n \){list}${s.FOOTER}`,
                { mentions: sudoList }
            );
        }

        return ctx.reply(
            menuBox('👑', 'sᴜᴅᴏ', [
                `\`${s.prefix}sudo add @user\` — Grant (resolves to real number)`,
                `\`${s.prefix}sudo add 2348…\` — Grant by number`,
                `\`${s.prefix}sudo remove @user\` — Revoke`,
                `\`${s.prefix}sudo list\` — Show sudo users (phone numbers)`,
            ]) + s.FOOTER
        );
    },
};