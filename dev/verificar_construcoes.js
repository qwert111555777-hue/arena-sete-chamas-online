const fs=require('fs');
const files=['/home/user/presidente-online/public/index.html','/home/user/presidente-online/server.js'];
const TABLES=['PROD_BUILDS','CONCRETE_NEED','PROD_NAMES','BUILD_TAB','BUILD_OUT'];
function getObj(text,tb){
  const ls=text.split('\n').filter(l=>l.startsWith('const '+tb+' = {'));
  if(ls.length!==1) throw new Error(tb+': '+ls.length+' linhas');
  return eval('('+ls[0].replace(/^const \w+ = /,'').replace(/;$/,'')+')');
}
const D=files.map(f=>{const t=fs.readFileSync(f,'utf8');const o={};TABLES.forEach(tb=>o[tb]=getObj(t,tb));return o;});
let fail=0;
TABLES.forEach(tb=>{const a=Object.keys(D[0][tb]).length,b=Object.keys(D[1][tb]).length;const ok=a===140&&b===140;if(!ok)fail++;console.log(tb,a,'/',b,ok?'OK':'ERRO');});
const dist={};Object.values(D[0].BUILD_TAB).forEach(t=>dist[t]=(dist[t]||0)+1);console.log('por aba:',JSON.stringify(dist));
TABLES.forEach(tb=>{if(JSON.stringify(D[0][tb])!==JSON.stringify(D[1][tb])){console.log('DIFERE:',tb);fail++;}});
if(!fail)console.log('CLIENT == SERVER OK');
const RES=new Set(['madeira','minerio','concreto','borracha','terras_raras','uranio','energia','comida']);
for(const [k,v] of Object.entries(D[0].BUILD_OUT)){
  const ks=Object.keys(v);
  if(ks.length===0)continue;
  const ok=((ks.length===1&&ks[0]==='money'&&typeof v.money==='number')||(ks.length===2&&RES.has(v.res)&&typeof v.qtd==='number'));
  if(!ok){console.log('OUT INVALIDO:',k,JSON.stringify(v));fail++;}
}
console.log(fail===0?'TUDO OK - total 140':'FALHAS: '+fail);
process.exit(fail?1:0);
