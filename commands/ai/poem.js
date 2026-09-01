'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'poem', aliases: ['poetry', 'aipoem', 'writepoem'], description: 'ᴡʀɪᴛᴇ ᴀ ᴘᴏᴇᴍ', instruction: 'Write an original poem about the supplied topic with vivid imagery.' });