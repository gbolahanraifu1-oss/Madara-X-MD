'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'gemine', aliases: ['gemini-lite'], description: 'ᴀsᴋ ᴀɪ', instruction: 'Answer the request clearly and accurately.' });