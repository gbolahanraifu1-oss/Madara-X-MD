'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'story', aliases: ['writestory', 'aiwrite', 'generate'], description: 'ᴡʀɪᴛᴇ ᴀ sᴛᴏʀʏ', instruction: 'Write an original, engaging short story based on the supplied idea.' });