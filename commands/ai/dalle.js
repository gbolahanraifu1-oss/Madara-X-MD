'use strict';
const { createImageCommand } = require('../../lib/aiCommand');
module.exports = createImageCommand({ name: 'dalle', aliases: ['texttoimage', 'tti'], description: 'ɢᴇɴᴇʀᴀᴛᴇ ᴀɴ ɪᴍᴀɢᴇ', usage: '†dalle image prompt' });