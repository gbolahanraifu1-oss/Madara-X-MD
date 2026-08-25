'use strict';

// ── Animated Progress Bar — edits the same message ────────────────────────

function createProgressBar(sock, chat, total, quoted) {
    let current = 0;
    let messageKey = null;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 300; // 300ms between updates
    const startTime = Date.now();

    const render = (percent, phase = '') => {
        const filled = Math.floor(percent / 100 * 20);
        const empty = 20 - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        const eta = percent > 0 && percent < 100 ? Math.round(((Date.now() - startTime) / percent) * (100 - percent) / 1000) : 0;
        
        return `╭═══〘 ᴄʀᴀsʜ ᴇxᴇᴄᴜᴛɪᴏɴ 〙═══⊷❍\n` +
               `┃ ${bar}\n` +
               `┃ ${percent}% ᴄᴏᴍᴘʟᴇᴛᴇ\n` +
               `┃ ᴘᴀʏʟᴏᴀᴅs: ${current}/${total}\n` +
               `┃ ʀᴇᴍᴀɪɴɪɴɢ: ${total - current}\n` +
               (eta > 0 ? `┃ ᴇᴛᴀ: ${eta}s\n` : '') +
               (phase ? `┃ ᴘʜᴀsᴇ: ${phase}\n` : '') +
               `╰══════════════════════════`;
    };

    const update = async (increment = 1, phase = '') => {
        current += increment;
        const percent = Math.min(100, Math.floor((current / total) * 100));
        const now = Date.now();
        
        // FIXED: Always update on first and last, throttle in between
        if (now - lastUpdate < UPDATE_INTERVAL && percent < 100 && current > 1) return;
        lastUpdate = now;

        const text = render(percent, phase);
        
        try {
            if (!messageKey) {
                const sent = await sock.sendMessage(chat, { text }, { quoted });
                messageKey = sent.key;
            } else {
                await sock.sendMessage(chat, { text, edit: messageKey }, { quoted });
            }
        } catch (e) {
            // Fallback: try direct edit if sendMessage with edit fails
            if (messageKey && messageKey.id) {
                try {
                    await sock.sendMessage(chat, { text, edit: messageKey });
                } catch (e2) {}
            }
        }
    };

    const done = async (finalText = '') => {
        const text = finalText || render(100, 'ᴄᴏᴍᴘʟᴇᴛᴇ');
        try {
            if (messageKey) {
                await sock.sendMessage(chat, { text, edit: messageKey }, { quoted });
            } else {
                await sock.sendMessage(chat, { text }, { quoted });
            }
        } catch (e) {}
    };

    const setPhase = async (phase) => {
        const percent = Math.min(100, Math.floor((current / total) * 100));
        const text = render(percent, phase);
        try {
            if (messageKey) {
                await sock.sendMessage(chat, { text, edit: messageKey }, { quoted });
            } else {
                const sent = await sock.sendMessage(chat, { text }, { quoted });
                messageKey = sent.key;
            }
        } catch (e) {}
    };

    return { update, done, setPhase, getCurrent: () => current, getTotal: () => total };
}

module.exports = { createProgressBar };