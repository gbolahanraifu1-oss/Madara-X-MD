const { Buffer } = require('buffer')
const { generateWAMessageFromContent } = require('@itsliaaa/baileys') // same as your slot
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
    name: 'subway',
    alias: ['surf', 'run'],
    desc: 'Play Subway Runner',
    category: 'Fun',
    usage: '.subway',
    react: '🚇',

    async execute(sock, msg, args, { from }) {
        const html = `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0}
body{background:#87CEEB}
.wrap{padding:5px;max-width:500px;margin:0 auto}
.top{display:flex;justify-content:space-between;margin-bottom:5px}
.tag{background:#000a;color:#FFD700;padding:6px 10px;border-radius:8px;font:bold 12px Arial}
#cv{width:100%;height:380px;background:#87CEEB;border:3px solid #333;border-radius:10px;display:block}
.txt{text-align:center;color:#fff;font:bold 14px Arial;text-shadow:1px 1px 2px #000;margin:5px 0}
</style></head><body><div class=wrap>
<div class=top><div class=tag>SCORE: <span id=score>0</span></div><div class=tag>COINS: <span id=coins>0</span></div></div>
<canvas id=cv width=500 height=380></canvas>
<div id=msg class=txt>TAP TO START</div>
<div class=txt style="font-size:10px;color:#000">SWIPE L/R TO MOVE | TAP TOP=JUMP | TAP BOTTOM=SLIDE</div>
</div><script>
var c=document.getElementById('cv'),x=c.getContext('2d'),W=500,H=380;
var pl={lane:1,y:0,j:0,vy:0,sl:0},ob=[],co=[],d=0,sc=0,cg=0,sp=4,g=0;

function rs(){pl={lane:1,y:0,j:0,vy:0,sl:0};ob=[];co=[];d=0;sc=0;cg=0;sp=4;g=1;msg.style.display='none';}
function add(){if(Math.random()<.025)ob.push({l:Math.random()*3|0,p:d+12,t:Math.random()<.5});if(Math.random()<.04)co.push({l:Math.random()*3|0,p:d+12,u:0})}
function up(){if(!g)return;d+=sp;sc=d/5|0;if(pl.j){pl.vy-=.7;pl.y+=pl.vy;if(pl.y>=0){pl.y=0;pl.j=0;pl.vy=0}}add();
for(var i=ob.length-1;i>=0;i--){if(ob[i].p<d-5)ob.splice(i,1);else if(ob[i].l==pl.lane&&ob[i].p>d-1&&ob[i].p<d+1&&pl.y>-0.5)g=0}
for(var i=co.length-1;i>=0;i--){if(co[i].p<d-5)co.splice(i,1);else if(!co[i].u&&co[i].l==pl.lane&&co[i].p>d-1&&co[i].p<d+1&&pl.y>-0.5){co[i].u=1;cg++}}
sp=Math.min(9,4+d/800);score.innerText=sc|0;coins.innerText=cg;}
function dr(){x.clearRect(0,0,W,H);var lw=W/3,gy=H-80;x.fillStyle='#444';x.fillRect(0,gy,W,H);for(var i=0;i<3;i++){x.fillStyle='#666';x.fillRect(i*lw+lw/2-3,gy,6,H)}
var px=pl.lane*lw+lw/2-15,py=gy-60+pl.y*60;if(pl.sl)py+=30;x.fillStyle='#FF4500';x.fillRect(px,py,30,pl.sl?30:60);x.fillStyle='#FFD700';x.beginPath();x.arc(px+15,py+12,10,0,7);x.fill();
ob.forEach(o=>{var ox=(o.l*lw+lw/2-25)-(o.p-d)*lw;x.fillStyle=o.t?'#1E90FF':'#8B4513';x.fillRect(ox,gy-60,50,60)});co.forEach(c=>{if(!c.u){var cx=(c.l*lw+lw/2)-(c.p-d)*lw;x.fillStyle='#FFD700';x.beginPath();x.arc(cx,gy-40,10,0,7);x.fill()}});
if(g){up();requestAnimationFrame(dr)}else{msg.innerHTML='GAME OVER<br>SCORE: '+(sc|0)+'<br>TAP TO RESTART';msg.style.display='block'}}
var sx=0,score=document.getElementById('score'),coins=document.getElementById('coins'),msg=document.getElementById('msg');
c.addEventListener('touchstart',e=>{sx=e.touches[0].clientX});c.addEventListener('touchend',e=>{var ex=e.changedTouches[0].clientX,ey=e.changedTouches[0].clientY;if(!g){rs();dr();return}if(Math.abs(ex-sx)>40){if(ex>sx&&pl.lane<2)pl.lane++;if(ex<sx&&pl.lane>0)pl.lane--}else{if(ey<180&&!pl.j){pl.j=1;pl.vy=11}else{pl.sl=1;setTimeout(()=>pl.sl=0,350)}}});
dr();
</script></body></html>`

        try {
            await htmlGoon(sock, from, html)
        } catch (e) {
            console.log(e)
            await sock.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: msg })
        }
    }
}