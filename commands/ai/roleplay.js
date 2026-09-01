'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'roleplay', aliases: ['rp', 'persona', 'aicharacter'], description: 'ʀᴏʟᴇᴘʟᴀʏ ᴡɪᴛʜ ᴀɪ', instruction: 'Roleplay the character or scenario requested by the user while staying safe and clearly fictional.' });