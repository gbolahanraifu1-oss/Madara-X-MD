module.exports = { name: 'playlist', aliases: ['ytplaylist','playlistdl','downloadplaylist'], category: 'media', desc: 'Download YouTube playlist (shows info + links)', usage: '†playlist [youtube-playlist-url]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const url=args[0]; if(!url||!url.includes('list=')) return ctx.reply(`❌ Provide a YouTube playlist URL (must contain list=).${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const yts=require('yt-search'); const q=url; const res=await yts({query:q,pages:1});
            const list=res.videos.slice(0,5);
            if(!list.length) return ctx.reply(`❌ No videos found in playlist.${s.FOOTER}`);
            const out=list.map((v,i)=>`${i+1}. *${v.title}*\n   ⏱ ${v.timestamp}\n   \`${s.prefix}ytdl ${v.url}\``).join('\n\n');
            ctx.reply(`📋 *Playlist (top 5):*\n\n${out}${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};
