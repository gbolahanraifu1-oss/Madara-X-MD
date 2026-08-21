'use strict';
module.exports = {
    name: 'textstyle', aliases: ['fancy', 'textfont', 'styletext'],
    category: 'misc', desc: 'sᴛʏʟᴇ ᴛᴇxᴛ ɪɴ ᴅɪғғᴇʀᴇɴᴛ ᴜɴɪᴄᴏᴅᴇ ғᴏɴᴛs',
    usage: '†textstyle <text>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const text = args.join(' ');
        if (!text) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}textstyle Hello${s.FOOTER}`);
        const t = text.toLowerCase();
        const styles = {
            'sᴍᴀʟʟ ᴄᴀᴘs':   t.split('').map(c => 'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘQʀsᴛᴜᴠᴡxʏᴢ'['abcdefghijklmnopqrstuvwxyz'.indexOf(c)] || c).join(''),
            '𝗕𝗼𝗹𝗱':          text.split('').map(c=>'𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭'['abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(c)] || c).join(''),
            '𝘐𝘵𝘢𝘭𝘪𝘤':        text.split('').map(c=>'𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡'['abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(c)] || c).join(''),
            '𝔊𝔬𝔱𝔥𝔦𝔠':        text.split('').map(c=>'𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ'['abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(c)] || c).join(''),
            'ʙᴜʙʙʟᴇ':        text.split('').map(c=>{const i='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.indexOf(c);return i>=0?'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ①②③④⑤⑥⑦⑧⑨⓪'[i]:c}).join(''),
        };
        const lines = Object.entries(styles).map(([k,v]) => `*${k}:* ${v}`).join('\n');
        await ctx.reply(`✨ *ᴛᴇxᴛ sᴛʏʟᴇs*\n\n${lines}${s.FOOTER}`);
    }
};
