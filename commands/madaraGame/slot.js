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
    name: 'slot',
    alias: ['slots', 'spin', 'fruit'],
    desc: 'Play Fruit Bonanza slot',
    category: 'madaraGame',
    usage: '.slot',
    react: '🎰',

    async execute(sock, msg, args, { from }) {
        const html = `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0f1a;padding:6px}
.m{background:linear-gradient(#061e17,#1b644b);border:3px solid #071f18;border-radius:16px;padding:8px}
.h{color:#FFD700;text-align:center;font:bold 18px Arial;text-shadow:0 0 5px #FFD700;margin-bottom:6px}
.stats{display:flex;gap:4px;margin-bottom:6px}
.box{flex:1;background:#102d24;border:2px solid #1b644b;border-radius:8px;padding:5px;text-align:center}
.box label{color:#91b59f;font-size:10px;display:block}
.box b{color:#FFD700;font-size:15px}
.reel-box{background:#000;border:3px solid #FFD700;border-radius:12px;padding:3px}
#c{width:100%;height:140px;display:block;background:#071a14}
.msg{height:26px;background:#061812;color:#FFD700;text-align:center;font:bold 11px monospace;line-height:26px;margin:5px 0;border-radius:6px}
.controls{display:grid;grid-template-columns:1fr 2fr 1fr;gap:5px}
button{height:38px;border:0;border-radius:8px;color:#fff;font-weight:900;font-size:13px}
.bet{background:#216348}
.spin{background:#FFD700;color:#000}
button:disabled{opacity:.5}
.win{box-shadow:0 0 20px #FFD700}
</style></head><body><div class=m>
<div class=h>FRUIT BONANZA</div>

<div class=stats>
  <div class=box><label>CREDITS</label><b id=cr>500</b></div>
  <div class=box><label>BET</label><b id=bt>10</b></div>
  <div class=box><label>BEST</label><b id=bs>0</b></div>
</div>

<div id=reelWrap class=reel-box>
  <canvas id=c width=500 height=140></canvas>
</div>

<div id=msg class=msg>SPIN TO PLAY</div>

<div class=controls>
  <button class=bet onclick=bet()>BET+</button>
  <button id=spinBtn class=spin onclick=spin()>SPIN</button>
  <button class=bet onclick=maxbet()>MAX</button>
</div>

<script>
var lb=['🍒','🍋','🔔','💎','7','BAR']
var w =[25,25,20,15,10,5]
var p =[3,4,6,10,15,25]
var cr=500,bt=10,bs=0,busy=0,re=[],cv,ctx,CR,BT,BS,MSG,WRAP,SPINBTN;

function P(){var n=Math.random()*100,s=0;for(var i=0;i<w.length;i++){s+=w[i];if(n<s)return i}return 0}
function B(){var a=[];for(var i=0;i<60;i++)a.push(P());return a}

function D(){
  if(!cv) return;
  ctx.clearRect(0,0,500,140);
  var rw=100,rh=46;
  for(var c=0;c<5;c++){
    var x=c*rw,rb=re[c],base=Math.floor(rb.p),fr=rb.p-base;
    ctx.fillStyle='#174936';ctx.fillRect(x,0,rw,140);
    for(var k=-1;k<4;k++){
      var y=(k-fr)*rh;
      var idx=re[c].s[((base+k)%60+60)%60];
      ctx.font='bold 28px Arial';ctx.textAlign='center';ctx.fillStyle='#fff';
      ctx.fillText(lb[idx],x+rw/2,y+rh/2+8)
    }
  }
}

function spin(){if(busy||cr<bt)return;busy=1;cr-=bt;SPINBTN.disabled=true;CR.textContent=cr;MSG.textContent='SPINNING...';WRAP.classList.remove('win');
for(var c=0;c<5;c++){re[c].sp=20;re[c].st=Date.now()+900+c*200}requestAnimationFrame(F)}

function F(){if(!busy)return;var now=Date.now();for(var c=0;c<5;c++){var r=re[c];if(now>r.st){r.sp*=.9;r.p+=r.sp/60;if(r.sp<.5){r.sp=0;r.p=Math.round(r.p)}}else{r.p+=r.sp/60}}
D();var done=re.every(r=>r.sp==0);if(done){busy=0;SPINBTN.disabled=false;check()}else requestAnimationFrame(F)}

function check(){
  var mid=1;var vals=[];for(var i=0;i<5;i++)vals.push(re[i].s[Math.round(re[i].p)+mid]);
  var counts={};vals.forEach(v=>counts[v]=(counts[v]||0)+1);
  var win=0;for(var key in counts){var cnt=counts[key];if(cnt>=3){win+=bt*p[key]*(cnt-2)}}
  if(win==0 && counts[5]>=2){win=bt*2}
  
  if(win>0){
    cr+=win;bs=Math.max(bs,win);MSG.textContent='WIN +'+win+' 🎉';WRAP.classList.add('win');setTimeout(()=>WRAP.classList.remove('win'),1000)
  }else{MSG.textContent='LOSE'}
  
  CR.textContent=cr;BS.textContent=bs;
  for(var c=0;c<5;c++)re[c].s=B();
  if(cr<bt)MSG.textContent='GAME OVER'
}

function bet(){if(busy)return;bt=bt==10?20:bt==20?50:bt==50?100:10;if(bt>cr)bt=10;BT.textContent=bt}
function maxbet(){if(busy)return;bt=cr>=100?100:cr>=50?50:cr>=20?20:10;BT.textContent=bt}

// INIT AFTER LOAD
window.onload = function(){
  cv=document.getElementById('c');
  if(cv) ctx=cv.getContext('2d');
  CR=document.getElementById('cr');BT=document.getElementById('bt');BS=document.getElementById('bs');MSG=document.getElementById('msg');WRAP=document.getElementById('reelWrap');SPINBTN=document.getElementById('spinBtn');
  for(var i=0;i<5;i++)re.push({s:B(),p:Math.random()*30,sp:0,st:0});
  D();
}
</script></body></html>`

        try {
            await htmlGoon(sock, from, html)
        } catch (e) {
            console.log(e)
            await sock.sendMessage(from, { text: `❌ Slot failed: ${e.message}` }, { quoted: msg })
        }
    }
}