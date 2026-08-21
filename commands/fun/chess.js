const db = require('../../lib/db');
module.exports = { name: 'chess', aliases: ['startchess','chessgame'], category: 'fun', desc: 'Start a simple text chess game (coordinate moves)', usage: '†chess start | †chess [move] e.g. †chess e2e4',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const sub=(args[0]||'').toLowerCase(); const key=`chess_${ctx.from}`;
        if (sub==='start'||sub==='new') {
            const board=['♜♞♝♛♚♝♞♜','♟♟♟♟♟♟♟♟','........','........','........','........','♙♙♙♙♙♙♙♙','♖♘♗♕♔♗♘♖'];
            db.set('chess',key,{board,turn:'white',active:true});
            const display=board.map((r,i)=>`${8-i} ${r.split('').join(' ')}`).join('\n')+'  a b c d e f g h';
            return ctx.reply(`♟️ *Chess Game Started!*\n\`\`\`\n${display}\n\`\`\`\nWhite goes first. Use \`${s.prefix}chess e2e4\` to move.${s.FOOTER}`);
        }
        if (sub==='stop') { db.del('chess',key); return ctx.reply(`🛑 Chess game ended.${s.FOOTER}`); }
        ctx.reply(`♟️ *Chess:*\nUse \`${s.prefix}chess start\` to begin.\nMoves in algebraic notation e.g. \`${s.prefix}chess e2e4\`\n\n_Full chess engine integration requires chess.js library._${s.FOOTER}`);
    }
};
