const store = new Map();
setInterval(() => store.clear(), 10 * 60 * 1000);
const getRateLimit = (key) => store.get(key);
const setRateLimit = (key, val) => store.set(key, val);
module.exports = { getRateLimit, setRateLimit };
