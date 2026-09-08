#!/usr/bin/env python3
"""FASE 28 (server) — premios semanais pros lideres (6 cats) + stats.titulos."""
import io
P = '/home/user/presidente-online/server.js'
h = io.open(P, encoding='utf-8').read()
ok = []

a = 'function resolveWeek(room) {'
assert h.count(a) == 1, 'ad1 %d' % h.count(a)
fn = """function premiosSemanais(room) {
  const alive = room.players.filter(p => p.alive);
  if (alive.length < 2) return;
  const poder = p => p.mil * 10 + Object.values(p.units || {}).reduce((a, b) => a + b, 0) * 15 + (p.nuclear || 0) * 20;
  const inds = p => Object.values(p.buildings || {}).reduce((a, b) => a + b, 0) + p.eco;
  const cats = [
    ['maior renda', p => incomeOf(room, p), p => { p.money += 150; }],
    ['maior poder militar', poder, p => { p.mil += 1; }],
    ['maior populacao', p => p.pop, p => { p.aprov = Math.min(100, p.aprov + 2); }],
    ['maior industria', inds, p => { p.money += 100; }],
    ['maior fe', p => p.fe || 0, p => { p.aprov = Math.min(100, p.aprov + 2); }],
    ['maior doutrina', p => p.influencia || 0, p => { p.influencia = Math.min(100, (p.influencia || 0) + 2); }],
  ];
  for (const [nm, f, prize] of cats) {
    const win = alive.slice().sort((x, y) => f(y) - f(x))[0];
    prize(win);
    win.stats.titulos = (win.stats.titulos || 0) + 1;
  }
  const tops = cats.map(([nm, f]) => `${nm}: ${cname(alive.slice().sort((x, y) => f(y) - f(x))[0])}`).join(' | ');
  log(room, `PRÊMIOS SEMANAIS: ${tops}. Líderes recebem bônus + títulos!`);
}

""" + a
h = h.replace(a, fn)
ok.append('AD1 funcao premios')

a = '  if ((room.day - 1) % 56 === 0) eleicoes(room);'
assert h.count(a) == 1, 'ad2 %d' % h.count(a)
h = h.replace(a, a + '\n  premiosSemanais(room);')
ok.append('AD2 tick semanal')

a = 'doutrinacoes: 0 }'
assert h.count(a) == 2, 'ad3 %d' % h.count(a)
h = h.replace(a, 'doutrinacoes: 0, titulos: 0 }')
ok.append('AD3 stats x2')

io.open(P, 'w', encoding='utf-8').write(h)
print('== SERVER ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH SERVER FASE28 OK')
