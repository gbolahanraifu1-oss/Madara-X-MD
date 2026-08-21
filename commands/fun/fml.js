const axios = require('axios');
module.exports = { name: 'fml', aliases: ['fmylife','badday'], category: 'fun', desc: 'Random FML (Funny My Life) story', usage: '†fml',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings;
        const stories=["Today, I accidentally sent a voice note of me singing in the shower to my boss instead of my friend. FML","Today, I confidently walked into the wrong meeting room and gave a full presentation to complete strangers. FML","Today, I waved back at someone who wasn't actually waving at me. We made prolonged eye contact. FML","Today, I replied 'Love you too' to a work email. It was from my manager. FML"];
        try { const res=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent('Write a short funny relatable FML story. Start with "Today," and end with "FML". Max 2 sentences.')}`); const txt=res.data?.data; if(txt) return ctx.reply(`😩 *FML:*\n\n${txt}${s.FOOTER}`); throw 0; }
        catch { ctx.reply(`😩 *FML:*\n\n${stories[Math.floor(Math.random()*stories.length)]}${s.FOOTER}`); }
    }
};
