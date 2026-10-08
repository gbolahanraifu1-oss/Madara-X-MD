module.exports = {
  name: "numberwords",
  aliases: [],
  description: "MADARA wow utility: numberwords",
  async execute({ reply, args = [], from, sender, msg, isGroup }) {
    try { const n=Number(args[0]); return reply(Number.isFinite(n)?n.toLocaleString('en-US'):'Usage: .numberwords number'); } catch (error) { return reply('❌ numberwords failed: ' + error.message); }
  }
};
