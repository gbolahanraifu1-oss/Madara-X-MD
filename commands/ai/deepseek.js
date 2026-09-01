'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'deepseek', aliases: ['ds', 'dschat'], description: 'ᴀsᴋ ᴀɪ', instruction: 'Answer the request accurately and reason through difficult parts before giving a concise result.' });