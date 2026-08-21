module.exports = { name: 'location', aliases: ['sendlocation','getlocation','coords'], category: 'utility', desc: 'Share or get a location', usage: '†location [lat,lng] or †location [city name]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const input=args.join(' ');
        if (!input) return ctx.reply(`❌ Usage:\n\`${s.prefix}location 6.5244,3.3792\` (coordinates)\n\`${s.prefix}location Lagos, Nigeria\` (city name)${s.FOOTER}`);
        const coords=input.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
        if (coords) {
            const lat=parseFloat(coords[1]); const lng=parseFloat(coords[2]);
            await sock.sendMessage(ctx.from,{location:{degreesLatitude:lat,degreesLongitude:lng}},{quoted:msg});
        } else {
            ctx.reply(`📍 *Location: ${input}*\n\nFor exact coordinates, use: \`${s.prefix}location [lat],[lng]\`\nExample: \`${s.prefix}location 6.5244,3.3792\`${s.FOOTER}`);
        }
    }
};
