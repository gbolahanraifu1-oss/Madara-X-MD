module.exports = {
    name: 'song',
    aliases: ['dlsong', 'getsong', 'musicdl'],
    category: 'media',
    desc: 'Search and download song (alias for play)',
    usage: '†song [song name]',
    async execute(sock, msg, args, ctx) {
        return require('./play').execute(sock, msg, args, ctx);
    }
};
