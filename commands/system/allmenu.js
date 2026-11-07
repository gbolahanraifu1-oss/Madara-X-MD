'use strict';
const crypto = require('crypto');
const { generateWAMessageFromContent, isJidGroup } = require('@itsliaaa/baileys');
const { prepareRichResponseMessage } = require('@itsliaaa/baileys/lib/Utils/rich-message-utils.js');

const findRich = o => {
  if (!o || typeof o !== 'object') return null;
  if (o.unifiedResponse?.data && o.submessages) return o;
  for (const v of Object.values(o)) { const r = findRich(v); if (r) return r; }
  return null;
};

async function allmenuRun(sock, from, replyFn) {
  try {
    await sock.sendMessage(from, { text: 'DEBUG: allmenu started' });

    let body = 'AI (3)\n• ai\n• aianalyze\n• aiart';
    try {
      // Try your loader - if path different, e go use fallback body above
      const loader = require('../../lib/loader');
      const categories = loader.getCategories();
      if (categories?.size) {
        const sortedCats = [...categories.keys()].sort((a, b) => a.localeCompare(b));
        const blocks = [];
        for (const cat of sortedCats) {
          const plugins = categories.get(cat)
            .filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i)
            .sort((a, b) => a.name.localeCompare(b.name));
          if (!plugins.length) continue;
          blocks.push(`${cat.toUpperCase()} (${plugins.length})\n${plugins.map(p => `• ${p.name}`).join('\n')}`);
        }
        body = blocks.join('\n\n');
      }
    } catch (e) {
      await sock.sendMessage(from, { text: 'DEBUG loader fail: ' + e.message });
    }

    if (body.length > 50000) body = body.slice(0, 50000);

    const responseId = crypto.randomUUID();
    const content = prepareRichResponseMessage({
      richResponse: Array(3).fill({ text: 'x' }),
      contentText: 'x',
      disclaimerText: 'MADARA X-MD' // no font.js, plain text
    });
    const rich = findRich(content);
    if (!rich) throw Error('Rich not found');

    rich.unifiedResponse.data = Buffer.from(JSON.stringify({
      __typename: 'GenAIUnifiedResponse',
      response_id: responseId,
      sections: [
        { __typename: 'GenAISingleLayoutViewModel', view_model: { __typename: 'GenAISingleLayoutViewModel', primitive: { __typename: 'GenAICodeUXPrimitive', language: 'javascript', code_blocks: [{ content: body, type: 'DEFAULT' }] } } }
      ]
    }));

    const context = content.messageContextInfo ?? {};
    content.messageContextInfo = context;
    context.botMetadata = {
      ...(context.botMetadata ?? {}),
      botResponseId: responseId,
      messageDisclaimerText: 'MADARA X-MD',
      capabilityMetadata: { capabilities: [2, 3, 8, 21, 34, 39, 55, 56, 60, 63] }
    };
    context.messageSecret ??= crypto.randomBytes(32);

    const msg = generateWAMessageFromContent(from, content, { userJid: sock.user.id, raw: true });
    const additionalNodes = [
      ...(!isJidGroup(from) ? [{ tag: 'bot', attrs: { biz_bot: '1' } }] : []),
      { tag: 'biz', attrs: { actual_actors: '2', host_storage: '2', privacy_mode_ts: String(Math.floor(Date.now() / 1000) - 77980457) }, content: [
        { tag: 'interactive', attrs: { type: 'native_flow', v: '1' }, content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }] },
        { tag: 'quality_control', attrs: { source_type: 'third_party' } }
      ]}
    ];

    await sock.relayMessage(from, msg.message, { messageId: msg.key.id, additionalNodes });
    await sock.sendMessage(from, { text: 'DEBUG: relay done' });

  } catch (e) {
    await sock.sendMessage(from, { text: 'ALLMENU ERROR:\n' + (e?.stack || e?.message || e) });
    console.log('allmenu error', e);
  }
}

// Export BOTH styles so your loader go find am either way
module.exports = {
  name: 'allmenu',
  aliases: ['allcmds', 'allcommands', 'cmdlist'],
  category: 'system',
  desc: 'List every command',
  run: async ({ sock, from }) => allmenuRun(sock, from),
  execute: async (sock, msg, args, ctx) => allmenuRun(sock, ctx.from || msg.key.remoteJid),
};