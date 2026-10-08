'use strict';

const { getCommand } = require('./loader');

const pending = new Map();

const COMMAND_SPECS = {
    kick: {
        prompt: 'Send the member number or tag the member you want me to remove.',
        confirm: ({ args }) => `Remove the selected member${args.join(' ') ? ` (${args.join(' ')})` : ''}? Reply *yes* or *no*.`,
    },
    remove: {
        prompt: 'Send the member number or tag the member you want me to remove.',
        confirm: ({ args }) => `Remove the selected member${args.join(' ') ? ` (${args.join(' ')})` : ''}? Reply *yes* or *no*.`,
    },
    ban: {
        prompt: 'Send the member number or tag the member you want me to ban.',
        confirm: ({ args }) => 'Ban the selected member? Reply *yes* or *no*.',
    },
    promote: {
        prompt: 'Send the member number or tag the member you want to promote.',
        confirm: 'Promote the selected member? Reply *yes* or *no*.',
    },
    demote: {
        prompt: 'Send the member number or tag the member you want to demote.',
        confirm: 'Demote the selected member? Reply *yes* or *no*.',
    },
    codegen: { prompt: 'Send the coding prompt you want me to execute.' },
    generatecode: { prompt: 'Send the coding prompt you want me to execute.' },
    writecode: { prompt: 'Send the coding prompt you want me to execute.' },
    aicode: { prompt: 'Send the coding prompt you want me to execute.' },
    aiimage: { prompt: 'Send the image prompt. I will return it in an interactive image carousel.' },
    imagine: { prompt: 'Send the image prompt. I will return it in an interactive image carousel.' },
    generate: { prompt: 'Send the image prompt. I will return it in an interactive image carousel.' },
    gen: { prompt: 'Send the image prompt. I will return it in an interactive image carousel.' },
};

function keyFor(ctx) {
    return `${ctx.sessionPhone || 'default'}:${ctx.from}:${ctx.sender}`;
}

function nameFor(plugin) {
    return String(plugin?.name || '').toLowerCase();
}

function hasInputUsage(plugin) {
    const usage = String(plugin?.usage || '').toLowerCase();
    return /<[^>]+>|\b(prompt|query|question|request|text|url|number|name|message|caption|argument|input|search|code|image)\b/.test(usage);
}

function getSpec(plugin) {
    const name = nameFor(plugin);
    if (COMMAND_SPECS[name]) return COMMAND_SPECS[name];
    if (plugin?.interactive === false || plugin?.noInteractivePrompt) return null;
    if (plugin?.interactive && typeof plugin.interactive === 'object') return plugin.interactive;
    if (plugin?.interactivePrompt || plugin?.interactiveConfirm) {
        return { prompt: plugin.interactivePrompt, confirm: plugin.interactiveConfirm };
    }
    return hasInputUsage(plugin) ? {} : null;
}

function shouldStart(plugin, args) {
    return !args?.length && !!getSpec(plugin);
}

function renderPrompt(plugin, spec, ctx) {
    const label = nameFor(plugin);
    if (typeof spec.prompt === 'function') return spec.prompt({ plugin, ctx });
    return spec.prompt || `Send the details for *${ctx.prefix || '.'}${label}*.`;
}

function renderConfirm(state) {
    if (typeof state.confirm === 'function') {
        return state.confirm({ args: state.args, ctx: state.ctx, plugin: state.plugin });
    }
    return state.confirm || 'Review the request, then reply *yes* to continue or *no* to cancel.';
}

function normalizeInput(ctx) {
    const text = String(ctx.body || '').trim();
    const mentions = ctx.getMentions?.() || [];
    return {
        text,
        args: text.split(/\s+/).filter(Boolean),
        mentions,
    };
}

async function start(ctx, plugin) {
    const spec = getSpec(plugin);
    if (!spec) return false;
    const state = {
        plugin,
        command: nameFor(plugin),
        spec,
        step: 'input',
        args: [],
        mentions: [],
        ctx,
        createdAt: Date.now(),
    };
    pending.set(keyFor(ctx), state);
    await ctx.reply(`💬 ${renderPrompt(plugin, spec, ctx)}`);
    return true;
}

async function resume(ctx) {
    const state = pending.get(keyFor(ctx));
    if (!state) return null;

    const input = normalizeInput(ctx);
    if (!input.text) {
        await ctx.reply('💬 Send a text reply so I can continue, or reply *cancel* to stop.');
        return { handled: true };
    }

    if (state.step === 'confirm') {
        const answer = input.text.toLowerCase();
        if (['no', 'n', 'cancel', 'stop'].includes(answer)) {
            pending.delete(keyFor(ctx));
            await ctx.reply('✦ Request cancelled.');
            return { handled: true };
        }
        if (!['yes', 'y', 'confirm', 'ok', 'okay'].includes(answer)) {
            await ctx.reply('Reply *yes* to continue or *no* to cancel.');
            return { handled: true };
        }
        pending.delete(keyFor(ctx));
        ctx._interactiveMentions = state.mentions;
        return { command: state.command, args: state.args };
    }

    state.args = input.args;
    state.mentions = input.mentions;
    if (state.spec.confirm) {
        state.step = 'confirm';
        await ctx.reply(`⚠️ ${renderConfirm(state)}`);
        return { handled: true };
    }

    pending.delete(keyFor(ctx));
    ctx._interactiveMentions = state.mentions;
    return { command: state.command, args: state.args };
}

function clear(ctx) {
    pending.delete(keyFor(ctx));
}

function isPending(ctx) {
    return pending.has(keyFor(ctx));
}

function getPendingCount() {
    return pending.size;
}

module.exports = {
    getSpec,
    shouldStart,
    start,
    resume,
    clear,
    isPending,
    getPendingCount,
};