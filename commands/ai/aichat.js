const axios = require('axios');
const db    = require('../../lib/db');
const sessions = new Map(); // chatId -> history[]
module.exports = {
    name: 'aichat',
    aliases: ['chatmode', 'aimode'],
    category: 'ai',
    desc: 'Toggle persistent AI conversation mode',
    usage: '†aichat on | †aichat off | †aichat clear',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0]||'').toLowerCase();
        const key = `aichat_${ctx.from}_${ctx.sender.split('@')[0]}`;
        if (sub === 'on') {
            db.set('aichat', key, true);
            sessions.set(key, []);
            return ctx.reply(`🤖 *AI Chat Mode ON*\n\nI'll respond to every message you send now.\nType \`${s.prefix}aichat off\` to stop.${s.FOOTER}`);
        }
        if (sub === 'off') {
            db.set('aichat', key, false);
            sessions.delete(key);
            return ctx.reply(`❌ *AI Chat Mode OFF*${s.FOOTER}`);
        }
        if (sub === 'clear') {
            sessions.set(key, []);
            return ctx.reply(`🗑️ Conversation history cleared.${s.FOOTER}`);
        }
        const enabled = db.get('aichat', key, false);
        ctx.reply(`🤖 *AI Chat Mode:* ${enabled?'✅ ON':'❌ OFF'}\n\nUsage: \`${s.prefix}aichat on|off|clear\`${s.FOOTER}`);
    }
};
module.exports.isAiChat = (sender, from) => {
    const key = `aichat_${from}_${sender.split('@')[0]}`;
    return db.get('aichat', key, false);
};
module.exports.handleAiChat = async (sock, msg, ctx) => {
    const key  = `aichat_${ctx.from}_${ctx.sender.split('@')[0]}`;
    const hist = sessions.get(key) || [];
    const text = ctx.body;
    if (!text || ctx.isCmd) return;
    hist.push({ role: 'user', content: text });
    if (hist.length > 20) hist.splice(0, 2);
    sessions.set(key, hist);
    try {
        const res = await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(text)}`);
        const reply = res.data?.data || res.data?.result || "I'm not sure how to respond to that.";
        hist.push({ role: 'assistant', content: reply });
        await sock.sendMessage(ctx.from, { text: `🤖 ${reply}` }, { quoted: msg });
    } catch {}
};
