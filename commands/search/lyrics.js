'use strict';
const axios = require('axios');
module.exports = {
    name:'lyrics', aliases:['lyric','songlyrics','lyricsearch'],
    category:'search', desc:'ɢᴇᴛ sᴏɴɢ ʟʏʀɪᴄs', usage:'†lyrics <song name>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings, q=args.join(' ');
        if(!q) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}lyrics Alone Alan Walker${s.FOOTER}`);
        await ctx.react('🎵');
        try {
            // Try lyricslovr (free, no key)
            const r1 = await axios.get(`https://lyricsovh.vercel.app/v1/${encodeURIComponent(q.split(' ')[0])}/${encodeURIComponent(q.split(' ').slice(1).join(' ')||q)}`, {timeout:8000}).catch(()=>null);
            if (r1?.data?.lyrics) {
                return ctx.reply(`🎵 *${q}*\n\n${r1.data.lyrics.slice(0,3000)}${s.FOOTER}`);
            }
            // Try genius scraper via dreaded API
            const r2 = await axios.get(`https://api.dreaded.site/api/lyrics?song=${encodeURIComponent(q)}`, {timeout:8000}).catch(()=>null);
            if (r2?.data?.result?.lyrics || r2?.data?.lyrics) {
                const lyr = r2.data?.result?.lyrics || r2.data?.lyrics;
                const title = r2.data?.result?.title || r2.data?.title || q;
                const artist = r2.data?.result?.artist || r2.data?.artist || '';
                return ctx.reply(`🎵 *${title}*${artist?'\n👤 '+artist:''}\n\n${lyr.slice(0,3000)}${s.FOOTER}`);
            }
            // Last fallback: lyrics.wiki free API
            const r3 = await axios.get(`https://lyrist.vercel.app/api/${encodeURIComponent(q)}`, {timeout:8000}).catch(()=>null);
            if (r3?.data?.lyrics) {
                return ctx.reply(`🎵 *${r3.data.title||q}*\n👤 ${r3.data.artist||''}\n\n${r3.data.lyrics.slice(0,3000)}${s.FOOTER}`);
            }
            await ctx.reply(`❌ ʟʏʀɪᴄs ɴᴏᴛ ғᴏᴜɴᴅ ғᴏʀ *${q}*.\n_ᴛʀʏ:_ \`.lyrics Artist - Song Title\`${s.FOOTER}`);
        } catch(e){ await ctx.reply(`❌ ʟʏʀɪᴄs ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};
