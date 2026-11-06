'use strict';

/**
 * Per-message async context so menuBox() / outgoing formatters can read
 * the active session phone without every command passing it in.
 */
const { AsyncLocalStorage } = require('async_hooks');

const als = new AsyncLocalStorage();

function run(store, fn) {
    return als.run(store || {}, fn);
}

function getStore() {
    return als.getStore() || null;
}

function getPhone() {
    const s = als.getStore();
    return s?.phone || null;
}

function setPhone(phone) {
    const s = als.getStore();
    if (s) s.phone = phone;
}

module.exports = { run, getStore, getPhone, setPhone };
