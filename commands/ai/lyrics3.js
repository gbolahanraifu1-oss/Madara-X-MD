'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'lyrics3', aliases: ['songwrite', 'writelyrics'], description: 'ᴡʀɪᴛᴇ ᴏʀɪɢɪɴᴀʟ ʟʏʀɪᴄs', instruction: 'Write original song lyrics about the supplied topic. Do not imitate a living artist or reproduce copyrighted lyrics.' });