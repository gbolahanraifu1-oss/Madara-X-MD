'use strict';
const fs   = require('fs');
const path = require('path');

const SHOP_ROOT = path.join(process.cwd(), 'shop');

const CATEGORIES = ['freefire', 'pubg', 'roblox', 'valorant', 'cod', 'genshin'];

const FIELDS = {
    freefire: ['Evo Count','Prime Status','Level','Legendary Weapons Count','Legendary Evos Count','Mythics Count','Vault Items','Condition','Price','Extra Notes'],
    pubg:     ['UC Amount','Royal Pass Status','Level','Legendary Skins Count','Outfits Count','Mythic Items','KD Ratio','Condition','Price','Extra Notes'],
    roblox:   ['Robux Amount','Limited Items Count','Game Passes','Legendary Accessories','Level','Condition','Price','Extra Notes'],
    valorant: ['Rank','Legendary Skins Count','Agents Unlocked','Battle Pass Status','Condition','Price','Extra Notes'],
    cod:      ['Level','Legendary Weapons Count','Legendary Skins Count','Battle Pass','KD Ratio','Condition','Price','Extra Notes'],
    genshin:  ['AR Level','5★ Characters Count','Legendary Weapons','Mythic Constellations','Primogems','Condition','Price','Extra Notes'],
};

function ensureDirs() {
    CATEGORIES.forEach(c => {
        const p = path.join(SHOP_ROOT, c, 'img');
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    });
}

function getAccPath(cat, id) {
    return path.join(SHOP_ROOT, cat, 'img', id);
}

function listAccounts(cat) {
    const dir = path.join(SHOP_ROOT, cat, 'img');
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir);
    const ids = [...new Set(files.map(f => f.replace(/\.(jpg|jpeg|png|txt)$/i, '')))];
    return ids.filter(id => {
        const hasImg = fs.existsSync(path.join(dir, id + '.jpg')) || fs.existsSync(path.join(dir, id + '.jpeg')) || fs.existsSync(path.join(dir, id + '.png'));
        const hasTxt = fs.existsSync(path.join(dir, id + '.txt'));
        return hasImg && hasTxt;
    });
}

function getAccount(cat, id) {
    const dir  = path.join(SHOP_ROOT, cat, 'img');
    const imgPath = ['.jpg','.jpeg','.png'].map(e => path.join(dir, id + e)).find(p => fs.existsSync(p));
    const txtPath = path.join(dir, id + '.txt');
    if (!imgPath || !fs.existsSync(txtPath)) return null;
    return {
        id,
        img:  imgPath,
        info: fs.readFileSync(txtPath, 'utf8'),
    };
}

function saveAccount(cat, id, imgBuffer, imgExt, infoText) {
    ensureDirs();
    const dir = path.join(SHOP_ROOT, cat, 'img');
    fs.writeFileSync(path.join(dir, `${id}${imgExt}`), imgBuffer);
    fs.writeFileSync(path.join(dir, `${id}.txt`), infoText);
}

function deleteAccount(cat, id) {
    const dir = path.join(SHOP_ROOT, cat, 'img');
    ['.jpg','.jpeg','.png','.txt'].forEach(e => {
        const p = path.join(dir, id + e);
        if (fs.existsSync(p)) fs.unlinkSync(p);
    });
}

function nextId(cat) {
    const existing = listAccounts(cat);
    let n = existing.length + 1;
    while (existing.includes(`acc${n}`)) n++;
    return `acc${n}`;
}

module.exports = { CATEGORIES, FIELDS, listAccounts, getAccount, saveAccount, deleteAccount, nextId, SHOP_ROOT };
