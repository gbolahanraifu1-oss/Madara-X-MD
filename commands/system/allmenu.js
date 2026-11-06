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

module.exports = {
  name: 'allmenu',
  aliases: ['allcmds', 'allcommands', 'cmdlist'],
  category: 'system',
  desc: 'List every command in the bot, grouped by category',
  usage: '.allmenu',
  async execute(sock, msg, args, ctx) {
    try {
      const { getCategories, getAllCommands } = require('../../lib/loader');
      const categories = getCategories();
      const allCmds = getAllCommands();
      const totalCmds = allCmds?.size ?? 0;
      if (!categories?.size) return ctx.reply('❌ No commands loaded right now.');

      const sortedCats = [...categories.keys()].sort((a, b) => a.localeCompare(b));
      const blocks = [];
      for (const cat of sortedCats) {
        const plugins = categories.get(cat)
          .filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i)
          .sort((a, b) => a.name.localeCompare(b.name));
        if (!plugins.length) continue;
        blocks.push(`${cat.toUpperCase()} (${plugins.length})\n${plugins.map(p => `• ${p.name}`).join('\n')}`);
      }
      let body = blocks.join('\n\n');
      // Code block get limit, keep am safe
      if (body.length > 50000) body = body.slice(0, 50000) + '\n... (truncated)';

      const header = `📦 MADARA X-MD ALL COMMANDS\n${totalCmds} commands - ${sortedCats.length} categories`;
      const responseId = crypto.randomUUID();

      // Build rich message - 1 text section + 1 code section
      const content = prepareRichResponseMessage({
        richResponse: Array(3).fill({ text: 'x' }),
        contentText: header,
        disclaimerText: 'MADARA X-MD'
      });
      const rich = findRich(content);
      if (!rich) throw Error('Rich not found');

      rich.unifiedResponse.data = Buffer.from(JSON.stringify({
        __typename: 'GenAIUnifiedResponse',
        response_id: responseId,
        sections: [
          {
            __typename: 'GenAISingleLayoutViewModel',
            view_model: {
              __typename: 'GenAISingleLayoutViewModel',
              primitive: {
                __typename: 'GenAITextUXPrimitive',
                text: header
              }
            }
          },
          {
            __typename: 'GenAISingleLayoutViewModel',
            view_model: {
              __typename: 'GenAISingleLayoutViewModel',
              primitive: {
                __typename: 'GenAICodeUXPrimitive',
                language: 'javascript',
                code_blocks: [{ content: body, type: 'DEFAULT' }]
              }
            }
          }
        ]
      }));

      const context = content.messageContextInfo ?? {};
      content.messageContextInfo = context;
      context.botMetadata = {
        ...(context.botMetadata ?? {}),
        botResponseId: responseId,
        messageDisclaimerText: 'MADARA X-MD',
        capabilityMetadata: { capabilities: [2,3,8,21,34,39,55,56,60,63] }
      };
      context.messageSecret ??= crypto.randomBytes(32);

      const waMsg = generateWAMessageFromContent(ctx.from, content, { userJid: sock.user.id, raw: true });
      const additionalNodes = [
        ...(!isJidGroup(ctx.from) ? [{ tag: 'bot', attrs: { biz_bot: '1' } }] : []),
        { tag: 'biz', attrs: { actual_actors: '2', host_storage: '2', privacy_mode_ts: String(Math.floor(Date.now()/1000) - 77980457) }, content: [
          { tag: 'interactive', attrs: { type: 'native_flow', v: '1' }, content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }] },
          { tag: 'quality_control', attrs: { source_type: 'third_party' } }
        ]}
      ];

      await sock.relayMessage(ctx.from, waMsg.message, { messageId: waMsg.key.id, additionalNodes });
    } catch (e) {
      console.log('allmenu rich fail:', e);
      await ctx.reply('❌ Rich code block fail, try again.');
    }
  }
};