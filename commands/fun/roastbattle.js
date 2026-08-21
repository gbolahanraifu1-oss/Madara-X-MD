'use strict';
const { aiQuery } = require('../../lib/ai');

const _battles = new Map(); // groupJid -> battle state
const _lobbies = new Map(); // groupJid -> { host, timer }
const BOT = 'BOT';

async function botLine(target) {
    try {
        return await aiQuery(`Write ONE short savage/funny roast line (max 15 words) aimed playfully at someone in a friendly roast battle game. No explanation, just the line.`);
    } catch { return `${target ? '@'+target.split('@')[0]+', ' : ''}you're so basic, autocorrect gave up on you. 😂`; }
}

async function startBattle(sock, msg, ctx, p1, p2) {
    const s = ctx.settings;
    _battles.set(ctx.from, { p1, p2, turn: p1, round: 1, max: 3, scores: { [p1]: 0, [p2]: 0 } });
    await ctx.react('🔥');

    const tag = (j) => j === BOT ? '🤖 *MADARA BOT*' : `@${j.split('@')[0]}`;
    const mentions = [p1, p2].filter(j => j !== BOT);

    await sock.sendMessage(ctx.from, {
        text: `🔥 *ROAST BATTLE STARTED!*\n\n${tag(p1)} 🆚 ${tag(p2)}\n\nRound 1/3 — ${tag(p1)}'s turn!`,
        mentions
    }, { quoted: msg });

    if (p1 === BOT) await runBotTurn(sock, msg, ctx);
}

async function runBotTurn(sock, msg, ctx) {
    const battle = _battles.get(ctx.from);
    if (!battle) return;
    const other = battle.turn === battle.p1 ? battle.p2 : battle.p1;
    const line = await botLine(other);
    await sock.sendMessage(ctx.from, { text: `🤖 *MADARA BOT:* ${line}` }, { quoted: msg });
    await advanceTurn(sock, msg, ctx);
}

async function advanceTurn(sock, msg, ctx) {
    const battle = _battles.get(ctx.from);
    const other = battle.turn === battle.p1 ? battle.p2 : battle.p1;
    battle.scores[battle.turn]++;
    battle.turn = other;

    const tag = (j) => j === BOT ? '🤖 *MADARA BOT*' : `@${j.split('@')[0]}`;

    if (battle.round >= battle.max) {
        const [a, b] = [battle.p1, battle.p2];
        const winner = battle.scores[a] === battle.scores[b] ? null : (battle.scores[a] > battle.scores[b] ? a : b);
        _battles.delete(ctx.from);
        await sock.sendMessage(ctx.from, {
            text: `🏁 *BATTLE OVER!*\n${tag(a)}: ${battle.scores[a]} pts\n${tag(b)}: ${battle.scores[b]} pts\n\n` +
                  (winner ? `🏆 Winner: ${tag(winner)}!` : `🤝 It's a tie!`),
            mentions: [a, b].filter(j => j !== BOT)
        }, { quoted: msg });
        return;
    }

    battle.round++;
    await sock.sendMessage(ctx.from, {
        text: `Round ${battle.round}/${battle.max} — ${tag(other)}'s turn!`,
        mentions: [other].filter(j => j !== BOT)
    }, { quoted: msg });

    if (other === BOT) await runBotTurn(sock, msg, ctx);
}

module.exports = {
    name: 'roastbattle', aliases: ['battleroast', 'roastwar'], category: 'fun',
    desc: 'PvP roast battle — vs tagged user, vs bot, or open lobby to join',
    usage: '.roastbattle @user — vs that user\n.roastbattle — vs bot (tag no one)\n.roastbattle @u1 @u2 — two players\n.roastbattle end',

    groupOnly: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if ((args[0] || '').toLowerCase() === 'end') {
            _battles.delete(ctx.from); _lobbies.delete(ctx.from);
            return ctx.reply(`🛑 Roast battle / lobby ended.${s.FOOTER}`);
        }
        if (_battles.has(ctx.from)) return ctx.reply(`⚠️ A battle is already running here. \`${s.prefix}roastbattle end\` to stop it.${s.FOOTER}`);

        const m = ctx.getMentions?.() ?? [];

        if (m.length >= 2) return startBattle(sock, msg, ctx, m[0], m[1]);
        if (m.length === 1) return startBattle(sock, msg, ctx, ctx.sender, m[0]);

        // No mention → open a join lobby: bot vs whoever types .rbjoin first
        if (_lobbies.has(ctx.from)) return ctx.reply(`⚠️ A lobby is already open. Type \`${s.prefix}rbjoin\` to join!${s.FOOTER}`);
        _lobbies.set(ctx.from, { host: ctx.sender });
        await ctx.react('🎤');
        await sock.sendMessage(ctx.from, {
            text: `🎤 *ROAST BATTLE LOBBY OPEN!*\n\nType \`${s.prefix}rbjoin\` to battle the *🤖 MADARA BOT*!\nFirst person to join gets battled. 60s to join, otherwise bot battles @${ctx.sender.split('@')[0]}.`,
            mentions: [ctx.sender]
        }, { quoted: msg });

        setTimeout(async () => {
            if (!_lobbies.has(ctx.from)) return; // someone already joined and started
            _lobbies.delete(ctx.from);
            await startBattle(sock, msg, ctx, BOT, ctx.sender);
        }, 60_000);
    },

    // Called from handler.js on every plain group message
    async handleTurn(sock, msg, ctx) {
        // Lobby join command
        if ((ctx.rawCmd || '').toLowerCase() === 'rbjoin' && _lobbies.has(ctx.from)) {
            _lobbies.delete(ctx.from);
            await startBattle(sock, msg, ctx, BOT, ctx.sender);
            return true;
        }

        const battle = _battles.get(ctx.from);
        if (!battle) return false;
        if (battle.turn === BOT) return false; // bot turn handled internally
        if (ctx.sender !== battle.turn) return false;
        const text = (ctx.body || '').trim();
        if (!text || ctx.isCmd) return false;

        let verdict = '';
        try {
            verdict = await aiQuery(`In a friendly roast battle game, player just said: "${text}". React as hype commentary in ONE short savage/funny line (max 15 words), no explanation.`);
        } catch { verdict = '🔥 Ohhh that\'s heat!'; }

        await sock.sendMessage(ctx.from, { text: verdict }, { quoted: msg });
        await advanceTurn(sock, msg, ctx);
        return true;
    }
};
