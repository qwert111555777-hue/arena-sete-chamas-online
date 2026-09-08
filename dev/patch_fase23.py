#!/usr/bin/env python3
"""FASE 23 (cliente) — modal FE: fix labels + sua fe (barra 60, conversoes, templo) + missoes."""
import io
P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = """const R = {islamismo:'X Islamismo'"""
i0 = h.index('  const R = {islamismo:')
i1 = h.index('};', i0) + 2
assert 'Juda' in h[i0:i1], 'R alvo nao achado'
h = h[:i0] + "  const R = {laico:'Estado Laico', cristao:'Crista', muculmano:'Islamica', budista:'Budista', hindu:'Hindu'};" + h[i1:]
ok.append('T1 labels certas')

a = 'NO MUNDO</h1>'
assert h.count(a) == 1, 't3 %d' % h.count(a)
h = h.replace(a, a + '<img src="headers/templo.jpg">')
ok.append('T3 marker')

# header img com estilo: troca o marcador simples pelo completo
a = '<img src="headers/templo.jpg">'
assert h.count(a) == 1
h = h.replace(a, '<img src=\\' + chr(34) + 'headers/templo.jpg' + chr(34) + ' style=' + chr(34) + 'width:100%;height:100px;object-fit:cover;border-radius:8px;border:2px solid #8a6a1f;margin-bottom:8px' + chr(34) + '>')
ok.append('T3b estilo')

a = """<button id="rl-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';"""
assert h.count(a) == 1, 't2 %d' % h.count(a)
Q = chr(34)
sec = ("""    + '<div class="stat-h">Sua fe</div><div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:8px 10px;margin-bottom:6px"><div style="font-size:12px">Fe: <b>' + Math.round(m.fe||0) + '/60</b> (marco: hegemonia religiosa) · Conversoes: <b>' + ((m.stats&&m.stats.conversoes)||0) + '</b></div><div style="background:#d8cba0;border:1px solid #8a6a1f;border-radius:4px;height:12px;margin:4px 0"><div style="width:' + Math.min(100,Math.round((m.fe||0)/60*100)) + '%;height:100%;background:#7b1fa2;border-radius:3px"></div></div><button id="rl-templo" style="padding:6px 12px;cursor:pointer" ' + ((m.ap>=1&&m.money>=200)?'':'disabled') + '>Erguer templo (1AP + $200)</button></div>'\n"""
+ """    + '<div class="stat-h">Enviar missionarios (1AP + $300)</div>' + state.players.filter(o=>o.alive&&o.id!==m.id&&o.religion!==m.religion).map(o=>'<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:6px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px"><div style="flex:1;font-size:12px"><b>' + o.name + '</b> <span style="color:#6b5a33">' + (R[o.religion]||o.religion||'?') + '</span></div><button data-miss=' + o.id + ' style="padding:6px 10px;cursor:pointer" ' + ((!m.religion||m.religion==='laico'||m.ap<1||m.money<300)?'disabled':'') + '>Enviar</button></div>').join('')\n""")
h = h.replace(a, sec + a)
ok.append('T2 secoes')

a = """ov.onclick = e => { if (e.target===ov || e.target.id==='rl-x') ov.remove(); };"""
assert h.count(a) == 1, 't4 %d' % h.count(a)
wire = a + "\n  const tp = ov.querySelector('#rl-templo'); if (tp) tp.onclick = () => { send({t:'action',action:'templo'}); tp.disabled = true; };\n  ov.querySelectorAll('[data-miss]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'espalhar_religiao',target:b.dataset.miss}); b.disabled=true; });"
h = h.replace(a, wire)
ok.append('T4 botoes')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE23 OK')
