'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'grammar', aliases: ['fixgrammar', 'grammarcheck', 'proofread'], description: 'ᴄʜᴇᴄᴋ ɢʀᴀᴍᴍᴀʀ', instruction: 'Correct grammar, spelling, punctuation, and clarity. Return the improved text and a short list of important changes.' });