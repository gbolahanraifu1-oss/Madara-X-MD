'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'caption', aliases: ['imagecaption', 'addcaption'], description: 'ᴡʀɪᴛᴇ ᴀ ᴄᴀᴘᴛɪᴏɴ', instruction: 'Write several concise, platform-friendly captions for the supplied description.' });