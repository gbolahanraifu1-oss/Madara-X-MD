'use strict';

function resolveDesignPreference(preferences, senderId) {
    if (senderId && Object.prototype.hasOwnProperty.call(preferences || {}, senderId)) {
        return preferences[senderId] || 'default';
    }
    return preferences?.default || 'default';
}

module.exports = { resolveDesignPreference };
