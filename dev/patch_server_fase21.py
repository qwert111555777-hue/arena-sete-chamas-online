#!/usr/bin/env python3
"""FASE 21 (server) — 3 novos ministros (ind/pac/esp) + hooks + ELEIÇÕES a cada 56 dias
+ stats.mandatos."""
import io
P = '/home/user/presidente-online/server.js'
h = io.open(P, encoding='utf-8').read()
ok = []

a = "pop: { name: 'Populista', desc: '+1 aprovação/turno, -5% renda' }"
assert h.count(a) == 1, 'n1 %d' % h.count(a)
h = h.replace(a, a + ", ind: { name: 'Industrialista', desc: '+20% renda de prédios' }")
ok.append('N1a min eco')

a = "estr: { name: 'Estrategista', desc: '+10% defesa' }"
assert h.count(a) == 1, 'n2 %d' % h.count(a)
h = h.replace(a, a + ", pac: { name: 'Pacifista', desc: '+2 aprovação/semana, -10% renda' }")
ok.append('N1b min def')

a = "inf: { name: 'Influenciador', desc: '+1 influência/turno' }"
assert h.count(a) == 1, 'n3 %d' % h.count(a)
h = h.replace(a, a + ", esp: { name: 'Mestre-Espião', desc: '+10% sabotagem' }")
ok.append('N1c min dip')

a = 'bldMoney += n * o.money * upM(p, k);'
assert h.count(a) == 1, 'n4 %d' % h.count(a)
h = h.replace(a, "bldMoney += n * o.money * upM(p, k) * (p.ministers.eco === 'ind' ? 1.2 : 1);")
ok.append('N2a hook ind')

a = "  if (p.ministers.eco === 'pop') mult -= 0.05;"
assert h.count(a) == 1, 'n5 %d' % h.count(a)
h = h.replace(a, a + "\n  if (p.ministers.def === 'pac') mult -= 0.10;")
ok.append('N2b hook pac renda')

a = "    if (p.ministers.eco === 'pop') dAprov += 1;"
assert h.count(a) == 1, 'n6 %d' % h.count(a)
h = h.replace(a, a + "\n    if (p.ministers.def === 'pac') dAprov += 2;")
ok.append('N2c hook pac aprov')

a = 'const chance = Math.min(0.85, 0.5 + 0.08 * sAtk);'
assert h.count(a) == 1, 'n7 %d' % h.count(a)
h = h.replace(a, "const chance = Math.min(0.85, 0.5 + 0.08 * sAtk + (p.ministers.dip === 'esp' ? 0.1 : 0));")
ok.append('N2d hook esp')

a = 'if ((room.day - 1) % 28 === 0 && !room.un) openUN(room);'
assert h.count(a) == 1, 'n8 %d' % h.count(a)
h = h.replace(a, a + '\n  if ((room.day - 1) % 56 === 0) eleicoes(room);')
ok.append('N3a tick eleicao')

a = 'function resolveWeek(room) {'
assert h.count(a) == 1, 'n9 %d' % h.count(a)
fn = """function eleicoes(room) {
  for (const p of room.players) {
    if (!p.alive || p.bot) continue;
    p.stats = p.stats || {};
    p.stats.mandatos = p.stats.mandatos || 0;
    if (p.aprov >= 50) { p.stats.mandatos++; p.money += 300; p.aprov = Math.min(100, p.aprov + 3); log(room, `🗳️ ${cname(p)} foi REELEITO com ${Math.round(p.aprov)}% de aprovação! (+$300, +3 ❤️, ${p.stats.mandatos}º mandato)`); }
    else if (p.aprov >= 35) { p.aprov = Math.min(100, p.aprov + 1); log(room, `🗳️ ${cname(p)} vence a eleição no aperto (${Math.round(p.aprov)}%) — a oposição cresce.`); }
    else { p.aprov = Math.max(0, p.aprov - 5); p.emergencyUntil = room.turn + 2; log(room, `🗳️ DERROTA nas urnas para ${cname(p)} (${Math.round(p.aprov)}%)! Protestos tomam as ruas — EMERGÊNCIA.`); }
  }
}

""" + a
h = h.replace(a, fn)
ok.append('N3b fn eleicoes')

a = 'stats: { construidas: 0, vendidas: 0, vitorias: 0, presentes: 0, treinos: 0, anexacoes: 0, ajuda: 0 }'
assert h.count(a) == 2, 'n10 %d' % h.count(a)
h = h.replace(a, a[:-2] + ', mandatos: 0 }')
ok.append('N4 mandatos x2')

io.open(P, 'w', encoding='utf-8').write(h)
print('== SERVER ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH SERVER FASE21 OK')
