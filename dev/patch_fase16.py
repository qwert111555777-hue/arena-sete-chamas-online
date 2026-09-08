#!/usr/bin/env python3
"""FASE 16 (cliente) — telas 🚀 ESPAÇO + 🌍 ECOLOGIA + ranks na vitória + 10 retratos.
Contratos: 'espacial' 2AP+SPACE_COSTS[nv] 12d Nv0-3 (+2 aprov/Nv, +$30/sem Nv3);
pollution no snapshot; 'reflorestar' 1AP+$250 −15."""
import io

P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = '<button id="btn-win" title="Caminhos da vitória">🏆</button>'
assert h.count(a) == 1
h = h.replace(a, a + '\n    <button id="btn-space" title="Programa espacial">🚀</button>\n    <button id="btn-eco" title="Ecologia">🌍</button>')
ok.append('J1 botoes hud')

a = ',#btn-onu,#btn-win'
assert h.count(a) == 1, 'css %d' % h.count(a)
h = h.replace(a, a + ',#btn-space,#btn-eco')
ok.append('J2 estilo')

a = "'btn-onu','btn-win']"
assert h.count(a) == 1, 'move %d' % h.count(a)
h = h.replace(a, "'btn-onu','btn-win','btn-space','btn-eco']")
ok.append('J3 move toolbar')

a = "id:'portraits/id.jpg' };"
assert h.count(a) == 1, 'port %d' % h.count(a)
h = h.replace(a, "id:'portraits/id.jpg', kr:'portraits/kr.jpg', pk:'portraits/pk.jpg', pl:'portraits/pl.jpg', ua:'portraits/ua.jpg', se:'portraits/se.jpg', co:'portraits/co.jpg', cl:'portraits/cl.jpg', pt:'portraits/pt.jpg', nl:'portraits/nl.jpg', be:'portraits/be.jpg' };")
ok.append('J4 retratos +10')

MOD = """$('btn-space').onclick = () => {
  const m = me(); if (!m || !state) return;
  const nv = m.space || 0;
  const prog = (m.builds||[]).filter(b=>b.kind==='espacial');
  const ETAPAS = [['🛰️','Satélite Nacional',500],['🛸','Estação Orbital',800],['🔴','Colônia em Marte',1200]];
  const ov = document.createElement('div'); ov.id='newspaper';
  let s = '<div class="paper" style="width:min(600px,94vw)"><h1 style="font-size:20px">🚀 PROGRAMA ESPACIAL</h1>';
  s += '<div style="font-size:11px;color:#6b5a33;margin-bottom:8px">Cada etapa: 2⚡ + dinheiro, 12 dias · +2 aprovação por etapa · Nv 3 rende +$30/semana.</div>';
  s += ETAPAS.map((e,i)=>{
    const done = i < nv, cur = (i === nv + prog.length) && prog.length>0 && i >= nv;
    const building = prog.length>0 && i===nv;
    const st = done ? '<b style="color:#2e7d32">✓ Concluída</b>' : (building ? '<b style="color:#8a6a1f">⏳ Em construção (pronta dia '+prog[0].untilDay+')</b>' : '<span style="color:#6b5a33">A construir</span>');
    return '<div style="background:#fff8e6;border:2px solid '+(done?'#2e7d32':'#c9b98b')+';border-radius:8px;padding:8px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px"><span style="font-size:26px">'+e[0]+'</span><div style="flex:1"><b style="font-size:13px">Nv '+(i+1)+' — '+e[1]+'</b><div style="font-size:11px;color:#6b5a33">$'+e[2]+' · '+st+'</div></div></div>';
  }).join('');
  const nx = nv + prog.length;
  const pode = nx < 3 && m.ap >= 2 && m.money >= ETAPAS[nx][2];
  s += '<div style="margin:4px 0 6px"><button data-spago style="padding:8px 16px;cursor:pointer" '+(pode?'':'disabled')+'>'+(nx<3?('🚀 Iniciar: '+ETAPAS[nx][1]+' (2⚡ + $'+ETAPAS[nx][2]+', 12 dias)'):'🏆 Programa completo — Marte é nosso!')+'</button></div>';
  s += '<div style="text-align:center;margin-top:6px"><button id="spc-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
  ov.innerHTML = s;
  document.body.appendChild(ov);
  ov.querySelector('#spc-x').onclick=()=>ov.remove();
  ov.onclick = e => { if (e.target===ov) ov.remove(); };
  const go = ov.querySelector('[data-spago]');
  if (go) go.onclick = () => { send({t:'action',action:'espacial'}); ov.remove(); };
};
$('btn-eco').onclick = () => {
  const m = me(); if (!m || !state) return;
  const pol = (m.pollution != null) ? m.pollution : 10;
  const st = pol>=90 ? ['🔴 CRÍTICA','#a33'] : pol>=70 ? ['🟠 ALTA','#b36b00'] : pol>=40 ? ['🟡 MODERADA','#8a6a1f'] : ['🟢 LIMPO','#2e7d32'];
  const ov = document.createElement('div'); ov.id='newspaper';
  let s = '<div class="paper" style="width:min(600px,94vw)"><h1 style="font-size:20px">🌍 ECOLOGIA</h1>';
  s += '<div style="background:#fff8e6;border:2px solid '+st[1]+';border-radius:8px;padding:8px 10px;margin-bottom:8px"><b style="font-size:15px;color:'+st[1]+'">'+st[0]+' — '+Math.round(pol)+'%</b><div style="background:#d8cba0;border:1px solid #8a6a1f;border-radius:4px;height:14px;margin-top:4px"><div style="height:100%;width:'+Math.min(100,Math.round(pol))+'%;background:'+st[1]+';border-radius:3px"></div></div></div>';
  s += '<div style="font-size:12px;color:#2b2416;margin-bottom:8px">🏭 Cada prédio polui +0.3/semana · 🧾 Imposto ambiental 12%+ limpa −2/semana · 💼 Orçamento do meio ambiente 2+ limpa −1.5/semana<br>⚠️ 70%+: aprovação cai · 🔴 90%+: aprovação cai mais + multas diárias.</div>';
  const pode = m.ap>=1 && m.money>=250 && pol>0;
  s += '<div style="margin-bottom:6px"><button data-refl style="padding:8px 16px;cursor:pointer" '+(pode?'':'disabled')+'>🌱 Mutirão de reflorestamento (1⚡ + $250, −15 poluição, +1 aprovação)</button></div>';
  s += '<div style="text-align:center;margin-top:6px"><button id="ec-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
  ov.innerHTML = s;
  document.body.appendChild(ov);
  ov.querySelector('#ec-x').onclick=()=>ov.remove();
  ov.onclick = e => { if (e.target===ov) ov.remove(); };
  const rf = ov.querySelector('[data-refl]');
  if (rf) rf.onclick = () => { send({t:'action',action:'reflorestar'}); ov.remove(); };
};
"""
a = "$('btn-onu').onclick = () => {"
assert h.count(a) == 1
h = h.replace(a, MOD + a)
ok.append('J5 modais espaco+eco')

a = '<button id="wn-x" style="padding:6px 18px;cursor:pointer">Fechar</button>'
assert h.count(a) == 1, 'win %d' % h.count(a)
add = """<div class="stat-h">📊 Sua posição no mundo</div>
  <div id="win-ranks"></div>
  <button id="wn-x" style="padding:6px 18px;cursor:pointer">Fechar</button>"""
h = h.replace(a, add)
a2 = "  ov.innerHTML = s;\n  document.body.appendChild(ov);\n  ov.querySelector('#wn-x').onclick=()=>ov.remove();"
assert h.count(a2) == 1, 'win2 %d' % h.count(a2)
add2 = """  ov.innerHTML = s;
  document.body.appendChild(ov);
  const RK = (f,lb,ic) => { const arr = alive.slice().sort((a,b)=>f(b)-f(a)); const pos = arr.findIndex(p=>p.id===myId)+1; return '<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:6px 10px;margin-bottom:6px;font-size:13px">'+ic+' '+lb+': <b>#'+pos+' de '+arr.length+'</b></div>'; };
  ov.querySelector('#win-ranks').innerHTML = RK(p=>p.dailyIncome||0,'Receita/dia','💵') + RK(p=>p.mil||0,'Poder militar','🪖') + RK(p=>p.pop||0,'População','👥') + RK(p=>p.eco||0,'Indústria (eco)','🏭');
  ov.querySelector('#wn-x').onclick=()=>ov.remove();"""
h = h.replace(a2, add2)
ok.append('J6 ranks vitoria')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE16 OK')
