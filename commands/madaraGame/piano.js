const { Buffer } = require('buffer')

module.exports = {
    name: 'piano',
    alias: ['keyboard', 'keys'],
    desc: 'Play inline piano with sound',
    category: 'madaraGame',
    usage: '.piano',
    react: '🎹',

    async execute(sock, msg, args, { from, sender }) {
        const html = `<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
html,body{margin:0;padding:0;width:100%;min-height:100%;background:transparent;font-family:Arial,Helvetica,sans-serif;color:#fff;overflow:hidden;touch-action:manipulation}
.wrap{width:100%;max-width:620px;margin:auto;padding:7px}
.card{position:relative;overflow:hidden;border-radius:24px;background:linear-gradient(180deg,#171525 0%,#090812 100%);border:1px solid rgba(255,255,255,.13);box-shadow:0 20px 55px rgba(0,0,0,.55),inset 0 1px rgba(255,255,255,.08)}
.header{display:flex;align-items:center;justify-content:space-between;padding:13px 15px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025)}
.brand{display:flex;align-items:center}
.logo{width:43px;height:43px;display:flex;align-items:center;justify-content:center;border-radius:14px;margin-right:10px;font-size:21px;font-weight:900;background:linear-gradient(145deg,#8b79ff,#5541c5);box-shadow:0 7px 25px rgba(105,87,229,.4),inset 0 1px rgba(255,255,255,.25)}
.mini{font-size:8px;letter-spacing:2px;color:#77748c;margin-bottom:4px}
.title{font-size:18px;font-weight:800}
.octave{text-align:right}
.octave-label{font-size:8px;letter-spacing:1.2px;color:#77748c}
.octave-value{margin-top:4px;font-size:16px;font-weight:800}
.main{padding:14px 12px 13px}
.display{text-align:center;margin-bottom:12px}
.display-label{font-size:8px;letter-spacing:2px;color:#77748c}
.note{margin-top:4px;font-size:27px;font-weight:900;letter-spacing:2px;text-shadow:0 0 14px rgba(139,121,255,.6)}
.piano{position:relative;display:flex;height:190px;padding:9px;border-radius:20px;background:linear-gradient(180deg,#29253c,#0e0d16);border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 1px rgba(255,255,255,.1),0 13px 35px rgba(0,0,0,.4)}
.white{position:relative;flex:1;height:170px;margin:0 2px;border:0;border-radius:0 0 9px 9px;background:linear-gradient(180deg,#ffffff,#d8d8df);box-shadow:inset 0 -8px 12px rgba(0,0,0,.15),0 4px 6px rgba(0,0,0,.35);color:#555;font-size:9px;font-weight:700;display:flex;align-items:flex-end;justify-content:center;padding-bottom:9px;z-index:1}
.white:active,.white.active{background:linear-gradient(180deg,#e5ddff,#a99bea);transform:translateY(3px)}
.black{position:absolute;top:9px;width:9%;height:108px;border:0;border-radius:0 0 7px 7px;background:linear-gradient(90deg,#08080c,#33333d 48%,#07070a);box-shadow:0 7px 10px rgba(0,0,0,.65),inset 2px 0 rgba(255,255,255,.12);color:#aaa;font-size:7px;font-weight:700;z-index:3;display:flex;align-items:flex-end;justify-content:center;padding-bottom:7px}
.black:active,.black.active{background:linear-gradient(90deg,#433b70,#7666c5,#31295b);transform:translateY(3px)}
.b1{left:12%}.b2{left:25.5%}.b3{left:53%}.b4{left:66.5%}.b5{left:80%}
.controls{display:flex;gap:8px;margin-top:11px}
.control{flex:1;height:45px;border:0;border-radius:13px;color:#fff;font-size:11px;font-weight:900;letter-spacing:1px;background:linear-gradient(135deg,#8270ff,#5946cc);box-shadow:0 7px 20px rgba(105,87,229,.25)}
.control:active{transform:scale(.96)}
.hint{text-align:center;margin-top:10px;font-size:8px;letter-spacing:.5px;color:#77748c}
.result{min-height:40px;display:flex;align-items:center;justify-content:center;text-align:center;margin-top:9px;padding:9px;border-radius:12px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);font-size:10px;color:#77748a}
.footer{display:flex;align-items:center;justify-content:center;gap:7px;padding:0 0 13px;font-size:8px;letter-spacing:1px;color:#5e5b70}
.dot{width:5px;height:5px;border-radius:50%;background:#67e6a5;box-shadow:0 0 9px rgba(103,230,165,.9)}
</style>
<div class="wrap"><div class="card"><div class="header"><div class="brand"><div class="logo">🎹</div><div><div class="mini">ᴍᴀᴅᴀʀᴀ x-ᴍᴅ ɢᴀᴍᴇ </div><div class="title">Piano</div></div></div><div class="octave"><div class="octave-label">OCTAVE</div><div id="octave" class="octave-value">4</div></div></div><div class="main"><div class="display"><div class="display-label">PLAYING NOTE</div><div id="note" class="note">READY</div></div><div id="piano" class="piano"><button class="white" data-note="C">C</button><button class="white" data-note="D">D</button><button class="white" data-note="E">E</button><button class="white" data-note="F">F</button><button class="white" data-note="G">G</button><button class="white" data-note="A">A</button><button class="white" data-note="B">B</button><button class="black b1" data-note="C#">C#</button><button class="black b2" data-note="D#">D#</button><button class="black b3" data-note="F#">F#</button><button class="black b4" data-note="G#">G#</button><button class="black b5" data-note="A#">A#</button></div><div class="controls"><button id="down" class="control">− OCTAVE</button><button id="middle" class="control">CENTER</button><button id="up" class="control">+ OCTAVE</button></div><div class="hint">Keyboard: A S D F G H J • W E T Y U</div><div id="result" class="result">Tap a piano key to play</div></div><div class="footer"><span class="dot"></span><span>ᴍᴀᴅᴀʀᴀ x-ᴍᴅ</span><span>•</span><span>PIANO</span></div></div></div><script>
(function(){var piano=document.getElementById("piano");var noteEl=document.getElementById("note");var octaveEl=document.getElementById("octave");var result=document.getElementById("result");var octave=4;var audioContext=null;var keys={"a":"C","s":"D","d":"E","f":"F","g":"G","h":"A","j":"B","w":"C#","e":"D#","t":"F#","y":"G#","u":"A#"};
function getAudio(){if(!audioContext){var AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext){return null;}audioContext=new AudioContext();}if(audioContext.state==="suspended"){audioContext.resume();}return audioContext;}
function frequency(note){var notes={"C":0,"C#":1,"D":2,"D#":3,"E":4,"F":5,"F#":6,"G":7,"G#":8,"A":9,"A#":10,"B":11};var midi=notes[note]+((octave+1)*12);return 440*Math.pow(2,(midi-69)/12);}
function play(note,key){var ctx=getAudio();if(ctx){var osc=ctx.createOscillator();var gain=ctx.createGain();osc.type="sine";osc.frequency.value=frequency(note);gain.gain.setValueAtTime(0.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.35,ctx.currentTime+0.015);gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.75);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.8);}noteEl.textContent=note+octave;result.textContent="🎵 Playing "+note+octave;key.classList.add("active");setTimeout(function(){key.classList.remove("active");},130);}
piano.querySelectorAll("[data-note]").forEach(function(key){key.addEventListener("pointerdown",function(e){e.preventDefault();play(key.dataset.note,key);});});
document.addEventListener("keydown",function(e){if(e.repeat){return;}var note=keys[e.key.toLowerCase()];if(!note){return;}var key=piano.querySelector('[data-note="'+note+'"]');if(key){play(note,key);}});
document.getElementById("down").addEventListener("click",function(){octave--;if(octave<1){octave=1;}octaveEl.textContent=octave;result.textContent="Octave "+octave;});
document.getElementById("up").addEventListener("click",function(){octave++;if(octave>7){octave=7;}octaveEl.textContent=octave;result.textContent="Octave "+octave;});
document.getElementById("middle").addEventListener("click",function(){octave=4;octaveEl.textContent=octave;result.textContent="Center octave selected";});})();</script>`

        const payload = {
            messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
                botMetadata: {
                    messageDisclaimerText: "",
                    botResponseId: "ᴍᴀᴅᴀʀᴀ x-ᴍᴅ-ᴘɪᴀɴᴏ" + Date.now()
                }
            },
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages: [
                            { messageType: 2, messageText: "ᴍᴀᴅᴀʀᴀ x-ᴍᴅ • ᴘɪᴀɴᴏ" }
                        ],
                        unifiedResponse: {
                            data: Buffer.from(JSON.stringify({
                                response_id: "yourbot-piano-" + Date.now(),
                                sections: [
                                    {
                                        view_model: {
                                            primitive: {
                                                __typename: "GenAIaeacdsnwHtmlPrimitive",
                                                payload: html,
                                                trusted_sources: ["ᴍᴀᴅᴀʀᴀ x-ᴍᴅ"]
                                            },
                                            __typename: "GenAISingleLayoutViewModel"
                                        }
                                    }
                                ]
                            })).toString("base64")
                        },
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedAiBotMessageInfo: {
                                botJid: "867051314767696@bot"
                            },
                            forwardOrigin: 4
                        }
                    }
                }
            }
        }

        try {
            await sock.relayMessage(from, payload, {})
        } catch (e) {
            console.log(e)
            await sock.sendMessage(from, { 
                text: `❌ Piano failed to load. Meta might have patched it.\n\nUse: https://your-piano.vercel.app instead` 
            }, { quoted: msg })
        }
    }
}