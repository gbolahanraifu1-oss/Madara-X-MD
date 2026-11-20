'use strict';
const path = require('path');
const { sendHtml } = require('../../utils/sendHtml');

module.exports = {
    name: 'galaxy',
    aliases: ['galaxygame'],
    description: 'Play MADARA GALAXY',
    category: 'games',
    async execute({ sock, msg, from, reply }) {
        try {
            const file = path.join(__dirname, '../../assets/games/galaxy.html');
            return await sendHtml({ sock, jid: from, file, quoted: msg });
        } catch (e) {
            console.error('[GALAXY]', e.message);
            return reply('Game could not open on this client. Update WhatsApp and try again.');
        }
    },
};
