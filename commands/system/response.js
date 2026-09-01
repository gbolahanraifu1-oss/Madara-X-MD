'use strict';

const db = require('../../lib/db');
const { sendInteractiveList } = require('../../lib/baileysHelper');

const STATE_KEY = 'groupCommandResponse';
const CONTROL_ALIASES = new Set(['response', 'respond', 'botresponse', 'groupresponse', 'groupoff']);

function normalise(state) {
    const value = state && typeof state === 'object' ? state : {};
    return {
        mode: ['all', 'off', 'selected'].includes(value.mode) ? value.mode : 'all',
        allowed: Array.isArray(value.allowed) ? value.allowed : [],
        blocked: Array.isArray(value.blocked) ? value.blocked : [],
    };
}

function getState() {
    return normalise(db.get('settings', STATE_KEY, { mode: 'all', allowed: [], blocked: [] }));
}

function saveState(state) {
    db.set('settings', STATE_KEY, normalise(state));
}

function isControlCommand(rawCmd) {
    return CONTROL_ALIASES.has(String(rawCmd || '').toLowerCase());
}

function isGroupEnabled(jid) {
    const state = getState();
    if (state.mode === 'off') return false;
    if (state.mode === 'selected') return state.allowed.includes(jid);
    return !state.blocked.includes(jid);
}

function shouldIgnoreGroup(ctx) {
    return Boolean(ctx?.isGroup && !isGroupEnabled(ctx.from));
}

function setCurrentGroup(enabled, jid) {
    const state = getState();
    if (enabled) {
        if (state.mode === 'off') {
            state.mode = 'selected';
            state.allowed = [jid];
            state.blocked = [];
        } else if (state.mode === 'selected') {
            state.allowed = [...new Set([...state.allowed, jid])];
        } else {
            state.blocked = state.blocked.filter(item => item !== jid);
        }
    } else if (state.mode === 'selected') {
        state.allowed = state.allowed.filter(item => item !== jid);
    } else if (state.mode === 'all') {
        state.blocked = [...new Set([...state.blocked, jid])];
    }
    saveState(state);
    return state;
}

function toggleGroup(jid) {
    return setCurrentGroup(!isGroupEnabled(jid), jid);
}

async function listGroups(sock, msg, ctx) {
    if (!ctx.isOwner) return ctx.reply('❌ ᴏɴʟʏ ᴛʜᴇ ʙᴏᴛ ᴏᴡɴᴇʀ ᴄᴀɴ ᴄʜᴀɴɢᴇ ɢʀᴏᴜᴘ ʀᴇsᴘᴏɴsᴇs.');
    let groups = {};
    try { groups = await sock.groupFetchAllParticipating(); } catch {
        return ctx.reply('❌ ᴄᴏᴜʟᴅ ɴᴏᴛ ʟᴏᴀᴅ ᴛʜᴇ ɢʀᴏᴜᴘ ʟɪsᴛ.');
    }
    const entries = Object.entries(groups).slice(0, 100);
    if (!entries.length) return ctx.reply('📭 ɴᴏ ɢʀᴏᴜᴘs ғᴏᴜɴᴅ.');

    const state = getState();
    try {
        return await sendInteractiveList(sock, ctx.from, {
            body: '📋 ᴄʜᴏᴏsᴇ ᴡʜɪᴄʜ ɢʀᴏᴜᴘs ᴄᴀɴ ʀᴇsᴘᴏɴᴅ ᴛᴏ ᴄᴏᴍᴍᴀɴᴅs',
            footer: `ᴍᴏᴅᴇ: ${state.mode === 'all' ? 'ᴀʟʟ ɢʀᴏᴜᴘs' : state.mode === 'off' ? 'ɴᴏ ɢʀᴏᴜᴘs' : 'sᴇʟᴇᴄᴛᴇᴅ ɢʀᴏᴜᴘs'}`,
            btnTitle: '📋 ɢʀᴏᴜᴘ ʀᴇsᴘᴏɴsᴇs',
            sections: [{
                title: 'ɢʀᴏᴜᴘs',
                rows: entries.map(([jid, group]) => ({
                    title: String(group.subject || jid).slice(0, 60),
                    description: isGroupEnabled(jid) ? 'ʀᴇsᴘᴏɴsᴇs ᴏɴ' : 'ʀᴇsᴘᴏɴsᴇs ᴏғғ',
                    rowId: `group_response_${encodeURIComponent(jid)}`,
                })),
            }],
        }, msg);
    } catch {
        return ctx.reply(entries.map(([jid, group]) =>
            `${group.subject || jid}: ${isGroupEnabled(jid) ? 'ᴏɴ' : 'ᴏғғ'}`
        ).join('\n'));
    }
}

async function handleInteractive(sock, msg, ctx, selectedId) {
    if (!String(selectedId || '').startsWith('group_response_')) return false;
    let jid = '';
    try { jid = decodeURIComponent(String(selectedId).replace('group_response_', '')); } catch {}
    if (!jid.endsWith('@g.us')) return true;
    if (!ctx.isOwner && (!ctx.isGroup || ctx.from !== jid)) {
        await ctx.reply('❌ ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴄʜᴀɴɢᴇ ᴛʜɪs ɢʀᴏᴜᴘ.');
        return true;
    }
    const state = toggleGroup(jid);
    await ctx.reply(`✅ ɢʀᴏᴜᴘ ʀᴇsᴘᴏɴsᴇs ᴀʀᴇ ${isGroupEnabled(jid) ? 'ᴏɴ' : 'ᴏғғ'} ғᴏʀ ᴛʜᴀᴛ ɢʀᴏᴜᴘ.\nᴍᴏᴅᴇ: ${state.mode}`);
    return true;
}

module.exports = {
    name: 'response',
    aliases: ['respond', 'botresponse', 'groupresponse', 'groupoff', 'group'],
    category: 'system',
    desc: 'ᴄʜᴏᴏsᴇ ᴡʜɪᴄʜ ɢʀᴏᴜᴘs ʀᴇsᴘᴏɴᴅ ᴛᴏ ᴄᴏᴍᴍᴀɴᴅs',
    usage: '†response on|off|list|group on|off',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const raw = String(ctx.rawCmd || '').toLowerCase();
        const sub = String(args[0] || '').toLowerCase();

        // `†group on|off` is always scoped to the current group.
        if (raw === 'group' || raw === 'groupoff') {
            if (sub === 'list' || !ctx.isGroup) return listGroups(sock, msg, ctx);
            if (sub === 'on' || sub === 'off') {
                if (!ctx.isGroup) return listGroups(sock, msg, ctx);
                setCurrentGroup(sub === 'on', ctx.from);
                return ctx.reply(`✅ ᴄᴏᴍᴍᴀɴᴅ ʀᴇsᴘᴏɴsᴇs ᴀʀᴇ ${sub === 'on' ? 'ᴏɴ' : 'ᴏғғ'} ɪɴ ᴛʜɪs ɢʀᴏᴜᴘ.${s.FOOTER}`);
            }
        }

        if (sub === 'on' || sub === 'all') {
            saveState({ mode: 'all', allowed: [], blocked: [] });
            return ctx.reply(`✅ ᴄᴏᴍᴍᴀɴᴅ ʀᴇsᴘᴏɴsᴇs ᴀʀᴇ ᴏɴ ɪɴ ᴀʟʟ ɢʀᴏᴜᴘs.${s.FOOTER}`);
        }
        if (sub === 'off') {
            saveState({ mode: 'off', allowed: [], blocked: [] });
            return ctx.reply(`🔕 ᴄᴏᴍᴍᴀɴᴅ ʀᴇsᴘᴏɴsᴇs ᴀʀᴇ ᴏғғ ɪɴ ᴀʟʟ ɢʀᴏᴜᴘs. ᴛʜᴇ ʙᴏᴛ ʀᴇᴍᴀɪɴs ᴘᴀɪʀᴇᴅ.${s.FOOTER}`);
        }
        if (sub === 'only' || sub === 'select' || sub === 'selected') {
            saveState({ mode: 'selected', allowed: [], blocked: [] });
            return listGroups(sock, msg, ctx);
        }
        if (sub === 'list' || sub === 'groups') return listGroups(sock, msg, ctx);
        if (sub === 'group') {
            const value = String(args[1] || '').toLowerCase();
            if (ctx.isGroup && (value === 'on' || value === 'off')) {
                setCurrentGroup(value === 'on', ctx.from);
                return ctx.reply(`✅ ᴄᴏᴍᴍᴀɴᴅ ʀᴇsᴘᴏɴsᴇs ᴀʀᴇ ${value === 'on' ? 'ᴏɴ' : 'ᴏғғ'} ɪɴ ᴛʜɪs ɢʀᴏᴜᴘ.${s.FOOTER}`);
            }
            return listGroups(sock, msg, ctx);
        }

        const state = getState();
        return ctx.reply(
            `📋 *ɢʀᴏᴜᴘ ʀᴇsᴘᴏɴsᴇ sᴛᴀᴛᴜs*\n\n` +
            `ᴍᴏᴅᴇ: ${state.mode}\n` +
            `${s.prefix}response on — ᴀʟʟ ɢʀᴏᴜᴘs\n` +
            `${s.prefix}response off — ɴᴏ ɢʀᴏᴜᴘs\n` +
            `${s.prefix}response list — ᴛᴏɢɢʟᴇ ɢʀᴏᴜᴘs\n` +
            `${s.prefix}response only — ᴄʜᴏᴏsᴇ ᴀʟʟᴏᴡᴇᴅ ɢʀᴏᴜᴘs\n` +
            `${s.prefix}group on|off — ᴄᴜʀʀᴇɴᴛ ɢʀᴏᴜᴘ${s.FOOTER}`
        );
    },

    shouldIgnoreGroup,
    isControlCommand,
    handleInteractive,
};