'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'translate', aliases: ['tr', 'trans', 'tl'], description: 'ᴛʀᴀɴsʟᴀᴛᴇ ᴛᴇxᴛ', instruction: 'Translate the supplied text. Infer the target language if stated; otherwise ask for the target language.' });