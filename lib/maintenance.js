// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Global Maintenance Mode               ║
// ║   Single source of truth, persisted to disk, shared   ║
// ║   by Telegram bot, web pairing API, and †pair cmd.     ║
// ╚══════════════════════════════════════════════════════╝

'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'maintenance.json');

function load() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            return { enabled: !!raw.enabled, reason: raw.reason || '' };
        }
    } catch (e) {
        console.error('[Maintenance] load error:', e.message);
    }
    return { enabled: false, reason: '' };
}

function persist() {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify({
            enabled:   _state.enabled,
            reason:    _state.reason,
            updatedAt: Date.now(),
        }, null, 2));
    } catch (e) {
        console.error('[Maintenance] save error:', e.message);
    }
}

const _state = load();

module.exports = {
    /** @returns {boolean} whether maintenance mode is currently ON */
    isOn() { return _state.enabled; },

    /** @returns {string} optional reason/message set when enabling */
    reason() { return _state.reason; },

    enable(reason = '') {
        _state.enabled = true;
        _state.reason  = reason;
        persist();
        return true;
    },

    disable() {
        _state.enabled = false;
        _state.reason  = '';
        persist();
        return false;
    },

    toggle(reason = '') {
        if (_state.enabled) return this.disable();
        return this.enable(reason);
    },
};
