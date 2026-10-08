module.exports = {
  name: "jid",
  aliases: [],
  description: "MADARA wow utility: jid",
  async execute({ reply, args = [], from, sender, msg, isGroup }) {
    try { return reply('🪪 Your chat JID: ' + from); } catch (error) { return reply('❌ jid failed: ' + error.message); }
  }
};
