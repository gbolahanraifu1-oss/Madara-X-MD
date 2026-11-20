'use strict';
const path = require('path');
const { sendHtml } = require('../../utils/sendHtml');

module.exports = {
    name: 'maze',
    aliases: ['mazegame'],
    description: 'Play MADARA MAZE',
    category: 'games',
    async execute({ sock, msg, from, reply }) {
        try {
            const file = path.join(__dirname, '../../assets/games/maze.html');
            return await sendHtml({ sock, jid: from, file, quoted: msg });
        } catch (e) {
            console.error('[MAZE]', e.message);
            return reply('Game could not open on this client. Update WhatsApp and try again.');
        }
    },
};
