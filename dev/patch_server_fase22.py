#!/usr/bin/env python3
"""FASE 22 (server) — 4 CRISES interativas (terremoto/pandemia/seca/enchente) c/ escolhas.
Q1: switch *14. Q2: novaCrise+resolverCrise + cases 10-13. Q3: action 'crise'.
Q4: snapshot crise. Q5: bots auto-resolvem."""
import io
P = '/home/user/presidente-online/server.js'
h = io.open(P, encoding='utf-8').read()
ok = []

a = 'switch (Math.floor(Math.random() * 10)) {'
assert h.count(a) == 1, 'q1 %d' % h.count(a)
h = h.replace(a, 'switch (Math.floor(Math.random() * 14)) {')
ok.append('Q1 switch 14')

a = 'function randomEvent(room) {'
assert h.count(a) == 1, 'q2a %d' % h.count(a)
fn = """function novaCrise(room, pick, tipo) {
  if (pick.crise || (pick.lastCrisis && room.day - pick.lastCrisis < 21)) { pick.money += 40; log(room, `📦 ${cname(pick)} recebe doações de rotina (+$40).`); return; }
  pick.crise = { tipo, desde: room.day };
  pick.lastCrisis = room.day;
  const dmg = { terremoto: '🏚️ TERREMOTO', pandemia: '🦠 PANDEMIA', seca: '🏜️ SECA SEVERA', enchente: '🌊 ENCHENTE' }[tipo];
  if (tipo === 'terremoto') { const prs = ownProvinces(pick).filter(pr => pr.infra > 0); if (prs.length) prs[0].infra -= 1; pick.aprov = Math.max(0, pick.aprov - 4); }
  if (tipo === 'pandemia') { pick.pop = Math.max(0, (pick.pop || 0) - 15); pick.aprov = Math.max(0, pick.aprov - 5); }
  if (tipo === 'seca') { pick.rec.comida = 0; pick.aprov = Math.max(0, pick.aprov - 3); }
  if (tipo === 'enchente') { pick.money = Math.max(0, pick.money - 200); pick.aprov = Math.max(0, pick.aprov - 3); }
  log(room, `${dmg} atinge ${cname(pick)}! Abra 🚨 CRISES e escolha como responder.`);
}

function resolverCrise(room, p, ch) {
  const c = p.crise; if (!c) return;
  const t = c.tipo; ch = ch | 0;
  const done = txt => { p.crise = null; log(room, txt); };
  if (t === 'terremoto') {
    if (ch === 0) { if (!spend(p, 1, 400)) return; const prs = ownProvinces(p).filter(pr => pr.infra < 5); if (prs.length) prs[0].infra = Math.min(5, prs[0].infra + 2); p.aprov = Math.min(100, p.aprov + 4); done(`🏗️ ${cname(p)} reconstruiu após o terremoto (+2 infra, +4 ❤️).`); }
    else if (ch === 1) { if (!room.proposals.some(pr => pr.from === p.id && pr.kind === 'ajuda')) room.proposals.push({ from: p.id, to: 'ALL', kind: 'ajuda' }); p.aprov = Math.min(100, p.aprov + 1); done(`🆘 ${cname(p)} pediu ajuda internacional contra o terremoto.`); }
    else { p.aprov = Math.max(0, p.aprov - 8); p.mil = Math.max(1, p.mil - 1); done(`🏚️ ${cname(p)} ignorou o terremoto (−8 ❤️, −1 militar).`); }
  } else if (t === 'pandemia') {
    if (ch === 0) { if (!spend(p, 1, 350)) return; p.aprov = Math.min(100, p.aprov + 5); done(`💉 ${cname(p)} vacinou a população (+5 ❤️).`); }
    else if (ch === 1) { if (!spend(p, 1, 0)) return; p.money = Math.max(0, p.money - 150); p.aprov = Math.min(100, p.aprov + 2); done(`🔒 ${cname(p)} decretou lockdown (−$150, +2 ❤️).`); }
    else { p.pop = Math.max(0, (p.pop || 0) - 10); p.aprov = Math.max(0, p.aprov - 10); done(`🦠 A pandemia se alastrou em ${cname(p)} (−10 pop, −10 ❤️).`); }
  } else if (t === 'seca') {
    if (ch === 0) { if (!spend(p, 1, 250)) return; p.rec.comida += 50; p.aprov = Math.min(100, p.aprov + 3); done(`🚰 ${cname(p)} enviou caminhões-pipa (+50 comida, +3 ❤️).`); }
    else if (ch === 1) { if (!spend(p, 2, 500)) return; p.rec.comida += 120; p.aprov = Math.min(100, p.aprov + 5); done(`🌧️ ${cname(p)} fez transposição de águas (+120 comida, +5 ❤️).`); }
    else { p.pop = Math.max(0, (p.pop || 0) - 5); p.aprov = Math.max(0, p.aprov - 8); done(`🏜️ A seca castigou ${cname(p)} (−5 pop, −8 ❤️).`); }
  } else if (t === 'enchente') {
    if (ch === 0) { if (!spend(p, 1, 200)) return; p.aprov = Math.min(100, p.aprov + 4); done(`🚤 ${cname(p)} fez resgates na enchente (+4 ❤️).`); }
    else if (ch === 1) { if (!spend(p, 2, 450)) return; const prs = ownProvinces(p).filter(pr => pr.infra < 5); if (prs.length) prs[0].infra = Math.min(5, prs[0].infra + 1); p.aprov = Math.min(100, p.aprov + 6); done(`🏗️ ${cname(p)} fez obras de drenagem (+1 infra, +6 ❤️).`); }
    else { p.money = Math.max(0, p.money - 150); p.aprov = Math.max(0, p.aprov - 8); done(`🌊 A enchente causou prejuízos em ${cname(p)} (−$150, −8 ❤️).`); }
  } else p.crise = null;
}

""" + a
h = h.replace(a, fn)
ok.append('Q2a funcoes crise')

a = '  }\n}\n\n/* ---------------- Ações ---------------- */'
assert h.count(a) == 1, 'q2b %d' % h.count(a)
cases = "    case 10: novaCrise(room, pick, 'terremoto'); break;\n    case 11: novaCrise(room, pick, 'pandemia'); break;\n    case 12: novaCrise(room, pick, 'seca'); break;\n    case 13: novaCrise(room, pick, 'enchente'); break;\n" + a
h = h.replace(a, cases)
ok.append('Q2b cases 10-13')

a = "    case 'convocar_reservas': {       // Emergency Reserves (pedido de players MA3)"
assert h.count(a) == 1, 'q3 %d' % h.count(a)
add = """    case 'crise': {
      if (!p.crise) { err(p.conn, 'Nenhuma crise ativa.'); return; }
      resolverCrise(room, p, msg.choice | 0);
      break;
    }
""" + a
h = h.replace(a, add)
ok.append('Q3 action crise')

a = 'emergencyUntil: p.emergencyUntil, leis: p.leis,'
assert h.count(a) == 1, 'q4 %d' % h.count(a)
h = h.replace(a, a + ' crise: p.crise || null,')
ok.append('Q4 snapshot')

a = '    for (const pr of room.proposals.filter(x => x.to === b.id)) {'
assert h.count(a) == 1, 'q5 %d' % h.count(a)
h = h.replace(a, '    if (b.crise) resolverCrise(room, b, (b.money > 500) ? 0 : 2);\n' + a)
ok.append('Q5 bots resolvem')

io.open(P, 'w', encoding='utf-8').write(h)
print('== SERVER ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH SERVER FASE22 OK')
