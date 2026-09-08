#!/usr/bin/env python3
"""FASE 31 (server) — +8 missoes + bots cumprem + recompensa x era + timeline + missionIdx."""
import io
P = '/home/user/presidente-online/server.js'
h = io.open(P, encoding='utf-8').read()
ok = []

a = "  { id: 'treinar_3',   desc: 'Treine o exército 3 vezes',                reward: 400, check: p => p.stats.treinos >= 3 },\n];"
assert h.count(a) == 1, 'aj1 %d' % h.count(a)
h = h.replace(a, """  { id: 'treinar_3',   desc: 'Treine o exército 3 vezes',                reward: 400, check: p => p.stats.treinos >= 3 },
  { id: 'fe_15',      desc: 'Alcance 15 de fé',                       reward: 500, check: p => (p.fe || 0) >= 15 },
  { id: 'doc_15',     desc: 'Alcance 15 de doutrina',                 reward: 500, check: p => (p.influencia || 0) >= 15 },
  { id: 'rede_3',     desc: 'Tenha 3 agentes secretos',               reward: 550, check: p => (p.espioes || 0) >= 3 },
  { id: 'nuke_2',     desc: 'Chegue ao Nv 2 nuclear',                 reward: 600, check: p => (p.nuclear || 0) >= 2 },
  { id: 'abrigo_1',   desc: 'Construa abrigos nucleares',             reward: 450, check: p => !!p.abrigo },
  { id: 'aliados_2',  desc: 'Tenha 2 aliados',                        reward: 550, check: p => (p.allies || []).length >= 2 },
  { id: 'tech_5',     desc: 'Domine 5 tecnologias',                   reward: 600, check: p => (p.techs || []).length >= 5 },
  { id: 'titulo_1',   desc: 'Ganhe 1 título semanal',                 reward: 500, check: p => (p.stats.titulos || 0) >= 1 },
];""")
ok.append('AJ1 missoes novas')

a = '    const hero = room.players.find(p => p.alive && !p.bot && mNow.check(p));'
assert h.count(a) == 1, 'aj2 %d' % h.count(a)
h = h.replace(a, '    const hero = room.players.find(p => p.alive && mNow.check(p));')
ok.append('AJ2 bots cumprem')

a = '      hero.money += mNow.reward; hero.aprov = Math.min(100, hero.aprov + 3); hero.xp += 10;'
assert h.count(a) == 1, 'aj3 %d' % h.count(a)
h = h.replace(a, '      const rw = mNow.reward * (room.era || 1); hero.money += rw; hero.aprov = Math.min(100, hero.aprov + 3); hero.xp = (hero.xp || 0) + 10;')
ok.append('AJ3 recompensa era')

a = '      log(room, `🏆 MISSÃO CUMPRIDA por ${cname(hero)}: ${mNow.desc} (+$${mNow.reward}, +3 aprovação)!`);'
assert h.count(a) == 1, 'aj4 %d' % h.count(a)
h = h.replace(a, '      log(room, `🏆 MISSÃO CUMPRIDA por ${cname(hero)}: ${mNow.desc} (+$${rw}, +3 aprovação)!`); record(room, `🏆 ${cname(hero)} cumpriu: ${mNow.desc}.`);')
ok.append('AJ4 log+timeline')

a = 'mission: MISSIONS[room.missionIdx % MISSIONS.length]'
assert h.count(a) == 1, 'aj5 %d' % h.count(a)
h = h.replace(a, a + ', missionIdx: room.missionIdx')
ok.append('AJ5 snapshot idx')

io.open(P, 'w', encoding='utf-8').write(h)
print('== SERVER ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH SERVER FASE31 OK')
