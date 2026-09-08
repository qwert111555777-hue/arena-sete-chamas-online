#!/usr/bin/env python3
"""FASE 16 (server) — sistema inédito 🌍 ECOLOGIA (original, supera o MA3).
S1: p.pollution=10 no init. S2: snapshot expõe pollution. S3: drift no dayTick
(prédios +0.3/sem cada; imposto amb12+ −2; orçamento amb2+ −1.5; clamp −4/+6 por sem;
>=70 aprov −1; >=90 aprov −2 + multa; alerta 1x). S4: ação 'reflorestar' 1AP+$250 → −15."""
import io

P = '/home/user/presidente-online/server.js'
h = io.open(P, encoding='utf-8').read()
ok = []

a = 'p.space = 0; p.relations'
assert h.count(a) == 1, 's1 %d' % h.count(a)
h = h.replace(a, 'p.space = 0; p.pollution = 10; p.relations')
ok.append('S1 init pollution')

a = 'sectors: p.sectors, space: p.space,'
assert h.count(a) == 1, 's2 %d' % h.count(a)
h = h.replace(a, a + ' pollution: Math.round(p.pollution != null ? p.pollution : 10),')
ok.append('S2 snapshot')

a = """    if (p.seguranca) dAprov += (p.seguranca.policia || 0);
    p.aprov = Math.max(0, Math.min(100, p.aprov + dAprov / DAY_DIV));"""
assert h.count(a) == 1, 's3 %d' % h.count(a)
add = """    if (p.seguranca) dAprov += (p.seguranca.policia || 0);
    // 🌍 ecologia (Fase 16): prédios poluem, verde limpa
    if (p.pollution == null) p.pollution = 10;
    let nPol = 0;
    for (const k in p.buildings) nPol += (p.buildings[k] || 0);
    let dPol = nPol * 0.3;
    if (p.taxes && p.taxes.amb >= 12) dPol -= 2;
    if (p.budget && p.budget.ambm >= 2) dPol -= 1.5;
    dPol = Math.max(-4, Math.min(6, dPol));
    p.pollution = Math.max(0, Math.min(100, p.pollution + dPol / DAY_DIV));
    if (p.pollution >= 70) dAprov -= 1;
    if (p.pollution >= 90) { dAprov -= 1; p.money = Math.max(0, p.money - 5 / DAY_DIV); }
    if (p.pollution >= 75 && !p.ecoAlert) { log(room, `🌍 ALERTA ECOLÓGICO em ${cname(p)}! Poluição ${Math.round(p.pollution)}% — aprovação caindo. Refloreste ou suba o imposto ambiental.`); p.ecoAlert = true; }
    else if (p.pollution < 60) p.ecoAlert = false;
    p.aprov = Math.max(0, Math.min(100, p.aprov + dAprov / DAY_DIV));"""
h = h.replace(a, add)
ok.append('S3 drift tick')

a = "    case 'seguranca': {                // aparato de segurança interna"
assert h.count(a) == 1, 's4 %d' % h.count(a)
add = """    case 'reflorestar': {
      if (p.pollution == null) p.pollution = 10;
      if (p.pollution <= 0) { err(p.conn, '🌍 O ar já está limpo.'); return; }
      if (!spend(p, 1, 250)) return;
      p.pollution = Math.max(0, p.pollution - 15);
      p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🌱 ${cname(p)} inicia um mutirão de reflorestamento (poluição ${Math.round(p.pollution)}%).`);
      break;
    }
""" + a
h = h.replace(a, add)
ok.append('S4 acao reflorestar')

io.open(P, 'w', encoding='utf-8').write(h)
print('== SERVER ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH SERVER FASE16 OK')
