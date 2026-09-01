'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'joke5', aliases: ['aijoke', 'funnyai'], description: 'ɢᴇɴᴇʀᴀᴛᴇ ᴀ ᴊᴏᴋᴇ', instruction: 'Create an original, safe joke about the supplied topic.' });