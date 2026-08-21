const wyr = [['Be invisible','Read minds'],['Have super speed','Have super strength'],['Live without music','Live without TV'],['Be rich and unhappy','Poor and happy'],['Always be cold','Always be hot'],['Talk to animals','Speak all languages'],['Never use social media','Never watch movies'],['Be famous','Be rich'],['Lose your phone','Lose your wallet'],['Always win arguments','Always know the truth']];
module.exports = {
    name: 'wouldyourather',
    aliases: ['wyr', 'would'],
    category: 'fun',
    desc: 'Would You Rather question',
    usage: '†wouldyourather',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = wyr[Math.floor(Math.random()*wyr.length)];
        ctx.reply(`🤔 *WOULD YOU RATHER...*\n\n🅰️ _${q[0]}_\n\n*OR*\n\n🅱️ _${q[1]}_${s.FOOTER}`);
    }
};
