#!/usr/bin/env python3
"""FASE 19 (cliente) — 6 headers (tech/war/laws/dip/space/eco) + tipo manter_paz no modal ONU
+ botão 🛡️ reservas na tela de guerra."""
import io
P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

IMG = '<img src="headers/%s.jpg" style="width:100%%;height:110px;object-fit:cover;border-radius:8px;border:2px solid #8a6a1f;margin-bottom:8px">'
for key, h1 in [('tech', 'PESQUISAS</h1>'), ('war', 'EXÉRCITO E GUERRAS</h1>'),
                ('laws', 'LEIS NACIONAIS</h1>'), ('dip', 'DIPLOMACIA</h1>'),
                ('space', 'PROGRAMA ESPACIAL</h1>'), ('eco', 'ECOLOGIA</h1>')]:
    assert h.count(h1) == 1, '%s %d' % (key, h.count(h1))
    h = h.replace(h1, h1 + IMG % key)
ok.append('L1 headers 6 telas')

a = "['condenar','📢 Condenar nação (alvo, −6 aprovação dele)']"
assert h.count(a) == 1, 'onu1 %d' % h.count(a)
h = h.replace(a, a + ",['manter_paz','🕊️ Missão de paz (alvo: encerra TODAS as guerras dele)']")
ok.append('L2 tipo manter_paz')

a = 'Alvo usado em: autorizar, embargo e condenar.'
assert h.count(a) == 1, 'onu2 %d' % h.count(a)
h = h.replace(a, 'Alvo usado em: autorizar, embargo, condenar e missão de paz.')
ok.append('L3 nota alvo')

a = '🏋️ Treinar (1⚡+$150)</button></div>'
assert h.count(a) == 1, 'res1 %d' % h.count(a)
h = h.replace(a, a + "\n  + '<div style=\"background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:8px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px\"><span style=\"font-size:22px\">🛡️</span><div style=\"flex:1\"><b style=\"font-size:13px\">Reservas de emergência</b><div style=\"font-size:11px;color:#6b5a33\">Convocação geral: +3 militar, −2 aprovação, 1x a cada 14 dias</div></div><button data-res style=\"padding:8px 10px;cursor:pointer;white-space:nowrap\" '+((m.mil<25&&m.ap>=1&&m.money>=300)?'':'disabled')+'>🛡️ Convocar (1⚡+$300)</button></div>'")
ok.append('L4 linha reservas')

a = "const tr = ov.querySelector('[data-trei]'); if (tr) tr.onclick=()=>{ send({t:'action',action:'treinar'}); tr.disabled=true; };"
assert h.count(a) == 1, 'res2 %d' % h.count(a)
h = h.replace(a, a + "\n  const rs = ov.querySelector('[data-res]'); if (rs) rs.onclick=()=>{ send({t:'action',action:'convocar_reservas'}); rs.disabled=true; };")
ok.append('L5 wire reservas')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE19 OK')
