'use strict';

module.exports = {
    name: 'bancheck',
    aliases: ['checkban', 'isbanned', 'banstatus', 'ghost'],
    category: 'madaraeye',
    desc: 'ᴀᴅᴠᴀɴᴄᴇᴅ ᴡʜᴀᴛsᴀᴘᴘ ʙᴀɴ ᴄʜᴇᴄᴋᴇʀ — ᴅᴇᴛᴇᴄᴛs ᴛʏᴘᴇ + ʀᴇᴀsᴏɴ',
    usage: '.bancheck <number>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prefix = s.prefix || '.';
        
        if (!args[0]) {
            return sock.sendMessage(ctx.from, { 
                text: `❌ *ᴡʀᴏɴɢ ᴜsᴀɢᴇ*\n\n📌 *Usage:* ${prefix}bancheck <number>\n📝 *Example:* ${prefix}bancheck 2348012345678` 
            }, { quoted: msg });
        }
        
        const number = args[0].replace(/[^0-9]/g, '');
        if (number.length < 7 || number.length > 15) {
            return sock.sendMessage(ctx.from, { 
                text: '❌ *ɪɴᴠᴀʟɪᴅ ɴᴜᴍʙᴇʀ*\n\nᴇɴᴛᴇʀ ᴡɪᴛʜ ᴄᴏᴜɴᴛʀʏ ᴄᴏᴅᴇ (ɴᴏ + ᴏʀ sᴘᴀᴄᴇs)' 
            }, { quoted: msg });
        }
        
        const target = number + '@s.whatsapp.net';
        
        await sock.sendMessage(ctx.from, { text: '👻 ɪɴɪᴛɪᴀᴛɪɴɢ ɢʜᴏsᴛ ᴘʀᴏᴛᴏᴄᴏʟ...' }, { quoted: msg });
        
        try {
            const results = [];
            let banType = 'ᴜɴᴋɴᴏᴡɴ';
            let banReason = 'ɴᴏ ʀᴇᴀsᴏɴ ᴅᴇᴛᴇᴄᴛᴇᴅ';
            let isBanned = false;
            
            // ── Check 1: onWhatsApp (existence) ──────────────────────────
            try {
                const [result] = await sock.onWhatsApp(target);
                if (!result || !result.exists) {
                    results.push('❌ ɴᴜᴍʙᴇʀ ɴᴏᴛ ᴏɴ ᴡʜᴀᴛsᴀᴘᴘ');
                    results.push('   ↳ ᴘᴏssɪʙʟᴇ ᴄᴀᴜsᴇs: ʙᴀɴɴᴇᴅ, ᴅᴇʟᴇᴛᴇᴅ, ᴏʀ ɴᴇᴠᴇʀ ʀᴇɢɪsᴛᴇʀᴇᴅ');
                } else {
                    results.push('✅ ɴᴜᴍʙᴇʀ ᴇxɪsᴛs ᴏɴ ᴡʜᴀᴛsᴀᴘᴘ');
                }
            } catch (e) {
                results.push('⚠️ ᴇxɪsᴛᴇɴᴄᴇ ᴄʜᴇᴄᴋ: ' + e.message);
            }
            
            // ── Check 2: Profile fetch ───────────────────────────────────
            try {
                const ppUrl = await sock.profilePictureUrl(target, 'image').catch(() => null);
                if (!ppUrl) {
                    results.push('❌ ᴘʀᴏғɪʟᴇ ᴘɪᴄᴛᴜʀᴇ ʙʟᴏᴄᴋᴇᴅ');
                    results.push('   ↳ ᴛʏᴘɪᴄᴀʟ ғᴏʀ ʙᴀɴɴᴇᴅ ᴀᴄᴄᴏᴜɴᴛs');
                } else {
                    results.push('✅ ᴘʀᴏғɪʟᴇ ᴀᴄᴄᴇssɪʙʟᴇ');
                }
            } catch (e) {
                results.push('❌ ᴘʀᴏғɪʟᴇ ᴄʜᴇᴄᴋ ғᴀɪʟᴇᴅ');
            }
            
            // ── Check 3: Status fetch ────────────────────────────────────
            try {
                const status = await sock.fetchStatus(target).catch(() => null);
                if (status === null || status === undefined) {
                    results.push('❌ sᴛᴀᴛᴜs ʙʟᴏᴄᴋᴇᴅ');
                } else {
                    results.push('✅ sᴛᴀᴛᴜs ᴀᴄᴄᴇssɪʙʟᴇ');
                }
            } catch (e) {
                results.push('❌ sᴛᴀᴛᴜs ᴄʜᴇᴄᴋ ғᴀɪʟᴇᴅ');
            }
            
            // ── Check 4: Send a test message (probe) ─────────────────────
            try {
                const probe = await sock.sendMessage(target, { 
                    text: '\u200B' // Zero-width space — invisible message
                }).catch(e => {
                    // Read the error to determine ban type
                    const errMsg = e.message || '';
                    const statusCode = e.output?.statusCode || 0;
                    
                    if (statusCode === 403 || errMsg.includes('forbidden')) {
                        isBanned = true;
                        if (errMsg.includes('permanently')) {
                            banType = '🔴 ᴘᴇʀᴍᴀɴᴇɴᴛ';
                            banReason = 'ᴀᴄᴄᴏᴜɴᴛ ᴘᴇʀᴍᴀɴᴇɴᴛʟʏ ʙᴀɴɴᴇᴅ ʙʏ ᴡʜᴀᴛsᴀᴘᴘ';
                        } else if (errMsg.includes('temporarily') || errMsg.includes('temporary')) {
                            banType = '🟡 ᴛᴇᴍᴘᴏʀᴀʀʏ';
                            banReason = 'ᴀᴄᴄᴏᴜɴᴛ ᴛᴇᴍᴘᴏʀᴀʀɪʟʏ sᴜsᴘᴇɴᴅᴇᴅ';
                        } else {
                            banType = '🔴 ʙᴀɴɴᴇᴅ';
                            banReason = 'ᴀᴄᴄᴏᴜɴᴛ ʀᴇsᴛʀɪᴄᴛᴇᴅ';
                        }
                        results.push('❌ ᴍᴇssᴀɢᴇ ʀᴇᴊᴇᴄᴛᴇᴅ: ' + errMsg.substring(0, 100));
                    } else if (statusCode === 401) {
                        banType = '🟡 sᴇssɪᴏɴ ᴇxᴘɪʀᴇᴅ';
                        banReason = 'ɴᴏᴛ ᴀ ʙᴀɴ — ᴊᴜsᴛ ʟᴏɢɢᴇᴅ ᴏᴜᴛ';
                        results.push('⚠️ sᴇssɪᴏɴ ᴇxᴘɪʀᴇᴅ (ɴᴏᴛ ᴀ ʙᴀɴ)');
                    }
                    return null;
                });
                
                if (probe) {
                    results.push('✅ ᴍᴇssᴀɢᴇ ᴘʀᴏʙᴇ sᴇɴᴛ sᴜᴄᴄᴇssғᴜʟʟʏ');
                }
            } catch (e) {
                results.push('⚠️ ᴘʀᴏʙᴇ ᴄʜᴇᴄᴋ: ' + e.message.substring(0, 80));
            }
            
            // ── Check 5: Privacy settings (banned accounts block everything) ──
            try {
                const bizProfile = await sock.getBusinessProfile(target).catch(() => null);
                results.push(bizProfile ? '✅ ʙᴜsɪɴᴇss ᴘʀᴏғɪʟᴇ ᴀᴄᴄᴇssɪʙʟᴇ' : '⚠️ ʙᴜsɪɴᴇss ᴘʀᴏғɪʟᴇ ɴᴏᴛ ᴀᴠᴀɪʟᴀʙʟᴇ');
            } catch (e) {
                results.push('❌ ʙᴜsɪɴᴇss ᴘʀᴏғɪʟᴇ ᴄʜᴇᴄᴋ ғᴀɪʟᴇᴅ');
            }
            
            // ── Final verdict ─────────────────────────────────────────────
            const bannedCount = results.filter(r => r.includes('❌')).length;
            const healthyCount = results.filter(r => r.includes('✅')).length;
            
            let finalVerdict;
            if (isBanned) {
                finalVerdict = banType;
            } else if (bannedCount >= 3 && healthyCount <= 1) {
                finalVerdict = '🔴 ʟɪᴋᴇʟʏ ᴘᴇʀᴍᴀɴᴇɴᴛ ʙᴀɴ';
                banReason = 'ᴍᴜʟᴛɪᴘʟᴇ ᴄʜᴇᴄᴋs ғᴀɪʟᴇᴅ — ᴀᴄᴄᴏᴜɴᴛ ʀᴇsᴛʀɪᴄᴛᴇᴅ';
            } else if (bannedCount >= 2) {
                finalVerdict = '🟡 ᴘᴏssɪʙʟʏ ᴛᴇᴍᴘᴏʀᴀʀʏ ʙᴀɴ';
                banReason = 'sᴏᴍᴇ ᴄʜᴇᴄᴋs ғᴀɪʟᴇᴅ — ᴄᴏᴜʟᴅ ʙᴇ ᴛᴇᴍᴘᴏʀᴀʀʏ';
            } else if (bannedCount === 0 && healthyCount >= 3) {
                finalVerdict = '🟢 ɴᴏᴛ ʙᴀɴɴᴇᴅ';
                banReason = 'ᴀᴄᴄᴏᴜɴᴛ ɪs ʜᴇᴀʟᴛʜʏ';
            } else {
                finalVerdict = '⚪ ᴜɴᴋɴᴏᴡɴ';
                banReason = 'ɪɴsᴜғғɪᴄɪᴇɴᴛ ᴅᴀᴛᴀ';
            }
            
            const resultText = 
`╭═══〘 👻 ʙᴀɴ ᴄʜᴇᴄᴋ ʀᴇsᴜʟᴛ 〙═══⊷❍
┃ 📱 *ɴᴜᴍʙᴇʀ:* +${number}
┃ 🎯 *sᴛᴀᴛᴜs:* ${finalVerdict}
┃ 📋 *ʀᴇᴀsᴏɴ:* ${banReason}
┃
┃ ━━━ ᴅᴇᴛᴀɪʟᴇᴅ ᴄʜᴇᴄᴋs ━━━
${results.map(r => `┃ ${r}`).join('\n')}
┃
┃ ━━━ sᴜᴍᴍᴀʀʏ ━━━
┃ ❌ ғᴀɪʟᴇᴅ: ${bannedCount}
┃ ✅ ᴘᴀssᴇᴅ: ${healthyCount}
╰══════════════════════════`;
            
            await sock.sendMessage(ctx.from, { text: resultText }, { quoted: msg });
            
        } catch (e) {
            await sock.sendMessage(ctx.from, { 
                text: '❌ ᴇʀʀᴏʀ: ' + e.message 
            }, { quoted: msg });
        }
    }
};