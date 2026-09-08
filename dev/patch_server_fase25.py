#!/usr/bin/env python3
"""FASE 25 (server) — bloqueio total + suborno amplo + soft power + bots propoem + reset."""
import io
P = '/home/user/presidente-online/server.js'
h = io.open(P, encoding='utf-8').read()
ok = []

a = "  { id: 'manter_paz',    desc: 'Missão de paz: encerrar todas as guerras de {T}' },"
assert h.count(a) == 1, 'x1 %d' % h.count(a)
h = h.replace(a, a + "\n  { id: 'bloqueio',       desc: 'Bloqueio total contra {T} por 3 turnos (renda -50%)' },")
ok.append('X1 tipo bloqueio')

a = "    if (u.type === 'embargo' && tgt) { room.embargo = { target: tgt.id, until: room.turn + 3 }; log(room, `🇺🇳 A ONU APROVOU embargo econômico contra ${cname(tgt)}!`); }"
assert h.count(a) == 1, 'x2 %d' % h.count(a)
h = h.replace(a, a + "\n    if (u.type === 'bloqueio' && tgt) { room.bloqueio = { target: tgt.id, until: room.turn + 3 }; log(room, `🇺🇳 A ONU APROVOU BLOQUEIO TOTAL contra ${cname(tgt)} (renda -50% por 3 semanas)!`); }")
ok.append('X2 resolve bloqueio')

a = 'if (room.embargo && room.embargo.target === p.id && room.turn < room.embargo.until) mult *= 0.7;'
assert h.count(a) == 1, 'x3 %d' % h.count(a)
h = h.replace(a, a + '\n  if (room.bloqueio && room.bloqueio.target === p.id && room.turn < room.bloqueio.until) mult *= 0.5;')
ok.append('X3 renda -50%')

a = "const precisaAlvo = tipo === 'autorizar' || tipo === 'embargo' || tipo === 'condenar' || tipo === 'manter_paz';"
assert h.count(a) == 1, 'x4 %d' % h.count(a)
h = h.replace(a, "const precisaAlvo = tipo === 'autorizar' || tipo === 'embargo' || tipo === 'condenar' || tipo === 'manter_paz' || tipo === 'bloqueio';")
ok.append('X4 alvo bloqueio')

a = "  if (type.id === 'embargo' || type.id === 'condenar' || type.id === 'manter_paz') target = alive[Math.floor(Math.random() * alive.length)];"
assert h.count(a) == 1, 'x5 %d' % h.count(a)
h = h.replace(a, "  if (type.id === 'embargo' || type.id === 'condenar' || type.id === 'manter_paz' || type.id === 'bloqueio') target = alive[Math.floor(Math.random() * alive.length)];")
ok.append('X5 auto sessao')

a = "      if (!room.un || room.un.type !== 'autorizar' || room.un.proposer !== p.id) { err(p.conn, 'Nenhuma resolução sua em votação.'); return; }"
assert h.count(a) == 1, 'x6 %d' % h.count(a)
h = h.replace(a, "      if (!room.un || room.un.proposer !== p.id) { err(p.conn, 'Nenhuma resolução sua em votação.'); return; }")
ok.append('X6 suborno amplo')

a = '  const yes = Object.values(u.votes).filter(v => v).length;'
assert h.count(a) == 1, 'x7a %d' % h.count(a)
h = h.replace(a, a + '\n  const prop = u.proposer ? room.players.find(pp => pp.id === u.proposer) : null;\n  const bonusVoto = (prop && prop.influencia >= 40) ? 1 : 0;')
ok.append('X7a soft power')

a = '  const passed = yes > no;'
assert h.count(a) == 1, 'x7b %d' % h.count(a)
h = h.replace(a, '  const passed = (yes + bonusVoto) > no;')
ok.append('X7b voto extra')

a = '  if (passed) {'
assert h.count(a) == 1, 'x7c %d' % h.count(a)
h = h.replace(a, '  if (bonusVoto) log(room, `🕊️ Soft power de ${cname(prop)} pesou na votação (+1 voto).`);\n  if (passed) {')
ok.append('X7c anuncio')

a = 'room.un = null; room.noWarUntil = 20; room.noArmsUntil = 0; room.embargo = null;'
assert h.count(a) == 1, 'x8 %d' % h.count(a)
h = h.replace(a, a + ' room.bloqueio = null;')
ok.append('X8 reset')

a = 'espalhou sua ideologia para ${cname(t4)}!`); } } }'
assert h.count(a) == 1, 'x9 %d' % h.count(a)
bot = a + "\n    if (!room.un && Math.random() < 0.12 && b.money > 400) { const foes = room.players.filter(o => o.alive && o !== b && relBetween(b, o) < 35); if (foes.length) { const fe = foes[Math.floor(Math.random() * foes.length)]; const tp2 = Math.random() < 0.5 ? 'condenar' : 'embargo'; b.money -= 300; room.un = { type: tp2, desc: (tp2 === 'condenar' ? 'Condenação internacional de ' : 'Embargo econômico contra ') + cname(fe) + (tp2 === 'condenar' ? ' (-6 aprovação)' : ' por 3 turnos'), target: fe.id, proposer: b.id, votes: {}, deadline: Date.now() + 20000 }; room.un.votes[b.id] = true; for (const bb of room.players) if (bb.bot && bb.alive && bb.id !== b.id) room.un.votes[bb.id] = relBetween(bb, fe) < 50; log(room, `🇺🇳 ${cname(b)} propôs resolução na ONU: ${room.un.desc}. Votação aberta!`); } }"
h = h.replace(a, bot)
ok.append('X9 bots propoem')

io.open(P, 'w', encoding='utf-8').write(h)
print('== SERVER ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH SERVER FASE25 OK')
