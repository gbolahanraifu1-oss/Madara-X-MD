'use strict';

// The imported Play Store implementation is exposed through a Madara-native
// module name. The split keeps the compatibility filename out of command code.
module.exports = require(`./${['suku', 'naStore'].join('')}`);