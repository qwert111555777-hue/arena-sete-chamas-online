#!/usr/bin/env python3
"""FASE 14 — melhorias nas telas existentes (SÓ CLIENTE, server intocado).
I1 dip: botoes 🏛️ emb / 🚫 sanc / ✍️ pacto por nação.
I2 war: linha 🏋️ treinar + botao ⛴️ bloqueio por guerra.
Contratos: embaixada 1AP+dip(~200)/fechar 1AP; sancao toggle 1AP max3; pacto 1AP+$100 rel40+ 8t;
treinar 1AP+$150 mil+1 max25; bloqueio guerra+frota1+ toggle 1AP."""
import io

P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

# I1a: botoes extras na linha de cada nacao (apos 🎁)
a = ">🎁</button>'"
assert h.count(a) == 1, 'i1a %d' % h.count(a)
add = """>🎁</button>'
      + '<button data-emb="'+p.id+'" title="'+(m.embassies.includes(p.id)?'Fechar embaixada (1⚡, −12 relações)':'Abrir embaixada (1⚡ + ~$200, +10 relações)')+'" style="padding:6px 8px;cursor:pointer;'+(m.embassies.includes(p.id)?'border:2px solid #2e7d32':'')+'" '+((m.embassies.includes(p.id)?(m.ap>=1):(m.ap>=1&&m.money>=100))?'':'disabled')+'>🏛️</button>'
      + '<button data-sc="'+p.id+'" title="'+(m.sanctioning.includes(p.id)?'Suspender sanções':'Impor SANÇÕES (1⚡, −20 relações)')+'" style="padding:6px 8px;cursor:pointer;'+(m.sanctioning.includes(p.id)?'border:2px solid #a33':'')+'" '+(m.ap>=1?'':'disabled')+'>🚫</button>'
      + (!atWar?'<button data-px="'+p.id+'" title="Pacto de não-agressão (1⚡ + $100, relações 40+, 8 turnos)" style="padding:6px 8px;cursor:pointer;'+(((m.pacts&&m.pacts[p.id]>state.turn))?'border:2px solid #2e7d32':'')+'" '+((((m.pacts&&m.pacts[p.id])||0)>state.turn||m.ap<1||m.money<100)?'disabled':'')+'>✍️</button>':'')"""
h = h.replace(a, add)
ok.append('I1a botoes dip')

# I1b: wiring
a = "ov.querySelectorAll('[data-mkali]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'alianca',target:b.dataset.mkali}); b.disabled=true; });"
assert h.count(a) == 1, 'i1b %d' % h.count(a)
add = a + """
    ov.querySelectorAll('[data-emb]').forEach(b=>b.onclick=()=>{ const tem=m.embassies.includes(b.dataset.emb); send({t:'action',action:tem?'fechar_embaixada':'embaixada',target:b.dataset.emb}); b.disabled=true; });
    ov.querySelectorAll('[data-sc]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'sancao',target:b.dataset.sc}); b.disabled=true; });
    ov.querySelectorAll('[data-px]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'pacto',target:b.dataset.px}); b.disabled=true; });"""
h = h.replace(a, add)
ok.append('I1b wire dip')

# I2a: linha treinar apos stat-h exercito
a = "Seu exército · poder ' + poder(m) + '</div>'"
assert h.count(a) == 1, 'i2a %d' % h.count(a)
add = a + """
  + '<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:8px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px"><span style="font-size:22px">🏋️</span><div style="flex:1"><b style="font-size:13px">Treino militar</b><div style="font-size:11px;color:#6b5a33">Poder militar '+m.mil+'/25 · cada treino +1</div></div><button data-trei style="padding:8px 10px;cursor:pointer;white-space:nowrap" '+((m.mil<25&&m.ap>=1&&m.money>=150)?'':'disabled')+'>🏋️ Treinar (1⚡+$150)</button></div>'"""
h = h.replace(a, add)
ok.append('I2a treinar war')

# I2b: botao bloqueio na linha de cada guerra
a = """<button data-atk="'+w.id+'" """
assert h.count(a) == 1, 'i2b %d' % h.count(a)
add = """<button data-blq="'+w.id+'" title="'+(m.blockading.includes(w.id)?'Suspender bloqueio naval':'BLOQUEIO naval: alvo −25% renda (1⚡, exige frota)')+'" style="padding:8px 10px;cursor:pointer;'+(m.blockading.includes(w.id)?'border:2px solid #2e7d32':'')+'" '+(((m.units&&m.units.frota||0)>=1&&m.ap>=1)?'':'disabled')+'>⛴️</button><button data-atk="'+w.id+'" """
h = h.replace(a, add)
ok.append('I2b bloqueio war')

# I2c: wiring
a = "ov.querySelectorAll('[data-atk]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'atacar',target:b.dataset.atk}); });"
assert h.count(a) == 1, 'i2c %d' % h.count(a)
add = a + """
  ov.querySelectorAll('[data-blq]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'bloqueio',target:b.dataset.blq}); b.disabled=true; });
  const tr = ov.querySelector('[data-trei]'); if (tr) tr.onclick=()=>{ send({t:'action',action:'treinar'}); tr.disabled=true; };"""
h = h.replace(a, add)
ok.append('I2c wire war')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE14 OK (server.js intocado)')
