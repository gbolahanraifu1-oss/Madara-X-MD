'use strict';
// ╔══════════════════════════════════════════════════════════╗
// ║   lib/themeHelper.js — MADARA X-MD                      ║
// ║   Shared chat themes helper (proto patch + server patch) ║
// ║   Based on Silent Tech shared-themes logic               ║
// ╚══════════════════════════════════════════════════════════╝

const { proto } = require('@itsliaaa/baileys');
const fs   = require('node:fs');
const path = require('node:path');

// ── colour name → ARGB ────────────────────────────────────────────────────────

const COLORS = {
    red: 'FF0000', green: '00FF00', blue: '0000FF', yellow: 'FFFF00',
    orange: 'FF8000', pink: 'FF69B4', purple: '800080', black: '000000',
    white: 'FFFFFF', brown: 'A52A2A', grey: '808080', gray: '808080',
    cyan: '00FFFF', lime: '00FF00', gold: 'FFD700', silver: 'C0C0C0',
    maroon: '800000', navy: '000080', teal: '008080', magenta: 'FF00FF',
    violet: '8A2BE2', indigo: '4B0082', peach: 'FFDAB9', sky: '87CEEB',
    mint: '98FF98', coral: 'FF7F50', lavender: 'E6E6FA', crimson: 'DC143C',
    turquoise: '40E0D0',
};

function normHex(h) {
    const name = String(h || '').trim().toLowerCase();
    if (COLORS[name]) return '#' + COLORS[name] + 'FF';
    const s = name.replace(/^#/, '').toUpperCase();
    if (/^[0-9A-F]{6}$/.test(s)) return '#' + s + 'FF';
    if (/^[0-9A-F]{8}$/.test(s)) return '#' + s;
    return null;
}

function nameToArgb(name) {
    const h = normHex(name);
    if (!h) return null;
    return (0xFF000000 | parseInt(h.slice(1, 7), 16)) >>> 0;
}

const COLOR_LIST = Object.keys(COLORS).filter(k => k !== 'gray').join(', ');

// ── proto patch (ProtocolMessage field 30 / tag 242) ─────────────────────────

function patchProto() {
    try {
        const M = proto && proto.Message;
        if (!M || M.__stThemePatched) return;
        const PM = M.ProtocolMessage;
        if (PM) {
            if (PM.Type && PM.Type.CHAT_THEME_SETTING == null) {
                PM.Type.CHAT_THEME_SETTING = 34;
                PM.Type[34] = 'CHAT_THEME_SETTING';
            }
            if (typeof PM.encode === 'function') {
                const prev = PM.encode;
                PM.encode = function (message, writer) {
                    const cts = message && message.chatThemeSetting;
                    if (cts && Object.prototype.hasOwnProperty.call(message, 'chatThemeSetting'))
                        delete message.chatThemeSetting;
                    const w = prev.call(this, message, writer);
                    if (cts) {
                        message.chatThemeSetting = cts;
                        const sub = w.uint32(242).fork();
                        if (cts.settingTimestampMs != null) sub.uint32(8).int64(cts.settingTimestampMs);
                        if (cts.clearTheme)                 sub.uint32(16).bool(true);
                        if (cts.colorSchemeId)              sub.uint32(26).string(cts.colorSchemeId);
                        if (cts.solidColor) {
                            const sc = sub.uint32(90).fork();
                            if (cts.solidColor.backgroundLightArgb != null)
                                sc.uint32(13).fixed32(cts.solidColor.backgroundLightArgb >>> 0);
                            if (cts.solidColor.backgroundDarkArgb != null)
                                sc.uint32(21).fixed32(cts.solidColor.backgroundDarkArgb >>> 0);
                            if (cts.solidColor.isDoodleEnabled != null)
                                sc.uint32(24).bool(!!cts.solidColor.isDoodleEnabled);
                            sc.ldelim();
                        }
                        if (cts.customImage) {
                            const ci = sub.uint32(106).fork();
                            if (cts.customImage.directPath)   ci.uint32(10).string(cts.customImage.directPath);
                            if (cts.customImage.mediaKey)     ci.uint32(18).bytes(cts.customImage.mediaKey);
                            if (cts.customImage.fileEncSha256) ci.uint32(26).bytes(cts.customImage.fileEncSha256);
                            if (cts.customImage.fileSha256)   ci.uint32(34).bytes(cts.customImage.fileSha256);
                            if (cts.customImage.dimLevel != null) ci.uint32(45).float(cts.customImage.dimLevel);
                            ci.ldelim();
                        }
                        sub.ldelim();
                    }
                    return w;
                };
            }
            if (typeof PM.fromObject === 'function') {
                const prev = PM.fromObject;
                PM.fromObject = function (object) {
                    const msg = prev.call(this, object);
                    if (object && object.chatThemeSetting) msg.chatThemeSetting = object.chatThemeSetting;
                    return msg;
                };
            }
        }
        M.__stThemePatched = true;
    } catch (e) {
        console.error('[themeHelper] proto patch failed:', e.message);
    }
}

// ── server-side getMediaType patch (runs once at require time) ────────────────

function patchServerFile() {
    try {
        const main   = require.resolve('@itsliaaa/baileys');
        const sendJs = path.join(path.dirname(main), 'Socket', 'messages-send.js');
        let src = fs.readFileSync(sendJs, 'utf8');
        const needle = "return 'chat_theme';";
        if (src.includes(needle)) return 'present';

        // try both indent styles (rc14 4-space / vansnowi 2-space)
        const branch14  = "        if (message.protocolMessage && message.protocolMessage.type === 34) {\n            return 'chat_theme';\n        }\n";
        const anchor14  = "    const getMediaType = (message) => {\n        if (message.imageMessage) {";
        const branchVan = "    if (message.protocolMessage && message.protocolMessage.type === 34) {\n      return 'chat_theme';\n    }\n";
        const anchorVan = "  const getMediaType = message => {\n    if (message.imageMessage) {";

        if (src.includes(anchor14)) {
            src = src.replace(anchor14, "    const getMediaType = (message) => {\n" + branch14 + "        if (message.imageMessage) {");
        } else if (src.includes(anchorVan)) {
            src = src.replace(anchorVan, "  const getMediaType = message => {\n" + branchVan + "    if (message.imageMessage) {");
        } else {
            return 'failed: getMediaType anchor not found';
        }

        fs.writeFileSync(sendJs, src);
        const after = fs.readFileSync(sendJs, 'utf8');
        if (!after.includes(needle)) return 'failed: write did not stick';
        return 'patched';
    } catch (e) {
        return 'failed: ' + (e && e.message ? e.message : String(e));
    }
}

// Run the server patch immediately at require time (idempotent).
// If it returns 'patched' the caller must restart to load the new branch.
globalThis.__stThemeServerPatch = globalThis.__stThemeServerPatch
    ?? patchServerFile();

function needsRestart() {
    return globalThis.__stThemeServerPatch === 'patched';
}
function restartSoon() {
    setTimeout(() => { try { process.exit(0); } catch {} }, 1500);
}

// ── send helper ───────────────────────────────────────────────────────────────

async function sendTheme(sock, jid, setting, cmdText, replyFn) {
    patchProto();
    if (needsRestart()) {
        if (replyFn) await replyFn(
            `⚙️ Server patch installed — restarting bot in 2s.\nRun \`${cmdText}\` again in ~20 seconds.`
        );
        restartSoon();
        return 'restart';
    }
    const sp = globalThis.__stThemeServerPatch;
    if (typeof sp === 'string' && sp.startsWith('failed')) {
        if (replyFn) await replyFn(`❌ Server patch failed (${sp}). Theme cannot apply without it.`);
        return 'failed';
    }
    await sock.relayMessage(jid, {
        protocolMessage: {
            type: 34,
            chatThemeSetting: Object.assign({ settingTimestampMs: Date.now() }, setting),
        },
    }, { additionalAttributes: { type: 'media' } });
    return 'sent';
}

// ── wallpaper mapping fix ─────────────────────────────────────────────────────

function fixWallpaperMappings() {
    try {
        const b  = require('@itsliaaa/baileys');
        const hk = b.MEDIA_HKDF_KEY_MAPPING;
        const pm = b.MEDIA_PATH_MAP;
        if (hk && hk['chat-wallpaper-image'] == null) hk['chat-wallpaper-image'] = 'Chat Wallpaper';
        if (pm && pm['chat-wallpaper-image'] == null) pm['chat-wallpaper-image'] = '/mms/image';
    } catch {}
}

// ── theme-check diagnostic ────────────────────────────────────────────────────

async function themeCheck(sock, jid) {
    globalThis.__stThemeServerPatch = patchServerFile();
    try {
        const main   = require.resolve('@itsliaaa/baileys');
        const sendJs = path.join(path.dirname(main), 'Socket', 'messages-send.js');
        let pkgVer = '?';
        try { pkgVer = JSON.parse(fs.readFileSync(path.join(path.dirname(main), 'package.json'), 'utf8')).version || '?'; } catch {}
        const src      = fs.readFileSync(sendJs, 'utf8');
        const hasBranch = src.includes("return 'chat_theme';");
        const count    = (src.match(/chat_theme/g) || []).length;

        let admin = 'n/a';
        try {
            const md  = await sock.groupMetadata(jid);
            const me  = String((sock.user && sock.user.id) || '').split(':')[0];
            const p   = (md.participants || []).find(x => String(x.id || '').split(':')[0] === me);
            admin = p ? String(!!p.admin) : 'bot not in group?';
        } catch { admin = 'n/a (not a group?)'; }

        let msg = `📊 *THEME CHECK*\n\n` +
            `*patch state:* ${globalThis.__stThemeServerPatch}\n` +
            `*Baileys:* ${pkgVer}\n` +
            `*branch in file:* ${hasBranch}\n` +
            `*chat_theme mentions:* ${count}\n` +
            `*bot is group admin:* ${admin}`;
        if (needsRestart()) msg += '\n\n_Patch just applied — run `.theme red`, the bot restarts once, then run it again._';
        return msg;
    } catch (e) {
        return '❌ Theme check failed: ' + (e && e.message ? e.message : String(e));
    }
}

module.exports = {
    normHex, nameToArgb, COLOR_LIST,
    sendTheme, needsRestart, restartSoon,
    fixWallpaperMappings, themeCheck,
};
