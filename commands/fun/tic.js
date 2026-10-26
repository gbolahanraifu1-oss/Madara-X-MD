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
    name: 'tic2',
    alias: ['tictac2', 'ttt2'],
    desc: '2 Player Tic Tac Toe - Tap to play',
    category: 'Fun',
    usage: '.tic2',
    react: '❌',

    async execute(sock, msg, args, { from }) {
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>
body{margin:0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
.game{background:#fff;padding:20px;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,0.3);max-width:400px;width:95%}
.title{text-align:center;font:bold 24px Arial;color:#667eea;margin-bottom:15px}
.status{background:#667eea;color:#fff;padding:14px;border-radius:10px;text-align:center;font:bold 16px Arial;margin-bottom:15px;cursor:pointer}
.status:active{background:#5566cc}
.board{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:15px}
.cell{aspect-ratio:1;background:#f0f0f0;border:3px solid #667eea;border-radius:12px;display:flex;align-items:center;justify-content:center;font:bold 55px Arial;cursor:pointer;transition:0.2s;user-select:none}
.cell:hover{background:#e0e0e0}
.cell.x{color:#FF4500}
.cell.o{color:#1E90FF}
.cell.win{background:#90EE90;animation:pulse 0.5s}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
.score{display:flex;justify-content:space-around;margin-bottom:15px}
.sbox{text-align:center;background:#f0f0f0;padding:10px;border-radius:8px;flex:1;margin:0 4px;font-weight:bold}
.sbox b{font-size:22px;color:#667eea;display:block}
.note{text-align:center;font-size:11px;color:#666}
</style></head><body><div class=game>
<div class=title>❌ TIC TAC TOE ⭕</div>
<div id=status class=status>TURN: PLAYER X<br><span style="font-size:11px">Tap here to Reset</span></div>
<div class=score>
  <div class=sbox>X<b id=xScore>0</b></div>
  <div class=sbox>DRAW<b id=draw>0</b></div>
  <div class=sbox>O<b id=oScore>0</b></div>
</div>
<div id=board class=board></div>
<div class=note>Tap cells to play. 2 Players on 1 device</div>
</div><script>
(function(){
var board=[],turn='X',gameOver=false,xScore=0,oScore=0,draws=0,winLine=[];

function init(){
  board=['','','','','','','','',''];
  gameOver=false;turn='X';winLine=[];
  document.getElementById('status').innerHTML='TURN: PLAYER X<br><span style="font-size:11px">Tap here to Reset</span>';
  render();
}

function render(){
  var b=document.getElementById('board');b.innerHTML='';
  for(var i=0;i<9;i++){
    var cell=document.createElement('div');
    cell.className='cell '+(board[i].toLowerCase());
    cell.innerText=board[i];
    if(winLine.includes(i)) cell.classList.add('win');
    cell.onclick=function(){move(parseInt(this.id))};
    cell.id=i;
    b.appendChild(cell);
  }
}

function move(i){
  if(board[i]!='' || gameOver) return;
  board[i]=turn;
  if(checkWin()){
    gameOver=true;
    document.getElementById('status').innerHTML='PLAYER '+turn+' WINS! 🎉<br><span style="font-size:11px">Tap here to Reset</span>';
    if(turn=='X') xScore++; else oScore++;
  } else if(board.every(c=>c!='')){
    gameOver=true;
    document.getElementById('status').innerHTML='IT\'S A DRAW! 🤝<br><span style="font-size:11px">Tap here to Reset</span>';
    draws++;
  } else {
    turn=turn=='X'?'O':'X';
    document.getElementById('status').innerHTML='TURN: PLAYER '+turn+'<br><span style="font-size:11px">Tap here to Reset</span>';
  }
  updateScore();render();
}

function checkWin(){
  var w=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for(var i=0;i<w.length;i++){
    if(board[w[i][0]]!='' && board[w[i][0]]==board[w[i][1]] && board[w[i][1]]==board[w[i][2]]){
      winLine=w[i];return true;
    }
  }winLine=[];return false;
}

function updateScore(){
  document.getElementById('xScore').innerText=xScore;
  document.getElementById('oScore').innerText=oScore;
  document.getElementById('draw').innerText=draws;
}

// Only 1 event listener on status bar
document.getElementById('status').onclick=init;
init();
})();
</script></body></html>`

        try {
            await htmlGoon(sock, from, html)
        } catch (e) {
            console.log(e)
            await sock.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: msg })
        }
    }
}