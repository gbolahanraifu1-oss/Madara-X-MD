
'use strict';
const crypto = require('crypto');

const BOT_NAME = 'MADARA';
const BOT_VERSION = 'X-MD';
const BOT_FULL = `${BOT_NAME} ${BOT_VERSION}`;

const quotedMessage = {
extendedTextMessage: {
text: `༺ ${BOT_FULL} ༻`
}
};

const quotedContext = {
remoteJid: 'status@broadcast',
participant: '0@s.whatsapp.net',
stanzaId: '666',
quotedMessage,
isForwarded: true,
forwardingScore: 999,
forwardedNewsletterMessageInfo: {
newsletterJid: '120363424626346173@newsletter',
newsletterName: 'MADARA X-MD'
},
forwardOrigin: 'USER'
};

const createMessageId = () => crypto.randomBytes(8).toString('hex').toUpperCase();

module.exports = { 
BOT_NAME, 
BOT_VERSION, 
BOT_FULL, 
quotedMessage, 
quotedContext, 
createMessageId, 
messageMeta 
};