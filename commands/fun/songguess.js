const db = require('../../lib/db');
module.exports = { name: 'songguess', aliases: ['guessong','musicguess','lyricquiz'], category: 'fun', desc: 'Guess the song from lyrics', usage: '†songguess | †songguess [answer]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const key=`sg_${ctx.from}`; const ans=args.join(' ')?.toLowerCase(); const active=db.get('songguess',key,null);
        if (ans&&active) { const ok=ans.includes(active.title.toLowerCase().split(' ')[0])||active.title.toLowerCase().includes(ans); db.del('songguess',key); return ctx.reply(ok?`✅ *Correct!* *${active.title}* by *${active.artist}*!${s.FOOTER}`:`❌ *Wrong!* It was *${active.title}* by *${active.artist}*${s.FOOTER}`); }
        const songs=[{lyric:'🎵 _Is this the real life? Is this just fantasy?_',title:'Bohemian Rhapsody',artist:'Queen'},{lyric:'🎵 _I used to rule the world..._',title:'Viva la Vida',artist:'Coldplay'},{lyric:'🎵 _Hello from the other side..._',title:'Hello',artist:'Adele'},{lyric:"🎵 _Just a small town girl, living in a lonely world..._",title:"Don't Stop Believin'",artist:'Journey'}];
        const song=songs[Math.floor(Math.random()*songs.length)];
        db.set('songguess',key,{title:song.title,artist:song.artist});
        ctx.reply(`🎵 *Song Guess!*\n\n${song.lyric}\n\n\`${s.prefix}songguess [song title]\`${s.FOOTER}`);
    }
};
