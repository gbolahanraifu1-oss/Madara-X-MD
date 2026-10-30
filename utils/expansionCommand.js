'use strict';

const https = require('https');

// ═══════════════════════════════════════════
// Shared game sessions (per chat + game name)
// ═══════════════════════════════════════════
const gameSessions = new Map(); // key: `\( {jid}: \){game}`

function sessionKey(jid, game) {
    return `\( {jid || 'dm'}: \){game}`;
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
    let n = 0;
    for (const key of [...gameSessions.keys()]) {
        if (key.startsWith(`${jid}:`)) {
            gameSessions.delete(key);
            n++;
        }
    }
    return n;
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════
function fetchJson(url, timeoutMs = 7000) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, {
            headers: { 'user-agent': 'MadaraMD/1.0', accept: 'application/json' },
        }, response => {
            let body = '';
            response.setEncoding('utf8');
            response.on('data', chunk => {
                body += chunk;
                if (body.length > 1000000) request.destroy(new Error('Response too large'));
            });
            response.on('end', () => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    return reject(new Error(`HTTP ${response.statusCode}`));
                }
                try { resolve(JSON.parse(body)); }
                catch { reject(new Error('Invalid JSON response')); }
            });
        });
        request.setTimeout(timeoutMs, () => request.destroy(new Error('Request timed out')));
        request.on('error', reject);
    });
}

function clean(value, max = 1600) {
    return String(value ?? '').slice(0, max).replace(/[\u0000-\u001F\u007F]/g, '');
}
function title(name) {
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function argsText(args) {
    return (args || []).map(String).filter(Boolean).join(' ');
}
function randInt(n) {
    return Math.floor(Math.random() * n);
}
function pick(arr) {
    return arr[randInt(arr.length)];
}

// ═══════════════════════════════════════════
// GAME IMPLEMENTATIONS
// ═══════════════════════════════════════════
const WORDLE_WORDS = [
    'apple','brave','crane','dream','eagle','flame','grape','house','input','joker',
    'knife','lemon','magic','night','ocean','piano','queen','robot','snake','tiger',
    'ultra','vivid','whale','xenon','youth','zesty','bread','cloud','dance','earth'
];

function wordleFeedback(secret, guess) {
    const s = secret.split('');
    const g = guess.split('');
    const res = Array(5).fill('⬜');
    const used = Array(5).fill(false);

    for (let i = 0; i < 5; i++) {
        if (g[i] === s[i]) {
            res[i] = '🟩';
            used[i] = true;
            g[i] = null;
        }
    }
    for (let i = 0; i < 5; i++) {
        if (!g[i]) continue;
        const idx = s.findIndex((ch, j) => !used[j] && ch === g[i]);
        if (idx >= 0) {
            res[i] = '🟨';
            used[idx] = true;
        }
    }
    return res.join('');
}

function render2048(board) {
    return board.map(row =>
        row.map(v => String(v || '.').padStart(4, ' ')).join('')
    ).join('\n');
}

function spawn2048(board) {
    const empty = [];
    for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++)
            if (!board[r][c]) empty.push([r, c]);
    if (!empty.length) return false;
    const [r, c] = pick(empty);
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
    return true;
}

function slide2048(row) {
    const nums = row.filter(Boolean);
    for (let i = 0; i < nums.length - 1; i++) {
        if (nums[i] === nums[i + 1]) {
            nums[i] *= 2;
            nums[i + 1] = 0;
        }
    }
    const merged = nums.filter(Boolean);
    while (merged.length < 4) merged.push(0);
    return merged;
}

function move2048(board, dir) {
    let moved = false;
    const copy = board.map(r => [...r]);

    const apply = (get, set) => {
        for (let i = 0; i < 4; i++) {
            const row = get(i);
            const next = slide2048(row);
            if (row.join() !== next.join()) moved = true;
            set(i, next);
        }
    };

    if (dir === 'left') apply(i => board[i], (i, v) => { board[i] = v; });
    if (dir === 'right') apply(i => [...board[i]].reverse(), (i, v) => { board[i] = [...v].reverse(); });
    if (dir === 'up') apply(i => board.map(r => r[i]), (i, v) => { for (let r = 0; r < 4; r++) board[r][i] = v[r]; });
    if (dir === 'down') apply(i => board.map(r => r[i]).reverse(), (i, v) => {
        const rev = [...v].reverse();
        for (let r = 0; r < 4; r++) board[r][i] = rev[r];
    });

    if (!moved) {
        for (let r = 0; r < 4; r++) board[r] = copy[r];
    }
    return moved;
}

function canMove2048(board) {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (!board[r][c]) return true;
            if (c < 3 && board[r][c] === board[r][c + 1]) return true;
            if (r < 3 && board[r][c] === board[r + 1][c]) return true;
        }
    }
    return false;
}

function deck52() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const d = [];
    for (const s of suits) for (const r of ranks) d.push(r + s);
    for (let i = d.length - 1; i > 0; i--) {
        const j = randInt(i + 1);
        [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
}

function handValue(cards) {
    let total = 0;
    let aces = 0;
    for (const c of cards) {
        const r = c.slice(0, -1);
        if (r === 'A') { aces++; total += 11; }
        else if (['K', 'Q', 'J'].includes(r)) total += 10;
        else total += Number(r);
    }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}

function minesBoard(size = 5, mines = 5) {
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    let placed = 0;
    while (placed < mines) {
        const r = randInt(size), c = randInt(size);
        if (grid[r][c] === -1) continue;
        grid[r][c] = -1;
        placed++;
        for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] !== -1) {
                    grid[nr][nc]++;
                }
            }
    }
    return grid;
}

function renderMines(grid, revealed) {
    const size = grid.length;
    let out = '   ' + [...Array(size)].map((_, i) => i + 1).join(' ') + '\n';
    for (let r = 0; r < size; r++) {
        out += `${r + 1} `;
        for (let c = 0; c < size; c++) {
            if (!revealed[r][c]) out += '⬜';
            else if (grid[r][c] === -1) out += '💣';
            else if (grid[r][c] === 0) out += '⬛';
            else out += ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣'][grid[r][c]];
        }
        out += '\n';
    }
    return out;
}

function handleGame(name, args, jid) {
    const cmd = (args[0] || '').toLowerCase();
    const rest = args.slice(1).map(a => String(a).toLowerCase());
    const help =
        `🎮 *${title(name)}*\n\n` +
        `• \`.${name} start\` — start / restart\n` +
        `• \`.${name} status\` — show board/state\n` +
        `• \`.${name} end\` — quit\n`;

    // ── END ──
    if (['end', 'quit', 'stop', 'exit'].includes(cmd)) {
        if (!getSession(jid, name)) return `❌ No active *${title(name)}* game.`;
        clearSession(jid, name);
        return `✅ *${title(name)}* ended.`;
    }

    // ── START ──
    if (cmd === 'start' || cmd === 'new' || cmd === 'restart') {
        if (name === 'wordle') {
            const secret = pick(WORDLE_WORDS);
            setSession(jid, name, { secret, tries: [], max: 6 });
            return `🎮 *Wordle started!*\nGuess a 5-letter word.\n\n\`.wordle guess <word>\`\nExample: \`.wordle guess crane\``;
        }

        if (name === '2048') {
            const board = Array.from({ length: 4 }, () => Array(4).fill(0));
            spawn2048(board); spawn2048(board);
            setSession(jid, name, { board, score: 0 });
            return `🎮 *2048 started!*\n\`\`\`\n${render2048(board)}\n\`\`\`\nMove: \`.2048 left|right|up|down\``;
        }

        if (name === 'blackjack') {
            const deck = deck52();
            const player = [deck.pop(), deck.pop()];
            const dealer = [deck.pop(), deck.pop()];
            setSession(jid, name, { deck, player, dealer, done: false });
            return (
                `🎮 *Blackjack*\n` +
                `Your hand: \( {player.join(' ')} ( \){handValue(player)})\n` +
                `Dealer: ${dealer[0]} ??\n\n` +
                `\`.blackjack hit\` or \`.blackjack stand\``
            );
        }

        if (name === 'minesweeper') {
            const size = 5, mines = 5;
            const grid = minesBoard(size, mines);
            const revealed = Array.from({ length: size }, () => Array(size).fill(false));
            setSession(jid, name, { grid, revealed, mines, alive: true });
            return (
                `🎮 *Minesweeper* (\( {size}x \){size}, ${mines} mines)\n` +
                `\`\`\`\n${renderMines(grid, revealed)}\n\`\`\`\n` +
                `Open: \`.minesweeper dig <row> <col>\`\nExample: \`.minesweeper dig 2 3\``
            );
        }

        if (name === 'rpsls' || name === 'randomdice') {
            setSession(jid, name, { active: true });
            if (name === 'randomdice') {
                const n = 1 + randInt(6);
                clearSession(jid, name);
                return `🎲 You rolled: *${n}*`;
            }
            return `🎮 *RPSLS*\nPlay: \`.rpsls rock|paper|scissors|lizard|spock\``;
        }

        // generic start for other listed games
        setSession(jid, name, { active: true, turn: 1 });
        return (
            `🎮 *${title(name)} started!*\n` +
            `Session is live in this chat.\n\n` +
            `Use \`.${name} play <move>\` to play\n` +
            `Use \`.\( {name} status\` / \`. \){name} end\``
        );
    }

    const session = getSession(jid, name);

    // No session yet → help (NOT infinite start loop)
    if (!session) {
        return help + `\nNo active game. Run \`.${name} start\``;
    }

    // ── STATUS ──
    if (cmd === 'status' || cmd === 'board' || cmd === 'show') {
        if (name === 'wordle') {
            const lines = session.tries.map(t => `${t.guess.toUpperCase()} ${t.fb}`);
            return `🎮 *Wordle*\nTries: \( {session.tries.length}/ \){session.max}\n` + (lines.join('\n') || '_No guesses yet_');
        }
        if (name === '2048') {
            return `🎮 *2048*\n\`\`\`\n${render2048(session.board)}\n\`\`\``;
        }
        if (name === 'blackjack') {
            return `Your hand: \( {session.player.join(' ')} ( \){handValue(session.player)})\nDealer: ${session.dealer[0]} ??`;
        }
        if (name === 'minesweeper') {
            return `\`\`\`\n${renderMines(session.grid, session.revealed)}\n\`\`\``;
        }
        return `🎮 *${title(name)}* is active. Turn ${session.turn || 1}`;
    }

    // ── WORDLE GUESS ──
    if (name === 'wordle') {
        let guess = cmd === 'guess' ? (rest[0] || '') : cmd;
        guess = guess.replace(/[^a-z]/gi, '').toLowerCase();
        if (guess.length !== 5) {
            return `❌ Need a 5-letter word.\n\`.wordle guess crane\``;
        }
        const fb = wordleFeedback(session.secret, guess);
        session.tries.push({ guess, fb });
        if (guess === session.secret) {
            clearSession(jid, name);
            return `✅ *Correct!* \( {guess.toUpperCase()}\n \){fb}\nTries: ${session.tries.length}`;
        }
        if (session.tries.length >= session.max) {
            const secret = session.secret;
            clearSession(jid, name);
            return `💀 Out of tries. Word was *\( {secret.toUpperCase()}*\n \){session.tries.map(t => `${t.guess.toUpperCase()} ${t.fb}`).join('\n')}`;
        }
        setSession(jid, name, session);
        return `🎮 Wordle (\( {session.tries.length}/ \){session.max})\n\( {session.tries.map(t => ` \){t.guess.toUpperCase()} ${t.fb}`).join('\n')}`;
    }

    // ── 2048 MOVE ──
    if (name === '2048') {
        const dir = ['left', 'right', 'up', 'down'].includes(cmd) ? cmd : rest[0];
        if (!['left', 'right', 'up', 'down'].includes(dir)) {
            return `Move with:\n\`.2048 left|right|up|down\``;
        }
        const moved = move2048(session.board, dir);
        if (!moved) return `⚠️ No change.\n\`\`\`\n${render2048(session.board)}\n\`\`\``;
        spawn2048(session.board);
        if (!canMove2048(session.board)) {
            const board = render2048(session.board);
            clearSession(jid, name);
            return `💀 *Game Over*\n\`\`\`\n${board}\n\`\`\``;
        }
        setSession(jid, name, session);
        return `🎮 *2048*\n\`\`\`\n${render2048(session.board)}\n\`\`\`\n\`.2048 left|right|up|down\``;
    }

    // ── BLACKJACK ──
    if (name === 'blackjack') {
        if (session.done) {
            clearSession(jid, name);
            return `Round over. \`.blackjack start\` for new game.`;
        }
        if (cmd === 'hit') {
            session.player.push(session.deck.pop());
            const pv = handValue(session.player);
            if (pv > 21) {
                clearSession(jid, name);
                return `💥 *Bust!* ${session.player.join(' ')} = ${pv}`;
            }
            setSession(jid, name, session);
            return `Your hand: \( {session.player.join(' ')} ( \){pv})\n\`.blackjack hit\` / \`.blackjack stand\``;
        }
        if (cmd === 'stand') {
            while (handValue(session.dealer) < 17) session.dealer.push(session.deck.pop());
            const pv = handValue(session.player);
            const dv = handValue(session.dealer);
            clearSession(jid, name);
            let result = '🤝 Push';
            if (dv > 21 || pv > dv) result = '✅ You win!';
            else if (pv < dv) result = '❌ Dealer wins';
            return (
                `${result}\n` +
                `You: \( {session.player.join(' ')} ( \){pv})\n` +
                `Dealer: \( {session.dealer.join(' ')} ( \){dv})`
            );
        }
        return `Your hand: \( {session.player.join(' ')} ( \){handValue(session.player)})\nUse \`.blackjack hit\` or \`.blackjack stand\``;
    }

    // ── MINESWEEPER ──
    if (name === 'minesweeper') {
        if (cmd !== 'dig' && cmd !== 'open') {
            return `Open a cell:\n\`.minesweeper dig <row> <col>\``;
        }
        const r = Number(rest[0]) - 1;
        const c = Number(rest[1]) - 1;
        const size = session.grid.length;
        if (!(r >= 0 && r < size && c >= 0 && c < size)) {
            return `❌ Invalid cell. Rows/cols are 1-${size}`;
        }
        if (session.revealed[r][c]) return `Already open.\n\`\`\`\n${renderMines(session.grid, session.revealed)}\n\`\`\``;

        if (session.grid[r][c] === -1) {
            session.revealed[r][c] = true;
            const board = renderMines(session.grid, session.revealed);
            clearSession(jid, name);
            return `💣 *BOOM!* Mine at \( {r + 1}, \){c + 1}\n\`\`\`\n${board}\n\`\`\``;
        }

        // flood fill zeros
        const stack = [[r, c]];
        while (stack.length) {
            const [cr, cc] = stack.pop();
            if (cr < 0 || cc < 0 || cr >= size || cc >= size) continue;
            if (session.revealed[cr][cc]) continue;
            session.revealed[cr][cc] = true;
            if (session.grid[cr][cc] === 0) {
                for (let dr = -1; dr <= 1; dr++)
                    for (let dc = -1; dc <= 1; dc++)
                        stack.push([cr + dr, cc + dc]);
            }
        }

        let hidden = 0;
        for (let i = 0; i < size; i++)
            for (let j = 0; j < size; j++)
                if (!session.revealed[i][j]) hidden++;

        if (hidden === session.mines) {
            const board = renderMines(session.grid, session.revealed);
            clearSession(jid, name);
            return `🏆 *You cleared the board!*\n\`\`\`\n${board}\n\`\`\``;
        }

        setSession(jid, name, session);
        return `\`\`\`\n${renderMines(session.grid, session.revealed)}\n\`\`\`\n\`.minesweeper dig <row> <col>\``;
    }

    // ── RPSLS ──
    if (name === 'rpsls') {
        const options = ['rock', 'paper', 'scissors', 'lizard', 'spock'];
        const player = options.includes(cmd) ? cmd : rest[0];
        if (!options.includes(player)) {
            return `Choose: \`.rpsls rock|paper|scissors|lizard|spock\``;
        }
        const bot = pick(options);
        const wins = {
            rock: ['scissors', 'lizard'],
            paper: ['rock', 'spock'],
            scissors: ['paper', 'lizard'],
            lizard: ['spock', 'paper'],
            spock: ['scissors', 'rock'],
        };
        let result = '🤝 Tie';
        if (wins[player].includes(bot)) result = '✅ You win!';
        else if (wins[bot].includes(player)) result = '❌ Bot wins';
        clearSession(jid, name);
        return `You: *\( {player}*\nBot: * \){bot}*\n${result}\n\n\`.rpsls start\` again`;
    }

    // Generic play for remaining games
    if (cmd === 'play' || cmd === 'move' || rest.length || cmd) {
        session.turn = (session.turn || 1) + 1;
        setSession(jid, name, session);
        const move = argsText(args) || cmd;
        return (
            `🎮 *${title(name)}* — turn ${session.turn}\n` +
            `Received: \`${clean(move, 80)}\`\n` +
            `_Full rules engine can be expanded per game._\n` +
            `\`.${name} end\` to quit`
        );
    }

    return help;
}

// ═══════════════════════════════════════════
// Non-game local helpers
// ═══════════════════════════════════════════
function localResult(name, args) {
    const input = argsText(args);
    const calculators = new Set(['mortgage', 'loanpayment', 'tipcalc', 'vatcalc', 'billsplit']);
    const tasks = new Set(['todoadd', 'tododone', 'todoclear', 'todolist', 'habittrack', 'checklist', 'grocerylist', 'kanban']);

    if (name === 'semvercompare') {
        const [a = '0.0.0', b = '0.0.0'] = args;
        const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
        const result = (pa[0] || 0) - (pb[0] || 0) || (pa[1] || 0) - (pb[1] || 0) || (pa[2] || 0) - (pb[2] || 0);
        return '```\n' + a + ' ' + (result > 0 ? '>' : result < 0 ? '<' : '=') + ' ' + b + '\n```';
    }
    if (calculators.has(name)) return `Calculator ready. Usage: .${name} <amount> [rate/people/months]`;
    if (tasks.has(name)) {
        return `Local workspace command ready. ${input ? `Item: ${clean(input, 300)}` : 'Provide an item or action.'}`;
    }
    return `${title(name)} is ready.\n\nInput: \( {clean(input || 'none', 500)}\nUse . \){name} help for usage.`;
}

const GAMES = new Set([
    '2048', 'minesweeper', 'connect4', 'checkers', 'chess', 'wordle', 'hangman',
    'battleship', 'memorymatch', 'sudoku', 'kakuro', 'mastermind', 'blackjack',
    'rpsls', 'typingrace', 'randomdice'
]);

async function executeCommand(name, args, reply, jid) {
    const values = (args || []).map(String).filter(Boolean);

    // Games — real session engine
    if (GAMES.has(name)) {
        return reply(handleGame(name, values, jid));
    }

    try {
        const query = encodeURIComponent(argsText(values));
        const api = {
            wikipedia: query ? `https://en.wikipedia.org/api/rest_v1/page/summary/${query}` : null,
            openlibrary: query ? `https://openlibrary.org/search.json?q=${query}&limit=3` : null,
            geocode: query ? `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&q=${query}` : null,
            reversegeocode: values.length >= 2
                ? `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=\( {encodeURIComponent(values[0])}&lon= \){encodeURIComponent(values[1])}`
                : null,
            earthquake: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
            nasaapod: process.env.NASA_API_KEY
                ? `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(process.env.NASA_API_KEY)}`
                : null,
        }[name];

        if (api) {
            const data = await fetchJson(api);
            let output = '';
            if (name === 'wikipedia') output = `\( {data.title || 'Wikipedia'}\n\n \){data.extract || 'No summary found.'}`;
            else if (name === 'openlibrary') {
                output = (data.docs || []).slice(0, 3)
                    .map(item => `${item.title} — \( {(item.author_name || [])[0] || 'Unknown'} ( \){item.first_publish_year || 'n/a'})`)
                    .join('\n');
            } else if (name === 'geocode') {
                output = (data || []).map(item => `\( {item.display_name}\n \){item.lat}, ${item.lon}`).join('\n\n');
            } else if (name === 'reversegeocode') output = data.display_name || JSON.stringify(data.address || {});
            else if (name === 'earthquake') {
                output = (data.features || []).slice(0, 5)
                    .map(item => `M${item.properties?.mag} — ${item.properties?.place}`)
                    .join('\n');
            } else if (name === 'nasaapod') {
                output = `\( {data.title}\n \){data.date}\n\( {data.explanation}\n \){data.url}`;
            }
            return reply(`*\( {title(name)}*\n\n \){clean(output || 'No results found.')}`);
        }
    } catch (error) {
        return reply(
            `*${title(name)}*\n\nLive data is unavailable right now. Try again shortly.\n\nReason: ${clean(error.message, 180)}`
        );
    }

    return reply(localResult(name, values));
}

function makeCommand({ name, category, description }) {
    return {
        name,
        aliases: [],
        description,
        category,
        // Support BOTH handler styles:
        // 1) execute({ reply, args, from })
        // 2) execute(sock, msg, args, ctx)
        async execute(a, b, c, d) {
            let reply, args, jid;

            if (a && typeof a === 'object' && (typeof a.reply === 'function' || a.args)) {
                // style 1
                reply = a.reply || (async (t) => t);
                args = a.args || [];
                jid = a.from || a.chat || a.jid || 'dm';
            } else {
                // style 2: sock, msg, args, ctx
                const sock = a;
                const msg = b;
                args = c || [];
                const ctx = d || {};
                jid = ctx.from || msg?.key?.remoteJid || 'dm';
                reply = async (text) => {
                    if (ctx.reply) return ctx.reply(text);
                    return sock.sendMessage(jid, { text }, { quoted: msg });
                };
            }

            return executeCommand(name, args, reply, jid);
        }
    };
}

module.exports = {
    makeCommand,
    fetchJson,
    gameSessions,
    clearAllForChat,
    clearSession,
};