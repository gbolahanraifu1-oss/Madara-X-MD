'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'codegen', aliases: ['generatecode', 'writecode', 'aicode'], description: 'ɢᴇɴᴇʀᴀᴛᴇ ᴄᴏᴅᴇ', instruction: 'Generate correct, secure, runnable code. Explain key assumptions briefly and use a fenced code block.' });