const axios = require('axios');
module.exports = {
    name: 'drivefolder',
    aliases: ['gdrivefolder', 'drivelist'],
    category: 'media',
    desc: 'List/download from public Google Drive folder',
    usage: '†drivefolder [folder-url]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const url = args[0];
        if (!url) return ctx.reply(`❌ Provide a public Google Drive folder URL.${s.FOOTER}`);
        const match = url.match(/folders\/([\\w-]+)/);
        const folderId = match?.[1];
        if (!folderId) return ctx.reply(`❌ Invalid Drive folder URL.${s.FOOTER}`);
        ctx.reply(`📁 *Drive Folder ID:* \`${folderId}\`\n\nTo download individual files use \`${s.prefix}drive [file-url]\`.\nFor full folder access, configure Google Drive API key in settings.${s.FOOTER}`);
    }
};
