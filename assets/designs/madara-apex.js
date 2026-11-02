'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
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
          bucket.push(plugin.name);
          totalCmds++;
        }
      };
      if(grouped && Object.keys(grouped).length){
        for(const k in grouped) if(k) addCategory(k, grouped[k]);
      }else if(categoriesMap){
        const entries = categoriesMap instanceof Map? categoriesMap.entries():Object.entries(categoriesMap);
        for(const [k,v] of entries){
          const list = v && typeof v.values==='function'? Array.from(v.values()):Array.isArray(v)? v:[];
          addCategory(k, list);
        }
      }
      const categoryNames = Object.keys(categories).sort();
      const categoryRows = categoryNames.map(cat => ({
        title: `${(getCategoryMeta(cat, categories)?.e || '📂')} ${cat.toUpperCase()}`,
        description: `${categories[cat].length} commands`,
        id: `madara_cat_${cat}`,
      }));
      
      // Build sections for single_select - chunk to show all 22 cats
      const sections = [];
      for (let i = 0; i < categoryRows.length; i += 10) {
        const page = Math.floor(i / 10) + 1;
        const pages = Math.ceil(categoryRows.length / 10);
        sections.push({
          title: pages > 1 ? `CATEGORIES ${page}/${pages}` : 'COMMAND CATEGORIES',
          rows: categoryRows.slice(i, i + 10),
        });
      }

      // DIRECTORY as single text - like premium file
      const directory = categoryNames.map(cat => {
        const cmds = categories[cat] || [];
        return `┌─〔 ${cat.toUpperCase()} 〕\n${cmds.map(n=>`│ .${n}`).join('\n')}\n└─ ${cmds.length} cmds`;
      }).join('\n\n');

      const uuid = crypto.randomUUID();
      const surfaceId = `madara-apex=${uuid}`;
      
      // Same widget structure as premium - 26 comps only
      const components = [
        {id:'root',component:'Card',child:'main'},
        {id:'main',component:'Column',children:['brand','version','heading','description','stats','divider','directoryTitle','directory','footerDivider','footerTitle','footerInfo','btnRow']},
        {id:'brand',component:'Text',text:'༺ 𝙼𝙰𝙳𝙰𝚁𝙰 𝙰𝙿𝙴𝚇 ༻',variant:'h2'},
        {id:'version',component:'Text',text:`ADVANCED INTERFACE / ${totalCmds} PLUGINS`,variant:'caption'},
        {id:'heading',component:'Text',text:'Centro de comandos',variant:'h3'},
        {id:'description',component:'Text',text:'Sistema principal de herramientas de MADARA X-MD.',variant:'body'},
        {id:'stats',component:'Row',children:['total','cats','status']},
        {id:'total',component:'Card',child:'totalValue'},
        {id:'totalValue',component:'Column',children:['totalLabel','totalNumber']},
        {id:'totalLabel',component:'Text',text:'COMANDOS',variant:'caption'},
        {id:'totalNumber',component:'Text',text:String(totalCmds),variant:'h2'},
        {id:'cats',component:'Card',child:'catsValue'},
        {id:'catsValue',component:'Column',children:['catsLabel','catsNumber']},
        {id:'catsLabel',component:'Text',text:'CATEGORÍAS',variant:'caption'},
        {id:'catsNumber',component:'Text',text:String(categoryNames.length),variant:'h2'},
        {id:'status',component:'Card',child:'statusValue'},
        {id:'statusValue',component:'Column',children:['statusLabel','statusNumber']},
        {id:'statusLabel',component:'Text',text:'ESTADO',variant:'caption'},
        {id:'statusNumber',component:'Text',text:'ONLINE',variant:'h2'},
        {id:'divider',component:'Divider'},
        {id:'directoryTitle',component:'Text',text:'DIRECTORIO DE COMANDOS',variant:'h3'},
        {id:'directory',component:'Text',text:directory.slice(0, 4000) || 'No hay comandos',variant:'body'},
        {id:'footerDivider',component:'Divider'},
        {id:'footerTitle',component:'Text',text:'𝙼𝙰𝙳𝙰𝚁𝙰 𝙰𝙿𝙴𝚇 • COMMAND CENTER',variant:'h4'},
        {id:'footerInfo',component:'Text',text:`Sistema activo · ${totalCmds} comandos · ID ${uuid.slice(0,8)}`,variant:'caption'},
        {id:'btnRow',component:'Row',justify:'spaceEvenly',children:['btn1','btn2']},
        {id:'btn1Label',component:'Text',text:'1st-Channel'},
        {id:'btn1',component:'Button',child:'btn1Label',variant:'primary',action:{call:'openUrl',args:{url:this.CHANNEL_URL}}},
        {id:'btn2Label',component:'Text',text:'2nd-Channel'},
        {id:'btn2',component:'Button',child:'btn2Label',variant:'primary',action:{call:'openUrl',args:{url:this.CHANNEL2_URL}}},
      ];

      const widget = {
        uuid,
        type:'im_a2ui',
        data:JSON.stringify({
          version:'v0.9',
          createSurface:{
            surfaceId,
            catalogId:'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json',
            sendDataModel:true,
            components
          }
        }),
        fallback:'𝙼𝙰𝙳𝙰𝚁𝙰 𝙰𝙿𝙴𝚇 | COMMAND CENTER',
        responseId: crypto.randomUUID().replace(/-/g,'')
      };

      return { IMAGE_URL:this.MENU_IMAGE_URL, widget, sections, totalCmds, categoriesCount: categoryNames.length, footerText:`𝙼𝙰𝙳𝙰𝚁𝙰 𝙰𝙿𝙴𝚇 | ${totalCmds} Plugins` };
    }catch(e){ 
      console.log(e);
      return { IMAGE_URL:this.MENU_IMAGE_URL, widget:{uuid:crypto.randomUUID(),type:'im_a2ui',data:JSON.stringify({version:"v0.9",createSurface:{surfaceId:"fb",catalogId:"https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json",components:[{id:"root",component:"Column",children:["t"]},{id:"t",component:"Text",text:"𝙼𝙰𝙳𝙰𝚁𝙰 𝙰𝙿𝙴𝚇"}]}}),fallback:"APEX"}, sections:[{title:"MENU",rows:[{title:".menu",id:"menu"}]}], totalCmds:1, footerText:"𝙼𝙰𝙳𝙰𝚁𝙰 𝙰𝙿𝙴𝚇" }; 
    }
  },

  async render(sock, msg, args, skinId, ctx){
    const { generateWAMessageFromContent, prepareWAMessageMedia, isJidGroup } = require('@itsliaaa/baileys');
    const from = (ctx && ctx.from) || (msg && (msg.chat || msg.key.remoteJid)) || '';
    let extra = {}; try{ const loader=require('../../lib/loader'); const cats=loader.getCategories(); if(cats instanceof Map) extra={categoriesMap:cats}; else extra={grouped:cats}; }catch{}
    const out = this.buildMadaraDesign(null,null,extra);
    const { imageMessage } = await prepareWAMessageMedia({ image:{ url: out.IMAGE_URL } }, { upload: sock.waUploadToServer.bind(sock) });

    const buttons = out.sections.map(sec => ({
      name: "single_select",
      buttonParamsJson: JSON.stringify({ title: sec.title, sections: [sec] })
    }));

    const responseId = out.widget.responseId || crypto.randomUUID().replace(/-/g,'');

    const content = {
      messageContextInfo:{messageSecret:crypto.randomBytes(32)},
      interactiveMessage:{
        header:{ imageMessage, hasMediaAttachment:true },
        body:{ text:`TV.Z | ${out.totalCmds} PLUGINS` },
        footer:{ text:out.footerText },
        nativeFlowMessage:{ buttons, messageParamsJson:'{}', messageVersion:1 },
        bloksWidget: out.widget,
        contextInfo:{
          isForwarded:true,
          forwardingScore:1,
          forwardedAiBotMessageInfo:{ botJid:"867051314767696@bot" },
          forwardOrigin:"META_AI",
          botMessageSharingInfo:{ botEntryPointOrigin:"FAVICON", forwardScore:1 }
        }
      }
    };

    const waMsg = generateWAMessageFromContent(from, content, {userJid:sock.user.id, raw:true, quoted:msg});
    const additionalNodes = [
      ...(!isJidGroup(from)?[{tag:'bot',attrs:{biz_bot:'1'}}]:[]),
      {tag:'biz',attrs:{actual_actors:'2',host_storage:'2',privacy_mode_ts:String(Math.floor(Date.now()/1000))},content:[
        {tag:'interactive',attrs:{type:'native_flow',v:'1'},content:[{tag:'native_flow',attrs:{v:'9',name:'mixed'}}]},
        {tag:'quality_control',attrs:{decision_id:responseId,source_type:'third_party'},content:[{tag:'decision_source',attrs:{value:'df'}}]}
      ]}
    ];
    await sock.relayMessage(from, waMsg.message, {messageId:waMsg.key.id, additionalNodes});
  }
};