#!/usr/bin/env python3
"""FASE 23 (server) — templos + conversoes tracked + bots missionarios.
S1: action 'templo'. S2: stats.conversoes x2. S3: ++ no spread. S4: bots espalham."""
import io
P = '/home/user/presidente-online/server.js'
h = io.open(P, encoding='utf-8').read()
ok = []

a = "    case 'espalhar_religiao': {"
assert h.count(a) == 1, 's1 %d' % h.count(a)
add = """    case 'templo': {
      if (!spend(p, 1, 200)) return;
      p.fe = Math.min(100, (p.fe || 0) + 4); p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🛕 ${cname(p)} ergueu um templo (+4 fé, +2 ❤️).`);
      break;
    }
""" + a
h = h.replace(a, add)
ok.append('S1 templo')

a = 'mandatos: 0 }'
assert h.count(a) == 2, 's2 %d' % h.count(a)
h = h.replace(a, 'mandatos: 0, conversoes: 0 }')
ok.append('S2 stats x2')

a = 'target.religion = p.religion; bumpRel(p, target, 10); p.xp += 5;'
assert h.count(a) == 1, 's3 %d' % h.count(a)
h = h.replace(a, a + ' p.stats.conversoes = (p.stats.conversoes || 0) + 1;')
ok.append('S3 conta conversao')

a = '    if (b.crise) resolverCrise(room, b, (b.money > 500) ? 0 : 2);'
assert h.count(a) == 1, 's4 %d' % h.count(a)
bot = a + "\n    if (b.religion && b.religion !== 'laico' && b.money > 500 && Math.random() < 0.25) { const tgts = room.players.filter(o => o.alive && o !== b && o.religion !== b.religion); if (tgts.length) { const t3 = tgts[Math.floor(Math.random() * tgts.length)]; if (Math.random() < 0.3 + relBetween(b, t3) / 200) { t3.religion = b.religion; bumpRel(b, t3, 10); b.stats.conversoes = (b.stats.conversoes || 0) + 1; log(room, `🛐 ${cname(b)} espalhou sua religião para ${cname(t3)}!`); } } }"
h = h.replace(a, bot)
ok.append('S4 bots missionarios')

io.open(P, 'w', encoding='utf-8').write(h)
print('== SERVER ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH SERVER FASE23 OK')
