module.exports = {
    name: 'ascii', aliases: ['asciiart','textart','figlet'], category: 'misc',
    desc: 'Create ASCII art from text', usage: '†ascii [text]',
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const text = args.join(' ').toUpperCase().slice(0, 10);
        if (!text) return ctx.reply(`❌ Usage: \`${s.prefix}ascii HELLO\`${s.FOOTER}`);
        // Simple block letter ASCII
        const blocks = { A:'██\n█ █\n███\n█ █\n█ █', B:'██\n█ █\n██\n█ █\n██', C:'███\n█\n█\n█\n███', D:'██\n█ █\n█ █\n█ █\n██', E:'███\n█\n██\n█\n███', F:'███\n█\n██\n█\n█', G:'███\n█\n█ █\n█ █\n███', H:'█ █\n█ █\n███\n█ █\n█ █', I:'███\n █\n █\n █\n███', J:'███\n  █\n  █\n█ █\n██', K:'█ █\n██\n█\n██\n█ █', L:'█\n█\n█\n█\n███', M:'█ █\n███\n█ █\n█ █\n█ █', N:'█ █\n██ █\n█ █\n█  █\n█ █', O:'███\n█ █\n█ █\n█ █\n███', P:'██\n█ █\n██\n█\n█', Q:'███\n█ █\n█ █\n█ ██\n████', R:'██\n█ █\n██\n█ █\n█ █', S:'███\n█\n███\n  █\n███', T:'███\n █\n █\n █\n █', U:'█ █\n█ █\n█ █\n█ █\n███', V:'█ █\n█ █\n█ █\n █ █\n  █', W:'█ █\n█ █\n█ █\n███\n█ █', X:'█ █\n █\n█\n █\n█ █', Y:'█ █\n █ █\n  █\n  █\n  █', Z:'███\n  █\n █\n█\n███' };
        const lines = text.split('').map(c => (blocks[c]||'?').split('\n'));
        const height = Math.max(...lines.map(l => l.length));
        let output = '';
        for (let row = 0; row < height; row++) {
            output += lines.map(l => (l[row] || '').padEnd(3)).join(' ') + '\n';
        }
        ctx.reply(`\`\`\`\n${output}\`\`\`${s.FOOTER}`);
    }
};
