'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'bio', aliases: ['writebio', 'aiprofile'], description: 'ᴡʀɪᴛᴇ ᴀ ᴘʀᴏғɪʟᴇ ʙɪᴏ', instruction: 'Write a polished, engaging profile bio from the supplied details.' });