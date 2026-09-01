'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'predict', aliases: ['future', 'aipredict'], description: 'ᴇxᴘʟᴏʀᴇ ᴘᴏssɪʙɪʟɪᴛɪᴇs', instruction: 'Discuss plausible possibilities and uncertainty. Do not present predictions as guaranteed facts.' });