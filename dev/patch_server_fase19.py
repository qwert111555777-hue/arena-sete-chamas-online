#!/usr/bin/env python3
"""FASE 19 (server) — 'manter_paz' (missão de paz ONU encerra guerras do alvo)
+ 'convocar_reservas' (1AP+$300, +3mil max25, −2aprov, cooldown 14d)."""
import io
P = '/home/user/presidente-online/server.js'
h = io.open(P, encoding='utf-8').read()
ok = []

a = "  { id: 'condenar',       desc: 'Condenação internacional de {T} (-6 aprovação)' },"
assert h.count(a) == 1, 'u1 %d' % h.count(a)
h = h.replace(a, a + "\n  { id: 'manter_paz',    desc: 'Missão de paz: encerrar todas as guerras de {T}' },")
ok.append('U1 tipo ONU')

a = "if (u.type === 'autorizar')"
assert h.count(a) == 1, 'u2 %d' % h.count(a)
add = """if (u.type === 'manter_paz' && tgt) {
      const foes = (tgt.wars || []).slice();
      for (const fid of foes) { const f = room.players.find(x => x.id === fid); if (!f) continue;
        tgt.wars = tgt.wars.filter(id => id !== fid); f.wars = (f.wars || []).filter(id => id !== tgt.id);
        tgt.blockading = (tgt.blockading || []).filter(id => id !== fid); f.blockadedBy = (f.blockadedBy || []).filter(id => id !== tgt.id);
        f.blockading = (f.blockading || []).filter(id => id !== tgt.id); tgt.blockadedBy = (tgt.blockadedBy || []).filter(id => id !== fid); }
      log(room, `🇺🇳🕊️ MISSÃO DE PAZ: a ONU encerrou ${foes.length} guerra(s) de ${cname(tgt)}! Capacetes azuis nas fronteiras.`);
    }
    if (u.type === 'autorizar')"""
h = h.replace(a, add)
ok.append('U2 resolve manter_paz')

a = "if (type.id === 'embargo' || type.id === 'condenar')"
assert h.count(a) == 1, 'u3 %d' % h.count(a)
h = h.replace(a, "if (type.id === 'embargo' || type.id === 'condenar' || type.id === 'manter_paz')")
ok.append('U3 openUN alvo')

a = "const precisaAlvo = tipo === 'autorizar' || tipo === 'embargo' || tipo === 'condenar';"
assert h.count(a) == 1, 'u4 %d' % h.count(a)
h = h.replace(a, "const precisaAlvo = tipo === 'autorizar' || tipo === 'embargo' || tipo === 'condenar' || tipo === 'manter_paz';")
ok.append('U4 propor alvo')

a = "    case 'treino_conjunto': {        // Joint Training (pedido de players MA3)"
assert h.count(a) == 1, 'u5 %d' % h.count(a)
add = """    case 'convocar_reservas': {       // Emergency Reserves (pedido de players MA3)
      if ((p.mil || 0) >= 25) { err(p.conn, 'Exército já no máximo.'); return; }
      if (p.lastReserve && room.day - p.lastReserve < 14) { err(p.conn, 'Reservas em reorganização — tente em ' + (14 - (room.day - p.lastReserve)) + ' dias.'); return; }
      if (!spend(p, 1, 300)) return;
      p.lastReserve = room.day;
      p.mil = Math.min(25, (p.mil || 0) + 3);
      p.aprov = Math.max(0, p.aprov - 2);
      log(room, `🛡️ ${cname(p)} CONVOCOU AS RESERVAS (+3 militar, −2 aprovação, 14 dias p/ reorganizar).`);
      break;
    }
""" + a
h = h.replace(a, add)
ok.append('U5 reservas')

io.open(P, 'w', encoding='utf-8').write(h)
print('== SERVER ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH SERVER FASE19 OK')
