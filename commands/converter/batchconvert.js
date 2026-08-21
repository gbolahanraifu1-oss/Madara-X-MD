module.exports = {
    name: 'batchconvert',
    aliases: ['batch', 'bulkconvert'],
    category: 'converter',
    desc: 'Batch convert — process multiple quoted media sequentially',
    usage: '†batchconvert [sticker|tomp3|togif] (reply to first media)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const type = args[0]?.toLowerCase();
        if (!type) return ctx.reply(`❌ Usage: \`${s.prefix}batchconvert [sticker|tomp3|togif]\`\nReply to the first media file.${s.FOOTER}`);
        const supported = ['sticker', 'tomp3', 'togif', 'toimg'];
        if (!supported.includes(type)) return ctx.reply(`❌ Supported types: ${supported.join(', ')}${s.FOOTER}`);
        ctx.reply(`⏳ Batch convert (${type}) — processing replied media...\n_Reply to each media individually with \`${s.prefix}${type}\` for best results._${s.FOOTER}`);
        // Route to the appropriate command
        try {
            const cmd = require(`./${type}`);
            await cmd.execute(sock, msg, [], ctx);
        } catch (e) {
            ctx.reply(`❌ Batch failed: ${e.message}${s.FOOTER}`);
        }
    }
};
