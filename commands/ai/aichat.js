'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'aichat', aliases: ['chatmode', 'aimode'], description: 'ᴄʜᴀᴛ ᴡɪᴛʜ ᴀɪ', instruction: 'Have a natural conversation and answer the user directly.' });