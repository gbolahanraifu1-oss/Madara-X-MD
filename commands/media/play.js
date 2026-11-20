'use strict';
const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const yts   = require('yt-search');
const { menuBox } = require('../../lib/menuBox');
const { Innertube, UniversalCache } = require('youtubei.js');

const TMP = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

function sc(str) {
    const m = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'};
    return String(str).toLowerCase().split('').map(c => m[c]||c).join('');
}

// ---------- cookies.txt loader - supports both formats ----------
function loadCookiesTxt() {
    try {
        const file = path.join(process.cwd(), 'cookies.txt');
        if (!fs.existsSync(file)) {
            console.log('[play] No cookies.txt found');
            return '';
        }
        const raw = fs.readFileSync(file, 'utf8').trim();
        if (!raw) return '';
        // Format 1: single line "name=value; name2=value2"
        if (!raw.includes('\n') && raw.includes('=')) return raw;
        // Format 2: Netscape "domain flag path secure expiry name value"
        const cookies = [];
        for (const line of raw.split('\n')) {
            const t = line.trim();
            if (!t || t.startsWith('#')) continue;
            const parts = t.split('\t');
            if (parts.length >= 7) cookies.push(`${parts[5]}=${parts[6]}`);
            else if (t.includes('=')) cookies.push(t);
        }
        console.log(`[play] Loaded ${cookies.length} cookies from cookies.txt`);
        return cookies.join('; ');
    } catch (e) {
        console.log('[play] cookies.txt fail:', e.message);
        return '';
    }
}
const COOKIE_STRING = process.env.YT_COOKIES || loadCookiesTxt();

// ---------- 1. EliteProTech ----------
async function getElitePro(url) {
    try {
        const { data } = await axios.get(
            `https://eliteprotech-apis.zone.id/download/ytmp3?url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
        );
        const link = data?.download?.downloadUrl || data?.downloadUrl || data?.url || data?.result?.url;
        if (!link) return null;
        const audio = await axios.get(link, { responseType: 'arraybuffer', timeout: 90000, maxContentLength: Infinity });
        const buffer = Buffer.from(audio.data);
        return buffer.length > 3000 ? buffer : null;
    } catch (e) {
        console.log('[play] EliteProTech fail:', e.message?.slice(0, 100));
        return null;
    }
}

// ---------- 2 + 3. Youtubei with / without cookies ----------
let ytAuth = null, ytNoAuth = null;
async function getYt(withCookies) {
    if (withCookies && ytAuth) return ytAuth;
    if (!withCookies && ytNoAuth) return ytNoAuth;
    const client = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
        cookie: withCookies ? (COOKIE_STRING || undefined) : undefined,
    });
    if (withCookies) ytAuth = client; else ytNoAuth = client;
    return client;
}
async function getYoutubei(url, withCookies) {
    try {
        const client = await getYt(withCookies);
        const id = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
        const info = await client.getInfo(id);
        const format = info.chooseFormat({ type: 'audio', quality: 'best' });
        if (!format) return null;
        const stream = await info.download({ format, type: 'audio' });
        const chunks = [];
        for await (const c of stream) chunks.push(c);
        const buf = Buffer.concat(chunks);
        return buf.length > 3000 ? buf : null;
    } catch (e) {
        console.log(`[play] Youtubei ${withCookies ? '+cookies' : ''} fail:`, e.message?.slice(0, 100));
        return null;
    }
}

// ---------- 4. Deezer / iTunes ----------
async function getPreviewFallback(query) {
    try {
        const { data } = await axios.get('https://api.deezer.com/search', { params: { q: query }, timeout: 10000 });
        const t = data?.data?.[0];
        if (t?.preview) {
            const a = await axios.get(t.preview, { responseType: 'arraybuffer', timeout: 30000 });
            return Buffer.from(a.data);
        }
    } catch {}
    try {
        const { data } = await axios.get('https://itunes.apple.com/search', { params: { term: query, media: 'music', limit: 1 }, timeout: 10000 });
        const t = data?.results?.[0];
        if (t?.previewUrl) {
            const a = await axios.get(t.previewUrl, { responseType: 'arraybuffer', timeout: 30000 });
            return Buffer.from(a.data);
        }
    } catch {}
    return null;
}

module.exports = {
    name: 'play',
    aliases: ['song', 'music', 'mp3'],
    category: 'media',
    desc: 'Search and download audio by song name',
    usage: '.play [song name]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = ctx.text;
        if (!q) return ctx.reply(`❌ Usage: \`${s.prefix}play [song name]\`${s.FOOTER}`);
        await ctx.react('🎵');
        try {
            const { videos } = await yts(q);
            const video = videos?.[0];
            if (!video) return ctx.reply(`❌ No results for *${q}*${s.FOOTER}`);
            if (video.seconds > 600) return ctx.reply(`❌ Too long (${video.timestamp}). Max 10 min.${s.FOOTER}`);
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

            let audioBuffer = null, source = '';
            audioBuffer = await getElitePro(video.url);
            if (audioBuffer) source = 'EliteProTech';
            if (!audioBuffer) { audioBuffer = await getYoutubei(video.url, true); if (audioBuffer) source = 'YouTube+Cookies'; }
            if (!audioBuffer) { audioBuffer = await getYoutubei(video.url, false); if (audioBuffer) source = 'YouTube'; }
            if (!audioBuffer) { audioBuffer = await getPreviewFallback(q); if (audioBuffer) source = 'Deezer/iTunes Preview'; }

            if (!audioBuffer) {
                await ctx.react('❌');
                return ctx.reply(`╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍\n┃✰│━━━❮❮ 💬 ᴍᴀᴅᴀʀᴀ x-ᴍᴅ ❯❯━━━━━\n┃✰│❌ ᴅᴏᴡɴʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ\n┃✰│\n┃✰│ᴀʟʟ 4 sᴏᴜʀᴄᴇs ғᴀɪʟᴇᴅ\n┃✰│ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ\n┃✰│> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀᴅᴀʀᴀ x-ᴍᴅ\n╰──────────────────`);
            }

            await sock.sendMessage(ctx.from, {
                audio: audioBuffer, mimetype: 'audio/mpeg', ptt: false,
                fileName: `${video.title.slice(0, 50)}.mp3`
            }, { quoted: msg });

            await sock.sendMessage(ctx.from, {
                text: menuBox('🎵', 'ᴘʟᴀʏ', [
                    `${sc('title')}: ${video.title.slice(0, 55)}`,
                    `${sc('artist')}: ${video.author?.name || 'Unknown'}`,
                    `${sc('duration')}: ${video.timestamp}`,
                    `${sc('views')}: ${(video.views || 0).toLocaleString()}`,
                    `${sc('source')}: ${source}`,
                    `${sc('status')}: ✅ ᴅᴏɴᴇ`,
                ]) + s.FOOTER
            }, { quoted: msg });
            await ctx.react('✅');
        } catch (err) {
            console.error('[play]', err);
            ctx.reply(`❌ ${err.message?.slice(0, 80) || 'Unknown error'}${s.FOOTER}`);
            ctx.react('❌').catch(() => {});
        }
    }
};