'use strict';
const { menuBox } = require('../../lib/menuBox');

// Standalone category map — not imported from menu.js to avoid circular load
const CAT = {
    system:    {e:'⚙️', l:'sʏsᴛᴇᴍ'},
    group:     {e:'👥', l:'ɢʀᴏᴜᴘ'},
    media:     {e:'📥', l:'ᴍᴇᴅɪᴀ'},
    converter: {e:'🔄', l:'ᴄᴏɴᴠᴇʀᴛᴇʀ'},
    sticker:   {e:'🎨', l:'sᴛɪᴄᴋᴇʀ'},
    ai:        {e:'🤖', l:'ᴀɪ'},
    fun:       {e:'🎮', l:'ғᴜɴ'},
    search:    {e:'🔍', l:'sᴇᴀʀᴄʜ'},
    utility:   {e:'🛠️',l:'ᴜᴛɪʟɪᴛʏ'},
    finance:   {e:'💰', l:'ғɪɴᴀɴᴄᴇ'},
    language:  {e:'🌐', l:'ʟᴀɴɢᴜᴀɢᴇ'},
    misc:      {e:'📦', l:'ᴍɪsᴄ'},
    owner:     {e:'👑', l:'ᴏᴡɴᴇʀ'},
    crash:     {e:'💥', l:'ᴄʀᴀsʜ'},
};

const _SC = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',
             k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'Q',r:'ʀ',s:'s',t:'ᴛ',
             u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'};
const sc = str => String(str).toLowerCase().split('').map(c=>_SC[c]||c).join('');

function greet() {
    const h = new Date().getHours();
    return h<12?'ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ':h<17?'ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ':'ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ';
}

module.exports = Object.entries(CAT).map(([key, m]) => ({
    name:     `${key}menu`,
    aliases:  [`${key}cmds`],
    category: 'system',
    desc:     `sʜᴏᴡ ${m.l} ᴍᴇɴᴜ`,
    usage:    `.${key}menu`,
    waitReact: false,

    async execute(sock, msg, args, ctx) {
        const { getCategories } = require('../../lib/loader');
        const s    = ctx.settings;
        const cats = getCategories();
        const cmds = cats.get(key) || [];

        if (!cmds.length)
            return sock.sendMessage(ctx.from,
                {text: menuBox('❌', `${m.l} ᴍᴇɴᴜ`, [`ɴᴏ ᴄᴏᴍᴍᴀɴᴅs ɪɴ *${sc(key)}*.`]) + s.FOOTER},
                {quoted:msg});

        const lines = cmds.map(c => `_${s.prefix}${sc(c.name)}_`);
        const text  = menuBox(m.e, `${m.l} ᴍᴇɴᴜ`, lines) + s.FOOTER;

        await sock.sendMessage(ctx.from, {text}, {quoted:msg});
    }
}));
