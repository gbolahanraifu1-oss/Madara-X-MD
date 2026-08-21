const { menuBox } = require('../../lib/menuBox');
const { toSmallCaps } = require('../../lib/smallcaps');
module.exports = {
    name: 'loan',
    aliases: ['loanCalc', 'interest', 'mortgage'],
    category: 'finance',
    desc: 'Loan/mortgage interest calculator',
    usage: '†loan [amount] [rate%] [years]  e.g. †loan 500000 12 5',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const [principal, rate, years] = args.map(Number);
        if (!principal || !rate || !years)
            return ctx.reply(`❌ Usage: \`${s.prefix}loan [amount] [rate%] [years]\`\n_Example: ${s.prefix}loan 500000 12 5_${s.FOOTER}`);
        const r   = rate / 100 / 12;
        const n   = years * 12;
        const monthly = r === 0 ? principal/n : (principal * r * Math.pow(1+r,n)) / (Math.pow(1+r,n)-1);
        const total   = monthly * n;
        const interest = total - principal;
        ctx.reply(
            menuBox('💳', toSmallCaps('loan'), [
                `*${toSmallCaps('principal')}:* ₦${principal.toLocaleString()}`,
                `*${toSmallCaps('rate')}:* ${rate}% p.a.`,
                `*${toSmallCaps('duration')}:* ${years} years (${n} months)`,
                `*${toSmallCaps('monthly payment')}:* ₦${monthly.toFixed(2)}`,
                `*${toSmallCaps('total payment')}:* ₦${total.toFixed(2)}`,
                `*${toSmallCaps('total interest')}:* ₦${interest.toFixed(2)}`,
            ]) + s.FOOTER
        );
    }
};
