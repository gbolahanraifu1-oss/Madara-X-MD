'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'nameai', aliases: ['suggestname', 'namegen'], description: 'ɢᴇɴᴇʀᴀᴛᴇ ɴᴀᴍᴇs', instruction: 'Suggest creative names for the supplied person, project, brand, or idea and briefly explain the strongest options.' });