'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'essay', aliases: ['writeessay', 'aiessay'], description: 'ᴡʀɪᴛᴇ ᴀɴ ᴇssᴀʏ', instruction: 'Write a well-structured essay with a clear thesis, organized paragraphs, and a conclusion.' });