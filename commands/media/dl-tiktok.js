'use strict';
const axios=require('axios');
module.exports = {
    // 'tt' used to collide with ttdl.js's own alias list — whichever file
    // loaded last (alphabetically, ttdl.js) silently won, so .tt was
    // actually running ttdl.js's single-API-no-fallback version instead
    // of this one. 'tt' now belongs cleanly to this command.
    // Bumped to 7 fallback tiers, tikwm.com first (most reliable as of
    // 2026 per real-world testing) — free/unofficial TikTok download
    // APIs rotate in and out of service constantly, so more diverse
    // sources means one or two being down doesn't take the whole command
    // down with them.
    name:'tiktok',aliases:['tt','tiktokdl'],category:'media',desc:'ᴅᴏᴡɴʟᴏᴀᴅ ᴛɪᴋᴛᴏᴋ ᴠɪᴅᴇᴏ',usage:'†tiktok <url>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,url=args[0];
        if(!url)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}tiktok <url>${s.FOOTER}`);
        await ctx.react('⏳');

        const sources = [
            { name:'tikwm', fn: async () => {
                const r = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`,{timeout:15000});
                if (r.data?.code !== 0) return null;
                const d = r.data.data;
                const v = d?.play || d?.wmplay;
                return v ? { url: v, title: d.title } : null;
            }},
            { name:'tiklydown', fn: async () => {
                const r = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,{timeout:15000});
                const v = r.data?.video?.noWatermark || r.data?.video?.watermark;
                return v ? { url: v, title: r.data?.title } : null;
            }},
            { name:'doublexp', fn: async () => {
                const r = await axios.get(`https://api.doublexp.io/api/tiktok?url=${encodeURIComponent(url)}`,{timeout:15000});
                const d = r.data?.data || r.data;
                const v = d?.play || d?.video || d?.nowm;
                return v ? { url: v, title: d?.title } : null;
            }},
            { name:'ryzendesu', fn: async () => {
                const r = await axios.get(`https://api.ryzendesu.vip/api/downloader/ttdl?url=${encodeURIComponent(url)}`,{timeout:15000});
                const v = r.data?.data?.play || r.data?.data?.video;
                return v ? { url: v } : null;
            }},
            { name:'siputzx', fn: async () => {
                const r = await axios.get(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`,{timeout:15000});
                const d = r.data?.data || r.data;
                const v = d?.url || d?.video || d?.nowm || d?.download;
                return v ? { url: v } : null;
            }},
            { name:'vreden', fn: async () => {
                const r = await axios.get(`https://vreden.dimensionx.web.id/api/tiktok?url=${encodeURIComponent(url)}`,{timeout:15000});
                const v = r.data?.result?.data?.[0]?.play || r.data?.result?.video;
                return v ? { url: v } : null;
            }},
            { name:'nekolabs', fn: async () => {
                const r = await axios.get(`https://api.nekolabs.my.id/downloader/tiktok?url=${encodeURIComponent(url)}`,{timeout:15000});
                const v = r.data?.result?.video || r.data?.result?.downloadUrl;
                return v ? { url: v } : null;
            }},
        ];

        let lastErr;
        for (const src of sources) {
            try {
                const result = await src.fn();
                if (!result?.url) throw new Error('no video field in response');
                await sock.sendMessage(ctx.from,{video:{url:result.url},caption:`🎵 ${result.title||'ᴛɪᴋᴛᴏᴋ ᴠɪᴅᴇᴏ'}${s.FOOTER}`,mimetype:'video/mp4'},{quoted:msg});
                return; // success — stop here
            } catch (e) {
                console.log(`[tiktok] ${src.name} failed:`, e.message);
                lastErr = e;
            }
        }
        await ctx.reply(`❌ ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ: ᴀʟʟ ${sources.length} sᴏᴜʀᴄᴇs ᴜɴᴀᴠᴀɪʟᴀʙʟᴇ ʀɪɢʜᴛ ɴᴏᴡ (ʟᴀsᴛ: ${lastErr?.message}). ᴛʀʏ ᴀɢᴀɪɴ ɪɴ ᴀ ʙɪᴛ.${s.FOOTER}`);
    }
};
