#!/usr/bin/env python3
"""FASE 9: telas MA3 de LEIS e DIPLOMACIA (botoes na toolbar).
So cliente (server.js intocado). Uso: python3 patch_fase9.py (a partir de /home/user/presidente-online)"""
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

h = rep(h, '    <button id="btn-war" title="Exército e guerras">⚔️</button>',
"""    <button id="btn-war" title="Exército e guerras">⚔️</button>
    <button id="btn-leis" title="Leis nacionais">📜</button>
    <button id="btn-dip" title="Diplomacia">🤝</button>""", 'D1 botoes hud')
h = rep(h, "#btn-pause,#btn-speed2,#btn-endturn,#btn-rank,#btn-news,#btn-notif,#btn-build,#btn-tech,#btn-war{",
           "#btn-pause,#btn-speed2,#btn-endturn,#btn-rank,#btn-news,#btn-notif,#btn-build,#btn-tech,#btn-war,#btn-leis,#btn-dip{", 'D2 estilo botoes')
h = rep(h, "['btn-rank','btn-news','btn-notif','btn-tax','btn-stats','btn-miss','btn-orc','btn-rel','btn-build','btn-tech','btn-war']",
           "['btn-rank','btn-news','btn-notif','btn-tax','btn-stats','btn-miss','btn-orc','btn-rel','btn-build','btn-tech','btn-war','btn-leis','btn-dip']", 'D3 move toolbar')
h = rep(h, "$('btn-tech').onclick = () => {",
"""$('btn-leis').onclick = () => {
  const m = me(); if (!m || !state) return;
  const LEIS_UI = [['servico_militar','🪖 Serviço Militar Obrigatório','+5% ataque em guerras',150],['guarda_nacional','🛡️ Guarda Nacional','+5% defesa',160],['reforma_agraria','🌾 Reforma Agrária','+$10/semana',200],['abertura_comercial','💼 Abertura Comercial','+$10/semana',180],['liberdade_imprensa','📰 Liberdade de Imprensa','+3 aprovação',120],['campanha_patriotica','🎖️ Campanha Patriótica','+4 aprovação',100]];
  const ov = document.createElement('div'); ov.id='newspaper';
  ov.innerHTML = '<div class="paper" style="width:min(560px,92vw)"><h1 style="font-size:20px">📜 LEIS NACIONAIS</h1><div style="font-size:11px;text-align:center;margin-bottom:8px;color:#6b5a33">Cada lei custa 1⚡ + dinheiro · vale para sempre</div>'
  + LEIS_UI.map(([k,nm,desc,cost])=>{ const on=(m.leis||[]).includes(k); const ok=!on&&m.ap>=1&&m.money>=cost;
    return '<div style="background:#fff8e6;border:2px solid '+(on?'#2e7d32':'#c9b98b')+';border-radius:8px;padding:8px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px"><div style="flex:1"><b style="font-size:13px">'+nm+'</b><div style="font-size:11px;color:#6b5a33">'+desc+'</div></div><button data-lei="'+k+'" style="padding:8px 12px;cursor:pointer;white-space:nowrap" '+(ok?'':'disabled')+'>'+(on?'✓ Ativa':'$'+cost)+'</button></div>'; }).join('')
  + '<div style="text-align:center;margin-top:10px"><button id="le-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
  document.body.appendChild(ov);
  ov.querySelectorAll('[data-lei]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'lei',value:b.dataset.lei}); b.disabled=true; b.textContent='✓ Ativa'; b.closest('div[style]').style.borderColor='#2e7d32'; });
  ov.querySelector('#le-x').onclick=()=>ov.remove();
  ov.onclick = e => { if (e.target===ov) ov.remove(); };
};
$('btn-dip').onclick = () => {
  const m = me(); if (!m || !state) return;
  let fDip = 'todos';
  const ov = document.createElement('div'); ov.id='newspaper';
  const esc = s => String(s==null?'':s).replace(/[<>&]/g,'');
  const render = () => {
    const others = state.players.filter(p=>p.alive && p.id!==myId && p.country);
    const rel = p => (m.relations && m.relations[p.id]!=null) ? m.relations[p.id] : 50;
    const status = p => m.allies.includes(p.id) ? '🤝 Aliado' : m.wars.includes(p.id) ? '⚔️ Guerra' : (m.trades.includes(p.id) ? '💼 Comércio' : '🕊️ Paz');
    let list = others.slice().sort((a,b)=>rel(a)-rel(b));
    if (fDip==='guerra') list = list.filter(p=>m.wars.includes(p.id));
    if (fDip==='aliados') list = list.filter(p=>m.allies.includes(p.id));
    if (fDip==='comercio') list = list.filter(p=>m.trades.includes(p.id));
    const tab = (id,lb) => '<button data-fdip="'+id+'" style="flex:1;padding:6px 4px;cursor:pointer;font-size:12px;font-weight:800;border-radius:6px;border:2px solid '+(fDip===id?'#2e7d32':'#8a6a1f')+';background:'+(fDip===id?'#e8f5e9':'#fff8e6')+';color:#2b2416">'+lb+'</button>';
    ov.innerHTML = '<div class="paper" style="width:min(640px,94vw)"><h1 style="font-size:20px">🤝 DIPLOMACIA</h1>'
    + '<div style="display:flex;gap:6px;margin-bottom:8px">'+tab('todos','🌍 Todos')+tab('guerra','⚔️ Guerra')+tab('aliados','🤝 Aliados')+tab('comercio','💼 Comércio')+'</div>'
    + '<div>'+list.map(p=>{ const r=rel(p); const atWar=m.wars.includes(p.id); const ally=m.allies.includes(p.id);
      const col = r>=70?'#2e7d32':(r>=40?'#8a6a1f':'#a33');
      return '<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:7px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px">'
      + '<div style="flex:1;min-width:0"><b style="font-size:13px">'+esc(cname(p))+'</b> <small style="color:#6b5a33">'+status(p)+'</small>'
      + '<div style="height:8px;background:#d9c795;border-radius:4px;margin-top:4px"><div style="height:8px;width:'+Math.max(0,Math.min(100,r))+'%;background:'+col+';border-radius:4px"></div></div></div>'
      + '<span style="font-size:11px;font-weight:800;color:'+col+'">'+r+'</span>'
      + '<button data-gift="'+p.id+'" title="Presente $100 (+8)" style="padding:6px 8px;cursor:pointer" '+((!atWar&&m.ap>=1&&m.money>=100)?'':'disabled')+'>🎁</button>'
      + (atWar?'<button data-mkpaz="'+p.id+'" title="Propor paz" style="padding:6px 8px;cursor:pointer">🕊️</button>':(!ally?'<button data-mkali="'+p.id+'" title="Propor aliança" style="padding:6px 8px;cursor:pointer">🤝</button>':''))
      + '</div>'; }).join('')+'</div>'
    + '<div style="text-align:center;margin-top:10px"><button id="dp-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
    ov.querySelectorAll('[data-fdip]').forEach(b=>b.onclick=()=>{fDip=b.dataset.fdip;render();});
    ov.querySelectorAll('[data-gift]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'presente',target:b.dataset.gift}); b.disabled=true; });
    ov.querySelectorAll('[data-mkpaz]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'paz',target:b.dataset.mkpaz}); b.disabled=true; });
    ov.querySelectorAll('[data-mkali]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'alianca',target:b.dataset.mkali}); b.disabled=true; });
    ov.querySelector('#dp-x').onclick=()=>ov.remove();
  };
  render();
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target===ov) ov.remove(); };
};
$('btn-tech').onclick = () => {""", 'D4 telas leis+dip')

if fails:
    print('\nFALHAS:'); [print(' -', f) for f in fails]; sys.exit(1)
io.open(IDX, 'w', encoding='utf-8').write(h)
print('\nPATCH FASE9 OK (server.js intocado)')
