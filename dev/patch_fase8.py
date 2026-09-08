#!/usr/bin/env python3
"""FASE 8: telas MA3 de TECNOLOGIAS e EXERCITO/GUERRAS (botoes na toolbar).
So cliente (server.js intocado). Uso: python3 patch_fase8.py (a partir de /home/user/presidente-online)"""
import io, sys

IDX = 'public/index.html'
fails = []

def rep(buf, old, new, tag):
    if buf.count(old) != 1:
        fails.append(f'{tag}: achou {buf.count(old)}x')
        return buf
    print(f'  ok {tag}')
    return buf.replace(old, new)

h = io.open(IDX, encoding='utf-8').read()
print('== CLIENTE ==')

h = rep(h, '    <button id="btn-build" title="Construir (suas construções)">🏗️</button>',
"""    <button id="btn-build" title="Construir (suas construções)">🏗️</button>
    <button id="btn-tech" title="Pesquisas e tecnologias">🔬</button>
    <button id="btn-war" title="Exército e guerras">⚔️</button>""", 'T1 botoes hud')
h = rep(h, "#btn-pause,#btn-speed2,#btn-endturn,#btn-rank,#btn-news,#btn-notif,#btn-build{",
           "#btn-pause,#btn-speed2,#btn-endturn,#btn-rank,#btn-news,#btn-notif,#btn-build,#btn-tech,#btn-war{", 'T2 estilo botoes')
h = rep(h, "['btn-rank','btn-news','btn-notif','btn-tax','btn-stats','btn-miss','btn-orc','btn-rel','btn-build']",
           "['btn-rank','btn-news','btn-notif','btn-tax','btn-stats','btn-miss','btn-orc','btn-rel','btn-build','btn-tech','btn-war']", 'T3 move toolbar')
h = rep(h, "$('btn-stats').onclick = () => {",
"""$('btn-tech').onclick = () => {
  const m = me(); if (!m || !state) return;
  let tAba = window.techAba || 'ec';
  const ov = document.createElement('div'); ov.id='newspaper';
  const render = () => {
    const chaves = Object.keys(TECHS).filter(k=>TECHS[k][0]===tAba);
    ov.innerHTML = '<div class="paper" style="width:min(620px,94vw)"><h1 style="font-size:20px">🔬 PESQUISAS</h1>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">' + TECH_TREES.map(([id,rot])=>'<button data-tree="'+id+'" style="flex:1;padding:6px 4px;cursor:pointer;font-size:12px;font-weight:800;border-radius:6px;border:2px solid '+(tAba===id?'#2e7d32':'#8a6a1f')+';background:'+(tAba===id?'#e8f5e9':'#fff8e6')+';color:#2b2416">'+rot+'</button>').join('') + '</div>'
    + '<div>' + chaves.map(k=>{ const lv = techLv(m,k); const maxed = lv>=TECH_MAX; const cost = maxed?0:TECH_COSTS[lv];
      return '<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:8px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px">'
      + '<div style="flex:1"><b style="font-size:13px">'+TECHS[k][1]+'</b><div style="font-size:11px;color:#6b5a33">'+(TECHS[k][2]||'')+'</div><div class="segs" style="margin-top:4px">'+[0,1,2,3,4].map(i=>'<span class="seg'+(i<lv?' on':'')+'"></span>').join('')+'</div></div>'
      + '<button data-tres="'+k+'" style="padding:8px 12px;cursor:pointer;white-space:nowrap" '+((maxed||m.ap<1||m.money<cost)?'disabled':'')+'>'+(maxed?'✔ MÁX':'Nv '+(lv+1)+' · $'+cost)+'</button></div>'; }).join('') + '</div>'
    + '<div style="text-align:center;margin-top:10px"><button id="tx-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
    ov.querySelectorAll('[data-tree]').forEach(b=>b.onclick=()=>{tAba=b.dataset.tree;render();});
    ov.querySelectorAll('[data-tres]').forEach(b=>b.onclick=()=>{ const k=b.dataset.tres; send({t:'action',action:'tech',value:k}); const lv=techLv(m,k); if(lv<TECH_MAX){ m.techLv=m.techLv||{}; m.techLv[k]=lv+1; } render(); });
    ov.querySelector('#tx-x').onclick=()=>ov.remove();
  };
  render();
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target===ov) ov.remove(); };
};
$('btn-war').onclick = () => {
  const m = me(); if (!m || !state) return;
  const poder = p => p.mil*10 + Object.values(p.units||{}).reduce((a,b)=>a+b,0)*15 + (p.nuclear||0)*20;
  const UNITS = [['infantaria','🪖','Infantaria',200],['blindados','🛡️','Blindados',300],['artilharia','💥','Artilharia',350],['aviacao','✈️','Aviação',400],['submarinos','🌊','Submarinos',450],['frota','⚓','Frota',500],['porta_avioes','🛳️','Porta-aviões',700]];
  const esc = s => String(s==null?'':s).replace(/[<>&]/g,'');
  const wars = (m.wars||[]).map(id=>state.players.find(p=>p.id===id)).filter(Boolean);
  const ov = document.createElement('div'); ov.id='newspaper';
  ov.innerHTML = '<div class="paper" style="width:min(620px,94vw)"><h1 style="font-size:20px">⚔️ EXÉRCITO E GUERRAS</h1>'
  + '<div class="stat-h">🎖️ Seu exército · poder ' + poder(m) + '</div>'
  + UNITS.map(([k,em,lb,cost])=>{ const q=m.units?(m.units[k]||0):0; const maxed=q>=3; const ok=!maxed&&m.ap>=1&&m.money>=cost&&((m.rec&&m.rec.terras_raras||0)>=4);
    return '<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:8px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px"><span style="font-size:22px">'+em+'</span><div style="flex:1"><b style="font-size:13px">'+lb+'</b><div class="segs" style="margin-top:3px">'+[0,1,2].map(i=>'<span class="seg'+(i<q?' on':'')+'"></span>').join('')+'</div></div><button data-rec="'+k+'" title="1⚡ + 4⚙️ terras raras" style="padding:8px 10px;cursor:pointer;white-space:nowrap" '+(ok?'':'disabled')+'>+ $'+cost+'</button></div>'; }).join('')
  + '<div class="stat-h">🔥 Guerras (' + wars.length + ')</div>'
  + (wars.length? wars.map(w=>'<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:8px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px"><div style="flex:1"><b style="font-size:13px">'+esc(cname(w))+'</b><div style="font-size:11px;color:#6b5a33">poder '+poder(w)+' · militar '+w.mil+'</div></div><button data-atk="'+w.id+'" style="padding:8px 10px;cursor:pointer" '+(m.ap>=2?'':'disabled')+'>⚔️ Atacar</button><button data-paz="'+w.id+'" style="padding:8px 10px;cursor:pointer">🕊️ Paz</button></div>').join('') : '<div style="font-size:12px;color:#6b5a33;margin-bottom:6px">Em paz. Declare guerra pelo painel de um país no mapa.</div>')
  + '<div style="text-align:center;margin-top:10px"><button id="wr-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
  document.body.appendChild(ov);
  ov.querySelectorAll('[data-rec]').forEach(b=>b.onclick=()=>{ send({t:'action',action:b.dataset.rec}); b.disabled=true; });
  ov.querySelectorAll('[data-atk]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'atacar',target:b.dataset.atk}); });
  ov.querySelectorAll('[data-paz]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'paz',target:b.dataset.paz}); b.disabled=true; b.textContent='🕊️ Pedida'; });
  ov.querySelector('#wr-x').onclick=()=>ov.remove();
  ov.onclick = e => { if (e.target===ov) ov.remove(); };
};
$('btn-stats').onclick = () => {""", 'T4 telas tech+war')
h = rep(h, "</style>",
"""  .ma3-tools{max-height:calc(100% - 24px);overflow-y:auto;overflow-x:hidden;padding:2px;}
  .ma3-tools::-webkit-scrollbar{width:6px;}
  .ma3-tools::-webkit-scrollbar-thumb{background:#8a6a1f;border-radius:3px;}
</style>""", 'T5 toolbar scroll')

if fails:
    print('\nFALHAS:'); [print(' -', f) for f in fails]; sys.exit(1)
io.open(IDX, 'w', encoding='utf-8').write(h)
print('\nPATCH FASE8 OK (server.js intocado)')
