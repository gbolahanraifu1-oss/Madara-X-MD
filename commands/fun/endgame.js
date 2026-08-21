module.exports = {
    name: 'endgame',
    aliases: ['stopgame', 'quitgame'],
    category: 'fun',
    desc: 'End any currently active game in this chat',
    usage: '†endgame',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const gid = ctx.from;
        let stopped = 0;
        // Try to clear all known game maps
        const gameMods = [
            '../fun/trivia', '../fun/hangman', '../fun/flagquiz',
            '../fun/emojigame', '../fun/riddle'
        ];
        for (const mod of gameMods) {
            try {
                const m = require(mod);
                if (m.activeGames?.has(gid)) { m.activeGames.delete(gid); stopped++; }
                // Handle Map exports on module itself
                const maps = Object.values(m).filter(v => v instanceof Map);
                for (const map of maps) {
                    if (map.has(gid)) { map.delete(gid); stopped++; }
                }
            } catch {}
        }
        ctx.reply(stopped > 0
            ? `✅ *${stopped} active game(s) ended.*${s.FOOTER}`
            : `❌ No active games found in this chat.${s.FOOTER}`
        );
    }
};
