'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'summarize', aliases: ['summary', 'tldr'], description: 'sᴜᴍᴍᴀʀɪᴢᴇ ᴛᴇxᴛ', instruction: 'Summarize the supplied text accurately in concise bullet points, preserving important qualifications.' });