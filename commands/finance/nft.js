const axios = require('axios');
module.exports = {
    name: 'nft', aliases: ['nftinfo','nftsearch','nftcollection'], category: 'finance',
    desc: 'NFT collection info and stats', usage: '†nft [collection name]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ') || 'Bored Ape Yacht Club';
        await ctx.react('🖼️');
        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Give current info about the NFT collection: ${q}. Include: floor price, volume, description, chain.`)}`);
            ctx.reply(`🖼️ *NFT: ${q}*\n\n${res.data?.data || 'NFT data not available.'}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};
