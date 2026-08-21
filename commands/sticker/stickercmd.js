// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Sticker Command Binder            ║
// ╚══════════════════════════════════════════════════════╝

const db = require('../../lib/db');
const { menuBox } = require('../../lib/menuBox');

function getStickerKey(stkMsg) {
    if (!stkMsg) return null;
    try {
        // Try fileSha256 first (most stable identifier)
        const sha = stkMsg.fileSha256;
        if (sha) {
            if (typeof sha === 'string') return sha; // already a string key
            if (Buffer.isBuffer(sha)) return sha.toString('hex');
            if (sha instanceof Uint8Array) return Buffer.from(sha).toString('hex');
            // Plain object from JSON.parse: {type:'Buffer',data:[...]} or {0:x,1:y,...}
            if (sha.type === 'Buffer' && Array.isArray(sha.data)) return Buffer.from(sha.data).toString('hex');
            if (typeof sha === 'object') return Buffer.from(Object.values(sha)).toString('hex');
        }
        // Fallback: fileEncSha256
        const enc = stkMsg.fileEncSha256;
        if (enc) {
            if (typeof enc === 'string') return 'enc:' + enc;
            if (Buffer.isBuffer(enc)) return 'enc:' + enc.toString('hex');
            if (enc instanceof Uint8Array) return 'enc:' + Buffer.from(enc).toString('hex');
            if (enc.type === 'Buffer' && Array.isArray(enc.data)) return 'enc:' + Buffer.from(enc.data).toString('hex');
        }
        return null;
    } catch { return null; }
}

function getSticker(msg) {
    const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
    return ctxInfo?.quotedMessage?.stickerMessage
        || msg.message?.stickerMessage
        || null;
}

module.exports = {
    name: 'stickercmd',
    aliases: ['stickerexec', 'bindsticker', 'stkrcmd', 'stickerbind'],
    category: 'sticker',
    desc: 'Bind a sticker to any bot command — send the sticker to auto-run it',
    usage: '†stickercmd bind [cmd] | unbind | list | clear',
    adminOnly: true,
    waitReact: false,

    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || 'list').toLowerCase();
        const cmd = args[1]?.toLowerCase();

        const stkMsg    = getSticker(msg);
        const stickerKey = getStickerKey(stkMsg);
        const binds     = db.get('stickercmds', 'bindings', {});

        // ── BIND ──────────────────────────────────────────────────────────
        if (sub === 'bind') {
            if (!stkMsg)
                return ctx.reply(
                    `❌ Reply to a sticker to bind it.\n` +
                    `Usage: \`${s.prefix}stickercmd bind [command]\`${s.FOOTER}`
                );
            if (!cmd)
                return ctx.reply(
                    `❌ Provide a command name.\n` +
                    `Example: \`${s.prefix}stickercmd bind ping\`${s.FOOTER}`
                );

            // Validate the command exists
            const { getCommand } = require('../../lib/loader');
            const plugin = getCommand(cmd);
            if (!plugin)
                return ctx.reply(`❌ Command \`${s.prefix}${cmd}\` not found. Check spelling.${s.FOOTER}`);

            binds[stickerKey] = {
                cmd,
                desc: plugin.desc || '',
                addedBy: ctx.sender,
                ts: Date.now()
            };
            db.set('stickercmds', 'bindings', binds);

            return ctx.reply(
                `✅ *Sticker Bound!*\n\n` +
                `🎭 Sticker → \`${s.prefix}${cmd}\`\n` +
                `📝 _${plugin.desc || cmd}_\n\n` +
                `Send this sticker anytime to trigger the command!${s.FOOTER}`
            );
        }

        // ── UNBIND ────────────────────────────────────────────────────────
        if (sub === 'unbind' || sub === 'remove') {
            if (!stkMsg)
                return ctx.reply(`❌ Reply to the sticker you want to unbind.${s.FOOTER}`);
            if (!binds[stickerKey])
                return ctx.reply(`❌ This sticker has no binding.${s.FOOTER}`);

            const old = binds[stickerKey].cmd;
            delete binds[stickerKey];
            db.set('stickercmds', 'bindings', binds);
            return ctx.reply(`✅ Sticker unbound from \`${s.prefix}${old}\`.${s.FOOTER}`);
        }

        // ── CHECK (show what a sticker is bound to) ───────────────────────
        if (sub === 'check' || sub === 'info') {
            if (!stkMsg)
                return ctx.reply(`❌ Reply to a sticker to check its binding.${s.FOOTER}`);
            const binding = binds[stickerKey];
            if (!binding)
                return ctx.reply(`❌ This sticker has no command binding.${s.FOOTER}`);
            return ctx.reply(
                `🎭 *Sticker Binding:*\n\n` +
                `⚡ Command: \`${s.prefix}${binding.cmd}\`\n` +
                `📝 ${binding.desc || 'No description'}\n` +
                `👤 Bound by: @${binding.addedBy?.split('@')[0] || 'unknown'}${s.FOOTER}`,
                { mentions: [binding.addedBy] }
            );
        }

        // ── LIST ──────────────────────────────────────────────────────────
        if (sub === 'list') {
            const list = Object.entries(binds);
            if (!list.length)
                return ctx.reply(
                    `📋 *No sticker bindings yet.*\n\n` +
                    `Bind one:\n\`${s.prefix}stickercmd bind ping\` _(reply to sticker)_${s.FOOTER}`
                );

            const out = list.map(([, v], i) =>
                `${i + 1}. 🎭 → \`${s.prefix}${v.cmd}\`${v.desc ? `\n   _${v.desc.slice(0, 50)}_` : ''}`
            );

            return ctx.reply(
                menuBox('🎭', `sᴛɪᴄᴋᴇʀ ᴄᴏᴍᴍᴀɴᴅs (${list.length})`, [
                    ...out,
                    ``,
                    `_Send any bound sticker to trigger its command_`,
                ]) + s.FOOTER
            );
        }

        // ── CLEAR (remove all bindings) ───────────────────────────────────
        if (sub === 'clear') {
            if (!ctx.isOwner)
                return ctx.reply(`❌ Only the owner can clear all bindings.${s.FOOTER}`);
            const count = Object.keys(binds).length;
            db.set('stickercmds', 'bindings', {});
            return ctx.reply(`🗑️ Cleared *${count}* sticker binding${count !== 1 ? 's' : ''}.${s.FOOTER}`);
        }

        // ── HELP ──────────────────────────────────────────────────────────
        ctx.reply(
            menuBox('🎭', 'sᴛɪᴄᴋᴇʀ ᴄᴏᴍᴍᴀɴᴅs', [
                `\`${s.prefix}stickercmd bind [cmd]\` _(reply to sticker)_`,
                `\`${s.prefix}stickercmd unbind\` _(reply to sticker)_`,
                `\`${s.prefix}stickercmd check\` _(reply to sticker)_`,
                `\`${s.prefix}stickercmd list\` — show all bindings`,
                `\`${s.prefix}stickercmd clear\` — remove all (owner)`,
                ``,
                `_Example: Reply to a sticker → \`${s.prefix}stickercmd bind tagall\`_`,
            ]) + s.FOOTER
        );
    }
};
