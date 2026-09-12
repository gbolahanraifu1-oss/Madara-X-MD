const { Buffer } = require('buffer')
const { generateWAMessageFromContent } = require('@itsliaaa/baileys')
const crypto = require('crypto')

async function htmlGoon(sock, jid, html) {
    const msg = generateWAMessageFromContent(jid, {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    unifiedResponse: {
                        data: Buffer.from(JSON.stringify({
                            __typename: "GenAIUnifiedResponse",
                            response_id: crypto.randomUUID(),
                            sections: [{
                                __typename: "GenAIUnifiedResponseSection",
                                view_model: {
                                    __typename: "GenAISingleLayoutViewModel",
                                    primitive: {
                                        __typename: "FOAHtmlPrimitiveDemoDONOTUSE",
                                        trusted_sources: ["madara"],
                                        payload: html.trim()
                                    }
                                }
                            }]
                        })).toString("base64")
                    },
                    contextInfo: { isForwarded: true, forwardOrigin: 4 }
                }
            }
        }
    }, {})
    return sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
}

module.exports = {
    name: 'musicplayer',
    alias: ['mplayer', 'mplay', 'mp'],
    desc: 'Play music in chat',
    category: 'Fun',
    usage: '.musicplayer',
    react: '🎵',

    async execute(sock, msg, args, { from }) {
        const html = `<html><head><meta name=viewport content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);font-family:Arial;overflow:hidden}.box{padding:15px;color:#fff;text-align:center}.title{font:22px Impact;margin-bottom:8px;text-shadow:0 2px 4px #0007}.card{background:#ffffff15;backdrop-filter:blur(10px);border:2px solid #ffffff30;border-radius:18px;padding:15px;margin-bottom:10px}input{width:100%;padding:10px;border:none;border-radius:10px;background:#00030;color:#fff;font-size:14px}input::placeholder{color:#ffffff88}.btns{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:10px 0}button{padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,#f093fb,#f5576c);color:#fff;font-weight:900;font-size:14px}audio{width:100%;margin-top:8px;border-radius:10px}.info{font-size:11px;color:#ffffffaa;margin-top:8px}</style></head><body><div class=box><div class=title>🎵 MADARA MUSIC PLAYER</div><div class=card><input id=url type=text placeholder="Paste Direct MP3 Link Here"><div class=btns><button ontouchstart=load()>LOAD</button><button ontouchstart=play()>▶ PLAY</button><button ontouchstart=pause()>⏸ PAUSE</button></div><audio id=audio controls></audio><div class=info>Tip: Use direct .mp3 link. YT links won't work</div></div></div><script>var aud=document.getElementById('audio');function load(){var u=document.getElementById('url').value.trim();if(!u)return;aud.src=u;aud.load();document.getElementById('url').value=''}function play(){aud.play().catch(e=>alert('Load a song first'))}function pause(){aud.pause()}</script></body></html>`

        try {
            await htmlGoon(sock, from, html)
        } catch (e) {
            console.log(e)
            await sock.sendMessage(from, { text: `❌ Music player failed to load` }, { quoted: msg })
        }
    }
}