'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'recipe2', aliases: ['cookingai', 'airecipe'], description: 'ɢᴇᴛ ᴀ ʀᴇᴄɪᴘᴇ', instruction: 'Create a practical recipe with ingredients, quantities, steps, timing, and substitutions.' });