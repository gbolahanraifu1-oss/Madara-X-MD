const { menuBox } = require('../../lib/menuBox');
const { toSmallCaps } = require('../../lib/smallcaps');
module.exports = {
    name: 'taxcalc',
    aliases: ['tax', 'vat', 'paye'],
    category: 'finance',
    desc: 'Basic tax calculator (VAT / PAYE)',
    usage: '†taxcalc [amount] [rate%]  e.g. †taxcalc 50000 7.5',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const amount = parseFloat(args[0]);
        const rate   = parseFloat(args[1]) || 7.5;
        if (isNaN(amount)) return ctx.reply(`❌ Usage: \`${s.prefix}taxcalc [amount] [rate%]\`${s.FOOTER}`);
        const tax   = amount * (rate / 100);
        const total = amount + tax;
        ctx.reply(
            menuBox('🧾', toSmallCaps('tax calc'), [
                `*${toSmallCaps('amount')}:* ₦${amount.toLocaleString()}`,
                `*${toSmallCaps('tax rate')}:* ${rate}%`,
                `*${toSmallCaps('tax')}:* ₦${tax.toFixed(2)}`,
                `*${toSmallCaps('total (after tax)')}:* ₦${total.toFixed(2)}`,
            ]) + s.FOOTER
        );
    }
};
