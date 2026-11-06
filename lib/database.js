'use strict';
const fs   = require('fs');
const path = require('path');
const DB_FILE = path.join(process.cwd(), 'data', 'madara_db.json');
if (!fs.existsSync(path.dirname(DB_FILE))) fs.mkdirSync(path.dirname(DB_FILE),{recursive:true});
let _db = {};
try { _db = JSON.parse(fs.readFileSync(DB_FILE,'utf8')); } catch {}
function save() { try { fs.writeFileSync(DB_FILE,JSON.stringify(_db,null,2)); } catch {} }
function getUser(id,key) { return _db.users?.[id]?.[key]; }
function setUser(id,key,val) { if(!_db.users) _db.users={}; if(!_db.users[id]) _db.users[id]={}; _db.users[id][key]=val; save(); }
function getAllUsers() { return _db.users||{}; }
function getSession(phone,key,group) { return _db.sessions?.[phone]?.[group]?.[key]; }
function setSession(phone,key,group,val) { if(!_db.sessions) _db.sessions={}; if(!_db.sessions[phone]) _db.sessions[phone]={}; if(!_db.sessions[phone][group]) _db.sessions[phone][group]={}; _db.sessions[phone][group][key]=val; save(); }
module.exports = { getUser, setUser, getAllUsers, getSession, setSession };
