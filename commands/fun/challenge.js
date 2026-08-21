module.exports = {
    name: 'challenge', aliases: ['groupchallenge','dare2','funChallenge'], category: 'fun',
    desc: 'Issue a fun challenge to the group', usage: '†challenge',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const challenges = [
            '🏆 *Challenge:* Send a voice note of you speaking in a fake accent for 30 seconds!',
            '🏆 *Challenge:* Share your most embarrassing childhood photo (if you dare)!',
            '🏆 *Challenge:* Write a 3-sentence poem about the person above you right now!',
            '🏆 *Challenge:* Send a thumbs-up to the last 5 people you chatted with!',
            '🏆 *Challenge:* Take a selfie making your funniest face and send it here!',
            '🏆 *Challenge:* Translate your name into Morse code and type it out!',
            '🏆 *Challenge:* Do 10 push-ups and send a voice note while counting!',
            '🏆 *Challenge:* Tell us your most unpopular opinion right now!',
        ];
        ctx.reply(`${challenges[Math.floor(Math.random() * challenges.length)]}\n\n_Who dares to accept? Tag yourself!_${s.FOOTER}`);
    }
};
