#!/usr/bin/env python3
"""FASE 24 (server) — centro cultural + doutrinacoes + marco sociedade perfeita + bots ideologicos."""
import io
P = '/home/user/presidente-online/server.js'
h = io.open(P, encoding='utf-8').read()
ok = []

a = "    case 'espalhar_ideologia': {"
assert h.count(a) == 1, 'v1 %d' % h.count(a)
add = """    case 'centro_cultural': {
      if (!spend(p, 1, 200)) return;
      p.influencia = Math.min(100, (p.influencia || 0) + 4); p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🗽 ${cname(p)} inaugurou um centro cultural (+4 doutrina, +2 ❤️).`);
      break;
    }
""" + a
h = h.replace(a, add)
ok.append('V1 centro cultural')

a = 'conversoes: 0 }'
assert h.count(a) == 2, 'v2 %d' % h.count(a)
h = h.replace(a, 'conversoes: 0, doutrinacoes: 0 }')
ok.append('V2 stats x2')

a = 'target.ideology = p.ideology; bumpRel(p, target, 10); p.xp += 5;'
assert h.count(a) == 1, 'v3 %d' % h.count(a)
h = h.replace(a, a + ' p.stats.doutrinacoes = (p.stats.doutrinacoes || 0) + 1;')
ok.append('V3 conta doutrinacao')

a = "  marco('convI', alive.find(p => p.ideology && alive.filter(o => o.ideology === p.ideology).length > alive.length / 2), 'sua doutrina governa a maioria das nações');"
assert h.count(a) == 1, 'v4 %d' % h.count(a)
h = h.replace(a, a + "\n  marco('sociedade', alive.find(p => { const s = p.sectors || {}; return ['educacao','saude','cultura','esportes','habitacao','justica','turismo'].every(k => (s[k] || 0) >= 4); }), 'sociedade perfeita (7 setores Nv4+)');")
ok.append('V4 marco sociedade')

a = 'espalhou sua religião para ${cname(t3)}!`); } } }'
assert h.count(a) == 1, 'v5 %d' % h.count(a)
h = h.replace(a, a + "\n    if (b.ideology && b.money > 500 && Math.random() < 0.25) { const tgts2 = room.players.filter(o => o.alive && o !== b && o.ideology !== b.ideology); if (tgts2.length) { const t4 = tgts2[Math.floor(Math.random() * tgts2.length)]; if (Math.random() < 0.3 + relBetween(b, t4) / 200) { t4.ideology = b.ideology; bumpRel(b, t4, 10); b.stats.doutrinacoes = (b.stats.doutrinacoes || 0) + 1; log(room, `⚖️ ${cname(b)} espalhou sua ideologia para ${cname(t4)}!`); } } }")
ok.append('V5 bots ideologicos')

io.open(P, 'w', encoding='utf-8').write(h)
print('== SERVER ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH SERVER FASE24 OK')
