#!/usr/bin/env python3
"""FASE 18 (cliente) — headers artísticos nos modais spy/nuke/onu/win + hero na home
+ retrato il (43/43!) + botão 🏋️ treino conjunto no dip (só aliado)."""
import io
P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

IMG = '<img src="headers/%s.jpg" style="width:100%%;height:110px;object-fit:cover;border-radius:8px;border:2px solid #8a6a1f;margin-bottom:8px">'
for key, h1 in [('spy', 'OPERAÇÕES SECRETAS</h1>'), ('nuke', 'PROGRAMA NUCLEAR</h1>'),
                ('onu', 'ORGANIZAÇÃO DAS NAÇÕES</h1>'), ('win', 'CAMINHOS DA VITÓRIA</h1>')]:
    assert h.count(h1) == 1, '%s %d' % (key, h.count(h1))
    h = h.replace(h1, h1 + IMG % key)
ok.append('K1 headers modais')

a = '<h1>PRESIDENTE <span>ONLINE</span></h1>'
assert h.count(a) == 1
h = h.replace(a, a + '\n  <img src="headers/home.jpg" style="width:100%;max-width:640px;height:180px;object-fit:cover;border-radius:12px;border:3px solid var(--gold);margin:10px 0">')
ok.append('K2 hero home')

a = "ch:'portraits/ch.jpg' };"
assert h.count(a) == 1
h = h.replace(a, "ch:'portraits/ch.jpg', il:'portraits/il.jpg' };")
ok.append('K3 retrato il (43/43)')

a = ">🤝</button>':'')"
assert h.count(a) == 1, 'tc1 %d' % h.count(a)
h = h.replace(a, a + "\n      + (ally?'<button data-tc=\"'+p.id+'\" title=\"Treino militar conjunto (1⚡ + $200: +1 militar p/ cada, +5 relações)\" style=\"padding:6px 8px;cursor:pointer\" '+((m.ap>=1&&m.money>=200)?'':'disabled')+'>🏋️</button>':'')")
ok.append('K4 botao treino dip')

a = "ov.querySelectorAll('[data-px]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'pacto',target:b.dataset.px}); b.disabled=true; });"
assert h.count(a) == 1, 'tc2 %d' % h.count(a)
h = h.replace(a, a + "\n    ov.querySelectorAll('[data-tc]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'treino_conjunto',target:b.dataset.tc}); b.disabled=true; });")
ok.append('K5 wire treino')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE18 OK')
