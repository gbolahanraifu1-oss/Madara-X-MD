const axios = require('axios');
const active = new Map();
module.exports = {
    name: 'flagquiz',
    aliases: ['flaggame', 'guessflag'],
    category: 'fun',
    desc: 'Guess the country from its flag emoji',
    usage: '†flagquiz',
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();
        if (sub === 'answer' || sub === 'ans') {
            const game = active.get(ctx.from);
            if (!game) return ctx.reply(`❌ No active flag quiz. Use \`${s.prefix}flagquiz\` to start.${s.FOOTER}`);
            active.delete(ctx.from);
            return ctx.reply(`🌍 *Answer:* ${game.flag} = *${game.country}*${s.FOOTER}`);
        }
        const flags = [
            { flag: '🇳🇬', country: 'Nigeria' }, { flag: '🇬🇭', country: 'Ghana' },
            { flag: '🇺🇸', country: 'United States' }, { flag: '🇬🇧', country: 'United Kingdom' },
            { flag: '🇫🇷', country: 'France' }, { flag: '🇩🇪', country: 'Germany' },
            { flag: '🇯🇵', country: 'Japan' }, { flag: '🇧🇷', country: 'Brazil' },
            { flag: '🇨🇳', country: 'China' }, { flag: '🇮🇳', country: 'India' },
            { flag: '🇿🇦', country: 'South Africa' }, { flag: '🇰🇪', country: 'Kenya' },
            { flag: '🇪🇬', country: 'Egypt' }, { flag: '🇦🇺', country: 'Australia' },
            { flag: '🇨🇦', country: 'Canada' }, { flag: '🇲🇽', country: 'Mexico' },
            { flag: '🇸🇦', country: 'Saudi Arabia' }, { flag: '🇦🇪', country: 'UAE' },
            { flag: '🇮🇹', country: 'Italy' }, { flag: '🇷🇺', country: 'Russia' },
        ];
        const q = flags[Math.floor(Math.random() * flags.length)];
        active.set(ctx.from, q);
        setTimeout(() => {
            if (active.get(ctx.from) === q) {
                active.delete(ctx.from);
                sock.sendMessage(ctx.from, { text: `⏰ Time's up! It was *${q.country}* ${q.flag}${s.FOOTER}` });
            }
        }, 30000);
        ctx.reply(`🚩 *FLAG QUIZ!*\n\n${q.flag}\n\n_Which country is this flag?_\nType the country name or \`${s.prefix}flagquiz answer\` to reveal!\n_30 seconds..._${s.FOOTER}`);
    }
};
