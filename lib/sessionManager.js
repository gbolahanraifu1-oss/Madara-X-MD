'use strict';

const pairManager = require('./pairManager');

function getSession(phoneNumber) {
    return pairManager.activeSessions.get(String(phoneNumber || '')) || null;
}

function getAllConnectedSessions() {
    return [...pairManager.activeSessions.entries()].map(([number, session]) => ({
        number,
        status: session?.connected ? 'connected' : 'connecting',
        ...session,
    }));
}

function getCachedMessage(from, id) {
    try {
        const retrieveStore = require('../utils/retrieveStore');
        return retrieveStore.getById(null, id, from);
    } catch {
        return null;
    }
}

module.exports = {
    ...pairManager,
    getSession,
    getAllConnectedSessions,
    getCachedMessage,
};