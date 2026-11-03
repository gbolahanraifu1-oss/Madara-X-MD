'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  getCategoryMeta,
  resolveCategory,
} = require('../../lib/menuCategories');

module.exports = {
  key: "madara-premium",
  aliases: ["premium","pmenu","cmdcenter","prime"],
  title: "Madara Premium",
  desc: "𝙼𝙰𝙳𝙰𝚁𝙰 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 | 𝚂𝙴𝙻𝙴𝙲𝚃𝙾𝚁",
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
            name: id,
            desc: String(plugin.desc || plugin.description || 'cmd').slice(0,60)
          });
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
      if(!totalCmds){ categories={general:[{name:'menu',desc:'menu'}]}; totalCmds=1; }

      const categoryNames = Object.keys(categories).sort();

      // WIDGET: categories + real command lists (trimmed for widget length)
      const directory = categoryNames.map(cat => {
        const meta = getCategoryMeta(cat, categories);
        const cmds = categories[cat] || [];
        const count = cmds.length;
        const shown = cmds.slice(0, 12).map(c => `│ .${c.name}`).join('\n');
        const more = count > 12 ? `\n│ … +${count - 12} more` : '';
        return `┌─〔 ${meta?.e || '📂'} ${cat.toUpperCase()} · ${count} 〕\n${shown}${more}\n└─`;
      }).join('\n\n');

      // SINGLE SELECT: all 1688 cmds grouped by category
      const sections = [];
      for(const cat of categoryNames){
        const cmds = categories[cat] || [];
        // chunk 10 rows per section (WA limit per section)
        for(let i=0;i<cmds.length;i+=10){
          const slice = cmds.slice(i,i+10);
          const page = Math.floor(i/10)+1;
          const pages = Math.ceil(cmds.length/10);
          sections.push({
            title: pages>1 ? `${cat.toUpperCase()} ${page}/${pages}` : cat.toUpperCase(),
            rows: slice.map(c=>({
              title: `.${c.name}`,
              description: c.desc,
              id: c.name
            }))
          });
        }
      }

      const uuid = crypto.randomUUID();
      const surfaceId = `madara-premium=${uuid}`;
      
      const components = [
        {id:'root',component:'Card',child:'main'},
        {id:'main',component:'Column',children:['brand','version','heading','description','stats','divider','directoryTitle','directory','footerDivider','footerTitle','footerInfo','btnRow']},
        {id:'brand',component:'Text',text:'༺ 𝙼𝙰𝙳𝙰𝚁𝙰 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 ༻',variant:'h2'},
        {id:'version',component:'Text',text:`MADARA X-MD / ${totalCmds} PLUGINS`,variant:'caption'},
        {id:'heading',component:'Text',text:'Command Center',variant:'h3'},
        {id:'description',component:'Text',text:'Full command lists below. Open the selector for every plugin.',variant:'body'},
        {id:'stats',component:'Row',children:['total','cats','status']},
        {id:'total',component:'Card',child:'totalValue'},
        {id:'totalValue',component:'Column',children:['totalLabel','totalNumber']},
        {id:'totalLabel',component:'Text',text:'PLUGINS',variant:'caption'},
        {id:'totalNumber',component:'Text',text:String(totalCmds),variant:'h2'},
        {id:'cats',component:'Card',child:'catsValue'},
        {id:'catsValue',component:'Column',children:['catsLabel','catsNumber']},
        {id:'catsLabel',component:'Text',text:'CATEGORIES',variant:'caption'},
        {id:'catsNumber',component:'Text',text:String(categoryNames.length),variant:'h2'},
        {id:'status',component:'Card',child:'statusValue'},
        {id:'statusValue',component:'Column',children:['statusLabel','statusNumber']},
        {id:'statusLabel',component:'Text',text:'STATUS',variant:'caption'},
        {id:'statusNumber',component:'Text',text:'ONLINE',variant:'h2'},
        {id:'divider',component:'Divider'},
        {id:'directoryTitle',component:'Text',text:'COMMAND DIRECTORY',variant:'h3'},
        {id:'directory',component:'Text',text:directory || 'No categories',variant:'body'},
        {id:'footerDivider',component:'Divider'},
        {id:'footerTitle',component:'Text',text:'𝙼𝙰𝙳𝙰𝚁𝙰 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 • COMMAND CENTER',variant:'h4'},
        {id:'footerInfo',component:'Text',text:`Active · ${totalCmds} plugins · ${categoryNames.length} categories · ID ${uuid.slice(0,8)}`,variant:'caption'},
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
        fallback:'𝙼𝙰𝙳𝙰𝚁𝙰 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 | COMMAND CENTER',
        responseId: crypto.randomUUID().replace(/-/g,'')
      };

      return { IMAGE_URL:this.MENU_IMAGE_URL, widget, sections, totalCmds, categoriesCount: categoryNames.length, footerText:`𝙼𝙰𝙳𝙰𝚁𝙰 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 | ${totalCmds} Plugins` };
    }catch(e){ 
      console.log(e);
      return { IMAGE_URL:this.MENU_IMAGE_URL, widget:{uuid:crypto.randomUUID(),type:'im_a2ui',data:JSON.stringify({version:"v0.9",createSurface:{surfaceId:"fb",catalogId:"https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json",components:[{id:"root",component:"Column",children:["t"]},{id:"t",component:"Text",text:"𝙼𝙰𝙳𝙰𝚁𝙰 𝙿𝚁𝙴𝙼𝙸𝚄𝙼"}]}}),fallback:"PREMIUM",responseId:""}, sections:[{title:"MENU",rows:[{title:".menu",id:"menu"}]}], totalCmds:1, footerText:"𝙼𝙰𝙳𝙰𝚁𝙰 𝙿𝚁𝙴𝙼𝙸𝚄𝙼" }; 
    }
  },

  async render(sock, msg, args, skinId, ctx){
    const { generateWAMessageFromContent, prepareWAMessageMedia, isJidGroup } = require('@itsliaaa/baileys');
    const from = (ctx && ctx.from) || (msg && (msg.chat || msg.key.remoteJid)) || '';
    let extra = {}; try{ const loader=require('../../lib/loader'); const cats=loader.getCategories(); if(cats instanceof Map) extra={categoriesMap:cats}; else extra={grouped:cats}; }catch{}
    const out = this.buildMadaraDesign(null,null,extra);
    const { imageMessage } = await prepareWAMessageMedia({ image:{ url: out.IMAGE_URL } }, { upload: sock.waUploadToServer.bind(sock) });

    const responseId = out.widget.responseId || crypto.randomUUID().replace(/-/g,'');

    // ONE single_select that contains all 1688 cmds (chunked by 10 per section)
    // WhatsApp allows many sections in one button with raw mode
    const buttons = [
      {
        name: "single_select",
        buttonParamsJson: JSON.stringify({
          title: `📂 OPEN MENU (${out.totalCmds})`,
          sections: out.sections
        })
      }
    ];

    const content = {
      messageContextInfo:{messageSecret:crypto.randomBytes(32)},
      interactiveMessage:{
        header:{ imageMessage, hasMediaAttachment:true },
        body:{ text:`༺ 𝙼𝙰𝙳𝙰𝚁𝙰 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 ༻\n${out.totalCmds} Plugins | ${out.categoriesCount} Categories` },
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