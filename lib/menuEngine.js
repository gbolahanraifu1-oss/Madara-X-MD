'use strict';
const fs = require('fs');
const path = require('path');
const DESIGN_DIR = path.join(__dirname, 'menuDesigns');
const ASSETS_DIR = path.join(__dirname, '../assets');
const PREF_FILE = path.join(__dirname, 'menuPref.json');

if (!fs.existsSync(DESIGN_DIR)) fs.mkdirSync(DESIGN_DIR, { recursive: true });
if (!fs.existsSync(PREF_FILE)) fs.writeFileSync(PREF_FILE, JSON.stringify({ default: "default" }, null, 2));

function scanDir(dir){
  if(!fs.existsSync(dir)) return [];
  let out=[];
  for(const f of fs.readdirSync(dir)){
    const full = path.join(dir,f);
    try{
      const stat = fs.statSync(full);
      if(stat.isDirectory()){
        // scan one level deep
        for(const sub of fs.readdirSync(full)){
          if(sub.endsWith('.js')) out.push(sub.replace(/\.js$/,''));
        }
      } else if(f.endsWith('.js')){
        out.push(f.replace(/\.js$/,''));
      }
    }catch{}
  }
  return out;
}

function listDesigns(){
  const direct = [...new Set([...scanDir(DESIGN_DIR),...scanDir(ASSETS_DIR)])]
    .filter(name => name !== 'madara-menu-pack');
  try {
    const pack = require(path.join(ASSETS_DIR, 'designs', 'madara-menu-pack.js'));
    if (Array.isArray(pack.DESIGNS)) direct.push(...pack.DESIGNS);
  } catch {}
  return [...new Set(direct)].sort();
}

function getDesignIdFor(chatId,senderId){
  try{
    const pref=JSON.parse(fs.readFileSync(PREF_FILE,'utf8'));
    if(senderId && pref[senderId]) return pref[senderId];
    return pref['default']||'default';
  }catch{ return 'default'; }
}

function getDesign(id){
  try{
    const tryFiles = [
      path.join(DESIGN_DIR, `${id}.js`),
      path.join(ASSETS_DIR, `${id}.js`),
      path.join(ASSETS_DIR, 'design', `${id}.js`),
      path.join(ASSETS_DIR, 'designs', `${id}.js`),
      path.join(ASSETS_DIR, 'menuDesigns', `${id}.js`),
    ];
    // also scan subfolders dynamically
    if(fs.existsSync(ASSETS_DIR)){
      for(const d of fs.readdirSync(ASSETS_DIR)){
        const full = path.join(ASSETS_DIR, d);
        try{ if(fs.statSync(full).isDirectory()) tryFiles.push(path.join(full, `${id}.js`)); }catch{}
      }
    }
    for(const file of tryFiles){
      if(fs.existsSync(file)){ delete require.cache[require.resolve(file)]; return require(file); }
    }
    const packFile = path.join(ASSETS_DIR, 'designs', 'madara-menu-pack.js');
    if (fs.existsSync(packFile)) {
      delete require.cache[require.resolve(packFile)];
      const pack = require(packFile);
      if (pack.DESIGNS?.includes(String(id).toLowerCase())) {
        return { render: (...args) => pack.renderDesign(String(id).toLowerCase(), ...args) };
      }
    }
  }catch(e){ console.log('getDesign fail', e.message); }
  return null;
}

async function render(sock,msg,args,skinId,ctx){
  const design=getDesign(skinId);
  if(!design) throw new Error(`Design ${skinId} not found`);
  if(typeof design.render==='function'){
    return await design.render(sock,msg,args,skinId,ctx);
  }
  throw new Error(`Design ${skinId} has no render()`);
}
module.exports={DESIGN_DIR,ASSETS_DIR,PREF_FILE,listDesigns,getDesignIdFor,getDesign,render};