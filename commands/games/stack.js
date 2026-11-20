'use strict';
const path = require('path');
const { sendHtml } = require('../../utils/sendHtml');

module.exports = {
    name: 'stack',
    aliases: ['stackgame'],
    description: 'Play MADARA STACK',
    category: 'games',
    async execute({ sock, msg, from, reply }) {
        try {
            const file = path.join(__dirname, '../../assets/games/stack.html');
            return await sendHtml({ sock, jid: from, file, quoted: msg });
        } catch (e) {
            console.error('[STACK]', e.message);
            return reply('Game could not open on this client. Update WhatsApp and try again.');
        }
    },
};
