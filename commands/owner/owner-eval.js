'use strict';
// ╔══════════════════════════════════════════════════════╗
// ║  eval — run JavaScript + paste full WA module + render live (DEV ONLY) ║
// ╚══════════════════════════════════════════════════════╝
//   .eval 1+1
//   .eval await sock.groupMetadata(from)
//   .eval render('abyss')  -> render saved skin live
//   .eval file('assets/menus/abyss.js') -> reload + render file
//   .eval <paste full module.exports file> -> compile + auto-render

const util = require('util');
const fs   = require('fs');
const path = require('path');

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const TIMEOUT_MS = 30_000;
const MAX_OUT    = 3500;

const digits = (jid) =>
    String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '').replace(/^0+/, '');

// STRICT dev check. ctx.isDevOwner alone is NOT enough here: in context.js it
// is also true whenever `fromMe` is true, and `fromMe` is true for the paired
// account of EVERY session — so any user who paired their own number would
// pass it. For code execution on your server we additionally require that the
// sender is literally OWNER_NUMBER (LID-resolved).
function isStrictDev(ctx) {
    const ownerNum = digits(ctx.settings?.ownerNumber);
    if (!ownerNum) return false;
    let resolve = (n) => n;
    try { resolve = require('../../lib/context').resolveLid || resolve; } catch {}
    const s = digits(ctx.sender);
    const p = digits(ctx.msg?.key?.participant);
    return [s, resolve(s), p, p ? resolve(p) : ''].filter(Boolean).includes(ownerNum);
}

function extractCode(ctx, args) {
    const body = ctx.body || '';
    const cmd  = String(ctx.rawCmd || '');
    let code = '';
    // Take the RAW text after the command word so newlines/indentation survive
    // (ctx.args collapses all whitespace, which breaks multi-line code).
    if (cmd) {
        const i = body.toLowerCase().indexOf(cmd.toLowerCase());
        if (i >= 0) code = body.slice(i + cmd.length);
    }
    if (!code.trim()) code = (args || []).join(' ');
    if (!code.trim() && typeof ctx.getQuotedText === 'function') code = ctx.getQuotedText();
    code = code.trim();
    const fence = code.match(/^```[a-z]*\n?([\s\S]*?)```$/i);
    if (fence) code = fence[1].trim();
    return code;
}

const fmt = (v) =>
    typeof v === 'string'
        ? v
        : util.inspect(v, { depth: 4, maxArrayLength: 100, maxStringLength: 4000, breakLength: 80 });

// Don't leak secrets into a chat (especially if this is run inside a group).
function redact(text) {
    let out = String(text);
    for (const [k, v] of Object.entries(process.env)) {
        if (v && v.length >= 8 && /TOKEN|SECRET|KEY|PASS|AUTH|SESSION/i.test(k)) {
            out = out.split(v).join('[redacted]');
        }
    }
    return out;
}

module.exports = {
    name: 'eval',
    aliases: ['ev', 'js', '>'],
    category: 'owner',
    desc: 'ʀᴜɴ ᴀɴʏ ᴡᴀ sᴄʀɪᴘᴛ + ʀᴇɴᴅᴇʀ ʟɪᴠᴇ (ᴅᴇᴠ ᴏɴʟʏ)',
    usage: '†eval <code>',
    ownerOnly: true,
    devOnly: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const realSock = ctx.sock || sock;

        // Raw send: bypasses theme/font formatting so output isn't mangled.
        const send = async (text) => {
            const raw = realSock._sendRawMessage;
            const content = { text };
            if (typeof raw === 'function') return raw(ctx.from, content, { quoted: msg });
            return realSock.sendMessage(ctx.from, content, { quoted: msg });
        };

        // Three layers: handler flags (devOnly/ownerOnly), isDevOwner, strict owner-number match.
        if (!ctx.isDevOwner || !isStrictDev(ctx)) {
            return ctx.reply(`⛔ *ᴅᴇᴠ ᴏɴʟʏ.*${s.FOOTER}`);
        }

        const code = extractCode(ctx, args);
        if (!code) {
            return send(
                `❌ *ADVANCED EVAL*\n` +
                `${s.prefix}eval 1+1\n` +
                `${s.prefix}eval await sock.groupMetadata(from)\n` +
                `${s.prefix}eval render('abyss')\n` +
                `${s.prefix}eval file('assets/menus/abyss.js')\n` +
                `${s.prefix}eval send({ text: 'test' })\n\n` +
                `Paste full module:\n` +
                `${s.prefix}eval module.exports = { name: 'abyss', async render(sock, from, msg) {...} }\n\n` +
                `Vars: sock, msg, args, ctx, db, settings, fs, path, util, from, send, reply, render, file, sendImg, sendCard, load, sleep, require`
            );
        }

        // === PASTE-FULL-FILE MODE ===
        // If user pastes a whole module like:
        // module.exports = { name: 'abyss', async render(sock, from, msg) {} }
        // Run it as a module and auto-render it
        if (code.includes('module.exports') || code.includes('exports.render') || code.includes('exports =')) {
            try {
                const Module = require('module');
                const m = new Module('eval-test', null);
                m.filename = path.join(process.cwd(), 'eval-test.js');
                m.paths = Module._nodeModulePaths(process.cwd());
                m._compile(code, m.filename);
                const mod = m.exports;

                if (mod && typeof mod.render === 'function') {
                    await mod.render(realSock, ctx.from, msg, ctx);
                    return send(`✅ *Rendered live:* \`${mod.name || 'unnamed'}\`\nPasted module executed + rendered.`);
                }
                if (mod && typeof mod.execute === 'function') {
                    const out = await mod.execute(realSock, msg, [], ctx);
                    return send(`✅ *Executed:* \`${mod.name || 'unnamed'}\`\n\`\`\`${fmt(out)}\`\`\``);
                }
                if (mod && typeof mod.run === 'function') {
                    const out = await mod.run({ sock: realSock, from: ctx.from, msg, args: [], ctx });
                    return send(`✅ *Executed:* \`${mod.name || 'unnamed'}\`\n\`\`\`${fmt(out)}\`\`\``);
                }
                return send(`✅ Module loaded but no render/execute found.\n\`\`\`${fmt(mod)}\`\`\``);
            } catch (e) {
                return send(`❌ *Module Eval Error*\n\`\`\`${redact(String(e.stack || e).split('\n').slice(0, 8).join('\n'))}\`\`\``);
            }
        }

        let db = null;
        try { db = require('../../lib/db'); } catch {}

        const logs = [];
        const cap = (...a) => logs.push(a.map(fmt).join(' '));
        const fakeConsole = { log: cap, info: cap, warn: cap, error: cap, debug: cap, dir: cap };

        // === WA TEST HELPERS ===
        const from = ctx.from;
        const helpers = {
            sock: realSock, msg, args, ctx, db, settings: s,
            fs, path, util, process, require, from,
            fromMe: true,
            send: (content, opts) => realSock.sendMessage(from, content, { quoted: msg, ...opts }),
            reply: (text) => send(text),
            // render any menu skin live: render('abyss') / render('default')
            render: async (skinName = 'abyss', extra) => {
                delete require.cache[require.resolve(path.resolve(process.cwd(), `assets/menus/${skinName}.js`))];
                const skin = require(path.resolve(process.cwd(), `assets/menus/${skinName}.js`));
                return skin.render(realSock, from, msg, extra);
            },
            // load + run any file: file('assets/menus/abyss.js')
            file: async (p, ...fargs) => {
                delete require.cache[require.resolve(path.resolve(process.cwd(), p))];
                const mod = require(path.resolve(process.cwd(), p));
                if (typeof mod.render === 'function') return mod.render(realSock, from, msg, ...fargs);
                if (typeof mod.execute === 'function') return mod.execute(realSock, msg, [], ctx);
                if (typeof mod.run === 'function') return mod.run({ sock: realSock, from, msg, args: [], ctx });
                if (typeof mod === 'function') return mod(realSock, from, msg, ...fargs);
                return mod;
            },
            sendImg: (url, caption = '') => realSock.sendMessage(from, { image: { url }, caption }, { quoted: msg }),
            sendCard: (opts) => realSock.sendLocationButtonCard(from, opts, { quoted: msg }),
            load: (p) => require(path.resolve(process.cwd(), p)),
            sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
            console: fakeConsole,
        };
        const names  = Object.keys(helpers);
        const values = Object.values(helpers);

        // 1) try as a single expression, 2) fall back to a statement body.
        let fn;
        try {
            fn = new AsyncFunction(...names, `return (\n${code}\n);`);
        } catch {
            try {
                fn = new AsyncFunction(...names, code);
            } catch (e) {
                return send(`❌ *SyntaxError*\n\`\`\`${redact(e.message)}\`\`\``);
            }
        }

        const started = Date.now();
        let timer;
        try {
            const result = await Promise.race([
                fn(...values),
                new Promise((_, rej) => {
                    timer = setTimeout(
                        () => rej(new Error(`Timed out after ${TIMEOUT_MS / 1000}s (async code only — a sync infinite loop can't be interrupted)`)),
                        TIMEOUT_MS
                    );
                }),
            ]);

            const parts = [];
            if (logs.length) parts.push(logs.join('\n'));
            if (result !== undefined) parts.push(`⮕ ${fmt(result)}`);

            let out = parts.join('\n') || '✅ (no output - but script ran, check chat for rendered message)';
            out = redact(out).replace(/```/g, '`\u200b``');
            if (out.length > MAX_OUT) out = out.slice(0, MAX_OUT) + `\n… [truncated ${out.length - MAX_OUT} chars]`;

            return send(`🧪 *eval* — ${Date.now() - started}ms\n\`\`\`${out}\`\`\``);
        } catch (err) {
            let out = String(err?.stack || err).split('\n').slice(0, 8).join('\n');
            out = redact(out).replace(/```/g, '`\u200b``');
            return send(`❌ *Error* — ${Date.now() - started}ms\n\`\`\`${out}\`\`\``);
        } finally {
            if (timer) clearTimeout(timer);
        }
    },
};