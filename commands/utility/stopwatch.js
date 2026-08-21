const active = new Map();
module.exports = {
    name: 'stopwatch',
    aliases: ['sw', 'stopwatch'],
    category: 'utility',
    desc: 'Start or stop a stopwatch',
    usage: '†stopwatch start | †stopwatch stop',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || 'start').toLowerCase();
        const key = `${ctx.from}_${ctx.sender}`;
        if (sub === 'start') {
            if (active.has(key)) return ctx.reply(`⏱️ Stopwatch already running!\nUse \`${s.prefix}stopwatch stop\` to stop.${s.FOOTER}`);
            active.set(key, Date.now());
            ctx.reply(`▶️ *Stopwatch started!*\nUse \`${s.prefix}stopwatch stop\` to stop.${s.FOOTER}`);
        } else if (sub === 'stop') {
            const start = active.get(key);
            if (!start) return ctx.reply(`❌ No stopwatch running.\nUse \`${s.prefix}stopwatch start\` to begin.${s.FOOTER}`);
            active.delete(key);
            const elapsed = Date.now() - start;
            const ms   = elapsed % 1000;
            const secs = Math.floor(elapsed / 1000) % 60;
            const mins = Math.floor(elapsed / 60000) % 60;
            const hrs  = Math.floor(elapsed / 3600000);
            ctx.reply(`⏹️ *Stopwatch stopped!*\n\n⏱️ *Time: ${hrs ? `${hrs}h ` : ''}${mins}m ${secs}.${ms}s*${s.FOOTER}`);
        } else {
            ctx.reply(`❌ Usage: \`${s.prefix}stopwatch start\` or \`${s.prefix}stopwatch stop\`${s.FOOTER}`);
        }
    }
};
