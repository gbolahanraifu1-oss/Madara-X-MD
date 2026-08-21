// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Auto-Translate (per-user DM pref)  ║
// ║   Free MyMemory API — same one .translate uses      ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const axios = require('axios');
const db    = require('./db');

function getUserLang(jid) {
    if (!jid) return null;
    return db.get('userlang', jid.split('@')[0], null);
}

function setUserLang(jid, code) {
    db.set('userlang', jid.split('@')[0], code);
}

async function translateText(text, targetLang) {
    if (!text || !targetLang || targetLang === 'en') return text;
    try {
        const res = await axios.get('https://api.mymemory.translated.net/get', {
            params: { q: text, langpair: `en|${targetLang}` },
            timeout: 4000,
        });
        const tr = res.data?.responseData?.translatedText;
        // MyMemory returns the original text back (sometimes with a notice)
        // when it can't translate — only use the result if it looks sane.
        return (tr && tr.length > 0) ? tr : text;
    } catch {
        return text; // never block sending on a translation failure
    }
}

module.exports = { getUserLang, setUserLang, translateText };
