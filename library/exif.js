'use strict';

// Keep sticker conversion functional when a source-specific EXIF helper is
// unavailable. WhatsApp accepts a valid WebP without custom metadata.
async function addExif(buffer) {
    return buffer;
}

module.exports = { addExif };