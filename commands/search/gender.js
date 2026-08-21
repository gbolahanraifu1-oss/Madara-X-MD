const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');
const { toSmallCaps } = require('../../lib/smallcaps');
module.exports = {
    name: 'gender',
    aliases: ['genderpredict', 'namegender'],
    category: 'search',
    desc: 'Predict gender probability from a name',
    usage: '†gender [name]',
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const name = args[0];
        if (!name) return ctx.reply(`❌ Provide a name.\n_Usage: ${s.prefix}gender Alex_${s.FOOTER}`);
        await ctx.react('🔍');
        try {
            const res = await axios.get(`https://api.genderize.io/?name=${encodeURIComponent(name)}`);
            const d   = res.data;
            const pct = Math.round((d.probability || 0) * 100);
            const emoji = d.gender === 'male' ? '👨' : d.gender === 'female' ? '👩' : '🧑';
            ctx.reply(
                menuBox(emoji, toSmallCaps('gender prediction'), [
                    `*${toSmallCaps('name')}:* ${d.name}`,
                    `*${toSmallCaps('gender')}:* ${d.gender || 'Unknown'}`,
                    `*${toSmallCaps('probability')}:* ${pct}%`,
                    `*${toSmallCaps('sample size')}:* ${d.count?.toLocaleString()}`,
                ]) + s.FOOTER
            );
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};
