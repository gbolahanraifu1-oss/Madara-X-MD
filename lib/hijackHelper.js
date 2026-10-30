// language: JavaScript, file: lib/hijackHelper.js
'use strict';

function extractPhone(jid) {
    if (!jid) return '';
    return String(jid).split('@')[0].split(':')[0].replace(/\D/g, '');
}

async function resolveJid(sock, groupJid, jid) {
    if (!jid) return jid;
    if (jid.endsWith('@s.whatsapp.net')) return jid;
    if (!jid.endsWith('@lid')) return jid;

    try {
        const map = sock?.signalRepository?.lidMapping;
        if (map?.getPNForLID) {
            const pn = await map.getPNForLID(jid);
            if (pn) return pn.endsWith('@s.whatsapp.net') ? pn : `${extractPhone(pn)}@s.whatsapp.net`;
        }
    } catch {}

    try {
        const meta = await sock.groupMetadata(groupJid);
        const hit  = meta?.participants?.find(p => p.lid === jid);
        if (hit?.id) return hit.id;
    } catch {}

    return jid;
}

function rankOf(p) {
    const r = (p?.admin || '').toString().toLowerCase();
    if (r === 'superadmin' || r === 'owner') return 2;
    if (r === 'admin') return 1;
    return 0;
}

async function checkAccountStatus(sock, jid) {
    const phone = extractPhone(jid) + '@s.whatsapp.net';
    let probed = false;

    try {
        if (typeof sock.checkStatusWa === 'function') {
            const res = await sock.checkStatusWa(phone);
            probed = true;
            const banned = res?.status === 'banned' || res?.isBanned === true;
            if (banned) return { isBanned: true, status: 'banned' };
            return { isBanned: false, status: 'alive' };
        }
    } catch {}

    try {
        const res = await sock.onWhatsApp(phone);
        probed = true;
        const exists = Array.isArray(res) ? res[0]?.exists : res?.exists;
        if (exists === false) return { isBanned: true, status: 'banned' };
        if (exists === true)  return { isBanned: false, status: 'alive' };
        return { isBanned: false, status: 'unknown' };
    } catch {}

    if (!probed) return { isBanned: false, status: 'unknown' };
    return { isBanned: false, status: 'unknown' };
}

async function getGroupInviteLink(sock, groupJid) {
    try {
        const code = await sock.groupInviteCode(groupJid);
        return code ? `https://chat.whatsapp.com/${code}` : null;
    } catch { return null; }
}

module.exports = {
    extractPhone, resolveJid, rankOf, checkAccountStatus, getGroupInviteLink,
};