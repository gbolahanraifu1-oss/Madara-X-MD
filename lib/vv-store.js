/*
 * VV-STORE - keeps recent incoming messages so view-once media can be
 * recovered later. WhatsApp does not resend view-once content to the
 * bot after the first delivery, so the original copy must be kept.
 *
 * Use ONE of these (the first is the easiest):
 *   attachVvStore(sock)           call once right after each socket is created (also after a reconnect)
 *   rememberMessage(sock, m)      call as the FIRST line for every message in your own messages.upsert loop
 */
const MESSAGE_STORE_LIMIT = 1500;

// One store for the whole program. (A store per socket was emptied on every reconnect,
// because a reconnect makes a new socket.)
const store = new Map(); // message id -> { message }
const attached = new WeakSet();

// Can the media inside really be downloaded? An empty shell has no key and no address.
function hasMedia(message) {
  let cur = message;
  for (let i = 0; i < 8 && cur; i++) {
    const wrap = cur.viewOnceMessage || cur.viewOnceMessageV2 || cur.viewOnceMessageV2Extension || cur.ephemeralMessage || cur.documentWithCaptionMessage || cur.editedMessage;
    if (wrap?.message) { cur = wrap.message; continue; }
    break;
  }
  const node = cur?.imageMessage || cur?.videoMessage || cur?.audioMessage;
  return !!(node && node.mediaKey && (node.directPath || node.url));
}

function rememberMessage(sock, message) {
  const id = message?.key?.id;
  if (!id || !message.message) return;

  // Never replace a complete copy with an empty shell of the same message.
  const old = store.get(id);
  if (old && hasMedia(old.message) && !hasMedia(message.message)) return;

  store.delete(id);
  store.set(id, { message: message.message });
  while (store.size > MESSAGE_STORE_LIMIT) store.delete(store.keys().next().value);
}

// Message ids are random and unique, so the id alone finds the message.
function getStoredMessage(sock, key) {
  const id = key?.id;
  const entry = id ? store.get(id) : null;
  if (!entry) return undefined;
  store.delete(id);
  store.set(id, entry);
  return entry.message;
}

// Remembers every message of this socket, of every type, before anything else sees it.
function attachVvStore(sock) {
  if (!sock?.ev || attached.has(sock)) return;
  attached.add(sock);
  sock.ev.on('messages.upsert', ({ messages }) => {
    for (const m of messages || []) {
      try { rememberMessage(sock, m); } catch (e) { console.error('[VV-STORE]', e.message); }
    }
  });
}

module.exports = { rememberMessage, getStoredMessage, attachVvStore };
