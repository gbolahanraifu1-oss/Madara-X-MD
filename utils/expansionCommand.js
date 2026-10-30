'use strict';

const https = require('https');
const gameSessions = new Map();

function sessionKey(jid, game) {
    return String(jid || 'dm') + ':' + game;
}
function getSession(jid, game) {
    return gameSessions.get(sessionKey(jid, game)) || null;
}
function setSession(jid, game, data) {
    gameSessions.set(sessionKey(jid, game), data);
}
function clearSession(jid, game) {
    gameSessions.delete(sessionKey(jid, game));
}
function clearAllForChat(jid) {
    var n = 0;
    var prefix = String(jid) + ':';
    gameSessions.forEach(function (_, key) {
        if (key.indexOf(prefix) === 0) {
            gameSessions.delete(key);
            n++;
        }
    });
    return n;
}

function title(name) {
    return String(name).replace(/[-_]/g, ' ').replace(/\b\w/g, function (c) {
        return c.toUpperCase();
    });
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

var WORDLE_WORDS = [
    'apple', 'brave', 'crane', 'dream', 'eagle', 'flame', 'grape', 'house',
    'input', 'joker', 'knife', 'lemon', 'magic', 'night', 'ocean', 'piano',
    'queen', 'robot', 'snake', 'tiger', 'ultra', 'vivid', 'whale', 'youth'
];

function wordleFeedback(secret, guess) {
    var s = secret.split('');
    var g = guess.split('');
    var res = ['⬜', '⬜', '⬜', '⬜', '⬜'];
    var used = [false, false, false, false, false];
    var i, idx;
    for (i = 0; i < 5; i++) {
        if (g[i] === s[i]) {
            res[i] = '🟩';
            used[i] = true;
            g[i] = null;
        }
    }
    for (i = 0; i < 5; i++) {
        if (!g[i]) continue;
        idx = -1;
        for (var j = 0; j < 5; j++) {
            if (!used[j] && s[j] === g[i]) {
                idx = j;
                break;
            }
        }
        if (idx >= 0) {
            res[i] = '🟨';
            used[idx] = true;
        }
    }
    return res.join('');
}

function handleGame(name, args, jid) {
    var cmd = String(args[0] || '').toLowerCase();
    var rest = args.slice(1).map(function (a) {
        return String(a).toLowerCase();
    });

    if (cmd === 'end' || cmd === 'quit' || cmd === 'stop') {
        if (!getSession(jid, name)) return '❌ No active ' + title(name) + ' game.';
        clearSession(jid, name);
        return '✅ ' + title(name) + ' ended.';
    }

    if (cmd === 'start' || cmd === 'new' || cmd === 'restart') {
        if (name === 'wordle') {
            setSession(jid, name, { secret: pick(WORDLE_WORDS), tries: [], max: 6 });
            return '🎮 Wordle started!\nGuess a 5-letter word.\n.' + name + ' guess crane';
        }
        if (name === 'blackjack') {
            setSession(jid, name, { active: true });
            return '🎮 Blackjack started!\n.' + name + ' hit  or  .' + name + ' stand';
        }
        if (name === '2048') {
            setSession(jid, name, { active: true });
            return '🎮 2048 started!\n.' + name + ' left|right|up|down';
        }
        if (name === 'minesweeper') {
            setSession(jid, name, { active: true });
            return '🎮 Minesweeper started!\n.' + name + ' dig 2 3';
        }
        setSession(jid, name, { active: true, turn: 1 });
        return '🎮 ' + title(name) + ' started!\n.' + name + ' play <move>\n.' + name + ' end';
    }

    var session = getSession(jid, name);
    if (!session) {
        return '🎮 ' + title(name) + '\nNo active game.\nRun: .' + name + ' start';
    }

    if (name === 'wordle') {
        var guess = cmd === 'guess' ? String(rest[0] || '') : cmd;
        guess = guess.replace(/[^a-z]/gi, '').toLowerCase();
        if (guess.length !== 5) return '❌ Need a 5-letter word.\n.' + name + ' guess crane';
        var fb = wordleFeedback(session.secret, guess);
        session.tries.push({ guess: guess, fb: fb });
        if (guess === session.secret) {
            clearSession(jid, name);
            return '✅ Correct! ' + guess.toUpperCase() + '\n' + fb;
        }
        if (session.tries.length >= session.max) {
            var secret = session.secret;
            clearSession(jid, name);
            return '💀 Out of tries. Word was ' + secret.toUpperCase();
        }
        setSession(jid, name, session);
        return '🎮 Wordle (' + session.tries.length + '/' + session.max + ')\n' +
            session.tries.map(function (t) {
                return t.guess.toUpperCase() + ' ' + t.fb;
            }).join('\n');
    }

    session.turn = (session.turn || 1) + 1;
    setSession(jid, name, session);
    return '🎮 ' + title(name) + ' turn ' + session.turn + '\nMove received.\n.' + name + ' end to quit';
}

var GAMES = {
    '2048': 1, minesweeper: 1, connect4: 1, checkers: 1, chess: 1, wordle: 1,
    hangman: 1, battleship: 1, memorymatch: 1, sudoku: 1, kakuro: 1,
    mastermind: 1, blackjack: 1, rpsls: 1, typingrace: 1, randomdice: 1
};

function executeCommand(name, args, reply, jid) {
    var values = (args || []).map(String).filter(Boolean);
    if (GAMES[name]) return reply(handleGame(name, values, jid));
    return reply(title(name) + ' is ready.\nInput: ' + (values.join(' ') || 'none'));
}

function makeCommand(opts) {
    var name = opts.name;
    var category = opts.category;
    var description = opts.description;
    return {
        name: name,
        aliases: [],
        description: description,
        category: category,
        execute: function (a, b, c, d) {
            var reply, args, jid;
            if (a && typeof a === 'object' && (typeof a.reply === 'function' || a.args)) {
                reply = a.reply;
                args = a.args || [];
                jid = a.from || a.chat || 'dm';
            } else {
                var sock = a;
                var msg = b;
                args = c || [];
                var ctx = d || {};
                jid = ctx.from || (msg && msg.key && msg.key.remoteJid) || 'dm';
                reply = function (text) {
                    if (ctx.reply) return ctx.reply(text);
                    return sock.sendMessage(jid, { text: text }, { quoted: msg });
                };
            }
            return executeCommand(name, args, reply, jid);
        }
    };
}

module.exports = {
    makeCommand: makeCommand,
    gameSessions: gameSessions,
    clearAllForChat: clearAllForChat,
    clearSession: clearSession
};