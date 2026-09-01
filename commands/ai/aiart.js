'use strict';
const { createImageCommand } = require('../../lib/aiCommand');
module.exports = createImageCommand({ name: 'aiart', aliases: ['art', 'txt2img', 'stablediff'], description: 'ɢᴇɴᴇʀᴀᴛᴇ ᴀɪ ᴀʀᴛ', usage: '†aiart image prompt' });