'use strict';

const path = require('path');
const fs = require('fs');
const { menuBox } = require('../../lib/menuBox');

// Prefer the GenAI HTML lobby when sendHtml + assets exist
let sendHtmlString = null;
try {
    ({ sendHtmlString } = require('../../utils/sendHtml'));
} catch (_) {}

const HTML_GAMES = [
    { id: 'snake',     emoji: '🐍', title: 'Snake' },
    { id: 'tetris',    emoji: '🧱', title: 'Tetris' },
    { id: '2048',      emoji: '🔢', title: '2048' },
    { id: 'flappy',    emoji: '🐦', title: 'Flappy' },
    { id: 'dino',      emoji: '🦖', title: 'Dino' },
    { id: 'pong',      emoji: '🏓', title: 'Pong' },
    { id: 'breakout',  emoji: '🟣', title: 'Breakout' },
    { id: 'maze',      emoji: '🌀', title: 'Maze' },
    { id: 'mines',     emoji: '💣', title: 'Mines' },
    { id: 'memory',    emoji: '🧠', title: 'Memory' },
    { id: 'tictactoe', emoji: '❌', title: 'TicTacToe' },
    { id: 'connect4',  emoji: '🔴', title: 'Connect 4' },
    { id: 'stack',     emoji: '📦', title: 'Stack' },
    { id: 'car',       emoji: '🏎️', title: 'Racer' },
    { id: 'frogger',   emoji: '🐸', title: 'Frogger' },
    { id: 'whack',     emoji: '🔨', title: 'Whack' },
    { id: 'knifehit',  emoji: '🔪', title: 'Knife Hit' },
    { id: 'doom',      emoji: '💀', title: 'Doom' },
    { id: 'galaxy',    emoji: '🌌', title: 'Galaxy' },
    { id: 'casino',    emoji: '🎰', title: 'Casino' },
    { id: 'quiz',      emoji: '❓', title: 'Quiz' },
    { id: 'solars',    emoji: '☀️', title: 'Solar' },
    { id: 'cdl',       emoji: '🐊', title: 'CDL' },
];

function buildLobbyHtml(prefix) {
    const cards = HTML_GAMES.map((g) => `
    <button class="card" data-id="${g.id}" onclick="pick('${g.id}')">
      <div class="emoji">${g.emoji}</div>
      <div class="title">${g.title}</div>
      <div class="cmd">${prefix}${g.id}</div>
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
.card{appearance:none;border:1px solid #7c3aed55;border-radius:14px;padding:12px 8px;background:linear-gradient(160deg,#12081f,#08040f);color:#e2e8f0;text-align:center;cursor:pointer}
.card:active{transform:scale(.96);border-color:#c084fc;box-shadow:0 0 16px #a855f744}
.emoji{font-size:26px;line-height:1.2}
.title{margin-top:4px;font:900 12px Arial Black,sans-serif}
.cmd{margin-top:6px;color:#c084fc;font:bold 10px monospace}
.panel{display:none;margin-top:12px;padding:14px;border:1px solid #a855f7;border-radius:16px;background:#0c0618;text-align:center}
.panel.show{display:block}
.panel .big{font:900 18px Arial Black,sans-serif;color:#f5e1ff}
.panel .hint{margin:8px 0;color:#94a3b8;font:11px monospace;line-height:1.4}
.panel .code{display:inline-block;padding:8px 14px;border-radius:10px;background:#1e0b36;border:1px solid #a855f7;color:#e9d5ff;font:bold 14px monospace}
.panel .back{margin-top:10px;padding:8px 16px;border:1px solid #64748b;border-radius:10px;background:#111;color:#cbd5e1;font:bold 11px monospace}
.foot{margin-top:12px;text-align:center;color:#64748b;font:9px monospace}
.sec{margin:14px 0 8px;color:#c084fc;font:bold 11px monospace;letter-spacing:1px}
</style></head><body><div class="wrap">
<div class="head">
  <div class="kicker">MADARA X-MD // ARCADE</div>
  <div class="h1">🎮 GAME CENTER</div>
  <div class="sub">${HTML_GAMES.length} HTML games · tap a card · or type ${prefix}name</div>
</div>
<div class="grid" id="grid">${cards}</div>
<div class="panel" id="panel">
  <div class="big" id="ptitle">—</div>
  <div class="hint">Send this command in chat to launch</div>
  <div class="code" id="pcmd">—</div>
  <button class="back" onclick="hide()">← BACK TO LOBBY</button>
</div>
<div class="foot">MADARA ARCADE · HTML + CLASSIC</div>
</div>
<script>
function pick(id){
  document.getElementById('grid').style.display='none';
  var p=document.getElementById('panel');
  p.classList.add('show');
  document.getElementById('ptitle').textContent=document.querySelector('[data-id=\"'+id+'\"] .title').textContent;
  document.getElementById('pcmd').textContent='${prefix}'+id;
}
function hide(){
  document.getElementById('panel').classList.remove('show');
  document.getElementById('grid').style.display='grid';
}
</script></body></html>`;
}

function classicTextMenu(prefix, footer) {
    return menuBox('🎮', 'ɢᴀᴍᴇ ᴄᴇɴᴛᴇʀ', [
        '—— HTML ARCADE ——',
        ...HTML_GAMES.map((g) => `${g.emoji} \`${prefix}${g.id}\` — ${g.title}`),
        '—— CLASSIC ——',
        `🎯 \`${prefix}trivia\` — Trivia quiz`,
        `🧩 \`${prefix}hangman start\` — Hangman`,
        `🚩 \`${prefix}flagquiz\` — Guess the flag`,
        `🎭 \`${prefix}emojigame\` — Emoji riddles`,
        `🧩 \`${prefix}riddle\` — Brain teasers`,
        `✂️ \`${prefix}rps\` — Rock Paper Scissors`,
        `🎲 \`${prefix}roll\` — Dice roller`,
        `🪙 \`${prefix}flipcoin\` — Coin flip`,
        `🎰 \`${prefix}slot\` — Slot machine`,
        `🔢 \`${prefix}mathquiz\` — Math quiz`,
        `🏆 \`${prefix}leaderboard\` — Group scores`,
        `🛑 \`${prefix}endgame\` — Stop active game`,
        '',
        `_HTML lobby: ${prefix}arcade_`,
    ]) + (footer || '');
}

module.exports = {
    name: 'games',
    aliases: ['gamemenu', 'gamelist', 'gamehelp', 'arcade', 'game'],
    category: 'games',
    desc: 'MADARA Game Center — HTML arcade + classic',
    usage: '.games',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings || {};
        const prefix = s.prefix || '.';
        const from = ctx.from || msg.key.remoteJid;
        const pick = (args[0] || '').toLowerCase().replace(/^\./, '');

        // .games snake → launch that HTML game if present
        if (pick) {
            const g = HTML_GAMES.find((x) => x.id === pick || x.title.toLowerCase() === pick);
            if (g) {
                try {
                    const { sendHtml } = require('../../utils/sendHtml');
                    const htmlName = g.id === 'cdl' ? 'CDL.html' : `${g.id}.html`;
                    const file = path.join(process.cwd(), 'assets', 'games', htmlName);
                    if (fs.existsSync(file)) {
                        return await sendHtml({ sock, jid: from, file, quoted: msg });
                    }
                } catch (e) {
                    console.log('[games] direct launch fail:', e.message);
                }
                return ctx.reply(`HTML file missing for *${g.title}*. Put it in assets/games/${g.id}.html`);
            }
            // unknown pick → fall through to menu
        }

        // Prefer GenAI HTML lobby
        if (typeof sendHtmlString === 'function') {
            try {
                await sendHtmlString({
                    sock,
                    jid: from,
                    html: buildLobbyHtml(prefix),
                    quoted: msg,
                });
                return;
            } catch (e) {
                console.log('[games] HTML lobby fail → text menu:', e.message);
            }
        }

        // Text fallback (classic + HTML cmd list)
        return ctx.reply(classicTextMenu(prefix, s.FOOTER));
    },
};
