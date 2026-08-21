// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Group Participant Events           ║
// ╚══════════════════════════════════════════════════════╝

const db       = require('./db');
const settings = require('../settings');

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action } = update;
        if (!id?.endsWith('@g.us')) return;
        let meta;
        try { meta = await sock.groupMetadata(id); } catch { return; }

        for (const rawJid of participants) {
            // Baileys 7.x can pass participants as plain JID strings OR as
            // objects (e.g. { id, jid, lid }) depending on the update type
            // and whether the participant has a LID assigned. Normalize
            // to a string first — calling .split() on an object is what
            // threw "jid.split is not a function".
            const jid = typeof rawJid === 'string'
                ? rawJid
                : (rawJid?.id || rawJid?.jid || rawJid?.lid || String(rawJid));

            if (typeof jid !== 'string' || !jid.includes('@')) continue; // can't do anything useful with this

            const num  = jid.split('@')[0];
            const name = meta.participants?.find(p => p.id === jid)?.pushName || `+${num}`;

            if (action === 'add') {
                // Welcome is intentionally NOT handled here — madaraFeatures.js
                // already owns welcome messages (richer, image-based) and is
                // gated by the same persisted 'welcome' flag toggled via
                // `.welcome on/off`. Handling it here too would send two
                // welcome messages per join once that flag actually persists.
                continue;

            } else if (action === 'remove') {
                const enabled = db.getGroupSetting(id, 'goodbye', false);
                if (!enabled) continue;
                const template = db.getGroupSetting(id, 'goodbyeMsg', 'Goodbye @{user}! Thanks for being with us 👋');
                const text = template
                    .replace(/{user}/g, num)
                    .replace(/{name}/g, name)
                    .replace(/{group}/g, meta.subject || 'the group');
                await sock.sendMessage(id, { text: `${text}${settings.footerGoodbye(jid)}`, mentions: [jid] });
            }
        }
    } catch (e) {
        console.error('[GroupEvents] Error:', e.message);
    }
}

module.exports = { handleGroupParticipantUpdate };
