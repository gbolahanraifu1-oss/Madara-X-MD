'use strict';
const fs = require('fs');
const path = require('path');
const {
  getMenuCategoryCatalog,
  getCategoryMeta,
  resolveCategory,
} = require('../../lib/menuCategories');

module.exports = {
  key: "madara-apex",
  aliases: ["apex","prime","main"],
  title: "Madara Apex",
  desc: "𝙼𝙰𝙳𝙰𝚁𝙰 𝙰𝙿𝙴𝚇 | 𝚂𝙴𝙻𝙴𝙲𝚃𝙾𝚁",
  MENU_IMAGE_URL: "https://files.catbox.moe/2prt24.jpg",
  CHANNEL_URL: "https://whatsapp.com/channel/0029Vb88OB4545unOuID4H0Q",
  CHANNEL2_URL: "https://whatsapp.com/channel/0029VbDKIMF6GcG5ams9Q21m",

  buildMadaraDesign(cards, mkCta, extra = {}){
    try{
      const grouped = extra.grouped || {};
      const categoriesMap = extra.categoriesMap;
      let categories = {};
      let totalCmds = 0;
      const seen = new Set();
      const addCategory = (rawKey, plugins) => {
        const key = resolveCategory(rawKey, 'misc');
        const list = Array.isArray(plugins) ? plugins : [];
        const bucket = categories[key] || (categories[key] = []);
        for (const plugin of list) {
          if (!plugin || !plugin.name) continue;
          const id = String(plugin.name);
          if (seen.has(`${key}:${id}`)) continue;
          seen.add(`${key}:${id}`);
          bucket.push({
            title: `.${id}`,
            description: String(plugin.desc || plugin.description || 'cmd').slice(0, 60),
            id,
          });
          totalCmds++;
        }
      };

      if(grouped && Object.keys(grouped).length){
        for(const k in grouped){
          if(!k) continue;
          addCategory(k, grouped[k]);
        }
      }else if(categoriesMap){
        const entries = categoriesMap instanceof Map? categoriesMap.entries():Object.entries(categoriesMap);
        for(const [k,v] of entries){
          const list = v && typeof v.values==='function'? Array.from(v.values()):Array.isArray(v)? v:[];
          addCategory(k, list);
        }
      }

      if(!Object.keys(categories).length){
        const baseDir = path.join(__dirname, '../../commands');
        if(fs.existsSync(baseDir)){
          for(const c of fs.readdirSync(baseDir).filter(d=>{try{return fs.statSync(path.join(baseDir,d)).isDirectory()}catch{return false}})){
            for(const f of fs.readdirSync(path.join(baseDir,c)).filter(x=>x.endsWith('.js'))){
              try{
                const fp=path.join(baseDir,c,f); try{delete require.cache[require.resolve(fp)]}catch{}
                const plugin=require(fp); if(!plugin||!plugin.name) continue;
                addCategory(plugin.category || c || 'misc', [plugin]);
              }catch{}
            }
          }
        }
      }
      if(!totalCmds){ categories={General:[{title:'.menu',description:'menu',id:'menu'}]}; totalCmds=1; }

      const categoryNames = Object.keys(categories).sort();
      const categoryRows = categoryNames.map(cat => {
        const meta = getCategoryMeta(cat, categories);
        return {
          title: `${meta?.e || '📂'} ${cat.toUpperCase()}`,
          description: `${categories[cat].length} commands`,
          id: `madara_cat_${cat}`,
        };
      });
      const sections = [];
      for (let i = 0; i < categoryRows.length; i += 10) {
        const page = Math.floor(i / 10) + 1;
        const pages = Math.ceil(categoryRows.length / 10);
        sections.push({
          title: pages > 1 ? `CATEGORIES ${page}/${pages}` : 'COMMAND CATEGORIES',
          rows: categoryRows.slice(i, i + 10),
        });
      }
      const tableCats = categoryNames;

      const widget = {
        version:"v0.9",
        createSurface:{
          surfaceId:"madara-apex-v1",
          catalogId:"https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json",
          components:[
            {id:"root",component:"Column",align:"center",children:["titleRow","d1","tableCard","d2","foot","btnRow"]},
            {id:"titleRow",component:"Row",justify:"center",children:["title"]},
            {id:"title",component:"Text",text:"༺ 𝙼𝙰𝙳𝙰𝚁𝙰 𝙰𝙿𝙴𝚇 ༻",variant:"h2"},
            {id:"d1",component:"Divider"},
            {id:"tableCard",component:"Card",child:"tableCol"},
            {id:"tableCol",component:"Column",children:["headRow","divHead",...tableCats.flatMap((_,i)=>['row'+i+'1','div'+i])]},
            {id:"headRow",component:"Row",children:["headL","headR"]},
            {id:"headL",component:"Column",weight:1,children:["hCmd"]},
            {id:"hCmd",component:"Text",text:"Category",variant:"h5"},
            {id:"headR",component:"Column",weight:1,children:["hDesc"]},
            {id:"hDesc",component:"Text",text:"Count",variant:"h5"},
            {id:"divHead",component:"Divider"},
         ...tableCats.flatMap((cat,i)=>[
              {id:'row'+i+'1',component:"Row",children:['col'+i+'L','col'+i+'R']},
              {id:'col'+i+'L',component:"Column",weight:1,children:['c'+i]},
              {id:'c'+i,component:"Text",text:String(cat)},
              {id:'col'+i+'R',component:"Column",weight:1,children:['d'+i+'x']},
              {id:'d'+i+'x',component:"Text",text:String(categories[cat].length)+' cmds'},
              {id:'div'+i,component:"Divider"},
            ]),
            {id:"d2",component:"Divider"},
            {id:"foot",component:"Text",text:'𝙼𝙰𝙳𝙰𝚁𝙰 𝙰𝙿𝙴𝚇 | '+String(totalCmds)+' Plugins',variant:"caption"},
            {id:"btnRow",component:"Row",justify:"spaceEvenly",children:["btn1","btn2"]},
            {id:"btn1Label",component:"Text",text:"1st-Channel"},
            {id:"btn1",component:"Button",child:"btn1Label",variant:"primary",action:{call:"openUrl",args:{url:this.CHANNEL_URL}}},
            {id:"btn2Label",component:"Text",text:"2nd-Channel"},
            {id:"btn2",component:"Button",child:"btn2Label",variant:"primary",action:{call:"openUrl",args:{url:this.CHANNEL2_URL}}},
          ]
        }
      };
      return { IMAGE_URL:this.MENU_IMAGE_URL, widget, sections, totalCmds, footerText:'𝙼𝙰𝙳𝙰𝚁𝙰 𝙰𝙿𝙴𝚇 | '+String(totalCmds)+' Plugins' };
    }catch(e){ return { IMAGE_URL:this.MENU_IMAGE_URL, widget:{version:"v0.9",createSurface:{surfaceId:"fb",catalogId:"https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json",components:[{id:"root",component:"Column",children:["t"]},{id:"t",component:"Text",text:"𝙼𝙰𝙳𝙰𝚁𝙰 𝙰𝙿𝙴𝚇"}]}}, sections:[{title:"MENU",rows:[{title:".menu",id:"menu"}]}], totalCmds:1, footerText:"𝙼𝙰𝙳𝙰𝚁𝙰 𝙰𝙿𝙴𝚇" }; }
  },

  async render(sock, msg, args, skinId, ctx){
    const { generateWAMessageFromContent, prepareWAMessageMedia } = require('@dark-yasiya/baileys');
    const from = (ctx && ctx.from) || (msg && (msg.chat || msg.key.remoteJid)) || '';
    let extra = {}; try{ const loader=require('../../lib/loader'); const cats=loader.getCategories(); if(cats instanceof Map) extra={categoriesMap:cats}; else extra={grouped:cats}; }catch{}
    const out = this.buildMadaraDesign(null,null,extra);
    const { imageMessage } = await prepareWAMessageMedia({ image:{ url: out.IMAGE_URL } }, { upload: sock.waUploadToServer.bind(sock) });

    const content = {
      interactiveMessage:{
        header:{ imageMessage, hasMediaAttachment:true },
        body:{ text:'\u200E' },
        footer:{ text:out.footerText },
        bloksWidget:{ type:"im_a2ui", data:JSON.stringify(out.widget), fallback:out.footerText },
        nativeFlowMessage:{
          messageParamsJson: JSON.stringify({
            limited_time_offer:{
              text:'𝙼𝙰𝙳𝙰𝚁𝙰 𝙰𝙿𝙴𝚇',
              url:this.CHANNEL_URL,
              copy_code:'𝙼𝙰𝙳𝙰𝚁𝙰 𝙰𝙿𝙴𝚇',
              expiration_time: new Date('2026-10-24T23:59:59Z').getTime()
            }
          }),
          buttons:[
            { name:"single_select", buttonParamsJson: JSON.stringify({ title:'📂 OPEN MENU ('+String(out.totalCmds)+')', sections:out.sections }) }
          ]
        }
      }
    };
    const waMsg = generateWAMessageFromContent(from, content, {userJid:sock.user.id, quoted:msg});
    await sock.relayMessage(from, waMsg.message, {messageId:waMsg.key.id});
  }
};