#!/usr/bin/env python3
"""FASE 27 (server) — dissuasao + teste nuclear + abrigos + inverno nuclear + retaliacao bots."""
import io
P = '/home/user/presidente-online/server.js'
h = io.open(P, encoding='utf-8').read()
ok = []

a = '      p.relations[target.id] = 0; target.relations[p.id] = 0;\n      p.aprov = Math.max(0, p.aprov - 2);'
assert h.count(a) == 1, 'ab1 %d' % h.count(a)
h = h.replace(a, a + '\n      if ((target.nuclear || 0) >= 3) { p.aprov = Math.max(0, p.aprov - 3); log(room, `☢️ DISSUASÃO: atacar ${cname(target)} (arsenal Nv${target.nuclear}) assusta seu povo (−3 ❤️ extra).`); }')
ok.append('AB1 dissuasao')

a = '    nuclear: 0, influencia: 0, fe: 0, provinces: [], wars: [],'
assert h.count(a) == 1, 'ab2 %d' % h.count(a)
h = h.replace(a, a + ' abrigo: false,')
ok.append('AB2 init abrigo')

a = '    nuclear: 0, influencia: 0, fe: 0, wars: [],'
assert h.count(a) == 1, 'ab2b %d' % h.count(a)
h = h.replace(a, a + ' abrigo: false,')
ok.append('AB2b init bot')

a = 'p.allies = []; p.eliminatedReason = null; p.nuclear = 0; p.influencia = 0; p.fe = 0; p.wars = [];'
assert h.count(a) == 1, 'ab3 %d' % h.count(a)
h = h.replace(a, a + ' p.abrigo = false;')
ok.append('AB3 reset')

a = '      nuclear: p.nuclear, influencia: Math.round(p.influencia), fe: Math.round(p.fe), wars: p.wars,'
assert h.count(a) == 1, 'ab4 %d' % h.count(a)
h = h.replace(a, a + ' abrigo: !!p.abrigo,')
ok.append('AB4 snapshot')

a = '    un: room.un, noWarUntil: room.noWarUntil, noArmsUntil: room.noArmsUntil, embargo: room.embargo,'
assert h.count(a) == 1, 'ab5 %d' % h.count(a)
h = h.replace(a, a + ' inverno: room.invernoUntil || 0,')
ok.append('AB5 snap inverno')

a = "      const shield = techLevel(target, 'interceptadores') > 0;"
assert h.count(a) == 1, 'ab6a %d' % h.count(a)
h = h.replace(a, a + '\n      const abrig = !!target.abrigo; if (abrig) target.abrigo = false;')
ok.append('AB6a consome abrigo')

a = '      target.mil = Math.max(1, Math.round(target.mil * (shield ? 0.7 : 0.4)));'
assert h.count(a) == 1, 'ab6b %d' % h.count(a)
h = h.replace(a, '      target.mil = Math.max(1, Math.round(target.mil * (abrig ? 0.75 : (shield ? 0.7 : 0.4))));')
ok.append('AB6b dano abrigo')

a = '      target.aprov = Math.max(0, target.aprov - (shield ? 10 : 20));'
assert h.count(a) == 1, 'ab6c %d' % h.count(a)
h = h.replace(a, '      target.aprov = Math.max(0, target.aprov - (abrig ? 5 : (shield ? 10 : 20)));')
ok.append('AB6c aprov abrigo')

a = "      log(room, `☢️💥 ${cname(p)} LANÇOU UM MÍSSIL NUCLEAR em ${cname(target)}!${shield ? ' (Defesa Antiaérea reduziu os danos!)' : ' Devastação total.'}`);"
assert h.count(a) == 1, 'ab6d %d' % h.count(a)
h = h.replace(a, a + '\n      room.nukesUsed = (room.nukesUsed || 0) + 1;\n      if (abrig) log(room, `🛡️ Abrigos nucleares de ${cname(target)} salvaram vidas (dano reduzido, abrigo consumido)!`);\n      if (room.nukesUsed >= 3 && !(room.turn < room.invernoUntil)) { room.invernoUntil = room.turn + 6; log(room, `❄️ INVERNO NUCLEAR! ${room.nukesUsed} ogivas detonadas — renda global -10% por 6 semanas.`); }')
ok.append('AB6d inverno')

a = '  if (room.bloqueio && room.bloqueio.target === p.id && room.turn < room.bloqueio.until) mult *= 0.5;'
assert h.count(a) == 1, 'ab7 %d' % h.count(a)
h = h.replace(a, a + '\n  if (room.turn < (room.invernoUntil || 0)) mult *= 0.9;')
ok.append('AB7 renda inverno')

a = 'room.un = null; room.noWarUntil = 20; room.noArmsUntil = 0; room.embargo = null; room.bloqueio = null;'
assert h.count(a) == 1, 'ab8 %d' % h.count(a)
h = h.replace(a, a + ' room.invernoUntil = 0; room.nukesUsed = 0;')
ok.append('AB8 reset sala')

a = "    case 'comprar': {"
assert h.count(a) == 1, 'ab9 %d' % h.count(a)
add = """    case 'teste_nuclear': {
      if ((p.nuclear || 0) < 2) { err(p.conn, 'Programa nuclear Nv2+ necessário para um teste.'); return; }
      if (p.lastTeste && room.turn - p.lastTeste < 4) { err(p.conn, 'Teste recente demais (1 a cada 4 semanas).'); return; }
      if (!spend(p, 1, 300)) return;
      p.lastTeste = room.turn;
      p.aprov = Math.min(100, p.aprov + 3);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, -2);
      log(room, `☢️🧪 ${cname(p)} fez um TESTE NUCLEAR (+3 ❤️ em casa, −2 relações com o mundo). Dissuasão reforçada!`);
      break;
    }
    case 'abrigo': {
      if (p.abrigo) { err(p.conn, 'Abrigos já construídos.'); return; }
      if (!spend(p, 1, 250)) return;
      p.abrigo = true;
      log(room, `🛡️ ${cname(p)} construiu ABRIGOS nucleares (protege do próximo ataque).`);
      break;
    }
""" + a
h = h.replace(a, add)
ok.append('AB9 acoes novas')

a = '    if ((b.espioes || 0) < 3 && b.money > 800)'
assert h.count(a) == 1, 'ab10 %d' % h.count(a)
bot = "    if ((b.nuclear || 0) >= 3 && (b.wars || []).length && (b.mil || 0) < 6 && Math.random() < 0.3) { const fw = room.players.find(o => o.alive && (b.wars || []).includes(o.id)); if (fw) { b.nuclear -= 1; const sh = techLevel(fw, 'interceptadores') > 0; fw.mil = Math.max(1, Math.round(fw.mil * (sh ? 0.7 : 0.4))); fw.aprov = Math.max(0, fw.aprov - (sh ? 10 : 20)); b.aprov = Math.max(0, b.aprov - 10); room.nukesUsed = (room.nukesUsed || 0) + 1; if (room.nukesUsed >= 3 && !(room.turn < room.invernoUntil)) { room.invernoUntil = room.turn + 6; log(room, `❄️ INVERNO NUCLEAR! ${room.nukesUsed} ogivas detonadas — renda global -10% por 6 semanas.`); } log(room, `☢️💥 ${cname(b)} LANÇOU UM MÍSSIL NUCLEAR em ${cname(fw)}!${sh ? ' (Defesa Antiaérea reduziu os danos!)' : ' Devastação total.'}`); } }\n" + a
h = h.replace(a, bot)
ok.append('AB10 retaliacao')

io.open(P, 'w', encoding='utf-8').write(h)
print('== SERVER ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH SERVER FASE27 OK')
