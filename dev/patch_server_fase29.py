#!/usr/bin/env python3
"""FASE 29 (server) — eras + timeline (record) + hooks marco/eleicao/nuke/inverno."""
import io
P = '/home/user/presidente-online/server.js'
h = io.open(P, encoding='utf-8').read()
ok = []

a = '    un: null, noWarUntil: 0, noArmsUntil: 0, embargo: null, paused: false, pausedRemaining: 0,'
assert h.count(a) == 1, 'af1 %d' % h.count(a)
h = h.replace(a, a + ' era: 1, timeline: [],')
ok.append('AF1 init sala')

a = 'room.un = null; room.noWarUntil = 20; room.noArmsUntil = 0; room.embargo = null; room.bloqueio = null; room.invernoUntil = 0; room.nukesUsed = 0;'
assert h.count(a) == 1, 'af2 %d' % h.count(a)
h = h.replace(a, a + ' room.era = 1; room.timeline = [];')
ok.append('AF2 reset')

a = '    un: room.un, noWarUntil: room.noWarUntil, noArmsUntil: room.noArmsUntil, embargo: room.embargo, inverno: room.invernoUntil || 0,'
assert h.count(a) == 1, 'af3 %d' % h.count(a)
h = h.replace(a, a + ' era: room.era || 1, timeline: room.timeline || [],')
ok.append('AF3 snapshot')

a = 'function premiosSemanais(room) {'
assert h.count(a) == 1, 'af4 %d' % h.count(a)
fn = """const ERAS = ['Fundação', 'Expansão', 'Potência', 'Lenda'];
function record(room, txt) { room.timeline = room.timeline || []; room.timeline.unshift({ day: room.day, txt }); if (room.timeline.length > 30) room.timeline.length = 30; }
function checarEra(room) {
  const nova = Math.min(4, Math.floor((room.day - 1) / 56) + 1);
  if (nova === (room.era || 1)) return;
  room.era = nova;
  for (const p of room.players) if (p.alive) { p.money += 100; p.aprov = Math.min(100, p.aprov + 2); }
  log(room, `NOVA ERA: ${ERAS[nova - 1]}! Todas as nações recebem +$100 e +2 coracoes.`);
  record(room, `Era ${ERAS[nova - 1]} começou (dia ${room.day}).`);
}

""" + a
h = h.replace(a, fn)
ok.append('AF4 eras+record')

a = '  premiosSemanais(room);'
assert h.count(a) == 1, 'af5 %d' % h.count(a)
h = h.replace(a, a + '\n  checarEra(room);')
ok.append('AF5 tick era')

a = '(o jogo continua: o mundo é infinito!)`); } };'
assert h.count(a) == 1, 'af6 %d' % h.count(a)
h = h.replace(a, '(o jogo continua: o mundo é infinito!)`); record(room, `🏆 ${cname(p)}: ${txt}`); } };')
ok.append('AF6 marco')

a = 'p.stats.mandatos++;'
assert h.count(a) == 1, 'af7a %d' % h.count(a)
h = h.replace(a, "record(room, 'Eleicao dia ' + room.day + ': ' + cname(p) + ' reeleito'); " + a)
ok.append('AF7a eleicao vence')

a = '    else if (p.aprov >= 35) { p.aprov = Math.min(100, p.aprov + 1);'
assert h.count(a) == 1, 'af7b %d' % h.count(a)
h = h.replace(a, '    else if (p.aprov >= 35) { ' + "record(room, 'Eleicao dia ' + room.day + ': ' + cname(p) + ' vence no aperto'); " + 'p.aprov = Math.min(100, p.aprov + 1);')
ok.append('AF7b eleicao aperto')

a = 'p.emergencyUntil = room.turn + 2;'
assert h.count(a) == 1, 'af7c %d' % h.count(a)
h = h.replace(a, "record(room, 'Eleicao dia ' + room.day + ': ' + cname(p) + ' derrotado'); " + a)
ok.append('AF7c eleicao derrota')

a = "      log(room, `☢️💥 ${cname(p)} LANÇOU UM MÍSSIL NUCLEAR em ${cname(target)}!${shield ? ' (Defesa Antiaérea reduziu os danos!)' : ' Devastação total.'}`);"
assert h.count(a) == 1, 'af8 %d' % h.count(a)
h = h.replace(a, a + "\n      record(room, `☢️ ${cname(p)} lançou ogiva em ${cname(target)} (dia ${room.day}).`);")
ok.append('AF8 nuke player')

a = "Devastação total.'}`); } }"
assert h.count(a) == 1, 'af9 %d' % h.count(a)
h = h.replace(a, "Devastação total.'}`); record(room, `☢️ ${cname(b)} lançou ogiva em ${cname(fw)} (dia ${room.day}).`); } }")
ok.append('AF9 nuke bot')

a = '— renda global -10% por 6 semanas.`);'
assert h.count(a) == 2, 'af10 %d' % h.count(a)
h = h.replace(a, '— renda global -10% por 6 semanas.`); record(room, `❄️ INVERNO NUCLEAR começou (dia ${room.day}).`);')
ok.append('AF10 inverno x2')

io.open(P, 'w', encoding='utf-8').write(h)
print('== SERVER ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH SERVER FASE29 OK')
