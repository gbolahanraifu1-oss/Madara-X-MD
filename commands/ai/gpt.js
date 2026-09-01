'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'gpt', aliases: ['chatgpt', 'openai'], description: 'ᴀsᴋ ᴀɪ', instruction: 'Answer the request clearly and accurately.' });