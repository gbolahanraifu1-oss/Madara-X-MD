const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const yts   = require('yt-search');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { menuBox } = require('../../lib/menuBox');

const TMP = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

function sc(str) {
    const m = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'};
    return String(str).toLowerCase().split('').map(c => m[c]||c).join('');
}

async function downloadBuffer(url, timeout = 90000) {
    const r = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout,
        maxRedirects: 5,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*'
        }
    });
    return Buffer.from(r.data);
}

// ── 1. LOCAL YT-DLP (best quality) ──
async function getYtDlp(url, outPath) {
    try {
        const cookiePath = path.join(process.cwd(), 'cookies.txt');
        const cookieArg  = fs.existsSync(cookiePath) ? `--cookies "${cookiePath}"` : '';
        const cmds = [
            `yt-dlp \( {cookieArg} --extractor-args "youtube:player_client=android,web" -f ba/bestaudio -x --audio-format mp3 --audio-quality 0 -o " \){outPath}" --no-playlist --no-warnings --force-overwrites "${url}"`,
            `yt-dlp \( {cookieArg} --extractor-args "youtube:player_client=ios" -f ba -x --audio-format mp3 -o " \){outPath}" --no-playlist --force-overwrites "${url}"`
        ];
        for (const cmd of cmds) {
            try {
                await execPromise(cmd, { timeout: 120000 });
                if (fs.existsSync(outPath) && fs.statSync(outPath).size > 8000) return true;
            } catch {}
        }
        return false;
    } catch { return false; }
}

// ── 2. SIPUTZX API (free, common in WA bots) ──
async function getSiputzx(url) {
    try {
        const res = await axios.get(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(url)}`, {
            timeout: 25000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const d = res.data;
        const link = d?.data?.dl || d?.data?.download || d?.result?.download || d?.result?.url || d?.download || d?.url;
        if (link && String(link).startsWith('http')) return link;
        return null;
    } catch (e) {
        console.log('[play] siputzx fail:', e.message?.slice(0, 60));
        return null;
    }
}

// ── 3. SAVEWAVE / public ytmp3 style ──
async function getSavewave(url) {
    try {
        // endpoint style used by many free converters
        const res = await axios.get(`https://api.nyxs.pw/dl/yt-mp3?url=${encodeURIComponent(url)}`, {
            timeout: 20000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const d = res.data;
        const link = d?.result?.url || d?.result?.download || d?.data?.url || d?.url;
        if (link && String(link).startsWith('http')) return link;
        return null;
    } catch {
        return null;
    }
}

// ── 4. FALLBACK: another public endpoint ──
async function getY2mateStyle(url) {
    try {
        const res = await axios.get(`https://api.agatz.xyz/api/ytmp3?url=${encodeURIComponent(url)}`, {
            timeout: 20000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const d = res.data;
        const link = d?.data?.download || d?.data?.url || d?.result?.url || d?.url;
        if (link && String(link).startsWith('http')) return link;
        return null;
    } catch {
        return null;
    }
}

module.exports = {
    name: 'play',
    aliases: ['song', 'music', 'mp3', 'ytmp3', 'playdoc'],
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

            const cleanUrl = video.url
                .replace(/youtube\.com\/shorts\//, 'youtube.com/watch?v=')
                .split('&si=')[0]
                .split('?si=')[0];

            // Thumbnail + info
            try {
                const ytId = (video.url.match(/(?:[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/) || [])[1];
                if (ytId) {
                    const thumb = await axios.get(`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`, {
                        responseType: 'arraybuffer',
                        timeout: 8000
                    });
                    await sock.sendMessage(ctx.from, {
                        image: Buffer.from(thumb.data),
                        caption: menuBox('🎵', 'ᴘʟᴀʏ', [
                            `*${sc('title')}:* ${video.title.slice(0, 55)}`,
                            `*${sc('artist')}:* ${video.author?.name || 'Unknown'}`,
                            `*${sc('duration')}:* ${video.timestamp}`,
                            `*${sc('status')}:* ⬇️ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...`,
                        ]) + s.FOOTER
                    }, { quoted: msg });
                }
            } catch {}

            const id = Date.now();
            const outPath = path.join(TMP, `${id}.mp3`);
            let audioBuffer = null;
            let source = '';

            // 1. yt-dlp first
            await ctx.react('⬇️');
            const ytdlpOk = await getYtDlp(cleanUrl, outPath);
            if (ytdlpOk) {
                audioBuffer = fs.readFileSync(outPath);
                source = 'yt-dlp';
            }

            // 2. Siputzx
            if (!audioBuffer) {
                console.log('[play] trying siputzx');
                const link = await getSiputzx(cleanUrl);
                if (link) {
                    try {
                        audioBuffer = await downloadBuffer(link);
                        source = 'siputzx';
                    } catch (e) {
                        console.log('[play] siputzx download fail', e.message?.slice(0, 40));
                    }
                }
            }

            // 3. Nyxs
            if (!audioBuffer) {
                console.log('[play] trying nyxs');
                const link = await getSavewave(cleanUrl);
                if (link) {
                    try {
                        audioBuffer = await downloadBuffer(link);
                        source = 'nyxs';
                    } catch {}
                }
            }

            // 4. Agatz
            if (!audioBuffer) {
                console.log('[play] trying agatz');
                const link = await getY2mateStyle(cleanUrl);
                if (link) {
                    try {
                        audioBuffer = await downloadBuffer(link);
                        source = 'agatz';
                    } catch {}
                }
            }

            if (!audioBuffer || audioBuffer.length < 3000) {
                return ctx.reply(
                    `❌ Download failed — all sources blocked.\n\n` +
                    `• yt-dlp: ${ytdlpOk ? 'file too small' : 'not installed / error'}\n` +
                    `• siputzx / nyxs / agatz: failed\n\n` +
                    `💡 Install yt-dlp + upload cookies.txt for best results.${s.FOOTER}`
                );
            }

            console.log(`[play] success via ${source} — ${audioBuffer.length} bytes`);

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
                    `${sc('source')}: ${source}`,
                    `${sc('status')}: ✅ ᴅᴏɴᴇ`,
                ]) + s.FOOTER
            }, { quoted: msg });

            await ctx.react('✅');
            try { fs.unlinkSync(outPath); } catch {}

        } catch (err) {
            console.error('[play]', err);
            ctx.reply(`❌ \( {err.message?.slice(0, 150) || 'Unknown error'} \){s.FOOTER}`);
            ctx.react('❌').catch(() => {});
        }
    }
};