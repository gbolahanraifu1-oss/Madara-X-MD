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

const AX = {
    timeout: 25000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

async function downloadBuffer(url) {
    try {
        const r = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 90000,
            maxContentLength: Infinity,
            headers: { 'User-Agent': AX.headers['User-Agent'], 'Accept': '*/*' }
        });
        const buf = Buffer.from(r.data);
        if (buf.length > 3000) return buf;
    } catch {}
    return null;
}

async function getAudioUrl(videoUrl) {
    const enc = encodeURIComponent(videoUrl);

    const apis = [
        // EliteProTech
        {
            name: 'EliteProTech',
            url: `https://eliteprotech-apis.zone.id/ytdown?url=${enc}&format=mp3`,
            get: d => d?.downloadURL || d?.download_url || d?.url || d?.result?.url
        },
        // Siputzx
        {
            name: 'Siputzx',
            url: `https://api.siputzx.my.id/api/d/ytmp3?url=${enc}`,
            get: d => d?.data?.url || d?.data?.download || d?.result?.url
        },
        // Ryzen
        {
            name: 'Ryzen',
            url: `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${enc}`,
            get: d => d?.url || d?.data?.url || d?.result?.url
        },
        // Vreden
        {
            name: 'Vreden',
            url: `https://vreden.dimensionx.web.id/api/ytmp3?url=${enc}`,
            get: d => d?.result?.download?.url || d?.result?.url || d?.url
        },
        // GiftedTech
        {
            name: 'GiftedTech',
            url: `https://api.giftedtech.web.id/api/download/ytmp3?apikey=gifted&url=${enc}`,
            get: d => d?.result?.dl_url || d?.result?.download_url || d?.result?.url
        },
        // Okatsu
        {
            name: 'Okatsu',
            url: `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${enc}`,
            get: d => d?.dl || d?.url || d?.result?.url
        },
        // Yupra
        {
            name: 'Yupra',
            url: `https://api.yupra.my.id/api/downloader/ytmp3?url=${enc}`,
            get: d => d?.data?.download_url || d?.data?.url
        }
    ];

    for (const api of apis) {
        try {
            const { data } = await axios.get(api.url, AX);
            const link = api.get(data);
            if (link && link.startsWith('http')) {
                console.log('[play] success via →', api.name);
                return link;
            }
        } catch (e) {
            console.log('[play] miss:', api.name, (e.message || '').slice(0, 60));
        }
    }
    return null;
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

            const audioUrl = await getAudioUrl(video.url);
            if (!audioUrl) {
                return ctx.reply(`╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
┃✰│━━━❮❮ 💬 ᴍᴀᴅᴀʀᴀ x-ᴍᴅ ❯❯━━━━━
┃✰│❌ ᴅᴏᴡɴʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ — ᴀʟʟ ᴀᴘɪs ʙʟᴏᴄᴋᴇᴅ
┃✰│
┃✰│💡 ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ ᴏʀ ᴜsᴇ ᴅɪғғᴇʀᴇɴᴛ sᴏɴɢ
┃✰│> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀᴅᴀʀᴀ x-ᴍᴅ
╰──────────────────`);
            }

            const audioBuffer = await downloadBuffer(audioUrl);
            if (!audioBuffer) {
                return ctx.reply(`❌ Failed to download audio file.${s.FOOTER}`);
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