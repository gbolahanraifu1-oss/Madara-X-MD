'use strict';

import { generateWAMessageFromContent, isJidGroup } from '@itsliaaa/baileys'
import { prepareRichResponseMessage } from '@itsliaaa/baileys/lib/Utils/rich-message-utils.js'
import crypto from 'crypto'
import font from '@/functions/font.js'

export const name = 'allmenu'
export const aliases = ['allcmds', 'allcommands', 'cmdlist']
export const category = 'system'
export const desc = 'List every command in the bot, grouped by category'
export const usage = '†allmenu'

const findRich = o => {
if (!o || typeof o !== 'object') return null
if (o.unifiedResponse?.data && o.submessages) return o
for (const v of Object.values(o)) { const r = findRich(v); if (r) return r }
return null
}

export async function run({ sock, from, msg, ctx }) {
try {
const s = ctx.settings
const { getCategories, getAllCommands } = require('../../lib/loader')

const categories = getCategories()
const allCmds = getAllCommands()
const totalCmds = allCmds.size

if (!categories.size) {
return sock.sendMessage(from, { text: `❌ No commands loaded right now.${s.FOOTER}` }, { quoted: msg })
}

// Build table rows: [Category, Command, Desc]
const sortedCats = [...categories.keys()].sort((a, b) => a.localeCompare(b))
const rows = [['Category', 'Command', 'Description']] // header

for (const cat of sortedCats) {
const plugins = categories.get(cat)
.filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i)
.sort((a, b) => a.name.localeCompare(b.name))

for (const p of plugins) {
rows.push([
cat.toUpperCase(),
`${s.prefix}${p.name}`,
p.desc || '-'
])
}
}

const responseId = crypto.randomUUID()
const content = prepareRichResponseMessage({
richResponse: Array(3).fill({ text: 'x' }),
contentText: `📦 All Commands — ${totalCmds} total across ${sortedCats.length} categories`,
disclaimerText: font(s.FOOTER || '')
})

const rich = findRich(content)
if (!rich) throw Error('Not found')

rich.unifiedResponse.data = Buffer.from(JSON.stringify({
__typename: 'GenAIUnifiedResponse',
response_id: responseId,
sections: [
{
__typename: 'GenAISingleLayoutViewModel',
view_model: {
__typename: 'GenAISingleLayoutViewModel',
primitive: {
__typename: 'GenATableUXPrimitive',
title: 'All Commands',
rows: rows.map((row, i) => ({
is_header: i === 0,
cells: row,
markdown_cells: row.map(text => ({ text }))
}))
}
}
}
]
}))

const context = content.messageContextInfo ?? {}
content.messageContextInfo = context
context.botMetadata = {
...(context.botMetadata ?? {}),
botResponseId: responseId,
messageDisclaimerText: font(s.FOOTER || ''),
capabilityMetadata: { capabilities: [2, 3, 8, 21, 34, 39, 55, 56, 60, 63] }
}
context.messageSecret ??= crypto.randomBytes(32)

const wamsg = generateWAMessageFromContent(from, content, { userJid: sock.user.id, raw: true })
const additionalNodes = [
...(!isJidGroup(from) ? [{ tag: 'bot', attrs: { biz_bot: '1' } }] : []),
{
tag: 'biz',
attrs: {
actual_actors: '2',
host_storage: '2',
privacy_mode_ts: String(Math.floor(Date.now() / 1000) - 77980457)
},
content: [
{ tag: 'interactive', attrs: { type: 'native_flow', v: '1' }, content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }] },
{ tag: 'quality_control', attrs: { source_type: 'third_party' } }
]
}
]

await sock.relayMessage(from, wamsg.message, { messageId: wamsg.key.id, additionalNodes })
} catch (e) {
console.error(e)
await sock.sendMessage(ctx.from, { text: `Error loading menu.` }, { quoted: msg })
}
}