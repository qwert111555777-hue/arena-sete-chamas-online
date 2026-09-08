#!/usr/bin/env python3
"""FASE 26 (server) — rede de espioes + recrutar + roubo tech + caca-espioes + sab synergia + bots."""
import io
P = '/home/user/presidente-online/server.js'
h = io.open(P, encoding='utf-8').read()
ok = []

a = '    seguranca: { defesa: 0, secreto: 0, policia: 0, guarda: 0 },'
assert h.count(a) == 1, 'z1 %d' % h.count(a)
h = h.replace(a, a + '\n    espioes: 1,')
ok.append('Z1 init player')

a = '    seguranca: { defesa: h % 2, secreto: (h >> 1) % 2, policia: (h >> 2) % 3, guarda: (h >> 3) % 2 },'
assert h.count(a) == 1, 'z1b %d' % h.count(a)
h = h.replace(a, a + '\n    espioes: 1,')
ok.append('Z1b init bot')

a = '    p.seguranca = { defesa: 0, secreto: 0, policia: 0, guarda: 0 };'
assert h.count(a) == 1, 'z2 %d' % h.count(a)
h = h.replace(a, a + ' p.espioes = 1;')
ok.append('Z2 reset fundar')

a = '      seguranca: p.seguranca || { defesa: 0, secreto: 0, policia: 0, guarda: 0 },'
assert h.count(a) == 1, 'z3 %d' % h.count(a)
h = h.replace(a, a + ' espioes: p.espioes || 0,')
ok.append('Z3 snapshot')

a = "      const chance = Math.min(0.85, 0.5 + 0.08 * sAtk + (p.ministers.dip === 'esp' ? 0.1 : 0));"
assert h.count(a) == 1, 'z4 %d' % h.count(a)
h = h.replace(a, "      const chance = Math.min(0.9, 0.5 + 0.08 * sAtk + 0.05 * (p.espioes || 0) + (p.ministers.dip === 'esp' ? 0.1 : 0));")
ok.append('Z4 chance c/ rede')

a = '          log(room, `🕵️ O Serviço Secreto de ${cname(target)} DETECTOU e conteve a sabotagem de ${cname(p)}!`);'
assert h.count(a) == 1, 'z5 %d' % h.count(a)
h = h.replace(a, '          p.espioes = Math.max(0, (p.espioes || 0) - 1);\n          log(room, `🕵️ O Serviço Secreto de ${cname(target)} DETECTOU e conteve a sabotagem de ${cname(p)}! Um agente foi capturado.`);')
ok.append('Z5 captura')

a = "    case 'sancao': {"
assert h.count(a) == 1, 'z6 %d' % h.count(a)
add = """    case 'recrutar_espiao': {
      const sA = (p.seguranca && p.seguranca.secreto) || 0;
      const maxE = 3 + sA * 2;
      if ((p.espioes || 0) >= maxE) { err(p.conn, 'Rede no máximo (' + maxE + ' agentes). Amplie o Serviço Secreto.'); return; }
      if (!spend(p, 1, 150)) return;
      p.espioes = (p.espioes || 0) + 1;
      log(room, `🕵️ ${cname(p)} recrutou um agente secreto (${p.espioes}/${maxE}).`);
      break;
    }
    case 'roubar_tech': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, dipCost(p, 200))) return;
      const sA2 = (p.seguranca && p.seguranca.secreto) || 0;
      const ch = Math.min(0.7, 0.3 + 0.07 * (p.espioes || 0) + 0.08 * sA2 + (p.ministers.dip === 'esp' ? 0.1 : 0));
      const pool = Object.keys(target.techLv || {}).filter(k => (target.techLv[k] || 0) > (((p.techLv || {}))[k] || 0) && TECHS[k]);
      if (Math.random() < ch && pool.length) {
        const k = pool[Math.floor(Math.random() * pool.length)];
        p.techLv = p.techLv || {}; p.techs = p.techs || [];
        p.techLv[k] = (p.techLv[k] || 0) + 1;
        if (!p.techs.includes(k)) p.techs.push(k);
        bumpRel(p, target, -4);
        log(room, `📡 Agentes de ${cname(p)} roubaram a tecnologia ${TECHS[k][1]} de ${cname(target)}!`);
      } else if (Math.random() < 0.3) { p.espioes = Math.max(0, (p.espioes || 0) - 1); bumpRel(p, target, -5); log(room, `🚨 ${cname(target)} capturou um espião de ${cname(p)} tentando roubar tecnologia!`); }
      else log(room, `🕵️ Agentes de ${cname(p)} voltaram de ${cname(target)} de mãos vazias.`);
      break;
    }
    case 'cacar_espioes': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, dipCost(p, 100))) return;
      const sA3 = (p.seguranca && p.seguranca.secreto) || 0;
      const tem = target.espioes || 0;
      if (!tem) { log(room, `🔍 Caça-espiões de ${cname(p)} não acharam nenhum agente em ${cname(target)}.`); break; }
      const kill = Math.min(tem, 1 + (Math.random() < 0.25 + 0.1 * sA3 + 0.05 * (p.espioes || 0) ? 1 : 0));
      target.espioes = tem - kill;
      bumpRel(p, target, -4);
      log(room, `🔍 Caça-espiões de ${cname(p)} eliminaram ${kill} agente(s) em ${cname(target)}!`);
      break;
    }
""" + a
h = h.replace(a, add)
ok.append('Z6 acoes novas')

a = 'espalhou sua ideologia para ${cname(t4)}!`); } } }'
assert h.count(a) == 1, 'z7 %d' % h.count(a)
bot = a + "\n    if ((b.espioes || 0) < 3 && b.money > 800) { b.money -= 150; b.espioes = (b.espioes || 0) + 1; }\n    if ((b.espioes || 0) >= 2 && b.money > 600 && Math.random() < 0.2) { const fs = room.players.filter(o => o.alive && o !== b && relBetween(b, o) < 40); if (fs.length) { const ft = fs[Math.floor(Math.random() * fs.length)]; b.money -= 150; const sAb = (b.seguranca && b.seguranca.secreto) || 0; const sDb = (ft.seguranca && ft.seguranca.secreto) || 0; if (Math.random() < Math.min(0.9, 0.5 + 0.08 * sAb + 0.05 * (b.espioes || 0))) { if (sDb >= 2 && Math.random() < 0.15 * sDb) { b.espioes = Math.max(0, (b.espioes || 0) - 1); log(room, `🕵️ O Serviço Secreto de ${cname(ft)} DETECTOU e conteve a sabotagem de ${cname(b)}! Um agente foi capturado.`); } else { const prs = ownProvinces(ft).filter(pr => pr.infra > 0); if (prs.length) { const pr = prs[Math.floor(Math.random() * prs.length)]; pr.infra -= 1; log(room, `🧨 Sabotagem de ${cname(b)} destrói infraestrutura em ${cname(ft)}!`); } else { ft.mil = Math.max(1, ft.mil - 3); log(room, `🧨 Sabotagem de ${cname(b)} danifica o arsenal de ${cname(ft)} (-3 militar)!`); } } bumpRel(b, ft, -5); } } }"
h = h.replace(a, bot)
ok.append('Z7 bots espiões')

io.open(P, 'w', encoding='utf-8').write(h)
print('== SERVER ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH SERVER FASE26 OK')
