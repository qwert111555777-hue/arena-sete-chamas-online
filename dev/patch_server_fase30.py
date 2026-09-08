#!/usr/bin/env python3
"""FASE 30 (server) — credito com teto + calote + tributo + juros + bots pagam."""
import io
P = '/home/user/presidente-online/server.js'
h = io.open(P, encoding='utf-8').read()
ok = []

a = "    case 'emprestimo': p.money += 600; p.debt += 720; log(room, `🏦 ${cname(p)} contrai empréstimo de $600 (dívida $${p.debt}).`); break;"
assert h.count(a) == 1, 'ah1 %d' % h.count(a)
h = h.replace(a, """    case 'emprestimo': {
      if (p.debt > 2000) { err(p.conn, 'Dívida alta demais — o banco não empresta.'); return; }
      if (room.turn < (p.caloteUntil || 0)) { err(p.conn, 'Nome sujo após calote — aguarde.'); return; }
      p.money += 600; p.debt += 720;
      log(room, `🏦 ${cname(p)} contrai empréstimo de $600 (dívida $${p.debt}).`);
      break;
    }""")
ok.append('AH1 credito teto')

a = "    case 'pagar': {"
assert h.count(a) == 1, 'ah2 %d' % h.count(a)
add = """    case 'calote': {
      if (p.debt <= 0) { err(p.conn, 'Sem dívida para calotear.'); return; }
      if (!spend(p, 1, 0)) return;
      p.debt = 0; p.caloteUntil = room.turn + 8;
      p.aprov = Math.max(0, p.aprov - 15);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, -15);
      log(room, `💸 ${cname(p)} deu CALOTE na dívida! (−15 ❤️, −15 relações, sem crédito por 8 semanas)`);
      break;
    }
""" + a
h = h.replace(a, add)
ok.append('AH2 calote')

a = "    case 'infra': {"
assert h.count(a) == 1, 'ah3 %d' % h.count(a)
add = """    case 'tributo': {
      if (!target || target === p || !target.alive) return;
      if (p.allies.includes(target.id)) { err(p.conn, 'Não tribute aliados.'); return; }
      if (!spend(p, 1, 0)) return;
      if (p.mil >= (target.mil || 1) * 2) {
        const x = Math.min(300, Math.floor(target.money));
        target.money -= x; p.money += x;
        bumpRel(p, target, -10);
        log(room, `💰 ${cname(p)} EXIGIU tributo de ${cname(target)} (+$${x}, −10 relações).`);
      } else { bumpRel(p, target, -8); target.aprov = Math.min(100, target.aprov + 2); log(room, `💰 ${cname(target)} RIU da exigência de tributo de ${cname(p)} (−8 relações)!`); }
      break;
    }
""" + a
h = h.replace(a, add)
ok.append('AH3 tributo')

a = '  checarEra(room);'
assert h.count(a) == 1, 'ah4 %d' % h.count(a)
h = h.replace(a, a + '\n  for (const p of room.players) if (p.alive && p.debt > 0) p.debt = Math.min(5000, Math.round(p.debt * 1.05));')
ok.append('AH4 juros')

a = '    if ((b.espioes || 0) < 3 && b.money > 800)'
assert h.count(a) == 1, 'ah5 %d' % h.count(a)
h = h.replace(a, '    if (b.debt > 0 && b.money > 1500) { const bx = Math.min(b.debt, Math.floor(b.money * 0.4)); b.money -= bx; b.debt -= bx; }\n' + a)
ok.append('AH5 bots pagam')

io.open(P, 'w', encoding='utf-8').write(h)
print('== SERVER ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH SERVER FASE30 OK')
