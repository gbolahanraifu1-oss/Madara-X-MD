'use strict';

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', 'data', 'telegram-pairing.json');

function createTelegramPairingState(filePath = STATE_FILE) {
    function isEnabled() {
        try {
            const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return typeof state.enabled === 'boolean' ? state.enabled : true;
        } catch {
            return true;
        }
    }

    function setEnabled(enabled) {
        if (typeof enabled !== 'boolean') throw new TypeError('enabled must be a boolean');
        const directory = path.dirname(filePath);
        fs.mkdirSync(directory, { recursive: true });
        const temporary = `${filePath}.${process.pid}.tmp`;
        fs.writeFileSync(temporary, JSON.stringify({ enabled }, null, 2), 'utf8');
        fs.renameSync(temporary, filePath);
        return enabled;
    }

    function toggle() {
        return setEnabled(!isEnabled());
    }

    return { isEnabled, setEnabled, toggle };
}

const state = createTelegramPairingState();

module.exports = {
    STATE_FILE,
    createTelegramPairingState,
    isPairingEnabled: state.isEnabled,
    setPairingEnabled: state.setEnabled,
    togglePairing: state.toggle,
};
