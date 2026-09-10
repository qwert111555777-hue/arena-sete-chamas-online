# -*- coding: utf-8 -*-
"""
FASES 381-383 — os 3 itens ALTO restantes da 2ª auditoria

381 (22) COMPOSIÇÃO MILITAR — vantagem situacional entre tipos de unidade.
         "Meu exército é melhor em X, pior em Y."
382 (23) MERCADO DINÂMICO  — preço reage a oferta, demanda, guerra e sanções.
383 (24) CADEIA DE EVENTOS — um evento pode gerar outro conforme as condições.
"""
import io, sys

P = '/home/user/presidente-online/server.js'
s = io.open(P, encoding='utf-8').read()
orig = s
ok = lambda m: sys.stdout.write('  ok: %s\n' % m)

# ======================================= 381: vantagem entre unidades
ANT = "const BT_COLS = 7, BT_LINHAS = 6;"
NOVO = """/* FASE 381 — COMPOSIÇÃO MILITAR
   Não basta contar tropas: cada tipo é forte contra uns e fraco contra outros.
   Isso faz a composição do exército importar tanto quanto o tamanho. */
const BT_VANTAGEM = {
  infantaria:   { contra:['artilharia','submarinos'],  mult:1.35, fraca:['blindados','aviacao'] },
  blindados:    { contra:['infantaria','artilharia'],  mult:1.35, fraca:['aviacao','artilharia'] },
  artilharia:   { contra:['blindados','infantaria'],   mult:1.30, fraca:['aviacao','frota'] },
  aviacao:      { contra:['blindados','frota'],        mult:1.40, fraca:['frota','porta_avioes'] },
  frota:        { contra:['artilharia','aviacao'],     mult:1.25, fraca:['submarinos','aviacao'] },
  submarinos:   { contra:['frota','porta_avioes'],     mult:1.45, fraca:['infantaria','aviacao'] },
  porta_avioes: { contra:['aviacao','submarinos'],     mult:1.20, fraca:['submarinos','frota'] },
  milicia:      { contra:[],                           mult:1.00, fraca:[] }
};
function vantagemUnidade(atacante, defensor) {
  const v = BT_VANTAGEM[atacante];
  if (!v) return { mult: 1, tipo: '' };
  if ((v.contra || []).includes(defensor)) return { mult: v.mult, tipo: 'forte' };
  if ((v.fraca || []).includes(defensor))  return { mult: 1 / v.mult, tipo: 'fraco' };
  return { mult: 1, tipo: '' };
}
/* resumo legível da composição do exército — para o log da batalha */
function resumoComposicao(p) {
  const u = p.units || {};
  const partes = [];
  for (const k of Object.keys(BT_VANTAGEM)) {
    if (k === 'milicia') continue;
    const n = u[k] || 0; if (!n) continue;
    partes.push(BT[k].em + n);
  }
  return partes.length ? partes.join(' ') : 'só milícia';
}
const BT_COLS = 7, BT_LINHAS = 6;"""
assert s.count(ANT) == 1, 'BT_COLS'
s = s.replace(ANT, NOVO)
ok('BT_VANTAGEM + vantagemUnidade + resumoComposicao')

# ---- aplica no dano
ANT = """  const dano = Math.max(1, Math.round(u.atk * (0.85 + Math.random() * 0.4) - alvo.def * 0.4));"""
if s.count(ANT) == 1:
    NOVO = """  /* FASE 381: vantagem de composição entra no dano */
  const vg = vantagemUnidade(u.tipo, alvo.tipo);
  const dano = Math.max(1, Math.round(u.atk * vg.mult * (0.85 + Math.random() * 0.4) - alvo.def * 0.4));"""
    s = s.replace(ANT, NOVO)
    ok('vantagem aplicada no calculo de dano')
else:
    sys.stdout.write('  AVISO: linha do dano nao encontrada, vantagem nao aplicada\n')

# ---- mostra no log
ANT = """  btLog(b, `${BT[u.tipo].em} ${BT[u.tipo].nome} atinge ${BT[alvo.tipo].em} ${BT[alvo.tipo].nome}: -${dano} HP` +"""
if s.count(ANT) == 1:
    NOVO = """  btLog(b, `${BT[u.tipo].em} ${BT[u.tipo].nome} atinge ${BT[alvo.tipo].em} ${BT[alvo.tipo].nome}: -${dano} HP` +
    (vg.tipo === 'forte' ? ` 💥 VANTAGEM (×${vg.mult.toFixed(2)})` : (vg.tipo === 'fraco' ? ` ⚠️ em desvantagem (×${vg.mult.toFixed(2)})` : '')) +"""
    s = s.replace(ANT, NOVO)
    ok('vantagem exibida no log da batalha')
else:
    sys.stdout.write('  AVISO: log da batalha nao encontrado\n')

# ---- mostra a composicao na abertura
ANT = """  btLog(b, `📊 ${cname(def)}: tech ${pct(fd.tech)} · terreno ${pct(fd.terreno)} · logística ${pct(fd.logistica)}`);"""
if s.count(ANT) == 1:
    NOVO = ANT + """
  btLog(b, `🎖️ ${cname(atk)}: ${resumoComposicao(atk)}`);
  btLog(b, `🎖️ ${cname(def)}: ${resumoComposicao(def)}`);"""
    s = s.replace(ANT, NOVO)
    ok('composicao dos exercitos exibida na abertura')

# ======================================= 382: mercado dinâmico
ANT = "  for (const k of Object.keys(room.market)) room.market[k] = Math.max(3, Math.min(40, Math.round(room.market[k] * (0.88 + Math.random() * 0.3))));"
NOVO = """  /* FASE 382 — MERCADO DINÂMICO
     Preço deixa de ser passeio aleatório e passa a refletir oferta, demanda,
     guerra e sanções. Excedente derruba o preço; escassez encarece. */
  atualizarMercado(room);"""
assert s.count(ANT) == 1, 'linha do mercado'
s = s.replace(ANT, NOVO)
ok('mercado agora calculado por atualizarMercado()')

ANT = "function resolveWeek(room) {"
NOVO = """/* FASE 382 — preço por oferta e demanda */
function atualizarMercado(room) {
  const vivos = room.players.filter(p => p.alive && !p.botEliminado);
  for (const k of Object.keys(room.market)) {
    let oferta = 0, demanda = 0;
    for (const p of vivos) {
      for (const b in (p.buildings || {})) {
        const n = p.buildings[b] || 0; if (!n) continue;
        const o = BUILD_OUT[b]; if (!o) continue;
        if (o.res === k) oferta += n * o.qtd;
        const ins = INSUMOS[b];
        if (ins && ins.res === k) demanda += n * ins.qtd;
      }
      /* estoque parado também conta como oferta */
      oferta += Math.floor(((p.rec && p.rec[k]) || 0) / 40);
      /* população consome comida e energia */
      if (k === 'comida') demanda += Math.floor((p.pop || 0) / 12);
      if (k === 'energia') demanda += Math.floor((p.pop || 0) / 20);
    }
    const base = room.market[k];
    const ratio = demanda > 0 ? (oferta / demanda) : 2;
    let alvo = base;
    if (ratio > 1.6)      alvo = base * 0.93;   /* sobra: preço cai */
    else if (ratio > 1.1) alvo = base * 0.98;
    else if (ratio < 0.5) alvo = base * 1.14;   /* falta: preço sobe */
    else if (ratio < 0.8) alvo = base * 1.07;
    /* guerra e sanções encarecem o mundo inteiro */
    const guerras = vivos.reduce((n, p) => n + (p.wars || []).length, 0);
    const sancoes = vivos.reduce((n, p) => n + (p.sanctionedBy || []).length, 0);
    if (guerras > 0)  alvo *= 1 + Math.min(0.10, guerras * 0.012);
    if (sancoes > 0)  alvo *= 1 + Math.min(0.08, sancoes * 0.010);
    /* leve ruído para não ficar determinístico */
    alvo += (Math.random() * 1.6 - 0.8);
    room.market[k] = Math.max(3, Math.min(80, Math.round(alvo)));
  }
  room.marketAtualizadoEm = room.day || 0;
}

function resolveWeek(room) {"""
assert s.count(ANT) == 1, 'resolveWeek'
s = s.replace(ANT, NOVO)
ok('atualizarMercado() criada (oferta/demanda/guerra/sancoes)')

# ======================================= 383: cadeia de eventos
ANT = "function dispararEventoSistemico(room, p) {"
NOVO = """/* FASE 383 — CADEIA DE EVENTOS
   Um evento planta uma consequência. Não é sorte: depende de como o país
   reagiu. Pandemia sem hospital vira revolta; revolta mal contida vira
   crise financeira. */
const EVENTOS_ENCADEADOS = {
  pandemia: {
    se: p => ((p.buildings && p.buildings.hospital) || 0) < 2 || (p.aprov || 100) < 40,
    proximo: 'revolta', delay: 2,
    texto: 'A pandemia mal administrada virou revolta popular.'
  },
  seca: {
    se: p => !!(p.famine),
    proximo: 'revolta', delay: 3,
    texto: 'A fome gerada pela seca virou revolta popular.'
  },
  crise_financeira: {
    se: p => (p.aprov || 100) < 45,
    proximo: 'revolta', delay: 3,
    texto: 'A crise econômica derrubou a confiança no governo.'
  },
  terremoto: {
    se: p => true,
    proximo: 'crise_financeira', delay: 4,
    texto: 'Os custos da reconstrução pesaram nas contas públicas.'
  },
  revolta: {
    se: p => (p.aprov || 100) < 28,
    proximo: 'crise_financeira', delay: 2,
    texto: 'A instabilidade afugentou investidores.'
  }
};

function agendarDesdobramento(p, eventoKey) {
  const cadeia = EVENTOS_ENCADEADOS[eventoKey];
  if (!cadeia) return;
  try { if (!cadeia.se(p)) return; } catch (e) { return; }
  p.eventosPendentes = p.eventosPendentes || [];
  if (p.eventosPendentes.some(x => x.evt === cadeia.proximo)) return;  // sem duplicar
  p.eventosPendentes.push({ evt: cadeia.proximo, dia: DIA_ATUAL + (cadeia.delay || 2), texto: cadeia.texto });
}

function processarDesdobramentos(room, p) {
  if (!p.eventosPendentes || !p.eventosPendentes.length) return;
  const prontos = p.eventosPendentes.filter(x => room.day >= x.dia);
  if (!prontos.length) return;
  p.eventosPendentes = p.eventosPendentes.filter(x => room.day < x.dia);
  for (const pd of prontos) {
    const ev = EVENTOS_SISTEMICOS[pd.evt];
    if (!ev) continue;
    if (pd.texto) log(room, `⛓️ ${pd.texto}`);
    ev.aplicar(room, p);
    agendarDesdobramento(p, pd.evt);   /* a cadeia pode continuar */
  }
}

function dispararEventoSistemico(room, p) {"""
assert s.count(ANT) == 1, 'dispararEventoSistemico'
s = s.replace(ANT, NOVO)
ok('EVENTOS_ENCADEADOS + agendar/processar desdobramentos')

# ---- dispara a cadeia depois de aplicar o evento
ANT = """  const txt = ev.aplicar(room, p);
  log(room, `${ev.nome} ${txt}`);
  return k;"""
if s.count(ANT) == 1:
    NOVO = """  const txt = ev.aplicar(room, p);
  log(room, `${ev.nome} ${txt}`);
  agendarDesdobramento(p, k);
  return k;"""
    s = s.replace(ANT, NOVO)
    ok('evento sorteia desdobramento ao acontecer')
else:
    sys.stdout.write('  AVISO: corpo do dispararEventoSistemico nao encontrado\n')

# ---- processa no tick
ANT = """    const dep = p.depositos || [];
    if (dep.includes('petroleo')) p.rec.energia += 2 / DAY_DIV;"""
if s.count(ANT) == 1:
    NOVO = """    /* FASE 383: desdobramentos de eventos passados */
    processarDesdobramentos(room, p);
    const dep = p.depositos || [];
    if (dep.includes('petroleo')) p.rec.energia += 2 / DAY_DIV;"""
    s = s.replace(ANT, NOVO)
    ok('desdobramentos processados no tick diario')
else:
    sys.stdout.write('  AVISO: ancora do tick nao encontrada\n')

io.open(P, 'w', encoding='utf-8').write(s)
print('\nFASES 381-383 aplicadas. %d -> %d bytes (+%d)' % (len(orig), len(s), len(s) - len(orig)))
