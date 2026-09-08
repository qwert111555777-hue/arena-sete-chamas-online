#!/usr/bin/env python3
"""FASE 20 (server) — contadores p/ conquistas + IA que cresce de verdade.
V1: vitorias defensivas contam + incremento seguro. V2: stats.anexacoes/ajuda.
V3/V4: incrementos em anexar/ajudar. V5: bots investem eco, mil cap 12→18, pesquisam, aprovam leis."""
import io
P = '/home/user/presidente-online/server.js'
h = io.open(P, encoding='utf-8').read()
ok = []

a = 'atk.stats.vitorias++; atk.xp += 15;'
assert h.count(a) == 1, 'v1a %d' % h.count(a)
h = h.replace(a, 'atk.stats.vitorias = (atk.stats.vitorias || 0) + 1; atk.xp += 15;')
ok.append('V1a atk seguro')

a = "b.resultado = { vencedor: 'def', loot: 0, provincia: null };"
assert h.count(a) == 1, 'v1b %d' % h.count(a)
h = h.replace(a, "def.stats.vitorias = (def.stats.vitorias || 0) + 1; def.xp += 10;\n    " + a)
ok.append('V1b def conta')

a = 'stats: { construidas: 0, vendidas: 0, vitorias: 0, presentes: 0, treinos: 0 }'
assert h.count(a) == 2, 'v2 %d' % h.count(a)
h = h.replace(a, 'stats: { construidas: 0, vendidas: 0, vitorias: 0, presentes: 0, treinos: 0, anexacoes: 0, ajuda: 0 }')
ok.append('V2 stats novos x2')

a = 'target.eliminatedReason = `Anexada por acordo diplomático por ${cname(p)}`;'
assert h.count(a) == 1, 'v3 %d' % h.count(a)
h = h.replace(a, a + '\n        p.stats.anexacoes = (p.stats.anexacoes || 0) + 1;')
ok.append('V3 anexacoes++')

a = 'target.money += 200; p.aprov = Math.min(100, p.aprov + 2);'
assert h.count(a) == 1, 'v4 %d' % h.count(a)
h = h.replace(a, a + ' p.stats.ajuda = (p.stats.ajuda || 0) + 1;')
ok.append('V4 ajuda++')

a = 'b.money > 1200 && b.mil < 12'
assert h.count(a) == 1, 'v5a %d' % h.count(a)
h = h.replace(a, 'b.money > 1200 && b.mil < 18')
ok.append('V5a mil cap 18')

a = '    for (const pr of room.proposals.filter(x => x.to === b.id)) {'
assert h.count(a) == 1, 'v5b %d' % h.count(a)
add = """    // crescimento da IA (Fase 20): bots evoluem eco/tech/leis como gente
    if (b.money > 2000 && room.turn % 5 === 0 && b.eco < 40) { b.money -= 500; b.eco += 1; }
    if (b.money > 1500 && room.turn % 6 === 0) { const _tk = Object.keys(TECHS)[(room.turn + b.id.length) % Object.keys(TECHS).length]; b.techLv = b.techLv || {}; if ((b.techLv[_tk] || 0) < 3) { b.techLv[_tk]++; b.money -= 200; } }
    if (b.money > 3000 && room.turn % 7 === 0 && (b.leis || []).length < 6) { b.leis = b.leis || []; const _lk = Object.keys(LEIS).find(k => !b.leis.includes(k)); if (_lk) { b.leis.push(_lk); b.money -= LEIS[_lk].cost; } }
""" + a
h = h.replace(a, add)
ok.append('V5b bots crescem')

io.open(P, 'w', encoding='utf-8').write(h)
print('== SERVER ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH SERVER FASE20 OK')
