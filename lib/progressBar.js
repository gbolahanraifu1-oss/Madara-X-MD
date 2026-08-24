'use strict';

// ── Animated Progress Bar — fixed ─────────────────────────────────────────

function createProgressBar(sock, chat, total, quoted) {
    let current = 0;
    let messageKey = null;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 800; // slightly safer
    const startTime = Date.now();
    let isDone = false;

    const render = (percent, phase = '') => {
        const filled = Math.floor((percent / 100) * 20);
        const empty = 20 - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        const eta = percent > 5
            ? Math.round(((Date.now() - startTime) / percent) * (100 - percent) / 1000)
            : 0;

        return (
`╭═══〘 ᴄʀᴀsʜ ᴇxᴇᴄᴜᴛɪᴏɴ 〙═══⊷❍
┃ ${bar}
┃ ${percent}% ᴄᴏᴍᴘʟᴇᴛᴇ
┃ ᴘᴀʏʟᴏᴀᴅs: \( {current}/ \){total}
┃ ʀᴇᴍᴀɪɴɪɴɢ: ${Math.max(0, total - current)}
\( {eta > 0 ? `┃ ᴇᴛᴀ: \~ \){eta}s\n` : ''}${phase ? `┃ ᴘʜᴀsᴇ: ${phase}\n` : ''}╰══════════════════════════`
        );
    };

    // Send the first message and correctly capture the key
    const init = async (phase = 'sᴛᴀʀᴛɪɴɢ...') => {
        try {
            const sent = await sock.sendMessage(chat, {
                text: render(0, phase)
            }, { quoted });

            // Baileys returns different shapes depending on version
            messageKey = sent?.key || sent;
            lastUpdate = Date.now();
            return messageKey;
        } catch (e) {
            console.error('[ProgressBar] init failed:', e.message);
            return null;
        }
    };

    const update = async (increment = 1, phase = '') => {
        if (isDone) return;

        current += increment;
        if (current > total) current = total;

        const percent = Math.min(100, Math.floor((current / total) * 100));
        const now = Date.now();

        // Always allow the final update
        if (now - lastUpdate < UPDATE_INTERVAL && percent < 100) return;
        lastUpdate = now;

        const text = render(percent, phase);

        try {
            if (!messageKey) {
                // first time → send new message
                const sent = await sock.sendMessage(chat, { text }, { quoted });
                messageKey = sent?.key || sent;
            } else {
                // edit existing message
                await sock.sendMessage(chat, {
                    text,
                    edit: messageKey
                });
            }
        } catch (e) {
            // If edit fails (message too old / key invalid), send a new one
            try {
                const sent = await sock.sendMessage(chat, { text }, { quoted });
                messageKey = sent?.key || sent;
            } catch {}
        }
    };

    const setPhase = async (phase) => {
        if (isDone) return;
        const percent = Math.min(100, Math.floor((current / total) * 100));
        const text = render(percent, phase);

        try {
            if (!messageKey) {
                const sent = await sock.sendMessage(chat, { text }, { quoted });
                messageKey = sent?.key || sent;
            } else {
                await sock.sendMessage(chat, { text, edit: messageKey });
            }
        } catch {
            try {
                const sent = await sock.sendMessage(chat, { text }, { quoted });
                messageKey = sent?.key || sent;
            } catch {}
        }
    };

    const done = async (finalText = '') => {
        isDone = true;
        const text = finalText || render(100, 'ᴄᴏᴍᴘʟᴇᴛᴇ');

        try {
            if (messageKey) {
                await sock.sendMessage(chat, {
                    text,
                    edit: messageKey
                });
            } else {
                await sock.sendMessage(chat, { text }, { quoted });
            }
        } catch {
            try {
                await sock.sendMessage(chat, { text }, { quoted });
            } catch {}
        }
    };

    return {
        update,
        done,
        setPhase,
        init,               // call this once at the start if you want
        getCurrent: () => current,
        getTotal: () => total
    };
}

module.exports = { createProgressBar };