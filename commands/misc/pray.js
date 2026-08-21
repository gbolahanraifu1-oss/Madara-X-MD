module.exports = {
    name: 'pray', aliases: ['prayer2','randompray','blessing'], category: 'misc',
    desc: 'Random prayer or blessing', usage: '†pray',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prayers = [
            'May you find strength in every challenge and peace in every storm. 🙏',
            'May your day be filled with small joys that lead to great happiness. 🌟',
            'May wisdom guide your steps and love surround your path. 💫',
            'May every door you knock on be opened, every prayer be answered. 🚪',
            'May you be blessed with health, happiness, and endless success. ✨',
        ];
        ctx.reply(`🙏 *Prayer:*\n\n_${prayers[Math.floor(Math.random() * prayers.length)]}_${s.FOOTER}`);
    }
};
