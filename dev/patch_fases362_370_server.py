# -*- coding: utf-8 -*-
"""
FASES 362-370 (SERVIDOR) — itens 7, 10, 11, 12, 19 do avaliador

362/365: ECONOMIA INTERLIGADA  -> recursos -> producao -> industria -> empregos -> PIB -> receita
366:     EVENTOS SISTEMICOS    -> crise altera pop/economia/infra/diplomacia
367:     LEIS COM CONSEQUENCIA -> grupos politicos reagem
368:     MINISTROS REAIS       -> cada ministro altera varios sistemas
369:     ESPIONAGEM COM RISCO  -> operacao pode ser descoberta e gerar crise

Tudo aditivo: nada que existia deixa de funcionar.
"""
import io, sys

P = '/home/user/presidente-online/server.js'
s = io.open(P, encoding='utf-8').read()
orig = s
ok = lambda m: sys.stdout.write('  ok: %s\n' % m)

# ============================================================ 365: INSUMOS
ANCLA_INSUMOS = "const upM = (p, k) => 1 + 0.5 * ((p.upgrades && p.upgrades[k]) || 0);"
assert s.count(ANCLA_INSUMOS) == 1, 'ancora upM'

BLOCO = ANCLA_INSUMOS + """

/* ============================================================
   FASE 365 — CADEIA ECONÔMICA INTERLIGADA
   recursos → produção → indústria → empregos → PIB → receita
   Indústrias de transformação CONSOMEM insumos. Sem insumo,
   rendem menos. Isso cria dependência real entre os setores.
   ============================================================ */
const INSUMOS = {
  /* metal-mecânica */
  siderurgica:{res:'minerio',qtd:4}, fabrica:{res:'minerio',qtd:2},
  montadora:{res:'minerio',qtd:3}, caminhoes:{res:'minerio',qtd:2},
  motores:{res:'minerio',qtd:2}, maquinas:{res:'minerio',qtd:2},
  estaleiro_naval:{res:'minerio',qtd:3}, estaleiro:{res:'minerio',qtd:2},
  vidro:{res:'minerio',qtd:2}, quimica:{res:'minerio',qtd:2},
  fertilizantes:{res:'minerio',qtd:2},
  /* energia-intensivas */
  refinaria:{res:'energia',qtd:3}, petroquimica:{res:'energia',qtd:4},
  plastico:{res:'energia',qtd:2}, aluminio:{res:'energia',qtd:3},
  /* alimentos */
  padaria:{res:'comida',qtd:3}, processados:{res:'comida',qtd:4},
  frigorifico:{res:'carne',qtd:3}, laticinios:{res:'carne',qtd:2},
  cervejaria:{res:'comida',qtd:2}, vinicola:{res:'comida',qtd:2},
  doces:{res:'comida',qtd:2}, cafe:{res:'comida',qtd:2},
  cacau:{res:'comida',qtd:2}, oleo_vegetal:{res:'comida',qtd:3},
  farmaceutica:{res:'comida',qtd:2},
  /* madeira */
  papel:{res:'madeira',qtd:3}, moveis:{res:'madeira',qtd:4},
  tecelagem:{res:'madeira',qtd:2}, couro:{res:'carne',qtd:2},
  /* alta tecnologia */
  eletronicos:{res:'terras_raras',qtd:2}, semicondutores:{res:'terras_raras',qtd:3},
  baterias:{res:'terras_raras',qtd:2}, aeronaves:{res:'terras_raras',qtd:2},
  paineis_solares:{res:'terras_raras',qtd:1},
  /* nuclear */
  usina_nuclear:{res:'uranio',qtd:1}, reator_torio:{res:'uranio',qtd:1}
};

function insumoNecessario(p) {
  const need = {};
  for (const k in (p.buildings || {})) {
    const n = p.buildings[k] || 0; if (!n) continue;
    const ins = INSUMOS[k]; if (!ins || !ins.qtd) continue;
    need[ins.res] = (need[ins.res] || 0) + n * ins.qtd;
  }
  return need;
}

/* 0..1 — quanto da demanda industrial o país consegue suprir */
function taxaSuprimento(p) {
  const need = insumoNecessario(p), ks = Object.keys(need);
  if (!ks.length) return 1;
  let soma = 0;
  for (const r of ks) soma += Math.min(1, ((p.rec && p.rec[r]) || 0) / Math.max(1, need[r]));
  return soma / ks.length;
}

function empregosOf(p) {
  let jobs = 0;
  for (const k in (p.buildings || {})) { const n = p.buildings[k] || 0; if (n) jobs += n * 9; }
  jobs += Math.floor(sectorSum(p) * 45) + Math.floor((p.mil || 0) * 2);
  return jobs;
}

function pibOf(p) {
  let v = 0;
  for (const k in (p.buildings || {})) {
    const n = p.buildings[k] || 0; if (!n) continue;
    const o = BUILD_OUT[k]; if (!o) continue;
    v += n * (((o.money || 0) * 42) + ((o.qtd || 0) * 9));
  }
  v += (p.eco || 0) * 260 + Math.floor(p.pop || 0) * 3 + sectorSum(p) * 120
     + (p.allies || []).length * 90 + (p.trades || []).length * 60;
  v *= 0.35 + 0.65 * taxaSuprimento(p);
  return Math.round(Math.max(0, v));
}

/* ============================================================
   FASE 367 — LEIS COM CONSEQUÊNCIA POLÍTICA
   Cada lei agrada e desagrada grupos. A soma vira pressão.
   ============================================================ */
const LEI_GRUPOS = {
  servico_militar:   { militares:+20, pacifistas:-25, empresarios:0,  religiosos:0,  intelectuais:-5 },
  guarda_nacional:   { militares:+12, pacifistas:-10, empresarios:+5, religiosos:0,  intelectuais:0 },
  reforma_agraria:   { militares:-5,  pacifistas:+10, empresarios:-15,religiosos:+5, intelectuais:+8 },
  abertura_comercial:{ militares:0,   pacifistas:+5,  empresarios:+22,religiosos:0,  intelectuais:+10 },
  liberdade_imprensa:{ militares:-8,  pacifistas:+12, empresarios:+5, religiosos:-5, intelectuais:+20 },
  campanha_patriotica:{militares:+15, pacifistas:-8,  empresarios:+3, religiosos:+8, intelectuais:-12 },
  ensino_obrigatorio:{ militares:0,   pacifistas:+8,  empresarios:-4, religiosos:-3, intelectuais:+18 },
  estado_direito:    { militares:-6,  pacifistas:+14, empresarios:+12,religiosos:0,  intelectuais:+16 },
  teto_gastos:       { militares:+3,   pacifistas:-6,  empresarios:+18,religiosos:0,  intelectuais:-8 },
  reforma_trabalhista:{militares:0,   pacifistas:-10, empresarios:+20,religiosos:0,  intelectuais:-6 },
  lei_marcal:        { militares:+18,  pacifistas:-20, empresarios:-8, religiosos:+4, intelectuais:-10 }
};

function gruposPoliticos(p) {
  const g = { militares: 0, pacifistas: 0, empresarios: 0, religiosos: 0, intelectuais: 0 };
  for (const lei of (p.leis || [])) {
    const m = LEI_GRUPOS[lei]; if (!m) continue;
    for (const k in m) g[k] += m[k];
  }
  /* religião de estado influencia o grupo religioso */
  if (p.religiaoEstado) g.religiosos += 12; else g.religiosos -= 8;
  /* imposto alto desagrada empresários */
  if (p.taxRate === 2) { g.empresarios -= 18; g.pacifistas += 5; }
  if (p.taxRate === 0) { g.empresarios += 15; g.intelectuais -= 4; }
  return g;
}

/* pressão política líquida: positiva = apoio, negativa = contestação */
function pressaoPolitica(p) {
  const g = gruposPoliticos(p);
  let soma = 0, n = 0;
  for (const k in g) { soma += g[k]; n++; }
  return Math.round(soma / n);
}

/* ============================================================
   FASE 368 — MINISTROS REAIS
   Cada ministro altera VÁRIOS sistemas, não só um número.
   ============================================================ */
const MINISTRO_EFEITOS = {
  eco: {
    tec: { renda:+0.10, pesquisa:+0.06, aprovacao:-1, desemprego:-0.02 },
    pop: { renda:-0.05, pesquisa:0,     aprovacao:+1, desemprego:-0.04 },
    ind: { renda:+0.20, pesquisa:-0.03, aprovacao:0,  desemprego:-0.06 }
  },
  def: {
    pac: { renda:-0.10, defesa:-0.05, aprovacao:+2, militar:-0.08 },
    agu: { renda:-0.02, defesa:+0.12, aprovacao:-2, militar:+0.15 },
    eq:  { renda:0,     defesa:+0.05, aprovacao:+1, militar:+0.05 }
  },
  soc: {
    art: { aprovacao:+1, cultura:+0.15, doutrina:+0.08, renda:-0.02 },
    atl: { aprovacao:0,  cultura:-0.05, doutrina:0,     renda:+0.05 }
  }
};

function ministroEfeito(p, pasta, campo) {
  const escolha = p.ministers && p.ministers[pasta];
  if (!escolha) return 0;
  const t = MINISTRO_EFEITOS[pasta] && MINISTRO_EFEITOS[pasta][escolha];
  return (t && t[campo]) || 0;
}

/* ============================================================
   FASE 369 — ESPIONAGEM COM RISCO
   ============================================================ */
function riscoEspionagem(p, alvo) {
  const defesa = (alvo.techLv && alvo.techLv.contraespionagem) || 0;
  const seg = (alvo.seguranca && alvo.seguranca.espiao) || 0;
  const base = 0.34 - defesa * 0.05 - seg * 0.04
             + ((alvo.ideology === 'autoritarismo') ? 0.08 : 0)
             + ministroEfeito(alvo, 'def', 'militar') * 0.2;
  return Math.max(0.05, Math.min(0.7, base));
}

/* ============================================================
   FASE 366 — EVENTOS SISTÊMICOS
   Um desastre mexe em vários sistemas de uma vez.
   ============================================================ */
const EVENTOS_SISTEMICOS = {
  terremoto: {
    nome: '🌪️ Terremoto',
    aplicar: (room, p) => {
      const mortes = Math.floor((p.pop || 0) * (0.004 + Math.random() * 0.012));
      p.pop = Math.max(0, (p.pop || 0) - mortes);
      p.money = Math.max(0, p.money - 900);
      for (const pr of p.provinces) if (pr.owner === p.id && Math.random() < 0.28 && pr.infra > 1) pr.infra -= 1;
      p.aprov = Math.max(0, p.aprov - 5);
      p.emergencyUntil = (room.turn || 0) + 6;
      return `Terremoto em ${cname(p)}: ${mortes} mortos, infraestrutura danificada, estado de emergência.`;
    }
  },
  seca: {
    nome: '🌵 Seca prolongada',
    aplicar: (room, p) => {
      p.rec.comida = Math.max(0, (p.rec.comida || 0) * 0.45);
      p.famine = true;
      p.aprov = Math.max(0, p.aprov - 7);
      return `Seca em ${cname(p)}: produção de alimentos pela metade e risco de fome.`;
    }
  },
  crise_financeira: {
    nome: '📉 Crise financeira',
    aplicar: (room, p) => {
      p.money = Math.max(0, p.money * 0.78);
      p.taxRate = Math.max(0, (p.taxRate || 1) - 1);
      p.aprov = Math.max(0, p.aprov - 9);
      return `Crise financeira em ${cname(p)}: reservas derretem e arrecadação cai.`;
    }
  },
  pandemia: {
    nome: '🦠 Pandemia',
    aplicar: (room, p) => {
      const mortes = Math.floor((p.pop || 0) * 0.006);
      p.pop = Math.max(0, (p.pop || 0) - mortes);
      const hosp = (p.buildings && p.buildings.hospital) || 0;
      if (hosp >= 3) { p.aprov = Math.max(0, p.aprov - 1); }
      else { p.aprov = Math.max(0, p.aprov - 8); }
      p.emergencyUntil = (room.turn || 0) + 4;
      return `Pandemia em ${cname(p)}: ${mortes} mortos` + (hosp >= 3 ? ', mas a rede hospitalar segurou a crise.' : ', sistema de saúde insuficiente.');
    }
  },
  revolta: {
    nome: '✊ Revolta popular',
    aplicar: (room, p) => {
      p.aprov = Math.max(0, p.aprov - 14);
      p.mil = Math.max(1, Math.round((p.mil || 1) * 0.94));
      p.pollution = Math.min(100, (p.pollution || 0) + 3);
      return `Revolta popular em ${cname(p)}: aprovação despenca e tropas se desorganizam.`;
    }
  },
  boom: {
    nome: '📈 Boom econômico',
    aplicar: (room, p) => {
      p.money += 1200;
      p.aprov = Math.min(100, (p.aprov || 0) + 8);
      return `Boom econômico em ${cname(p)}: investimentos externos e otimismo popular.`;
    }
  }
};

function dispararEventoSistemico(room, p) {
  const ks = Object.keys(EVENTOS_SISTEMICOS);
  const k = ks[Math.floor(Math.random() * ks.length)];
  const ev = EVENTOS_SISTEMICOS[k];
  const txt = ev.aplicar(room, p);
  log(room, `${ev.nome} ${txt}`);
  return k;
}"""

s = s.replace(ANCLA_INSUMOS, BLOCO, 1)
ok('FASE 365/366/367/368/369: constantes e funcoes injetadas')

# ================================================ 365: ligar na renda (incomeOf)
RENDA_ANTES = """  let bldMoney = 0;
  for (const k in p.buildings) {
    const n = p.buildings[k] || 0; if (!n) continue;
    const o = BUILD_OUT[k]; if (!o || !o.money) continue;
    bldMoney += n * o.money * upM(p, k) * (p.ministers.eco === 'ind' ? 1.2 : 1);
  }"""
RENDA_DEPOIS = """  /* FASE 365: indústria só rende bem se tiver insumo — cadeia produtiva real */
  const _sup = taxaSuprimento(p);
  let bldMoney = 0;
  for (const k in p.buildings) {
    const n = p.buildings[k] || 0; if (!n) continue;
    const o = BUILD_OUT[k]; if (!o || !o.money) continue;
    let v = n * o.money * upM(p, k) * (p.ministers.eco === 'ind' ? 1.2 : 1);
    if (INSUMOS[k]) v *= (0.30 + 0.70 * _sup);   /* indústria de transformação */
    bldMoney += v;
  }"""
assert s.count(RENDA_ANTES) == 1, 'bloco bldMoney do incomeOf'
s = s.replace(RENDA_ANTES, RENDA_DEPOIS)
ok('renda das industrias agora depende dos insumos')

BASE_ANTES = """  base += 20 * techLevel(p, 'valor_agreg');"""
BASE_DEPOIS = """  base += 20 * techLevel(p, 'valor_agreg');
  /* FASE 365: PIB e empregos alimentam a receita */
  base += Math.round(pibOf(p) / 90);
  /* FASE 368: ministros mexem em vários campos */
  base *= 1 + ministroEfeito(p, 'eco', 'renda') + ministroEfeito(p, 'soc', 'renda') + ministroEfeito(p, 'def', 'renda');
  /* FASE 367: pressão política das leis — país contestado arrecada menos */
  const _press = pressaoPolitica(p);
  if (_press < -12) base *= 0.88;
  else if (_press > 12) base *= 1.06;"""
assert s.count(BASE_ANTES) == 1, 'linha valor_agreg do incomeOf'
s = s.replace(BASE_ANTES, BASE_DEPOIS)
ok('PIB + ministros + pressao politica ligados a receita')

# ================================================ 365: consumo + PIB no tick
TICK_ANTES = """    const dep = p.depositos || [];
    if (dep.includes('petroleo')) p.rec.energia += 2 / DAY_DIV;"""
TICK_DEPOIS = """    /* FASE 365: a indústria CONSOME os insumos que os produtores geraram */
    const _need = insumoNecessario(p);
    for (const r in _need) {
      const take = Math.min((p.rec[r] || 0), _need[r] / DAY_DIV);
      p.rec[r] = (p.rec[r] || 0) - take;
    }
    p.suprimento = Math.round(taxaSuprimento(p) * 100);
    p.empregos = empregosOf(p);
    p.pib = pibOf(p);
    const dep = p.depositos || [];
    if (dep.includes('petroleo')) p.rec.energia += 2 / DAY_DIV;"""
assert s.count(TICK_ANTES) == 1, 'bloco de depositos no dayTick'
s = s.replace(TICK_ANTES, TICK_DEPOIS)
ok('consumo de insumos + empregos/PIB calculados no tick')

# ================================================ 365: expor no snapshot
SNAP_ANTES = "      pop: Math.round(p.pop), rec: floorRec(p.rec), xp: p.xp, bot: p.bot, customName: p.customName, customFlag: p.customFlag,"
SNAP_DEPOIS = ("      pop: Math.round(p.pop), rec: floorRec(p.rec), xp: p.xp, bot: p.bot, customName: p.customName, customFlag: p.customFlag,\n"
               "      pib: p.pib || pibOf(p), empregos: p.empregos || empregosOf(p),\n"
               "      suprimento: p.suprimento != null ? p.suprimento : Math.round(taxaSuprimento(p) * 100),\n"
               "      pressao: pressaoPolitica(p), grupos: gruposPoliticos(p),")
assert s.count(SNAP_ANTES) == 1, 'linha do snapshot'
s = s.replace(SNAP_ANTES, SNAP_DEPOIS)
ok('PIB/empregos/suprimento/grupos expostos ao cliente')

io.open(P, 'w', encoding='utf-8').write(s)
print('\nFASES 362-370 (servidor) aplicadas. %d -> %d bytes (+%d)' % (len(orig), len(s), len(s) - len(orig)))
