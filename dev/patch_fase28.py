#!/usr/bin/env python3
'''FASE 28 (cliente) - rank: +fe/doutrina + coroa #1 + hint premios.'''
import io
P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = ", inds, v=>v]];"
assert h.count(a) == 1, 'ae1 %d' % h.count(a)
h = h.replace(a, ", inds, v=>v], ['Fe', p=>p.fe||0, v=>v], ['Doutrina', p=>p.influencia||0, v=>v]];")
ok.append('AE1 categorias')

a = "    top.forEach(p => { html += '<li'"
assert h.count(a) == 1, 'ae2a %d' % h.count(a)
h = h.replace(a, "    top.forEach((p, ix) => { html += '<li'")
ok.append('AE2a indice')

a = ">'+cname(p)+' — '+fm(fn(p))+'</li>'; });"
assert h.count(a) == 1, 'ae2b %d' % h.count(a)
h = h.replace(a, ">'+(ix===0?'👑 ':'')+cname(p)+' — '+fm(fn(p))+'</li>'; });")
ok.append('AE2b coroa')

i = h.index("Ranking Mundial</h3>';")
assert h.count("Ranking Mundial</h3>';") == 1, 'ae3'
j = h.index(chr(10), i)
h = h[:j] + chr(10) + '''  html += '<div style="font-size:11px;color:#6b5a33">Premios semanais: o lider de cada categoria ganha bonus + 1 titulo.</div>';''' + h[j:]
ok.append('AE3 hint')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE28 OK')
