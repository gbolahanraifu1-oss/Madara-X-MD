'use strict';
const path = require('path');
const { sendHtml } = require('../../utils/sendHtml');

module.exports = {
    name: 'connect4',
    aliases: ['connect4game'],
    description: 'Play MADARA CONNECT4',
    category: 'games',
    async execute({ sock, msg, from, reply }) {
        try {
            const file = path.join(__dirname, '../../assets/games/connect4.html');
            return await sendHtml({ sock, jid: from, file, quoted: msg });
        } catch (e) {
            console.error('[CONNECT4]', e.message);
            return reply('Game could not open on this client. Update WhatsApp and try again.');
        }
    },
};
