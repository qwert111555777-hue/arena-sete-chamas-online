# -*- coding: utf-8 -*-
"""
FASES 384-391 (SERVIDOR) — itens 27-38 da 2ª auditoria

384 (27) FEED MUNDIAL        — eventos importantes classificados por relevância
385 (28) COALIZÕES POLÍTICAS — grupos se unem contra o presidente
386 (29) PROTESTOS           — pressão alta gera manifestação com efeitos
387 (30) CRISES MINISTERIAIS — ministro falha, critica ou exige orçamento
388 (31) PAINEL "O QUE MUDOU"— deltas diários de tudo que importa
389 (34) ESTADOS DE CRISE    — pandemia/guerra/emergência expostos ao cliente
390 (37) VITÓRIAS HÍBRIDAS   — hegemonia econômica e diplomática
391 (38) EVENTOS ÚNICOS      — acontecimentos raros e memoráveis
"""
import io, sys

P = '/home/user/presidente-online/server.js'
s = io.open(P, encoding='utf-8').read()
orig = s
ok = lambda m: sys.stdout.write('  ok: %s\n' % m)

ANCLA = "const upM = (p, k) => 1 + 0.5 * ((p.upgrades && p.upgrades[k]) || 0);"
assert s.count(ANCLA) == 1, 'ancora upM'

BLOCO = ANCLA + """

/* ============================================================
   FASE 384 — FEED MUNDIAL
   O log é uma fila cronológica. O feed é o que IMPORTA,
   classificado por relevância, para o jogador não se afogar.
   ============================================================ */
const FEED_PESO = [
  [/[☢️]|[💥]|nuclear|míssil/i,                        'guerra',   100],
  [/declarou GUERRA|OFENSIVA|invas/i,                   'guerra',    90],
  [/SANÇÕES|EMBARGO|BLOQUEIO/i,                         'sancao',    75],
  [/aliança|ALIANÇA|pacto|PACTO/i,                      'alianca',   70],
  [/ONU|resolução|votação/i,                            'onu',       65],
  [/Terremoto|Seca|Pandemia|Revolta|Crise financeira|Boom|furac/i, 'crise', 80],
  [/VENCEU|vitória|hegemonia/i,                         'vitoria',   95],
  [/eleição|reelei|impeachment/i,                       'politica',  60],
  [/DESCOBRIU|espionagem|sabot/i,                       'espionagem',55],
  [/conclu/i,                                           'obra',      20]
];
function classificarFeed(msg) {
  for (const [re, tipo, peso] of FEED_PESO) if (re.test(msg)) return { tipo, peso };
  return { tipo: 'outro', peso: 10 };
}
function montarFeed(room) {
  const vistos = room.feedVistos || 0;
  const feed = [];
  for (let i = 0; i < (room.log || []).length && feed.length < 40; i++) {
    const e = room.log[i];
    const msg = e && e.msg ? e.msg : String(e || '');
    const c = classificarFeed(msg);
    feed.push({ msg, tipo: c.tipo, peso: c.peso, dia: e && e.turn ? e.turn : room.day });
  }
  feed.sort((a, b) => b.peso - a.peso);
  room.feed = feed.slice(0, 18);
  return room.feed;
}

/* ============================================================
   FASE 385 — COALIZÕES POLÍTICAS
   Grupos muito insatisfeitos se unem contra o governo.
   ============================================================ */
function coalizoes(p) {
  const g = gruposPoliticos(p);
  const contra = Object.keys(g).filter(k => g[k] <= -18);
  const aFavor = Object.keys(g).filter(k => g[k] >= 18);
  return {
    contra, aFavor,
    ativa: contra.length >= 2,
    /* dois ou mais grupos unidos conseguem pressão real */
    forca: contra.reduce((n, k) => n + Math.abs(g[k]), 0),
    texto: contra.length >= 2
      ? ('Coalizão contra o governo: ' + contra.join(', ') + '.')
      : null
  };
}

/* ============================================================
   FASE 386 — PROTESTOS
   Pressão política sustentada vira rua.
   ============================================================ */
function riscoProtesto(p) {
  const c = coalizoes(p);
  const press = pressaoPolitica(p);
  let r = 0;
  if (press <= -25) r += 0.10;
  if (press <= -40) r += 0.12;
  if ((p.aprov || 50) < 30) r += 0.10;
  if ((p.aprov || 50) < 18) r += 0.10;
  if (c.ativa) r += 0.12;
  if (p.famine) r += 0.08;
  if ((p.taxRate || 1) === 2) r += 0.05;
  if (p.ideology === 'autoritarismo') r -= 0.06;   // regime fecha a rua
  if (p.leis && p.leis.includes('toque_recolher')) r -= 0.05;
  if ((p.seguranca && p.seguranca.policia) || 0 >= 3) r -= 0.05;
  return Math.max(0, Math.min(0.55, r));
}

function aplicarProtesto(room, p) {
  const intensidade = Math.random();
  const mortos = intensidade > 0.85 ? Math.floor((p.pop || 0) * 0.001) : 0;
  p.pop = Math.max(0, (p.pop || 0) - mortos);
  p.aprov = Math.max(0, (p.aprov || 0) - (6 + Math.round(intensidade * 6)));
  const prejuizo = Math.round(150 + Math.random() * 500);
  p.money = Math.max(0, p.money - prejuizo);
  p.mil = Math.max(1, p.mil - (intensidade > 0.7 ? 1 : 0));
  p.protestoUntil = (room.day || 0) + 3;
  const c = coalizoes(p);
  let txt = `✊ PROTESTOS em ${cname(p)}: ${p.aprov}% de aprovação, −$${prejuizo} em prejuízo`;
  if (c.ativa) txt += ` — ${c.texto}`;
  if (mortos) txt += `, ${mortos} mortos em confronto`;
  txt += '.';
  log(room, txt);
  return txt;
}

/* ============================================================
   FASE 387 — CRISES MINISTERIAIS
   Ministro não é buff permanente: cobra, erra e desgasta.
   ============================================================ */
const CRISES_MINISTERIAIS = [
  { id:'orcamento', txt:(p,pasta) => `💼 O ministro de ${pasta} de ${cname(p)} exigiu verba extra.`,
    aplicar:(room,p) => { const v = Math.min(p.money, 300); p.money -= v;
      log(room, `💼 ${cname(p)} cedeu $${v} ao ministro (+2 ❤️ com o grupo).`); p.aprov = Math.min(100, p.aprov + 2); } },
  { id:'erro', txt:(p,pasta) => `📉 Uma decisão do ministro de ${pasta} de ${cname(p)} deu errado.`,
    aplicar:(room,p) => { p.aprov = Math.max(0, p.aprov - 5); p.money = Math.max(0, p.money - 200); } },
  { id:'critica', txt:(p,pasta) => `🗞️ A oposição pediu a saída do ministro de ${pasta} de ${cname(p)}.`,
    aplicar:(room,p) => { p.aprov = Math.max(0, p.aprov - 3); } },
  { id:'renuncia', txt:(p,pasta) => `🚪 O ministro de ${pasta} de ${cname(p)} RENUNCIOU.`,
    aplicar:(room,p,pasta) => { if (p.ministers && p.ministers[pasta]) p.ministers[pasta] = null;
      p.aprov = Math.max(0, p.aprov - 6); } }
];
const PASTAS = ['eco', 'def', 'soc'];

function criseMinisterial(room, p) {
  if (!p.ministers) return null;
  const pastas = PASTAS.filter(k => p.ministers[k]);
  if (!pastas.length) return null;
  const pasta = pastas[Math.floor(Math.random() * pastas.length)];
  const pesos = [0.35, 0.30, 0.25, 0.10];   // renúncia é a mais rara
  let r = Math.random(), i = 0;
  while (i < pesos.length - 1 && r > pesos[i]) { r -= pesos[i]; i++; }
  const c = CRISES_MINISTERIAIS[i];
  log(room, c.txt(p, pasta));
  c.aplicar(room, p, pasta);
  return c.id;
}

/* ============================================================
   FASE 388 — PAINEL "O QUE MUDOU?"
   O jogador precisa ver o deltas, não só os absolutos.
   ============================================================ */
function deltasDe(p) {
  const ant = p.deltaAnt || {};
  const agora = {
    money: Math.round(p.money || 0),
    pop: Math.round(p.pop || 0),
    pib: pibOf(p),
    aprov: Math.round(p.aprov || 0),
    mil: Math.round(p.mil || 0),
    eco: Math.round(p.eco || 0),
    fe: Math.round(p.fe || 0),
    doutrina: Math.round(p.doutrina || 0),
    empregos: empregosOf(p),
    suprimento: Math.round(taxaSuprimento(p) * 100),
    guerras: (p.wars || []).length,
    aliados: (p.allies || []).length,
    sancoes: (p.sanctionedBy || []).length
  };
  const d = {};
  for (const k in agora) d[k] = (ant[k] == null) ? 0 : (agora[k] - ant[k]);
  p.deltaAnt = agora;
  p.deltas = d;
  return d;
}

/* ============================================================
   FASE 389 — ESTADOS DE CRISE (para o cliente pintar a tela)
   ============================================================ */
function estadoVisual(p, room) {
  const e = [];
  if (p.famine) e.push('fome');
  if (p.blackout) e.push('apagao');
  if ((room.day || 0) < (p.emergencyUntil || 0)) e.push('emergencia');
  if ((room.day || 0) < (p.protestoUntil || 0)) e.push('protesto');
  if ((p.wars || []).length) e.push('guerra');
  if ((p.sanctionedBy || []).length) e.push('sancionado');
  if ((p.blockadedBy || []).length) e.push('bloqueado');
  if ((p.nuclear || 0) >= 3) e.push('nuclear');
  if (p.money < 500) e.push('falimentar');
  if (p.crise) e.push('crise');
  return e;
}

/* ============================================================
   FASE 390 — VITÓRIAS HÍBRIDAS
   Nem toda partida precisa terminar em guerra.
   ============================================================ */
const VITORIAS_HIBRIDAS = [
  { id:'hegemonia_economica', nome:'💰 Hegemonia Econômica',
    desc:'Maior PIB do mundo com comércio ativo e sem dívidas',
    testa:(room, p) => {
      const vivos = room.players.filter(x => x.alive);
      const maior = vivos.every(x => x.id === p.id || pibOf(x) < pibOf(p));
      return maior && pibOf(p) >= 40000 && (p.trades || []).length >= 2 && (p.debt || 0) <= 0;
    } },
  { id:'potencia_diplomatica', nome:'🕊️ Superpotência Diplomática',
    desc:'3 alianças, 3 organizações e influência alta',
    testa:(room, p) => (p.allies || []).length >= 3
      && (p.orgs || []).length >= 3 && (p.influencia || 0) >= 60 },
  { id:'sociedade_modelo', nome:'🏛️ Sociedade Modelo',
    desc:'7 setores no nível 5, aprovação alta e sem guerras',
    testa:(room, p) => {
      const base = ['educacao','saude','cultura','esportes','habitacao','justica','turismo'];
      return base.every(k => (p.sectors && p.sectors[k] || 0) >= 5)
        && (p.aprov || 0) >= 70 && !(p.wars || []).length;
    } }
];
function checarVitoriasHibridas(room, p) {
  for (const v of VITORIAS_HIBRIDAS) {
    try { if (v.testa(room, p)) return v; } catch (e) {}
  }
  return null;
}

/* ============================================================
   FASE 391 — EVENTOS ÚNICOS
   Raros, e por isso memoráveis. Criam história.
   ============================================================ */
const EVENTOS_UNICOS = [
  { id:'alianca_secreta', nome:'🤫 Aliança Secreta Revelada',
    txt: p => `Documentos vazados revelam que ${cname(p)} mantinha um pacto secreto. O mundo reage.`,
    aplicar:(room,p) => { for (const o of room.players) if (o.alive && o.id !== p.id)
      bumpRel(o, p, -7, 'pacto secreto revelado'); p.aprov = Math.max(0, p.aprov - 6); } },
  { id:'ouro_enterrado', nome:'💎 Descoberta Arqueológica',
    txt: p => `Escavações em ${cname(p)} revelam um tesouro histórico de valor incalculável.`,
    aplicar:(room,p) => { p.money += 3000; p.aprov = Math.min(100, p.aprov + 8);
      p.maravilhas = p.maravilhas || []; p.maravilhas.push('tesouro'); } },
  { id:'desertor', nome:'🏃 Desertor de Alto Escalão',
    txt: p => `Um general de ${cname(p)} desertou levando planos militares.`,
    aplicar:(room,p) => { p.mil = Math.max(1, Math.round(p.mil * 0.9)); p.aprov = Math.max(0, p.aprov - 5);
      const o = room.players.filter(x => x.alive && x.id !== p.id);
      if (o.length) { const q = o[Math.floor(Math.random() * o.length)]; q.mil += 1; } } },
  { id:'milagre_medico', nome:'🧬 Avanço Médico',
    txt: p => `Pesquisadores de ${cname(p)} anunciam um tratamento revolucionário.`,
    aplicar:(room,p) => { p.aprov = Math.min(100, p.aprov + 12);
      p.sectors = p.sectors || {}; p.sectors.saude = (p.sectors.saude || 0) + 1; } },
  { id:'ciberataque', nome:'💻 Ciberataque em Massa',
    txt: p => `Uma rede internacional derruba sistemas críticos de ${cname(p)}.`,
    aplicar:(room,p) => { p.money = Math.max(0, p.money * 0.9);
      p.rec && (p.rec.energia = Math.max(0, (p.rec.energia || 0) * 0.5));
      p.aprov = Math.max(0, p.aprov - 4); } }
];
function chanceEventoUnico(room, p) {
  /* raro: ~1,2% por dia por nação, e nunca repetido na mesma partida */
  if (Math.random() > 0.012) return null;
  p.eventosUnicosVistos = p.eventosUnicosVistos || [];
  const disp = EVENTOS_UNICOS.filter(e => !p.eventosUnicosVistos.includes(e.id));
  if (!disp.length) return null;
  const e = disp[Math.floor(Math.random() * disp.length)];
  p.eventosUnicosVistos.push(e.id);
  log(room, `${e.nome} — ${e.txt(p)}`);
  record(room, `${e.nome}: ${cname(p)} (dia ${room.day}).`);
  e.aplicar(room, p);
  return e.id;
}"""

s = s.replace(ANCLA, BLOCO, 1)
ok('FASES 384-391: constantes e funcoes injetadas')

# ============================================== ligar no dayTick
ANT = """    /* FASE 383: desdobramentos de eventos passados */
    processarDesdobramentos(room, p);"""
NOVO = """    /* FASE 383: desdobramentos de eventos passados */
    processarDesdobramentos(room, p);
    /* FASE 386: protesto — pressão sustentada vai para a rua */
    if (Math.random() < riscoProtesto(p)) aplicarProtesto(room, p);
    /* FASE 387: crise ministerial (~2,5%/dia) */
    if (Math.random() < 0.025) criseMinisterial(room, p);
    /* FASE 391: evento único e raro */
    chanceEventoUnico(room, p);
    /* FASE 388/389: deltas e estado visual para o cliente */
    deltasDe(p);
    p.estadoVisual = estadoVisual(p, room);
    p.coalizao = coalizoes(p);"""
assert s.count(ANT) == 1, 'ancora dos desdobramentos'
s = s.replace(ANT, NOVO)
ok('protestos, crises ministeriais, eventos unicos, deltas e estado no tick')

# ============================================== feed + vitórias no tick (uma vez por dia)
ANT = """  if (room.un && Date.now() >= room.un.deadline) resolveUN(room);"""
NOVO = """  if (room.un && Date.now() >= room.un.deadline) resolveUN(room);
  /* FASE 384: feed mundial recalculado uma vez por dia */
  montarFeed(room);"""
assert s.count(ANT) == 1, 'ancora do un deadline'
s = s.replace(ANT, NOVO)
ok('feed mundial recalculado no tick')

# ============================================== vitórias híbridas
ANT = """    /* FASE 388/389: deltas e estado visual para o cliente */
    deltasDe(p);
    p.estadoVisual = estadoVisual(p, room);
    p.coalizao = coalizoes(p);"""
NOVO = ANT + """
    /* FASE 390: vitórias híbridas */
    const vh = checarVitoriasHibridas(room, p);
    if (vh) {
      log(room, `🏆 ${cname(p)} conquistou ${vh.nome}! ${vh.desc}.`);
      record(room, `🏆 ${vh.nome} — ${cname(p)} (dia ${room.day}).`);
      room.hybridWins = room.hybridWins || {};
      if (!room.hybridWins[vh.id]) { room.hybridWins[vh.id] = p.id; p.stats.vitorias = (p.stats.vitorias || 0) + 1; }
    }"""
assert s.count(ANT) == 1, 'ancora dos deltas'
s = s.replace(ANT, NOVO)
ok('vitorias hibridas verificadas no tick')

# ============================================== expor no snapshot
ANT = """      pibDetalhe: pibDetalhe(p), histRel: (p.histRel && typeof p.histRel === 'object') ? p.histRel : {},"""
NOVO = """      pibDetalhe: pibDetalhe(p), histRel: (p.histRel && typeof p.histRel === 'object') ? p.histRel : {},
      deltas: p.deltas || {}, estadoVisual: p.estadoVisual || [],
      coalizao: p.coalizao || null, riscoProtesto: Math.round(riscoProtesto(p) * 100),"""
assert s.count(ANT) == 1, 'pibDetalhe no snapshot'
s = s.replace(ANT, NOVO)
ok('deltas, estadoVisual, coalizao e risco de protesto expostos')

io.open(P, 'w', encoding='utf-8').write(s)
print('\nFASES 384-391 (servidor) aplicadas. %d -> %d bytes (+%d)' % (len(orig), len(s), len(s) - len(orig)))
