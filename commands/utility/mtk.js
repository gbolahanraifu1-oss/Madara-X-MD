module.exports = {
    name: 'mtk', aliases: ['mathsolver','advancedmath','wolframcalc'], category: 'utility',
    desc: 'Advanced math solver with steps', usage: '†mtk [expression]',
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const expr = args.join(' ');
        if (!expr) return ctx.reply(`❌ Usage: \`${s.prefix}mtk 2^10\` or \`${s.prefix}mtk integral of x^2\`${s.FOOTER}`);
        await ctx.react('🧮');
        try {
            const math   = require('mathjs');
            const result = math.evaluate(expr);
            ctx.reply(`🧮 *Math Solver:*\n\n📝 \`${expr}\`\n✅ *Result: ${result}*${s.FOOTER}`);
        } catch {
            const axios = require('axios');
            try {
                const res = await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Solve this math problem step by step: ${expr}`)}`);
                ctx.reply(`🧮 *Math Solution:*\n\n${res.data?.data || 'Could not solve.'}${s.FOOTER}`);
            } catch (e) { ctx.reply(`❌ Math failed: ${e.message}${s.FOOTER}`); }
        }
    }
};
