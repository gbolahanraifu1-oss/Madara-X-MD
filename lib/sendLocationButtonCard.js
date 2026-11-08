'use strict';
// lib/sendLocationButtonCard.js

module.exports = function attachSendLocationButtonCard(sock) {
  if (sock.sendLocationButtonCard) return sock;

  sock.sendLocationButtonCard = async (jid, data = {}, opts = {}) => {
    const {
      title = 'MADARA X-MD',
      subtitle = '',
      text = '',
      thumbnail,
      thumbnailUrl,
      buttons = [],
      latitude = 6.5244,
      longitude = 3.3792,
    } = data;

    let thumb = thumbnail;
    if (!thumb && thumbnailUrl) {
      const r = await fetch(thumbnailUrl);
      thumb = Buffer.from(await r.arrayBuffer());
    }

    return sock.sendMessage(jid, {
      location: {
        degreesLatitude: latitude,
        degreesLongitude: longitude,
        name: title,
        address: subtitle,
      },
      caption: text,
      jpegThumbnail: thumb,
      footer: title,
      buttons: buttons.map(b => ({
        buttonId: b.id,
        buttonText: { displayText: b.text },
        type: 1
      })),
      headerType: 6,
    }, opts);
  };

  return sock;
};