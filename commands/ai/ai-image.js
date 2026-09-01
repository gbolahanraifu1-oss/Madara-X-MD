'use strict';
const { createImageCommand } = require('../../lib/aiCommand');
module.exports = createImageCommand({ name: 'imagine', aliases: ['aiimage', 'generate', 'gen'], description: 'ɢᴇɴᴇʀᴀᴛᴇ ᴀɪ ɪᴍᴀɢᴇ', usage: '†imagine image prompt' });