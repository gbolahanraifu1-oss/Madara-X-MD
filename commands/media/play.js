const yts = require('yt-search')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)
const { menuBox } = require('../../lib/menuBox')

const TMP = path.join(process.cwd(), 'temp')
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true })

function sc(str) {
  const m = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'}
  return String(str).toLowerCase().split('').map(c => m[c]||c).join('')
}

// ── yt-dlp ──
async function getYtDlp(url) {
  try {
    const out = path.join(TMP, `play_${Date.now()}.%(ext)s`)
    const cookies = fs.existsSync('./cookies.txt') ? '--cookies cookies.txt' : ''
    await execPromise(
      `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${out}" \( {cookies} --no-playlist --max-filesize 50M " \){url}"`,
      { timeout: 90000 }
    )
    const files = fs.readdirSync(TMP).filter(f => f.startsWith('play_') && f.endsWith('.mp3'))
    if (!files.length) return null
    const file = path.join(TMP, files[0])
    const buffer = fs.readFileSync(file)
    fs.unlinkSync(file)
    return buffer.length > 3000 ? buffer : null
  } catch {
    return null
  }
}

// ── @distube/ytdl-core (v4 + v5 safe) ──
async function getDistube(url) {
  try {
    const mod = require('@distube/ytdl-core')

    // New v5 style
    if (mod.Ytdl) {
      const yt = new mod.Ytdl()
      const info = await yt.getInfo(url)
      const stream = yt.download(info, {
        quality: mod.Quality?.HighestAudio || 'highestaudio',
        filter: { hasAudio: true, hasVideo: false }
      })
      const chunks = []
      for await (const chunk of stream) chunks.push(chunk)
      const buffer = Buffer.concat(chunks)
      return buffer.length > 3000 ? buffer : null
    }

    // Old v4 style
    const stream = mod(url, { filter: 'audioonly', quality: 'highestaudio' })
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const buffer = Buffer.concat(chunks)
    return buffer.length > 3000 ? buffer : null
  } catch (e) {
    console.error('[play] distube error:', e.message)
    return null
  }
}

// ── Public APIs ──
async function getApi(url) {
  const enc = encodeURIComponent(url)
  const apis = [
    { name: 'siputzx', url: `https://api.siputzx.my.id/api/d/ytmp3?url=${enc}`, get: d => d?.data?.url },
    { name: 'ryzen', url: `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${enc}`, get: d => d?.url },
    { name: 'vreden', url: `https://vreden.dimensionx.web.id/api/ytmp3?url=${enc}`, get: d => d?.result?.download?.url || d?.result?.url },
  ]

  for (const api of apis) {
    try {
      const { data } = await axios.get(api.url, { timeout: 20000 })
      const link = api.get(data)
      if (!link) continue
      const res = await axios.get(link, { responseType: 'arraybuffer', timeout: 60000 })
      const buf = Buffer.from(res.data)
      if (buf.length > 3000) {
        console.log('[play] via', api.name)
        return buf
      }
    } catch {}
  }
  return null
}

module.exports = {
  name: 'play',
  aliases: ['song', 'music', 'mp3'],
  category: 'media',
  desc: 'Search and download audio by song name',
  usage: '†play [song name]',
  async execute(sock, msg, args, ctx) {
    const s = ctx.settings
    const q = ctx.text

    if (!q) return ctx.reply(`❌ Usage: \`\( {s.prefix}play [song name]\` \){s.FOOTER}`)

    await ctx.react('🎵')

    try {
      const { videos } = await yts(q)
      const video = videos?.[0]
      if (!video) return ctx.reply(`❌ No results for *\( {q}* \){s.FOOTER}`)
      if (video.seconds > 600) return ctx.reply(`❌ Too long (\( {video.timestamp}). Max 10 min. \){s.FOOTER}`)

      // Thumbnail status
      try {
        await sock.sendMessage(ctx.from, {
          image: { url: video.thumbnail },
          caption: menuBox('🎵', 'ᴘʟᴀʏ', [
            `*${sc('title')}:* ${video.title.slice(0, 55)}`,
            `*${sc('artist')}:* ${video.author?.name || 'Unknown'}`,
            `*${sc('duration')}:* ${video.timestamp}`,
            `*${sc('status')}:* ⬇️ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...`,
          ]) + s.FOOTER
        }, { quoted: msg })
      } catch {}

      await ctx.react('⬇️')

      let audioBuffer = null

      // 1. yt-dlp
      audioBuffer = await getYtDlp(video.url)

      // 2. @distube/ytdl-core
      if (!audioBuffer) audioBuffer = await getDistube(video.url)

      // 3. Public APIs
      if (!audioBuffer) audioBuffer = await getApi(video.url)

      if (!audioBuffer) {
        return ctx.reply(`╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
┃✰│━━━❮❮ 💬 ᴍᴀᴅᴀʀᴀ x-ᴍᴅ ❯❯━━━━━
┃✰│❌ ᴅᴏᴡɴʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ
┃✰│
┃✰│• ʏᴛ-ᴅʟᴘ: ɴᴏᴛ ɪɴsᴛᴀʟʟᴇᴅ / ᴇʀʀᴏʀ
┃✰│• ᴅɪsᴛᴜʙᴇ: ꜰᴀɪʟᴇᴅ
┃✰│• ᴀᴘɪs: ꜰᴀɪʟᴇᴅ
┃✰│
┃✰│💡 ɪɴsᴛᴀʟʟ ʏᴛ-ᴅʟᴘ + ᴜᴘʟᴏᴀᴅ ᴄᴏᴏᴋɪᴇs.ᴛxᴛ
┃✰│> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀᴅᴀʀᴀ x-ᴍᴅ
╰──────────────────`)
      }

      await sock.sendMessage(ctx.from, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: `${video.title.slice(0, 50)}.mp3`
      }, { quoted: msg })

      await sock.sendMessage(ctx.from, {
        text: menuBox('🎵', 'ᴘʟᴀʏ', [
          `${sc('title')}: ${video.title.slice(0, 55)}`,
          `${sc('artist')}: ${video.author?.name || 'Unknown'}`,
          `${sc('duration')}: ${video.timestamp}`,
          `${sc('views')}: ${(video.views || 0).toLocaleString()}`,
          `${sc('status')}: ✅ ᴅᴏɴᴇ`,
        ]) + s.FOOTER
      }, { quoted: msg })

      await ctx.react('✅')

    } catch (err) {
      console.error('[play]', err)
      ctx.reply(`❌ \( {err.message?.slice(0, 80) || 'Unknown error'} \){s.FOOTER}`)
      ctx.react('❌').catch(() => {})
    }
  }
}