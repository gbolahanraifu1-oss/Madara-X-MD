'use strict';
const fs = require('fs');
const path = require('path');
const { resolveDesignPreference } = require('./designPreference');
const DESIGN_DIR = path.join(__dirname, 'menuDesigns');
const ASSETS_DIR = path.join(__dirname, '../assets');
const PREF_FILE = path.join(__dirname, 'menuPref.json');

if (!fs.existsSync(DESIGN_DIR)) fs.mkdirSync(DESIGN_DIR, { recursive: true });
if (!fs.existsSync(PREF_FILE)) fs.writeFileSync(PREF_FILE, JSON.stringify({ default: "default" }, null, 2));

/**
 * Scan a directory for .js skin files.
 * Returns objects { id, file } so callers know the full path.
 * Recurses one level deep into subdirectories.
 */
function scanDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return []; }
  for (const f of entries) {
    const full = path.join(dir, f);
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        // one level deep
        let subEntries;
        try { subEntries = fs.readdirSync(full); } catch { continue; }
        for (const sub of subEntries) {
          if (sub.endsWith('.js')) {
            out.push({ id: sub.replace(/\.js$/, ''), file: path.join(full, sub) });
          }
        }
      } else if (f.endsWith('.js')) {
        out.push({ id: f.replace(/\.js$/, ''), file: full });
      }
    } catch {}
  }
  return out;
}

function listDesigns() {
  const seen = new Map(); // id -> file path

  // 1. Scan lib/menuDesigns/
  for (const { id, file } of scanDir(DESIGN_DIR)) {
    if (!seen.has(id)) seen.set(id, file);
  }

  // 2. Scan assets/ root and all subdirs (this picks up assets/designs/*.js)
  for (const { id, file } of scanDir(ASSETS_DIR)) {
    if (!seen.has(id)) seen.set(id, file);
  }

  // 3. Add designs from madara-menu-pack.js DESIGNS array (virtual entries)
  try {
    const packFile = path.join(ASSETS_DIR, 'designs', 'madara-menu-pack.js');
    if (fs.existsSync(packFile)) {
      const pack = require(packFile);
      if (Array.isArray(pack.DESIGNS)) {
        for (const id of pack.DESIGNS) {
          if (!seen.has(String(id))) seen.set(String(id), '__pack__');
        }
      }
    }
  } catch {}

  // Remove internal-only names and return sorted list
  return [...seen.keys()]
    .filter(name => name !== 'madara-menu-pack')
    .sort();
}

function getDesignIdFor(chatId, senderId) {
  try {
    const pref = JSON.parse(fs.readFileSync(PREF_FILE, 'utf8'));
    return resolveDesignPreference(pref, senderId);
  } catch { return 'default'; }
}

function getDesign(id) {
  try {
    // Build ordered search paths — most specific first
    const tryFiles = [
      path.join(DESIGN_DIR, `${id}.js`),
      path.join(ASSETS_DIR, 'designs', `${id}.js`),  // most likely location
      path.join(ASSETS_DIR, `${id}.js`),
      path.join(ASSETS_DIR, 'design', `${id}.js`),
      path.join(ASSETS_DIR, 'menuDesigns', `${id}.js`),
    ];

    // Also scan any subdirectory of assets/ dynamically
    if (fs.existsSync(ASSETS_DIR)) {
      for (const d of fs.readdirSync(ASSETS_DIR)) {
        const full = path.join(ASSETS_DIR, d);
        try {
          if (fs.statSync(full).isDirectory()) {
            const candidate = path.join(full, `${id}.js`);
            if (!tryFiles.includes(candidate)) tryFiles.push(candidate);
          }
        } catch {}
      }
    }

    // Try each path
    for (const file of tryFiles) {
      if (fs.existsSync(file)) {
        delete require.cache[require.resolve(file)];
        return require(file);
      }
    }

    // Last resort: check madara-menu-pack virtual designs
    const packFile = path.join(ASSETS_DIR, 'designs', 'madara-menu-pack.js');
    if (fs.existsSync(packFile)) {
      delete require.cache[require.resolve(packFile)];
      const pack = require(packFile);
      if (pack.DESIGNS?.includes(String(id).toLowerCase())) {
        return { render: (...args) => pack.renderDesign(String(id).toLowerCase(), ...args) };
      }
    }
  } catch (e) {
    console.log('[menuEngine] getDesign fail:', e.message);
  }
  return null;
}

async function render(sock, msg, args, skinId, ctx) {
  const design = getDesign(skinId);
  if (!design) throw new Error(`Design "${skinId}" not found`);
  if (typeof design.render === 'function') {
    return await design.render(sock, msg, args, skinId, ctx);
  }
  throw new Error(`Design "${skinId}" has no render()`);
}

module.exports = { DESIGN_DIR, ASSETS_DIR, PREF_FILE, listDesigns, resolveDesignPreference, getDesignIdFor, getDesign, render };
