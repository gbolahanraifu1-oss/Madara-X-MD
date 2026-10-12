'use strict';
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '../data/premium.json');

function normalizePhone(value) {
    return String(value || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}
function validPhone(value) {
    const phone = normalizePhone(value);
    return phone.length >= 7 && phone.length <= 15 ? phone : null;
}
function readUsers() {
    try {
        const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
        const users = Array.isArray(parsed) ? parsed : parsed.users;
        return Array.isArray(users) ? [...new Set(users.map(normalizePhone).filter(Boolean))] : [];
    } catch { return []; }
}
function writeUsers(users) {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify({ users: [...new Set(users.map(normalizePhone).filter(Boolean))] }, null, 2) + '\n', 'utf8');
}
function getPremiumUsers() { return readUsers(); }
function addPremiumUser(value) {
    const phone = validPhone(value);
    if (!phone) return false;
    const users = readUsers();
    if (users.includes(phone)) return false;
    users.push(phone);
    writeUsers(users);
    return true;
}
function removePremiumUser(value) {
    const phone = validPhone(value);
    if (!phone) return false;
    const users = readUsers();
    if (!users.includes(phone)) return false;
    writeUsers(users.filter(user => user !== phone));
    return true;
}
function isPremiumUser(jid) {
    const raw = normalizePhone(jid);
    if (!raw) return false;
    const candidates = new Set([raw]);
    try {
        const resolved = require('./context').resolveLid(raw);
        const normalized = normalizePhone(resolved);
        if (normalized) candidates.add(normalized);
    } catch {}
    const users = new Set(readUsers());
    return [...candidates].some(candidate => users.has(candidate));
}
module.exports = { FILE, normalizePhone, getPremiumUsers, addPremiumUser, removePremiumUser, isPremiumUser };
