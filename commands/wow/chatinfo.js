module.exports = {
  name: "chatinfo",
  aliases: [],
  description: "MADARA wow utility: chatinfo",
  async execute({ reply, args = [], from, sender, msg, isGroup }) {
    try { return reply('💬 Chat info\nType: ' + (isGroup ? 'Group' : 'Private') + '\nJID: ' + from); } catch (error) { return reply('❌ chatinfo failed: ' + error.message); }
  }
};
