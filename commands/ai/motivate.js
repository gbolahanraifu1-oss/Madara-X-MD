'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'motivate', aliases: ['inspire2', 'aiinspire'], description: 'ɢᴇᴛ ᴍᴏᴛɪᴠᴀᴛᴇᴅ', instruction: 'Give a practical, encouraging motivational response tailored to the supplied situation.' });