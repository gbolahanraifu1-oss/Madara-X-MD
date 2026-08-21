// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  GET SAVED MESSAGE
// Resends a message that was previously saved under a text trigger.
// Saved entries live in the 'savedmsgs' db bucket as either a plain
// string (text reply) or { type: 'image'|'video'|'audio', url, caption }.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const db = require('../../lib/db');

// ── Auto-handler called from handler.js on plain (non-command) messages ──
async function checkSavedMessage(sock, from, sender, msg, ctx) {
    try {
        if (msg.key.fromMe) return false;
        if (from?.endsWith('status@broadcast')) return false;

        const body = (ctx?.body || '').trim();
        if (!body) return false;

        const saved = db.get('savedmsgs', body.toLowerCase());
        if (!saved) return false;

        if (typeof saved === 'string') {
            await sock.sendMessage(from, { text: saved }, { quoted: msg });
            return true;
        }

        if (saved.type === 'image')  await sock.sendMessage(from, { image: { url: saved.url }, caption: saved.caption || '' }, { quoted: msg });
        else if (saved.type === 'video') await sock.sendMessage(from, { video: { url: saved.url }, caption: saved.caption || '' }, { quoted: msg });
        else if (saved.type === 'audio') await sock.sendMessage(from, { audio: { url: saved.url }, mimetype: 'audio/mpeg' }, { quoted: msg });
        else return false;

        return true;
    } catch (err) {
        console.error('[getmsg] error:', err.message);
        return false;
    }
}

module.exports = { checkSavedMessage };
