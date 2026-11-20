'use strict';
const path = require('path');
const { sendHtml } = require('../../utils/sendHtml');

module.exports = {
    name: '2048',
    aliases: ['2048game'],
    description: 'Play MADARA 2048',
    category: 'games',
    async execute({ sock, msg, from, reply }) {
        try {
            const file = path.join(__dirname, '../../assets/games/2048.html');
            return await sendHtml({ sock, jid: from, file, quoted: msg });
        } catch (e) {
            console.error('[2048]', e.message);
            return reply('Game could not open on this client. Update WhatsApp and try again.');
        }
    },
};
