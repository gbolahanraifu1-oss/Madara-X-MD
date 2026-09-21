'use strict';
const fs2=require('fs');
const path=require('path');
function loadDesigns(){
 const designs={};
 const dir=path.join(__dirname,'../assets/designs');
 if(!fs2.existsSync(dir)) return {default:{TITLE:'Default Menu',title:'Default Menu',desc:'default',filePath:''}};
 fs2.readdirSync(dir).forEach(f=>{
 if(!f.endsWith('.js')) return;
 const key=f.replace('.js','').toLowerCase();
 try{
 const fp=path.join(dir,f);
 delete require.cache[require.resolve(fp)];
 const mod=require(fp);
 designs[key]={TITLE:mod.TITLE||key,title:mod.TITLE||key,desc:mod.DESC||key,filePath:fp};
 }catch(e){
 designs[key]={TITLE:key,title:key,desc:key,filePath:path.join(dir,f)};
 }
 });
 designs['default']={TITLE:'Default Menu',title:'Default Menu',desc:'default',filePath:''};
 return designs;
}
module.exports={loadDesigns};
