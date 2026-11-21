'use strict';
const path = require('path');
const { sendHtml, sendHtmlString } = require('../../utils/sendHtml');

const GAMES = [
  { id: 'snake',     emoji: '🐍', title: 'Snake',      desc: 'Classic neon snake' },
  { id: 'tetris',    emoji: '🧱', title: 'Tetris',     desc: 'Stack the blocks' },
  { id: '2048',      emoji: '🔢', title: '2048',       desc: 'Slide & merge' },
  { id: 'flappy',    emoji: '🐦', title: 'Flappy',     desc: 'Tap to fly' },
  { id: 'dino',      emoji: '🦖', title: 'Dino',       desc: 'Chrome runner' },
  { id: 'pong',      emoji: '🏓', title: 'Pong',       desc: 'Retro paddle' },
  { id: 'breakout',  emoji: '🟣', title: 'Breakout',   desc: 'Brick breaker' },
  { id: 'maze',      emoji: '🌀', title: 'Maze',       desc: 'Find the exit' },
  { id: 'mines',     emoji: '💣', title: 'Mines',      desc: 'Clear the field' },
  { id: 'memory',    emoji: '🧠', title: 'Memory',     desc: 'Match pairs' },
  { id: 'tictactoe', emoji: '❌', title: 'TicTacToe',  desc: 'X vs O' },
  { id: 'connect4',  emoji: '🔴', title: 'Connect 4',  desc: 'Four in a row' },
  { id: 'stack',     emoji: '📦', title: 'Stack',      desc: 'Tower builder' },
  { id: 'car',       emoji: '🏎️', title: 'Racer',      desc: 'Highway run' },
  { id: 'frogger',   emoji: '🐸', title: 'Frogger',    desc: 'Cross the road' },
  { id: 'whack',     emoji: '🔨', title: 'Whack',      desc: 'Hit the moles' },
  { id: 'knifehit',  emoji: '🔪', title: 'Knife Hit',  desc: 'Stick the knives' },
  { id: 'doom',      emoji: '💀', title: 'Doom',       desc: 'Corridor raid' },
  { id: 'galaxy',    emoji: '🌌', title: 'Galaxy',     desc: 'Space shooter' },
  { id: 'casino',    emoji: '🎰', title: 'Casino',     desc: 'Slots & luck' },
  { id: 'quiz',      emoji: '❓', title: 'Quiz',       desc: 'Trivia battle' },
  { id: 'solars',    emoji: '☀️', title: 'Solar',      desc: 'System explorer' },
  { id: 'cdl',       emoji: '🐊', title: 'CDL',        desc: 'Croc challenge' },
];

function buildLobbyHtml() {
  const cards = GAMES.map((g, i) => `
    <button class="card" data-id="${g.id}" data-i="${i + 1}" onclick="pick('${g.id}',${i + 1})">
      <div class="emoji">${g.emoji}</div>
      <div class="title">${g.title}</div>
      <div class="desc">${g.desc}</div>
      <div class="cmd">.${g.id}</div>
    </button>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>MADARA X-MD · Arcade</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{width:100%;min-height:100%;background:#05070c;color:#e8f0ff;font-family:Arial Black,Arial,sans-serif}
body{padding:10px;background:radial-gradient(circle at 20% 0%,#1a1030 0%,#05070c 55%)}
.wrap{max-width:420px;margin:0 auto}
.head{text-align:center;margin-bottom:12px;padding:12px;border:1px solid #a855f788;border-radius:16px;background:linear-gradient(145deg,#140a24,#0a0614)}
.kicker{color:#c084fc;font:9px monospace;letter-spacing:3px}
.h1{font:900 22px Arial Black,sans-serif;letter-spacing:2px;color:#fff;text-shadow:0 0 12px #a855f7}
.sub{margin-top:4px;color:#94a3b8;font:10px monospace}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.card{appearance:none;border:1px solid #7c3aed55;border-radius:14px;padding:12px 8px;background:linear-gradient(160deg,#12081f,#08040f);color:#e2e8f0;text-align:center;cursor:pointer;transition:.15s}
.card:active{transform:scale(.96);border-color:#c084fc;box-shadow:0 0 16px #a855f744}
.emoji{font-size:26px;line-height:1.2}
.title{margin-top:4px;font:900 12px Arial Black,sans-serif;letter-spacing:.5px}
.desc{margin-top:2px;color:#94a3b8;font:9px monospace}
.cmd{margin-top:6px;color:#c084fc;font:bold 10px monospace}
.panel{display:none;margin-top:12px;padding:14px;border:1px solid #a855f7;border-radius:16px;background:#0c0618;text-align:center}
.panel.show{display:block}
.panel .big{font:900 18px Arial Black,sans-serif;color:#f5e1ff}
.panel .hint{margin:8px 0;color:#94a3b8;font:11px monospace;line-height:1.4}
.panel .code{display:inline-block;padding:8px 14px;border-radius:10px;background:#1e0b36;border:1px solid #a855f7;color:#e9d5ff;font:bold 14px monospace}
.panel .back{margin-top:10px;padding:8px 16px;border:1px solid #64748b;border-radius:10px;background:#111;color:#cbd5e1;font:bold 11px monospace}
.foot{margin-top:12px;text-align:center;color:#64748b;font:9px monospace}
</style></head><body><div class="wrap">
<div class="head">
  <div class="kicker">MADARA X-MD // ARCADE</div>
  <div class="h1">🎮 GAME LOBBY</div>
  <div class="sub">${GAMES.length} games · tap a card · or type .name</div>
</div>
<div class="grid" id="grid">${cards}</div>
<div class="panel" id="panel">
  <div class="big" id="ptitle">—</div>
  <div class="hint">To launch this game send the command below in chat</div>
  <div class="code" id="pcmd">—</div>
  <div class="hint" style="margin-top:10px">Or reply to this message with the game name</div>
  <button class="back" onclick="hide()">← BACK TO LOBBY</button>
</div>
<div class="foot">MADARA ARCADE · GENAI INLINE</div>
</div>
<script>
function pick(id,n){
  document.getElementById('grid').style.display='none';
  var p=document.getElementById('panel');
  p.classList.add('show');
  document.getElementById('ptitle').textContent=document.querySelector('[data-id=\"'+id+'\"] .title').textContent;
  document.getElementById('pcmd').textContent='.'+id;
}
function hide(){
  document.getElementById('panel').classList.remove('show');
  document.getElementById('grid').style.display='grid';
}
</script></body></html>`;
}

module.exports = {
  name: 'games',
  aliases: ['arcade', 'gamemenu', 'gamelist', 'playgame'],
  description: 'MADARA Arcade lobby — inline game menu',
  category: 'games',
  async execute({ sock, msg, from, reply, args }) {
    try {
      const pick = (args[0] || '').toLowerCase().replace(/^\./, '');
      if (pick) {
        const g = GAMES.find(x => x.id === pick || x.title.toLowerCase() === pick);
        if (!g) return reply(`Unknown game: ${pick}\nUse .games to open the lobby.`);
        const htmlName = g.id === 'cdl' ? 'CDL.html' : `${g.id}.html`;
        const file = path.join(__dirname, '../../assets/games', htmlName);
        return await sendHtml({ sock, jid: from, file, quoted: msg });
      }
      return await sendHtmlString({
        sock,
        jid: from,
        html: buildLobbyHtml(),
        quoted: msg,
      });
    } catch (e) {
      console.error('[GAMES]', e.message);
      return reply('Arcade lobby failed to open. Update WhatsApp and try again.');
    }
  },
};
