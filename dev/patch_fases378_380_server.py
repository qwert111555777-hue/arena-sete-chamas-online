# -*- coding: utf-8 -*-
"""
FASES 378-380 (SERVIDOR) — resposta à 2ª auditoria

378: MEMÓRIA DIPLOMÁTICA (item 21) — todo bumpRel registra motivo;
     bots escalam resposta contra agressores reincidentes.
379: HISTÓRICO DIPLOMÁTICO (item 26) — relação explicada por motivos.
380: EXPLICAÇÃO ECONÔMICA (item 25) — breakdown do PIB fator a fator.
"""
import io, sys

P = '/home/user/presidente-online/server.js'
s = io.open(P, encoding='utf-8').read()
orig = s
ok = lambda m: sys.stdout.write('  ok: %s\n' % m)

# ================================================ 378: dia atual + bumpRel com motivo
ANT = """function bumpRel(a, b, d) {
  const v = Math.max(0, Math.min(100, relBetween(a, b) + d));
  a.relations[b.id] = v; b.relations[a.id] = v;
}"""
NOVO = """/* FASE 378 — MEMÓRIA DIPLOMÁTICA
   O mundo não esquece. Cada mudança de relação guarda o motivo.
   Isso alimenta tanto a IA (escalada) quanto a UI (histórico visual). */
let DIA_ATUAL = 0;

function bumpRel(a, b, d, motivo) {
  const v = Math.max(0, Math.min(100, relBetween(a, b) + d));
  a.relations[b.id] = v; b.relations[a.id] = v;
  if (motivo && d) {
    const reg = { m: motivo, v: Math.round(d), d: DIA_ATUAL };
    for (const x of [a, b]) {
      if (!x) continue;
      if (!x.histRel) x.histRel = {};
      const outro = (x === a) ? b.id : a.id;
      if (!x.histRel[outro]) x.histRel[outro] = [];
      x.histRel[outro].unshift(reg);
      if (x.histRel[outro].length > 14) x.histRel[outro].length = 14;
    }
  }
}

/* lê a memória de um país sobre outro */
function memoriaRel(p, outroId) {
  const h = (p.histRel && p.histRel[outroId]) || [];
  let guerras = 0, traicoes = 0, ajudas = 0, sancoes = 0;
  for (const r of h) {
    const m = (r.m || '').toLowerCase();
    if (/guerra|ataque|invas|nuclear/.test(m)) guerras += 1;
    if (/sabot|espion|traic|calote/.test(m)) traicoes += 1;
    if (/ajuda|presente|com.rci|empr.stimo|acordo/.test(m)) ajudas += 1;
    if (/san..o|bloqueio|embargo/.test(m)) sancoes += 1;
  }
  const rancor = guerras * 16 + traicoes * 13 + sancoes * 7 - ajudas * 11;
  return { guerras, traicoes, ajudas, sancoes, rancor, total: h.length };
}"""
assert s.count(ANT) == 1, 'bumpRel'
s = s.replace(ANT, NOVO)
ok('bumpRel registra motivo; memoriaRel() criada')

# ================================================ 378: DIA_ATUAL no tick
ANT2 = "function dayTick(room) {\n  if (room.phase !== 'game' || room.paused) return;"
NOVO2 = "function dayTick(room) {\n  if (room.phase !== 'game' || room.paused) return;\n  DIA_ATUAL = room.day;"
assert s.count(ANT2) == 1, 'cabecalho do dayTick'
s = s.replace(ANT2, NOVO2)
ok('DIA_ATUAL atualizado no tick')

# ================================================ 378: IA escala com a memória
ANT3 = """    /* aliado do agredido entra em guerra contra o agressor */
    if (o.allies.includes(def.id) && !o.wars.includes(atk.id) && r < 0.75) {"""
NOVO3 = """    /* FASE 378: a memória endurece a resposta — agressor reincidente é tratado pior */
    const mem = memoriaRel(o, atk.id);
    const escalada = Math.min(0.30, Math.max(0, mem.rancor) * 0.012);
    const ajuste = escalada;

    /* aliado do agredido entra em guerra contra o agressor */
    if (o.allies.includes(def.id) && !o.wars.includes(atk.id) && r < 0.75 + ajuste) {"""
assert s.count(ANT3) == 1, 'aliado na reacao'
s = s.replace(ANT3, NOVO3)
ok('aliados reagem mais a agressores reincidentes (+escalada)')

ANT4 = """    /* inimigo do agressor aproveita para sancionar */
    if (relAtk < 30 && !o.sanctioning.includes(atk.id) && r < 0.55) {"""
NOVO4 = """    /* inimigo do agressor aproveita para sancionar */
    if ((relAtk < 30 || mem.rancor > 24) && !o.sanctioning.includes(atk.id) && r < 0.55 + ajuste) {"""
assert s.count(ANT4) == 1, 'sancao na reacao'
s = s.replace(ANT4, NOVO4)
ok('sancoes tambem consideram rancor acumulado')

ANT5 = """    /* pacifista condena publicamente */
    if ((o.ministers && o.ministers.def === 'pac') || o.ideology === 'democracia') {
      if (r < 0.45) {"""
NOVO5 = """    /* pacifista condena publicamente */
    if ((o.ministers && o.ministers.def === 'pac') || o.ideology === 'democracia') {
      if (r < 0.45 + ajuste) {"""
assert s.count(ANT5) == 1, 'condenacao na reacao'
s = s.replace(ANT5, NOVO5)
ok('condenacao publica escala com a memoria')

# ================================================ 379/380: breakdown do PIB
ANT6 = """function empregosOf(p) {"""
NOVO6 = """/* FASE 380 — EXPLICAÇÃO ECONÔMICA
   Devolve quanto cada fator contribui para o PIB. Sem isso o jogador olha
   para "siderúrgica rendendo 30%" e acha que é bug. */
function pibDetalhe(p) {
  let predios = 0;
  for (const k in (p.buildings || {})) {
    const n = p.buildings[k] || 0; if (!n) continue;
    const o = BUILD_OUT[k]; if (!o) continue;
    predios += n * (((o.money || 0) * 42) + ((o.qtd || 0) * 9));
  }
  const populacao = Math.floor(p.pop || 0) * 3 + (p.eco || 0) * 260;
  const setores = sectorSum(p) * 120;
  const comercio = (p.trades || []).length * 60;
  const aliados = (p.allies || []).length * 90;
  const bruto = predios + populacao + setores + comercio + aliados;
  const sup = taxaSuprimento(p);
  const mult = 0.35 + 0.65 * sup;
  const need = insumoNecessario(p);
  const faltando = Object.keys(need).filter(r => ((p.rec && p.rec[r]) || 0) < need[r]);
  return {
    predios: Math.round(predios * mult),
    populacao: Math.round(populacao * mult),
    setores: Math.round(setores * mult),
    comercio: Math.round(comercio * mult),
    aliados: Math.round(aliados * mult),
    suprimento: Math.round(bruto * (mult - 1)),
    total: Math.round(bruto * mult),
    taxaSuprimento: Math.round(sup * 100),
    insumosFaltando: faltando,
    /* alerta objetivo: o jogador precisa saber o que está travando a indústria */
    aviso: faltando.length
      ? ('Falta ' + faltando.slice(0, 3).join(', ').replace(/_/g, ' ') +
         ' — indústrias que dependem disso rendem apenas 30%.')
      : null
  };
}

function empregosOf(p) {"""
assert s.count(ANT6) == 1, 'empregosOf'
s = s.replace(ANT6, NOVO6)
ok('pibDetalhe() criado (breakdown + aviso de insumo faltante)')

# ================================================ expor no snapshot
ANT7 = """      pib: p.pib || pibOf(p), empregos: p.empregos || empregosOf(p),"""
NOVO7 = """      pib: p.pib || pibOf(p), empregos: p.empregos || empregosOf(p),
      pibDetalhe: pibDetalhe(p), histRel: (p.histRel && typeof p.histRel === 'object') ? p.histRel : {},"""
assert s.count(ANT7) == 1, 'pib no snapshot'
s = s.replace(ANT7, NOVO7)
ok('pibDetalhe e histRel expostos ao cliente')

# ================================================ motivos nas acoes-chave
MOTIVOS = [
  ("      p.wars.push(target.id); target.wars.push(p.id);\n      p.trades = p.trades.filter(id => id !== target.id);",
   None),  # placeholder, handled below
]

# guerra
a = "      p.wars.push(target.id); target.wars.push(p.id);"
if s.count(a) == 1:
    s = s.replace(a, a + "\n      bumpRel(p, target, -30, 'declarou guerra');")
    ok('guerra registra motivo')

# sabotagem descoberta
a = "        bumpRel(target, p, -22);"
if s.count(a) == 1:
    s = s.replace(a, "        bumpRel(target, p, -22, 'sabotagem descoberta');")
    ok('sabotagem registra motivo')

# espionagem detectada
a = "        bumpRel(target, p, -14);"
if s.count(a) == 1:
    s = s.replace(a, "        bumpRel(target, p, -14, 'espionagem detectada');")
    ok('espionagem registra motivo')

io.open(P, 'w', encoding='utf-8').write(s)
print('\nFASES 378-380 (servidor) aplicadas. %d -> %d bytes (+%d)' % (len(orig), len(s), len(s) - len(orig)))
