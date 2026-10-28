const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const yts   = require('yt-search');
const { menuBox } = require('../../lib/menuBox');

const TMP = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

function sc(str) {
    const m = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'};
    return String(str).toLowerCase().split('').map(c => m[c]||c).join('');
}

async function getElitePro(url) {
    try {
        const { data } = await axios.get(
            `https://eliteprotech-apis.zone.id/download/ytmp3?url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
        );

        const link = data?.download?.downloadUrl || data?.downloadUrl || data?.url || data?.result?.url;
        if (!link) return null;

        console.log('[play] EliteProTech success');

        const audio = await axios.get(link, {
            responseType: 'arraybuffer',
            timeout: 90000,
            maxContentLength: Infinity
        });

        const buffer = Buffer.from(audio.data);
        return buffer.length > 3000 ? buffer : null;
    } catch (e) {
        console.error('[play] EliteProTech error:', e.message?.slice(0, 100));
        return null;
    }
}

module.exports = {
    name: 'play',
    aliases: ['song', 'music', 'mp3'],
    category: 'media',
    desc: 'Search and download audio by song name',
    usage: '†play [song name]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = ctx.text;

        if (!q) return ctx.reply(`❌ Usage: \`\( {s.prefix}play [song name]\` \){s.FOOTER}`);

        await ctx.react('🎵');

        try {
            const { videos } = await yts(q);
            const video = videos?.[0];
            if (!video) return ctx.reply(`❌ No results for *\( {q}* \){s.FOOTER}`);
            if (video.seconds > 600) return ctx.reply(`❌ Too long (\( {video.timestamp}). Max 10 min. \){s.FOOTER}`);

            // Status card
            try {
                await sock.sendMessage(ctx.from, {
                    image: { url: video.thumbnail },
                    caption: menuBox('🎵', 'ᴘʟᴀʏ', [
                        `*${sc('title')}:* ${video.title.slice(0, 55)}`,
                        `*${sc('artist')}:* ${video.author?.name || 'Unknown'}`,
                        `*${sc('duration')}:* ${video.timestamp}`,
                        `*${sc('status')}:* ⬇️ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...`,
                    ]) + s.FOOTER
                }, { quoted: msg });
            } catch {}

            await ctx.react('⬇️');

            const audioBuffer = await getElitePro(video.url);

            if (!audioBuffer) {
                return ctx.reply(`╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
┃✰│━━━❮❮ 💬 ᴍᴀᴅᴀʀᴀ x-ᴍᴅ ❯❯━━━━━
┃✰│❌ ᴅᴏᴡɴʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ
┃✰│
┃✰│ᴇʟɪᴛᴇᴘʀᴏᴛᴇᴄʜ ᴀᴘɪ ɴᴏᴛ ʀᴇsᴘᴏɴᴅɪɴɢ
┃✰│ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ
┃✰│> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀᴅᴀʀᴀ x-ᴍᴅ
╰──────────────────`);
            }

            await sock.sendMessage(ctx.from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${video.title.slice(0, 50)}.mp3`
            }, { quoted: msg });

            await sock.sendMessage(ctx.from, {
                text: menuBox('🎵', 'ᴘʟᴀʏ', [
                    `${sc('title')}: ${video.title.slice(0, 55)}`,
                    `${sc('artist')}: ${video.author?.name || 'Unknown'}`,
                    `${sc('duration')}: ${video.timestamp}`,
                    `${sc('views')}: ${(video.views || 0).toLocaleString()}`,
                    `${sc('status')}: ✅ ᴅᴏɴᴇ`,
                ]) + s.FOOTER
            }, { quoted: msg });

            await ctx.react('✅');

        } catch (err) {
            console.error('[play]', err);
            ctx.reply(`❌ \( {err.message?.slice(0, 80) || 'Unknown error'} \){s.FOOTER}`);
            ctx.react('❌').catch(() => {});
        }
    }
};