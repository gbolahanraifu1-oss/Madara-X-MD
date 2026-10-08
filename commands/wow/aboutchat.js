module.exports = {
  name: "aboutchat",
  aliases: [],
  description: "MADARA wow utility: aboutchat",
  async execute({ reply, args = [], from, sender, msg, isGroup }) {
    try { return reply('📊 Chat type: '+(isGroup?'Group':'Private')+'\nChat ID: '+from+'\nBot: MADARA X-MD'); } catch (error) { return reply('❌ aboutchat failed: ' + error.message); }
  }
};
