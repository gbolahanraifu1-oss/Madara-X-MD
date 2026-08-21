const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');
const { toSmallCaps } = require('../../lib/smallcaps');
module.exports = {
    name: 'invest',
    aliases: ['investment', 'investtips'],
    category: 'finance',
    desc: 'Investment compound interest calculator',
    usage: '†invest [amount] [rate%] [years]  e.g. †invest 100000 15 10',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const [p, r, y] = args.map(Number);
        if (!p || !r || !y) return ctx.reply(`❌ Usage: \`${s.prefix}invest [principal] [annual_rate%] [years]\`${s.FOOTER}`);
        const final    = p * Math.pow(1 + r/100, y);
        const gain     = final - p;
        const monthly  = p * (Math.pow(1 + r/100, y) - 1) / (y*12) * (r/100/12 + 1);
        ctx.reply(
            menuBox('💹', toSmallCaps('invest'), [
                `*${toSmallCaps('principal')}:* ₦${p.toLocaleString()}`,
                `*${toSmallCaps('annual rate')}:* ${r}%`,
                `*${toSmallCaps('duration')}:* ${y} years`,
                `*${toSmallCaps('final value')}:* ₦${final.toFixed(2)}`,
                `*${toSmallCaps('total gain')}:* ₦${gain.toFixed(2)}`,
                `*${toSmallCaps('roi')}:* ${((gain/p)*100).toFixed(1)}%`,
            ]) + s.FOOTER
        );
    }
};
