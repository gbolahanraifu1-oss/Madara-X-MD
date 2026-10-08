'use strict';

// Compatibility settings for commands imported from the legacy command
// collection. The running bot remains configured through settings.js and
// environment variables; this file only exposes the small config shape those
// plugins expect.
const settings = require('./settings');

module.exports = {
    botName: settings.botName,
    version: settings.version,
    prefix: settings.prefix,
    ownerNumber: settings.ownerNumber,
    owner: {
        name: settings.ownerName,
        number: settings.ownerNumber,
        github: 'https://github.com/gbolahanraifu1-oss/Madara-X-MD',
        channel: settings.channelLink,
        telegram: settings.tgGroupUrl,
    },
    assets: {
        menuVideo: './assets/menuvideo.mp4',
        menuThumb: settings.botImagePath,
    },
    apiKeys: {
        openai: process.env.OPENAI_API_KEY || '',
        weather: process.env.WEATHER_API_KEY || '',
        imgbb: process.env.IMGBB_API_KEY || '',
        removebg: process.env.REMOVEBG_API_KEY || '',
    },
    messages: {
        wait: '⏳ Processing...',
        success: '✅ Success!',
        error: '❌ Error occurred.',
        adminOnly: '🛡️ This command is only for admins.',
        groupOnly: '👥 This command can only be used in groups.',
        botAdminNeeded: '🤖 Make the bot a group admin first.',
    },
};