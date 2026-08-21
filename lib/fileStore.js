'use strict';
const fs=require('fs'),path=require('path');
const db=require('./db');
const FILES_ROOT=path.join(process.cwd(),'shop','files');
const FILE_PRICES_STORE='filePrices';

// ── Category classification ────────────────────────────────────────────
// FREE: bot sends the actual file straight away.
// PAID: bot NEVER sends the file — it only takes an order + Track ID.
const FREE_CATEGORIES=['sensitivity','freebies'];
const PLATFORM_CATS=['macro','headshots','proxy','vvipproxy','config']; // paid, split by android/iphone
const CATEGORIES=[...FREE_CATEGORIES,...PLATFORM_CATS];
const isPaidCategory=cat=>!FREE_CATEGORIES.includes(cat);

// ── Pricing (paid categories only) — falls back to a generic label for
//    any future paid category that isn't explicitly priced here. ───────
const PRICES={
  macro:      '₦1,000',
  headshots:  '₦1,500',
  proxy:      '₦2,000',
  vvipproxy:  '₦3,500',
  config:     '₦1,200',
};
const getPrice=cat=>PRICES[cat]||'ᴄᴏɴᴛᴀᴄᴛ ᴠᴇɴᴅᴏʀ';

// ── Per-file price overrides ─────────────────────────────────────────────
// Set when an admin uploads a file through the Telegram admin File Store
// Manager and enters a specific price. Falls back to the category default
// (PRICES/getPrice above) when no per-file price has been set.
function priceKey(cat,plat,filename){return `${cat}__${plat||''}__${filename}`;}
function setFilePrice(cat,plat,filename,price){
  if(!price)return;
  db.set(FILE_PRICES_STORE,priceKey(cat,plat,filename),price);
}
function getFilePrice(cat,plat,filename){
  const custom=db.get(FILE_PRICES_STORE,priceKey(cat,plat,filename),null);
  return custom||getPrice(cat);
}
function deleteFilePrice(cat,plat,filename){
  db.del(FILE_PRICES_STORE,priceKey(cat,plat,filename));
}

const catDir=cat=>path.join(FILES_ROOT,cat);
const platDir=(cat,plat)=>path.join(FILES_ROOT,cat,plat.toLowerCase());
function listFiles(dir){if(!fs.existsSync(dir))return[];return fs.readdirSync(dir).filter(f=>fs.statSync(path.join(dir,f)).isFile());}

function findSensitivity(model){
  const dir=catDir('sensitivity');if(!fs.existsSync(dir))return null;
  const files=listFiles(dir);const q=model.toLowerCase().replace(/\s+/g,'_');
  let m=files.find(f=>f.toLowerCase().replace(/\s+/g,'_').startsWith(q));
  // Fallback fuzzy match — was `.some()`, which only required ONE shared
  // word to match. Since every query shares the brand name ("samsung"),
  // that alone satisfied the check regardless of the actual model number
  // — so "Samsung A02/A03/A04/A05" all matched a file literally named
  // "Samsung A01" just because "samsung" matched. `.every()` requires
  // ALL significant words (brand AND model number) to be present, so a
  // different model number correctly falls through as no-match instead
  // of silently returning the wrong file.
  if(!m){const words=model.toLowerCase().split(/\s+/).filter(w=>w.length>2);m=words.length&&files.find(f=>{const fl=f.toLowerCase();return words.every(w=>fl.includes(w));});}
  if(m)return path.join(dir,m);
  const def=files.find(f=>f.toLowerCase().startsWith('default'));
  return def?path.join(dir,def):null;
}

function getFreebies(){return listFiles(catDir('freebies')).map(f=>path.join(catDir('freebies'),f));}

// ── Paid-file listing/IDs ───────────────────────────────────────────────
// Stable, human-readable IDs like "MACRO-ANDROID-1" — derived from the
// category, platform and sorted position in the folder. Used for
// `.buyfile <ID>` lookups. NOTE: for paid categories this is used only
// to identify what the buyer wants — the file itself is never sent.
function buildFileId(cat,plat,idx){return `${cat.toUpperCase()}-${plat.toUpperCase()}-${idx+1}`;}

function listPaidFiles(cat,plat){
  const dir=platDir(cat,plat);
  const files=listFiles(dir).sort();
  return files.map((filename,idx)=>({
    id:buildFileId(cat,plat,idx),
    filename,
    cat,
    plat:plat.toLowerCase(),
    price:getFilePrice(cat,plat,filename),
    path:path.join(dir,filename),
  }));
}

function findPaidFileById(id){
  if(!id)return null;
  const parts=id.toUpperCase().split('-');
  if(parts.length<3)return null;
  const idx=parseInt(parts[parts.length-1],10);
  const plat=parts[parts.length-2].toLowerCase();
  const cat=parts.slice(0,parts.length-2).join('-').toLowerCase();
  if(!PLATFORM_CATS.includes(cat)||!['android','iphone'].includes(plat)||!Number.isFinite(idx))return null;
  const files=listPaidFiles(cat,plat);
  return files[idx-1]||null;
}

// Legacy helper kept for compatibility — returns the first file only.
// Paid flows should use listPaidFiles()/findPaidFileById() instead so the
// file itself is never sent directly.
function getPlatformFile(cat,plat){const dir=platDir(cat,plat);if(!fs.existsSync(dir))return null;const files=listFiles(dir);return files.length?path.join(dir,files[0]):null;}

function saveFile(cat,plat,filename,buffer,price){
  const dir=FREE_CATEGORIES.includes(cat)?catDir(cat):platDir(cat,plat||'android');
  if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});
  const fp=path.join(dir,filename);fs.writeFileSync(fp,buffer);
  if(isPaidCategory(cat)&&price)setFilePrice(cat,plat||'android',filename,price);
  return fp;
}
function mimeLabel(fp){const ext=path.extname(fp).toLowerCase();return ext==='.zip'?'application/zip':ext==='.rar'?'application/x-rar-compressed':'text/plain';}

module.exports={
  CATEGORIES,PLATFORM_CATS,FREE_CATEGORIES,isPaidCategory,
  PRICES,getPrice,getFilePrice,setFilePrice,deleteFilePrice,
  catDir,platDir,listFiles,
  findSensitivity,getFreebies,
  listPaidFiles,findPaidFileById,buildFileId,
  getPlatformFile,saveFile,mimeLabel,FILES_ROOT,
};
