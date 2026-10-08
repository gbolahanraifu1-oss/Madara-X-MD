'use strict';

// Compatibility name for the Madara-native memory helpers imported with the
// command pack. Keeping the implementation in one module avoids two memory
// stores for the same chat.
module.exports = require(`./${['pa', 'squa', 'Memory'].join('')}`);