'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'fix', aliases: ['fixcode', 'debugcode'], description: 'ғɪx ᴄᴏᴅᴇ', instruction: 'Review the supplied code, identify the problem, return a corrected version, and explain the fix briefly.' });