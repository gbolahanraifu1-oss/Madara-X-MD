module.exports = {
    name: 'unit',
    aliases: ['convert', 'unitconvert'],
    category: 'utility',
    desc: 'Convert units (length, weight, temperature)',
    usage: '†unit 100 km to miles',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const text = ctx.text.toLowerCase();
        if (!text) return ctx.reply(`❌ Usage: \`${s.prefix}unit 100 km to miles\`${s.FOOTER}`);

        const conversions = {
            'km to miles': v => v * 0.621371,    'miles to km': v => v * 1.60934,
            'kg to lbs':   v => v * 2.20462,     'lbs to kg':   v => v * 0.453592,
            'km to m':     v => v * 1000,         'm to km':     v => v / 1000,
            'cm to inches':v => v * 0.393701,     'inches to cm':v => v * 2.54,
            'c to f':      v => v * 9/5 + 32,     'f to c':      v => (v-32) * 5/9,
            'c to k':      v => v + 273.15,        'k to c':      v => v - 273.15,
            'gb to mb':    v => v * 1024,          'mb to gb':    v => v / 1024,
            'hours to min':v => v * 60,            'min to hours':v => v / 60,
        };

        const match = text.match(/^([\d.]+)\s+(.+?)\s+to\s+(.+)$/);
        if (!match) return ctx.reply(`❌ Format: \`${s.prefix}unit [value] [from] to [to]\`\n\n_Examples:_\n• \`${s.prefix}unit 100 km to miles\`\n• \`${s.prefix}unit 37 c to f\`\n• \`${s.prefix}unit 5 kg to lbs\`${s.FOOTER}`);

        const val  = parseFloat(match[1]);
        const from = match[2].trim();
        const to   = match[3].trim();
        const key  = `${from} to ${to}`;

        const fn = conversions[key];
        if (!fn) return ctx.reply(`❌ Conversion *${key}* not supported.\n\nSupported:\n${Object.keys(conversions).map(k=>`• \`${k}\``).join('\n')}${s.FOOTER}`);

        const result = fn(val);
        ctx.reply(`🔄 *Unit Conversion*\n\n${val} ${from} = *${result.toFixed(4)} ${to}*${s.FOOTER}`);
    }
};
