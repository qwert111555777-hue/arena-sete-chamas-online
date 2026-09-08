#!/usr/bin/env python3
"""FASE 25 (cliente) — tipo bloqueio no modal + suborno amplo + atalho diplomacia + hint soft power."""
import io
P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = "encerra TODAS as guerras dele)']];"
assert h.count(a) == 1, 'y1 %d' % h.count(a)
h = h.replace(a, "encerra TODAS as guerras dele)'],['bloqueio','🚫 Bloqueio TOTAL (alvo: renda -50%, 3 turnos)']];")
ok.append('Y1 tipo modal')

a = "if (un.proposer===myId && un.type==='autorizar')"
assert h.count(a) == 1, 'y2 %d' % h.count(a)
h = h.replace(a, "if (un.proposer===myId)")
ok.append('Y2 suborno amplo')

a = "     ['condenar','📢 Condenação internacional de '+p.flag],"
assert h.count(a) == 1, 'y3 %d' % h.count(a)
h = h.replace(a, a + "\n     ['bloqueio','🚫 Bloqueio TOTAL da ONU contra '+p.flag],")
ok.append('Y3 atalho diplomacia')

a = '    const podeP = m.ap>=1 && m.money>=300;'
assert h.count(a) == 1, 'y4 %d' % h.count(a)
h = h.replace(a, "    s += '<div style=\"font-size:11px;color:#6b5a33\">🕊️ Soft power: '+((m.influencia||0)>=40?'ATIVO (+1 voto nas suas propostas)':'chegue a 40 de doutrina p/ +1 voto')+'</div>';\n" + a)
ok.append('Y4 hint soft power')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE25 OK')
