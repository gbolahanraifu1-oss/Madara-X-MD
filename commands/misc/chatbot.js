'use strict';

// Keep legacy .ai/.ask routes pointed at the secure multi-provider handler.
// The utility chatbot plugin owns the `chatbot` command itself.
module.exports = require('../ai/ai');