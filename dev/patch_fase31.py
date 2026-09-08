#!/usr/bin/env python3
'''FASE 31 (cliente) - 8 missoes no painel + progresso x era.'''
import io
P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = "['treinar_3','🪖','Treine o exército 3 vezes',400]];"
assert h.count(a) == 1, 'ak1 %d' % h.count(a)
h = h.replace(a, "['treinar_3','🪖','Treine o exército 3 vezes',400],['fe_15','🛐','Alcance 15 de fé',500],['doc_15','🗽','Alcance 15 de doutrina',500],['rede_3','🕵️','Tenha 3 agentes',550],['nuke_2','☢️','Nv 2 nuclear',600],['abrigo_1','🛡️','Construa abrigos',450],['aliados_2','🤝','Tenha 2 aliados',550],['tech_5','🔬','Domine 5 tecnologias',600],['titulo_1','👑','Ganhe 1 título',500]];")
ok.append('AK1 missoes painel')

a = 'MISSÕES DO PRESIDENTE</h1>'
assert h.count(a) == 1, 'ak2 %d' % h.count(a)
h = h.replace(a, a + '''<div style="text-align:center;font-size:11px;color:#6b5a33">Missão '+((state.missionIdx||0)+1)+' de '+MS.length+' · Recompensa ×'+(state.era||1)+' (era atual)</div>''')
ok.append('AK2 progresso')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE31 OK')
