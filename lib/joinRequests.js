// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Auto-Accept Group Join Requests    ║
// ║   For groups with "Admin Approval" enabled — when   ║
// ║   ON, every pending join request is approved        ║
// ║   automatically the moment it arrives.               ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const db = require('./db');

/**
 * Called from pairManager.js on every 'group.join-request' event.
 * Approves the request instantly if auto-accept is ON for that group.
 */
async function handleJoinRequest(sock, update) {
    try {
        const { id, participant, action } = update; // action: 'created' | 'revoked'
        if (!id?.endsWith('@g.us') || !participant) return;
        if (action && action !== 'created') return; // only act on NEW requests

        if (!db.getGroupSetting(id, 'autoAccept', false)) return;

        await sock.groupRequestParticipantsUpdate(id, [participant], 'approve');
        console.log(`[JoinRequest] Auto-approved ${participant.split('@')[0]} in ${id}`);
    } catch (e) {
        console.error('[JoinRequest] Error:', e.message);
    }
}

module.exports = { handleJoinRequest };
