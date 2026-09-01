'use strict';
const { createAiCommand } = require('../../lib/aiCommand');
module.exports = createAiCommand({ name: 'anonymize', aliases: ['redact', 'removeinfo', 'hidepii'], description: 'ʀᴇᴍᴏᴠᴇ ᴘᴇʀsᴏɴᴀʟ ɪɴғᴏʀᴍᴀᴛɪᴏɴ', instruction: 'Anonymize the supplied text. Remove or replace names, contact details, identifiers, and other personal information while preserving meaning.' });