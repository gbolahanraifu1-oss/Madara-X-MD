'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'explain', aliases: ['simplify', 'layman'], description: 'ᴇxᴘʟᴀɪɴ sɪᴍᴘʟʏ', instruction: 'Explain the supplied topic in simple language using a short example when helpful.' });