const yts = require('yt-search')
const { Ytdl, Quality } = require('@distube/ytdl-core')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)

const yt = new Ytdl()

// Optional: still try yt-dlp first if the binary exists
async function getYtDlp(url) {
  try {
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
    const out = path.join(tempDir, `play_${Date.now()}.%(ext)s`)
    
    // Try with cookies if present
    const cookies = fs.existsSync('./cookies.txt') ? '--cookies cookies.txt' : ''
    
    await execPromise(
      `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${out}" \( {cookies} --no-playlist --max-filesize 50M " \){url}"`,
      { timeout: 90000 }
    )
    
    const files = fs.readdirSync(tempDir).filter(f => f.startsWith('play_') && f.endsWith('.mp3'))
    if (!files.length) return null
    const file = path.join(tempDir, files[0])
    const buffer = fs.readFileSync(file)
    fs.unlinkSync(file)
    return buffer.length > 3000 ? buffer : null
  } catch {
    return null
  }
}

async function getDistube(url) {
  try {
    const info = await yt.getInfo(url)
    const stream = yt.download(info, {
      quality: Quality.HighestAudio,
      filter: { hasAudio: true, hasVideo: false }
    })

    const chunks = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)
    return buffer.length > 3000 ? buffer : null
  } catch (e) {
    console.error('[play] distube error:', e.message)
    return null
  }
}

module.exports = {
  name: 'play',
  alias: ['p', 'song', 'music'],
  category: 'media',
  desc: 'Play YouTube audio',
  async execute(m, { conn, text, args, usedPrefix, command }) {
    if (!text) return m.reply(`Example: ${usedPrefix + command} Never Gonna Give You Up`)

    try {
      const search = await yts(text)
      if (!search.videos.length) return m.reply('❌ No results found.')

      const video = search.videos[0]
      if (video.seconds > 600) return m.reply('❌ Max 10 minutes only.')

      // Thumbnail preview
      await conn.sendMessage(m.chat, {
        image: { url: video.thumbnail },
        caption: `╭───⌜ 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 ⌟───
│ ✰ *Title:* ${video.title}
│ ✰ *Duration:* ${video.timestamp}
│ ✰ *Channel:* ${video.author.name}
│ ✰ *Views:* ${video.views}
│ 
│ ⏳ Downloading audio...
╰──────────────────`
      }, { quoted: m })

      let audioBuffer = null

      // 1. Try yt-dlp (best quality if installed)
      audioBuffer = await getYtDlp(video.url)

      // 2. Fallback to pure JS @distube/ytdl-core
      if (!audioBuffer) {
        audioBuffer = await getDistube(video.url)
      }

      if (!audioBuffer) {
        return m.reply(`╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
┃✰│━━━❮❮ 💬 ᴍᴀᴅᴀʀᴀ x-ᴍᴅ ❯❯━━━━━
┃✰│❌ ᴅᴏᴡɴʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ
┃✰│
┃✰│• ʏᴛ-ᴅʟᴘ: ɴᴏᴛ ɪɴsᴛᴀʟʟᴇᴅ / ᴇʀʀᴏʀ
┃✰│• ᴅɪsᴛᴜʙᴇ: ꜰᴀɪʟᴇᴅ
┃✰│
┃✰│💡 ɪɴsᴛᴀʟʟ ʏᴛ-ᴅʟᴘ + ᴜᴘʟᴏᴀᴅ ᴄᴏᴏᴋɪᴇs.ᴛxᴛ
┃✰│> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀᴅᴀʀᴀ x-ᴍᴅ
╰──────────────────`)
      }

      await conn.sendMessage(m.chat, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${video.title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: video.title,
            body: video.author.name,
            thumbnailUrl: video.thumbnail,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m })

    } catch (e) {
      console.error(e)
      m.reply('❌ Error: ' + e.message)
    }
  }
}