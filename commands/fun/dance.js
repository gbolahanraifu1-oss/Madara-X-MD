const moves = ['🕺 The Robot — lock every joint and move mechanically','💃 The Worm — drop to the floor and wave your body','🕺 The Running Man — jog in place with exaggerated arm swings','💃 The Moonwalk — slide backward while appearing to walk forward','🕺 The Floss — swing your hips and pump your arms in opposite directions','💃 The Dougie — lean side to side and run fingers through your hair','🕺 The Griddy — lift knees alternately and roll your shoulders','💃 The Shuffle — step side to side with rapid foot movements'];
module.exports = {
    name: 'dance',
    aliases: ['dancemove', 'randomdance'],
    category: 'fun',
    desc: 'Get a random dance move description',
    usage: '†dance',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        ctx.reply(`💃 *Random Dance Move:*\n\n${move}\n\n_Now show us what you got! 🎵_${ctx.settings.FOOTER}`);
    }
};
