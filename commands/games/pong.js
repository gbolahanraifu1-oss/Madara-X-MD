'use strict';
const path = require('path');
const { sendHtml } = require('../../utils/sendHtml');

module.exports = {
    name: 'pong',
    aliases: ['ponggame'],
    description: 'Play MADARA PONG',
    category: 'games',
    async execute({ sock, msg, from, reply }) {
        try {
            const file = path.join(__dirname, '../../assets/games/pong.html');
            return await sendHtml({ sock, jid: from, file, quoted: msg });
        } catch (e) {
            console.error('[PONG]', e.message);
            return reply('Game could not open on this client. Update WhatsApp and try again.');
        }
    },
};
