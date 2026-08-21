module.exports = {
    name: 'color', aliases: ['randomcolor','colorpalette','palette'], category: 'misc',
    desc: 'Generate a random color palette', usage: '†color',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const rand = () => Math.floor(Math.random() * 256);
        const toHex = (r, g, b) => `#${[r,g,b].map(v => v.toString(16).padStart(2,'0')).join('')}`.toUpperCase();
        const colors = Array.from({ length: 5 }, () => {
            const r = rand(), g = rand(), b = rand();
            return { hex: toHex(r,g,b), rgb: `${r},${g},${b}` };
        });
        ctx.reply(`🎨 *Random Color Palette:*\n\n${colors.map((c,i) => `${i+1}. \`${c.hex}\` — rgb(${c.rgb})`).join('\n')}${s.FOOTER}`);
    }
};
