# -*- coding: utf-8 -*-
"""
LIGAÇÃO das fases 366-369 nos sistemas existentes

366: evento sistêmico dispara junto com a crise
367: guerra estratégica — tecnologia, terreno, logística, suprimento
368: IA diplomática reativa — bots reagem a guerras
369: espionagem com risco de ser descoberto
"""
import io, sys

P = '/home/user/presidente-online/server.js'
s = io.open(P, encoding='utf-8').read()
orig = s
ok = lambda m: sys.stdout.write('  ok: %s\n' % m)

# ==================================================== 367: GUERRA ESTRATÉGICA
ANT = """function montarExercito(p, lado) {
  const tipos = [];
  for (const t of Object.keys(BT)) {
    if (t === 'milicia') continue;
    const n = (p.units && p.units[t]) || 0;
    for (let i = 0; i < n; i++) tipos.push(t);
  }
  // quem não tem forças treinadas luta com milícia proporcional ao poder militar
  const nMil = Math.max(3, Math.min(8, Math.round((p.mil || 1) / 2)));
  for (let i = 0; i < nMil; i++) tipos.push('milicia');
  const md = ((p.ministers || {}).def); const bonus = 1 + (p.mil || 0) * 0.02 + (lado === 'atk' && md === 'fal' ? 0.1 : 0) + (lado === 'def' && md === 'estr' ? 0.1 : 0);"""

NOVO = """/* FASE 367 — fatores estratégicos de uma batalha.
   Tecnologia, terreno, logística e suprimento decidem tanto quanto o número
   de tropas. O defensor luta em casa; o atacante precisa de linha de suprimento. */
function fatoresGuerra(p, lado) {
  const b = p.buildings || {};
  /* tecnologia militar */
  const tech = techLevel(p, 'guerra_terrestre') * 0.045
             + techLevel(p, 'guerra_aerea') * 0.035
             + techLevel(p, 'guerra_naval') * 0.030
             + techLevel(p, 'drones_militares') * 0.030
             + techLevel(p, 'guerra_cibernetica') * 0.025;
  /* terreno: quem defende conhece o próprio solo */
  const infra = ownProvinces(p).reduce((s, pr) => s + (pr.infra || 0), 0);
  const provs = Math.max(1, ownProvinces(p).length);
  const terreno = lado === 'def' ? 0.10 + (infra / provs) * 0.035 : 0;
  /* logística: estradas, portos e centros sustentam a ofensiva */
  const logistica = Math.min(0.25,
      (b.estrada || 0) * 0.020 + (b.ferrovia || 0) * 0.025 +
      (b.porto || 0) * 0.030 + (b.centro_logistico || 0) * 0.050 +
      (b.armazem || 0) * 0.030 + (b.aeroporto || 0) * 0.020);
  /* suprimento: tropa sem comida nem energia luta mal */
  const suprimento = (taxaSuprimento(p) - 0.5) * 0.30;
  /* doutrina e ministro da defesa */
  const ministro = ministroEfeito(p, 'def', 'militar') + ministroEfeito(p, 'def', 'defesa');
  /* sanções e bloqueios corroem a capacidade de combate */
  const pressao = (p.sanctionedBy || []).length * -0.03 + (p.blockadedBy || []).length * -0.05;
  return { tech, terreno, logistica, suprimento, ministro, pressao,
           total: tech + terreno + logistica + suprimento + ministro + pressao };
}

function montarExercito(p, lado) {
  const tipos = [];
  for (const t of Object.keys(BT)) {
    if (t === 'milicia') continue;
    const n = (p.units && p.units[t]) || 0;
    for (let i = 0; i < n; i++) tipos.push(t);
  }
  // quem não tem forças treinadas luta com milícia proporcional ao poder militar
  const nMil = Math.max(3, Math.min(8, Math.round((p.mil || 1) / 2)));
  for (let i = 0; i < nMil; i++) tipos.push('milicia');
  const md = ((p.ministers || {}).def);
  const fg = fatoresGuerra(p, lado);
  const bonus = 1 + (p.mil || 0) * 0.02
    + (lado === 'atk' && md === 'fal' ? 0.1 : 0)
    + (lado === 'def' && md === 'estr' ? 0.1 : 0)
    + fg.total;"""

assert s.count(ANT) == 1, 'montarExercito'
s = s.replace(ANT, NOVO)
ok('guerra estrategica: tecnologia, terreno, logistica, suprimento, sancoes')

# ---- batalha informa os fatores no log
ANT2 = """  btLog(b, `⚔️ BATALHA CAMPO ABERTO — ${cname(atk)} invade ${cname(def)}!`);"""
NOVO2 = """  btLog(b, `⚔️ BATALHA CAMPO ABERTO — ${cname(atk)} invade ${cname(def)}!`);
  /* FASE 367: transparência dos fatores estratégicos */
  const fa = fatoresGuerra(atk, 'atk'), fd = fatoresGuerra(def, 'def');
  const pct = v => (v >= 0 ? '+' : '') + Math.round(v * 100) + '%';
  btLog(b, `📊 ${cname(atk)}: tech ${pct(fa.tech)} · logística ${pct(fa.logistica)} · suprimento ${pct(fa.suprimento)}`);
  btLog(b, `📊 ${cname(def)}: tech ${pct(fd.tech)} · terreno ${pct(fd.terreno)} · logística ${pct(fd.logistica)}`);
  /* FASE 368: o mundo reage à agressão */
  reacaoDiplomatica(room, atk, def);"""
assert s.count(ANT2) == 1, 'log da batalha'
s = s.replace(ANT2, NOVO2)
ok('fatores exibidos + reacao diplomatica disparada')

# ==================================================== 368: IA DIPLOMÁTICA REATIVA
ANT3 = "function iniciarBatalha(room, atk, def) {"
NOVO3 = """/* FASE 368 — IA DIPLOMÁTICA REATIVA
   Quando uma nação ataca, as outras não ficam paradas: condenam, oferecem
   aliança ao agredido, aplicam sanções ou bloqueiam. Depende de relação,
   ideologia, doutrina e se há pacto prévio. */
function reacaoDiplomatica(room, atk, def) {
  for (const o of room.players) {
    if (!o.alive || o.id === atk.id || o.id === def.id) continue;
    const relAtk = relBetween(o, atk), relDef = relBetween(o, def);
    const r = Math.random();

    /* aliado do agredido entra em guerra contra o agressor */
    if (o.allies.includes(def.id) && !o.wars.includes(atk.id) && r < 0.75) {
      o.wars.push(atk.id); atk.wars.push(o.id);
      bumpRel(o, atk, -30); bumpRel(o, def, +12);
      log(room, `🤝 ${cname(o)} honrou a aliança e DECLAROU GUERRA a ${cname(atk)}.`);
      record(room, `⚔️ ${cname(o)} entrou na guerra ao lado de ${cname(def)} (dia ${room.day}).`);
      continue;
    }
    /* inimigo do agressor aproveita para sancionar */
    if (relAtk < 30 && !o.sanctioning.includes(atk.id) && r < 0.55) {
      o.sanctioning.push(atk.id); atk.sanctionedBy.push(o.id);
      bumpRel(o, atk, -12);
      log(room, `🚫 ${cname(o)} aplicou SANÇÕES a ${cname(atk)} após a agressão.`);
      continue;
    }
    /* amigo do agredido oferece ajuda */
    if (relDef > 65 && r < 0.35) {
      const ajuda = Math.min(o.money, 400);
      if (ajuda > 50) {
        o.money -= ajuda; def.money += ajuda;
        bumpRel(o, def, +8); bumpRel(o, atk, -8);
        log(room, `💸 ${cname(o)} enviou $${ajuda} de ajuda humanitária a ${cname(def)}.`);
      }
      continue;
    }
    /* pacifista condena publicamente */
    if ((o.ministers && o.ministers.def === 'pac') || o.ideology === 'democracia') {
      if (r < 0.45) {
        bumpRel(o, atk, -6); bumpRel(o, def, +4);
        log(room, `🕊️ ${cname(o)} CONDENOU publicamente a agressão de ${cname(atk)}.`);
      }
      continue;
    }
    /* oportunista aproveita a distração */
    if (relAtk < 45 && relDef > 25 && r > 0.88) {
      bumpRel(o, def, -5);
      log(room, `🌍 ${cname(o)} observa o conflito com atenção — pode haver oportunismo.`);
    }
  }
}

function iniciarBatalha(room, atk, def) {"""
assert s.count(ANT3) == 1, 'iniciarBatalha'
s = s.replace(ANT3, NOVO3)
ok('IA diplomatica reativa: alianca, sancoes, ajuda, condenacao')

# ==================================================== 366: EVENTO SISTÊMICO NA CRISE
ANT4 = "  log(room, `${dmg} atinge ${cname(pick)}! Abra 🚨 CRISES e escolha como responder.`);"
NOVO4 = ANT4 + """
  /* FASE 366: 40% das crises viram evento sistêmico — mexe em vários sistemas */
  if (Math.random() < 0.40) dispararEventoSistemico(room, pick);"""
assert s.count(ANT4) == 1, 'log da crise'
s = s.replace(ANT4, NOVO4)
ok('crise agora pode virar evento sistemico (40%)')

# ==================================================== 369: ESPIONAGEM COM RISCO
ANT5 = """    case 'sabotagem': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, dipCost(p, 150))) return;"""
NOVO5 = """    case 'sabotagem': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, dipCost(p, 150))) return;
      /* FASE 369: risco real de ser descoberto */
      if (Math.random() < riscoEspionagem(p, target) * 0.55) {
        bumpRel(target, p, -22);
        p.aprov = Math.max(0, (p.aprov || 0) - 4);
        log(room, `🕵️❌ ${cname(target)} DESCOBRIU agentes de ${cname(p)}! Relações despencam (−22) e há escândalo interno.`);
        record(room, `🕵️ Operação de ${cname(p)} descoberta por ${cname(target)} (dia ${room.day}).`);
        target.crise = target.crise || { tipo: 'espionagem', dia: room.day };
        break;
      }"""
assert s.count(ANT5) == 1, 'case sabotagem'
s = s.replace(ANT5, NOVO5)
ok('sabotagem pode ser descoberta: relacoes, aprovação e crise')

# ---- espionar também tem risco (menor)
ANT6 = """      info(p.conn, `🕵️ Relatório sobre ${cname(target)} — Caixa $${Math.round(target.money)} | Eco ${target.eco} | Mil ${target.mil} | ❤️ ${target.aprov}% | ☢️ ${target.nuclear} | ⚖️ ${target.influencia} | 🕌 ${target.fe} | Dívida $${target.debt}`);
      break;"""
NOVO6 = """      /* FASE 369: espionar também pode ser descoberto (risco menor) */
      if (Math.random() < riscoEspionagem(p, target) * 0.30) {
        bumpRel(target, p, -14);
        log(room, `🕵️⚠️ ${cname(target)} detectou espionagem de ${cname(p)} (−14 relações).`);
      }
      info(p.conn, `🕵️ Relatório sobre ${cname(target)} — Caixa $${Math.round(target.money)} | Eco ${target.eco} | Mil ${target.mil} | ❤️ ${target.aprov}% | ☢️ ${target.nuclear} | ⚖️ ${target.influencia} | 🕌 ${target.fe} | Dívida $${target.debt}`);
      break;"""
assert s.count(ANT6) == 1, 'case espionar'
s = s.replace(ANT6, NOVO6)
ok('espionagem pode ser detectada')

io.open(P, 'w', encoding='utf-8').write(s)
print('\nLIGACOES aplicadas. %d -> %d bytes (+%d)' % (len(orig), len(s), len(s) - len(orig)))
