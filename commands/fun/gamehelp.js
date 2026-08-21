const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'gamehelp',
    aliases: ['games', 'gamelist'],
    category: 'fun',
    desc: 'List all available games and how to play',
    usage: '†gamehelp',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        ctx.reply(menuBox('🎮', 'ɢᴀᴍᴇ ᴄᴇɴᴛᴇʀ', [
            `🎯 \`${s.prefix}trivia\` — Trivia quiz`,
            `🧩 \`${s.prefix}hangman start\` — Hangman`,
            `🚩 \`${s.prefix}flagquiz\` — Guess the flag`,
            `🎭 \`${s.prefix}emojigame\` — Emoji riddles`,
            `🧩 \`${s.prefix}riddle\` — Brain teasers`,
            `✂️ \`${s.prefix}rps\` — Rock Paper Scissors`,
            `🎲 \`${s.prefix}roll\` — Dice roller`,
            `🪙 \`${s.prefix}flipcoin\` — Coin flip`,
            `🎰 \`${s.prefix}slot\` — Slot machine`,
            `🔢 \`${s.prefix}mathquiz\` — Math quiz`,
            `🏆 \`${s.prefix}leaderboard\` — Group scores`,
            `🛑 \`${s.prefix}endgame\` — Stop active game`,
        ]) + s.FOOTER);
    }
};
