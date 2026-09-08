#!/usr/bin/env python3
"""FASE 18 (server) — ação inédita 'treino_conjunto' (responde a pedido de players MA3).
Aliados: 1AP+$200 → +1 mil cada (max 25), +5 rel, +3xp."""
import io
P = '/home/user/presidente-online/server.js'
h = io.open(P, encoding='utf-8').read()
a = "    case 'convocar': {                 // Call to Arms"
assert h.count(a) == 1, 's %d' % h.count(a)
add = """    case 'treino_conjunto': {        // Joint Training (pedido de players MA3)
      if (!target || target === p || !target.alive) return;
      if (!p.allies.includes(target.id)) return err(p.conn, 'Treino conjunto exige ALIANÇA.');
      if (p.wars.includes(target.id)) return err(p.conn, 'Impossível treinar com um inimigo.');
      if (!spend(p, 1, 200)) return;
      p.mil = Math.min(25, p.mil + 1); target.mil = Math.min(25, target.mil + 1);
      bumpRel(p, target, 5); p.xp += 3;
      log(room, `🏋️🤝 ${cname(p)} e ${cname(target)} fazem TREINO MILITAR CONJUNTO (+1 militar cada, +5 relações).`);
      break;
    }
""" + a
h = h.replace(a, add)
io.open(P, 'w', encoding='utf-8').write(h)
print('SERVER FASE18 OK')
