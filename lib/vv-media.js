/*
 * VV-MEDIA - shared view-once unwrapping + downloading.
 * One downloader for .vv, .vv2, the emoji-reply saver and ANTIONCEVIEW,
 * with reupload fallback (WhatsApp deletes media from servers quickly).
 */
const { downloadContentFromMessage, downloadMediaMessage } = require('@itsliaaa/baileys');
const pino = require('pino');

const silentLogger = pino({ level: 'silent' });

function unwrapViewOnce(message) {
  let cur = message, viewOnce = false;
  for (let i = 0; i < 6 && cur; i++) {
    const vo = cur.viewOnceMessage || cur.viewOnceMessageV2 || cur.viewOnceMessageV2Extension;
    if (vo?.message) { viewOnce = true; cur = vo.message; continue; }
    const wrap = cur.ephemeralMessage || cur.documentWithCaptionMessage;
    if (wrap?.message) { cur = wrap.message; continue; }
    break;
  }
  const type = cur?.imageMessage ? 'image'
    : cur?.videoMessage ? 'video'
    : cur?.audioMessage ? 'audio'
    : null;
  return { cur, type, media: type ? cur[`${type}Message`] : null, viewOnce };
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// sock + key are needed for the reupload path; media/type for the direct path.
async function downloadViewOnceMedia(sock, key, u) {
  let lastErr;
  try {
    const buf = await downloadMediaMessage({ key, message: u.cur }, 'buffer', {}, {
      logger: silentLogger,
      reuploadRequest: msg => sock.updateMediaMessage(msg)
    });
    if (Buffer.isBuffer(buf) && buf.length) return buf;
  } catch (e) { lastErr = e; }
  try {
    const stream = await downloadContentFromMessage(u.media, u.type);
    const buf = await streamToBuffer(stream);
    if (buf.length) return buf;
  } catch (e) { lastErr = e; }
  throw lastErr || new Error('empty media download');
}

module.exports = { unwrapViewOnce, downloadViewOnceMedia, streamToBuffer };
