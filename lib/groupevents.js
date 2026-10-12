'use strict';
// Compatibility shim: all group welcome/goodbye delivery now lives in madaraFeatures.
async function handleGroupParticipantUpdate(sock, update) {
    const { handleGroupUpdate } = require('./madaraFeatures');
    return handleGroupUpdate(sock, update, require('../settings'));
}
module.exports = { handleGroupParticipantUpdate };
