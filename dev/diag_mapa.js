const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1440,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  // conta quantos requests de bandeira o navegador faz
  let reqFlags=0, reqFalhas=0;
  p.on('request',r=>{ if(/\/flags\/.*\.svg/.test(r.url())) reqFlags++; });
  p.on('requestfailed',r=>{ if(/\/flags\//.test(r.url())) reqFalhas++; });
  p.on('response',async r=>{ if(/\/flags\//.test(r.url()) && r.status()>=400) reqFalhas++; });

  await p.goto(process.env.URL||'http://localhost:3000',{waitUntil:'domcontentloaded'}); await sleep(1800);
  await p.fill('#inp-name','Mapa'); await p.click('#btn-create'); await sleep(3000);
  await p.click('#btn-start'); await sleep(5000);
  await p.evaluate(()=>{const t=document.getElementById('tut'); if(t) t.classList.add('hidden');});
  await sleep(2500);

  console.log('=== CARGA ===');
  console.log('  requests de bandeira SVG :', reqFlags);
  console.log('  falhas (404/erro)        :', reqFalhas);

  console.log('\n=== DOM DO MAPA ===');
  const dom = await p.evaluate(()=>({
    markers: document.querySelectorAll('#map-markers .mk').length,
    imagens: document.querySelectorAll('#map-markers image').length,
    nosTotais: document.querySelectorAll('#map-root *').length,
    leaflet: !!document.querySelector('.leaflet-container'),
    leafTiles: document.querySelectorAll('.leaflet-tile').length,
    svgRoot: !!document.getElementById('map-root'),
  }));
  Object.entries(dom).forEach(([k,v])=>console.log('  '+k.padEnd(12), v));

  console.log('\n=== QUANTO TEMPO LEVA UM REDESENHO ===');
  const t = await p.evaluate(()=>{
    const t0=performance.now(); renderMap(); const t1=performance.now();
    const t2=performance.now(); renderMap(); const t3=performance.now();
    return {primeiro:+(t1-t0).toFixed(1), segundo:+(t3-t2).toFixed(1)};
  });
  console.log('  1o renderMap:', t.primeiro+'ms');
  console.log('  2o renderMap:', t.segundo+'ms');

  console.log('\n=== QUANTAS VEZES REDESENHA EM 10 SEGUNDOS ===');
  const n = await p.evaluate(async ()=>{
    let c=0; const orig=window.renderMap;
    window.renderMap=function(){ c++; return orig.apply(this,arguments); };
    await new Promise(r=>setTimeout(r,10000));
    window.renderMap=orig; return c;
  });
  console.log('  renderMap chamado', n, 'vezes em 10s');

  console.log('\n=== POSICAO DAS BANDEIRAS (sobreposicao) ===');
  const pos = await p.evaluate(()=>{
    const out=[];
    document.querySelectorAll('#map-markers .mk').forEach(mk=>{
      const tr=mk.getAttribute('transform')||'';
      const m=tr.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
      if(m) out.push({x:+m[1], y:+m[2]});
    });
    return out;
  });
  let colisoes=0, pares=[];
  for(let i=0;i<pos.length;i++) for(let j=i+1;j<pos.length;j++){
    const dx=pos[i].x-pos[j].x, dy=pos[i].y-pos[j].y;
    const d=Math.sqrt(dx*dx+dy*dy);
    if(d<18){ colisoes++; if(pares.length<5) pares.push(`(${pos[i].x|0},${pos[i].y|0})x(${pos[j].x|0},${pos[j].y|0}) d=${d.toFixed(1)}`); }
  }
  console.log('  marcadores           :', pos.length);
  console.log('  pares colidindo (<18):', colisoes);
  pares.forEach(x=>console.log('     ', x));

  console.log('\n=== FORA DA AREA VISIVEL? ===');
  const fora = await p.evaluate(()=>{
    const svg=document.getElementById('map-root'); if(!svg) return null;
    const vb=(svg.getAttribute('viewBox')||'').split(/[\s,]+/).map(Number);
    let fora=0, tot=0;
    document.querySelectorAll('#map-markers .mk').forEach(mk=>{
      const m=(mk.getAttribute('transform')||'').match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
      if(!m||vb.length<4) return; tot++;
      const x=+m[1], y=+m[2];
      if(x<vb[0]||x>vb[0]+vb[2]||y<vb[1]||y>vb[1]+vb[3]) fora++;
    });
    return {viewBox:vb, tot, fora};
  });
  console.log('  viewBox:', fora&&fora.viewBox, '| marcadores:', fora&&fora.tot, '| FORA:', fora&&fora.fora);

  console.log('\nerros de pagina:', errs.length?errs.slice(0,3).join(' | '):'nenhum');
  await p.screenshot({path:'/home/user/shots/diag-mapa.png'});
  await b.close();
})().catch(e=>{console.error('FALHOU:',e.message);process.exit(1);});
