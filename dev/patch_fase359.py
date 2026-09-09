# -*- coding: utf-8 -*-
"""
FASE 359 — Setores INFRAESTRUTURA e CIENCIA (paridade 100% com a lista oficial do MA3).

MA3 (fontes publicas: aptoide FAQ Oxiwyle v1.0.106 / apk.dog):
  education, INFRASTRUCTURE, SCIENCE AND RESEARCH, culture, sports, housing, justice

Nos tinhamos: educacao, saude, cultura, esportes, habitacao, justica, turismo
  -> faltavam infraestrutura e ciencia (existem como predios/techs, nao como setores)
  -> mantemos saude e turismo como EXTRAS (MA3 nao tem)

Efeitos (acumulam com o que ja existe, sem quebrar equilibrio):
  * Infraestrutura Nv n -> -3% custo de construcao por nivel (soma com tech 'infra' -5%/Nv)
      teto: tech 5 (25%) + setor 5 (15%) = 40% de desconto
  * Ciencia Nv n        -> -3% custo de pesquisa por nivel (soma com Educacao -4%/Nv)
      teto: educacao 5 (20%) + ciencia 5 (15%) = 35% de desconto
"""
import io, sys

SRV = '/home/user/presidente-online/server.js'
CLI = '/home/user/presidente-online/public/index.html'
srv = io.open(SRV, encoding='utf-8').read()
cli = io.open(CLI, encoding='utf-8').read()
s0, c0 = srv, cli


def edita(txt, antigo, novo, nome, esperado=1, path=''):
    n = txt.count(antigo)
    if n != esperado:
        print('ERRO [%s]: esperado %d, achado %d -> %r' % (nome, esperado, n, antigo[:60]))
        sys.exit(1)
    print('  ok: %s (%dx)' % (nome, n))
    return txt.replace(antigo, novo)


# ---------------------------------------------------- 1. SERVER: const SECTORS
srv = edita(srv,
"""const SECTORS = [
  ['educacao', 'Educação'], ['saude', 'Saúde'], ['cultura', 'Cultura'],
  ['esportes', 'Esportes'], ['habitacao', 'Habitação'], ['justica', 'Justiça'], ['turismo', 'Turismo'],
];""",
"""const SECTORS = [
  ['educacao', 'Educação'], ['saude', 'Saúde'], ['cultura', 'Cultura'],
  ['esportes', 'Esportes'], ['habitacao', 'Habitação'], ['justica', 'Justiça'], ['turismo', 'Turismo'],
  ['infraestrutura', 'Infraestrutura'], ['ciencia', 'Ciência'],
];""",
'SECTORS const', path='srv')

# --------------------------------------- 2. SERVER: init dos setores (5 pontos)
INIT_ANT = 'sectors: { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0, turismo: 0 }'
INIT_NOV = 'sectors: { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0, turismo: 0, infraestrutura: 0, ciencia: 0 }'
srv = edita(srv, INIT_ANT, INIT_NOV, 'init sectors (objeto)', esperado=2, path='srv')

P_ANT = 'p.techs = []; p.techLv = {}; p.sectors = { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0, turismo: 0 };'
P_NOV = 'p.techs = []; p.techLv = {}; p.sectors = { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0, turismo: 0, infraestrutura: 0, ciencia: 0 };'
srv = edita(srv, P_ANT, P_NOV, 'init sectors (reset)', path='srv')

# ------------------------------------- 3. SERVER: efeito CIENCIA no custo tech
srv = edita(srv,
"      const cost = Math.round(techCost(lvl) * (p.ideology === 'republica' ? 0.75 : 1) * (1 - 0.04 * (((p.sectors && p.sectors.educacao) || 0))));",
"      const cost = Math.round(techCost(lvl) * (p.ideology === 'republica' ? 0.75 : 1) * (1 - 0.04 * ((p.sectors && p.sectors.educacao) || 0) - 0.03 * ((p.sectors && p.sectors.ciencia) || 0)));",
'efeito ciencia (-3% pesquisa/Nv)', path='srv')

# ----------------------------- 4. SERVER: efeito INFRAESTRUTURA no custo obra
srv = edita(srv,
"      cCost = Math.ceil(cCost * (1 - 0.05 * techLevel(p, 'infra')));",
"      cCost = Math.ceil(cCost * (1 - 0.05 * techLevel(p, 'infra') - 0.03 * ((p.sectors && p.sectors.infraestrutura) || 0)));",
'efeito infraestrutura (-3% obra/Nv)', path='srv')

# ------------------------------------------------- 5. SERVER: bots investem
srv = edita(srv,
"    if (b.money > 4000 && ((b.sectors && b.sectors.justica) || 0) < 5 && Math.random() < 0.08) { b.money -= 600; b.sectors.justica = ((b.sectors && b.sectors.justica) || 0) + 1; b.money += 150; }",
"""    if (b.money > 4000 && ((b.sectors && b.sectors.justica) || 0) < 5 && Math.random() < 0.08) { b.money -= 600; b.sectors.justica = ((b.sectors && b.sectors.justica) || 0) + 1; b.money += 150; }
    if (b.money > 4000 && ((b.sectors && b.sectors.infraestrutura) || 0) < 5 && Math.random() < 0.08) { b.money -= 600; b.sectors.infraestrutura = ((b.sectors && b.sectors.infraestrutura) || 0) + 1; }
    if (b.money > 4500 && ((b.sectors && b.sectors.ciencia) || 0) < 5 && Math.random() < 0.08) { b.money -= 700; b.sectors.ciencia = ((b.sectors && b.sectors.ciencia) || 0) + 1; }""",
'bots investem nos novos setores', path='srv')

# ------------------------------------------------- 6. CLIENTE: SECTORS_UI
cli = edita(cli,
"const SECTORS_UI = [['educacao','Educação'],['saude','Saúde'],['cultura','Cultura'],['esportes','Esportes'],['habitacao','Habitação'],['justica','Justiça'],['turismo','Turismo']];",
"const SECTORS_UI = [['educacao','Educação'],['saude','Saúde'],['cultura','Cultura'],['esportes','Esportes'],['habitacao','Habitação'],['justica','Justiça'],['turismo','Turismo'],['infraestrutura','Infraestrutura'],['ciencia','Ciência']];",
'SECTORS_UI', path='cli')

# ------------------------------------------- 7. CLIENTE: TH e PD do widget
cli = edita(cli,
"    const TH = {educacao:'🎓',saude:'🏥',cultura:'🎭',esportes:'⚽',habitacao:'🏠',justica:'⚖️',turismo:'🧳'};",
"    const TH = {educacao:'🎓',saude:'🏥',cultura:'🎭',esportes:'⚽',habitacao:'🏠',justica:'⚖️',turismo:'🧳',infraestrutura:'🛣️',ciencia:'🔬'};",
'TH (emojis)', path='cli')

cli = edita(cli,
"    const PD = {educacao:'pesquisa −4% custo/Nv',saude:'natalidade acelerada',cultura:'desenvolvimento cultural',esportes:'Copa · Davis · FIFA',habitacao:'Nv3+ = +1/sem',justica:'Nv2+ barra golpes',turismo:'+$'+(lv*15)+'/sem'};",
"    const PD = {educacao:'pesquisa −4% custo/Nv',saude:'natalidade acelerada',cultura:'desenvolvimento cultural',esportes:'Copa · Davis · FIFA',habitacao:'Nv3+ = +1/sem',justica:'Nv2+ barra golpes',turismo:'+$'+(lv*15)+'/sem',infraestrutura:'obras −3% custo/Nv',ciencia:'pesquisa −3% custo/Nv'};",
'PD (descricoes)', path='cli')

if srv == s0 and cli == c0:
    print('NADA MUDOU — abortando'); sys.exit(1)

io.open(SRV, 'w', encoding='utf-8').write(srv)
io.open(CLI, 'w', encoding='utf-8').write(cli)
print('\nFASE 359 aplicada. Rodar node-check duplo + smokes.')
