'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'gemini', aliases: ['bard'], description: 'ᴀsᴋ ᴀɪ', instruction: 'Answer the request clearly and accurately.' });