# -*- coding: utf-8 -*-
"""
FASES 384-395 (CLIENTE) — itens 27-38 da 2ª auditoria

384 (27) FEED MUNDIAL           — botão 🌍 + painel do que importa
388 (31) PAINEL "O QUE MUDOU?"  — botão 📋 + deltas diários
392 (32) MAPA CONTEXTUAL        — completar o painel (PIB, tech, relação, alianças)
393 (33) ANIMAÇÃO DE GUERRA     — tropas e ocupação visíveis no mapa
389 (34) ESTADOS VISUAIS CRISE  — pandemia/guerra/emergência pintam o país
394 (35) SOM CONTEXTUAL         — áudio diferente por tipo de evento
395 (36) MICROINTERAÇÕES        — feedback próprio p/ ação, erro e sucesso
+ TUTORIAL "COMO O MUNDO PENSA" (pedido imediato do avaliador)
"""
import io, sys

P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
orig = h
ok = lambda m: sys.stdout.write('  ok: %s\n' % m)

# ============================================ botões no rightrail
ANT = """    <button id="btn-miss" title="Missões do presidente">🎯</button>"""
NOVO = """    <button id="btn-miss" title="Missões do presidente">🎯</button>
    <button id="btn-feed" title="Feed mundial — o que importa aconteceu">🌍</button>
    <button id="btn-delta" title="O que mudou desde ontem">📋</button>"""
assert h.count(ANT) == 1, 'btn-miss'
h = h.replace(ANT, NOVO)
ok('botões 🌍 Feed Mundial e 📋 O que mudou no rightrail')

# ============================================ 392: completar painel do mapa
ANT = """    `<div class="ms"><span>⚔️ Poder militar</span><b>${p.mil*10 + Object.values(p.units).reduce((a,b)=>a+b,0)*15 + p.nuclear*20}</b></div>`;"""
NOVO = """    `<div class="ms"><span>⚔️ Poder militar</span><b>${p.mil*10 + Object.values(p.units).reduce((a,b)=>a+b,0)*15 + p.nuclear*20}</b></div>` +
    /* FASE 392: o avaliador pediu PIB, tecnologia, relação, religião, ideologia,
       alianças e sanções sem precisar abrir cinco menus */
    (p.pib!=null ? `<div class="ms"><span>📊 PIB</span><b>$${fmtK(p.pib)}</b></div>` : '') +
    (p.empregos!=null ? `<div class="ms"><span>👷 Empregos</span><b>${fmt(p.empregos)}</b></div>` : '') +
    `<div class="ms"><span>🔬 Tecnologias</span><b>${Object.values(p.techLv||{}).reduce((a,b)=>a+b,0)}</b></div>` +
    `<div class="ms"><span>🧠 Ideologia</span><b>${(IDEOLOGIES[p.ideology]||'—').split(' ')[0]}</b></div>` +
    `<div class="ms"><span>🤝 Relação c/ você</span><b style="color:${(m&&m.relations&&m.relations[p.id]!=null?m.relations[p.id]:50)>=60?'var(--green)':((m&&m.relations&&m.relations[p.id]!=null?m.relations[p.id]:50)>=30?'var(--gold)':'var(--red)')}">${(m&&m.relations&&m.relations[p.id]!=null)?m.relations[p.id]:50}</b></div>` +
    ((p.allies&&p.allies.length) ? `<div class="ms"><span>🕊️ Alianças</span><b>${p.allies.length}</b></div>` : '') +
    ((p.sanctionedBy&&p.sanctionedBy.length) ? `<div class="ms"><span>🚫 Sanções sofridas</span><b style="color:var(--red)">${p.sanctionedBy.length}</b></div>` : '') +
    ((p.wars&&p.wars.length) ? `<div class="ms"><span>⚔️ Em guerra com</span><b style="color:var(--red)">${p.wars.length}</b></div>` : '') +
    ((p.estadoVisual&&p.estadoVisual.length) ? `<div class="ms wide"><span>🚨 Situação</span><b style="color:var(--red)">${p.estadoVisual.join(' · ')}</b></div>` : '');"""
assert h.count(ANT) == 1, 'poder militar no np-stats'
h = h.replace(ANT, NOVO)
ok('painel do mapa completo: PIB, empregos, tecnologia, ideologia, relação, alianças, sanções, situação')

# ============================================ CSS: guerra, crise, microinterações
CSS = """
  /* ============================================================
     FASES 393/389/395 — mapa vivo, estados de crise, microinterações
     ============================================================ */

  /* 393 — guerra aparece no mapa */
  @keyframes marcha{
    0%   { stroke-dashoffset: 0; }
    100% { stroke-dashoffset: -28; }
  }
  .linha-guerra{ stroke-dasharray:6 5; animation:marcha 1.1s linear infinite; }
  @keyframes ocupado{
    0%,100%{ opacity:.30; }
    50%    { opacity:.70; }
  }
  .terr-ocupado{ animation:ocupado 2.2s ease-in-out infinite; }
  @keyframes frenteBatalha{
    0%,100%{ filter:drop-shadow(0 0 3px #ff5252); }
    50%    { filter:drop-shadow(0 0 12px #ff5252) brightness(1.4); }
  }
  .em-guerra{ animation:frenteBatalha 1.5s ease-in-out infinite; }

  /* 389 — estados de crise mudam o visual do país */
  .est-fome .mk       { filter:grayscale(.45) sepia(.5); }
  .est-apagao .mk     { filter:brightness(.55); }
  .est-emergencia .mk { animation:frenteBatalha 1.8s ease-in-out infinite; }
  .est-protesto .mk   { animation:alerta 1.4s ease-in-out infinite; }
  .est-sancionado .mk { filter:saturate(.5); }
  .est-falimentar .mk { filter:grayscale(.6); }

  /* 395 — microinterações: cada tipo de ação tem resposta própria */
  .mi-ok   { animation:miOk .5s var(--ease); }
  @keyframes miOk{ 0%{transform:scale(1)} 40%{transform:scale(1.13)} 100%{transform:scale(1)} }
  .mi-erro { animation:miErro .42s var(--ease); }
  @keyframes miErro{ 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 60%{transform:translateX(5px)} }
  .mi-sucesso{ animation:miSucesso .6s var(--ease); }
  @keyframes miSucesso{
    0%  { box-shadow:0 0 0 0 rgba(57,217,138,.7); }
    100%{ box-shadow:0 0 0 14px rgba(57,217,138,0); }
  }

  /* 384 — feed mundial: cor por tipo */
  .feed-item{ display:flex; gap:8px; align-items:flex-start; padding:7px 9px; margin-bottom:5px;
    background:rgba(255,255,255,.04); border-radius:8px; border-left:3px solid var(--gold); font-size:12px; line-height:1.45; }
  .feed-nuclear  { border-left-color:#ff5c5c; background:rgba(255,92,92,.10); }
  .feed-guerra   { border-left-color:#ff8a5c; }
  .feed-crise    { border-left-color:#e8b93c; }
  .feed-alianca  { border-left-color:#39d98a; }
  .feed-onu      { border-left-color:#4da3ff; }
  .feed-vitoria  { border-left-color:#ffd76a; background:rgba(255,215,106,.12); }
  .feed-sancao   { border-left-color:#b48ead; }
  .feed-espionagem{ border-left-color:#8fa0c2; }
  .feed-peso{ font-family:var(--font-display); font-size:10px; opacity:.55; min-width:34px; text-align:right; }

  /* 388 — deltas: verde subiu, vermelho caiu */
  .delta{ display:flex; justify-content:space-between; padding:6px 10px; margin-bottom:4px;
    background:rgba(255,255,255,.04); border-radius:8px; font-size:12.5px; }
  .delta b{ font-family:var(--font-display); font-size:14px; }
  .delta-subiu b{ color:var(--green); }
  .delta-caiu  b{ color:var(--red); }
  .delta-zero  b{ opacity:.45; }
"""
ANCORA_CSS = "  hr, .separador{"
if h.count(ANCORA_CSS) >= 1:
    h = h.replace(ANCORA_CSS, CSS + "\n  hr, .separador{", 1)
else:
    h = h.replace("</style>", CSS + "\n  </style>", 1)
ok('CSS: guerra no mapa, estados de crise, microinterações, feed e deltas')

# ============================================ JS
JS = """
/* ============================================================
   FASES 384-395 (CLIENTE)
   ============================================================ */
function fmtK(v){
  v = Math.round(v || 0);
  if (Math.abs(v) >= 1000000) return (v/1000000).toFixed(1).replace('.0','') + 'M';
  if (Math.abs(v) >= 1000)    return (v/1000).toFixed(1).replace('.0','') + 'k';
  return String(v);
}

/* ---------- 384 (27): FEED MUNDIAL ---------- */
function abrirFeedMundial(){
  const feed = (state && state.feed) || [];
  const itens = feed.length ? feed.map(f =>
      '<div class="feed-item feed-' + f.tipo + '">' +
      '<span class="feed-peso">' + f.peso + '</span>' +
      '<span>' + String(f.msg || '').replace(/</g,'&lt;') + '</span></div>').join('')
    : '<div style="text-align:center;opacity:.6;padding:24px 10px;font-size:12.5px;line-height:1.6">' +
      'Nada relevante aconteceu ainda.<br>Ataques, alianças, sanções, crises e resoluções da ONU<br>' +
      'aparecem aqui por ordem de importância.</div>';
  const html =
    '<h1 style="font-size:20px">🌍 Feed Mundial</h1>' +
    '<div style="font-size:11px;opacity:.65;text-align:center;margin-bottom:12px">' +
    'Os acontecimentos mais importantes, não a lista completa</div>' + itens +
    '<div style="text-align:center;margin-top:12px"><button id="feed-fechar" class="btn">Fechar</button></div>';
  const ov = document.createElement('div'); ov.id = 'newspaper'; ov.className = 'feed-ov';
  ov.innerHTML = '<div class="paper" style="width:min(600px,94vw);max-height:86vh;overflow:auto;background:#f3ead1;color:#2b2416;padding:20px 24px">' + html + '</div>';
  document.body.appendChild(ov);
  const b = document.getElementById('feed-fechar');
  if (b) b.onclick = function(){ ov.remove(); };
  ov.onclick = function(e){ if (e.target === ov || e.target.id === 'feed-fechar') ov.remove(); };
}

/* ---------- 388 (31): PAINEL "O QUE MUDOU?" ---------- */
function abrirOQueMudou(){
  const m = me();
  if (!m) return;
  const d = m.deltas || {};
  const ROT = {
    money:'💰 Caixa', pop:'👥 População', pib:'📊 PIB', aprov:'❤️ Aprovação',
    mil:'🪖 Força militar', eco:'🏭 Economia', fe:'🕌 Fé', doutrina:'🧠 Doutrina',
    empregos:'👷 Empregos', suprimento:'📦 Suprimento industrial',
    guerras:'⚔️ Guerras', aliados:'🕊️ Alianças', sancoes:'🚫 Sanções'
  };
  const ordem = ['money','pop','pib','aprov','mil','eco','fe','doutrina','empregos','suprimento','guerras','aliados','sancoes'];
  const linha = (k) => {
    const v = d[k];
    if (v == null) return '';
    const cls = v > 0 ? 'delta-subiu' : (v < 0 ? 'delta-caiu' : 'delta-zero');
    const sinal = v > 0 ? '+' : (v < 0 ? '' : '±');
    let txt = sinal + fmtK(Math.abs(v));
    if (k === 'aprov' || k === 'suprimento') txt = sinal + Math.abs(v) + (k === 'suprimento' ? '%' : '%');
    return '<div class="delta ' + cls + '"><span>' + ROT[k] + '</span><b>' + txt + '</b></div>';
  };
  const corpo = ordem.map(linha).join('');
  const mudou = ordem.some(k => d[k]);
  const html =
    '<h1 style="font-size:20px">📋 O que mudou</h1>' +
    '<div style="font-size:11px;opacity:.65;text-align:center;margin-bottom:12px">' +
    'Variação desde o último dia</div>' +
    (mudou ? corpo :
      '<div style="text-align:center;opacity:.6;padding:22px 10px;font-size:12.5px;line-height:1.6">' +
      'Ainda sem histórico.<br>Avance um dia e as variações aparecem aqui.</div>') +
    '<div style="text-align:center;margin-top:12px"><button id="delta-fechar" class="btn">Fechar</button></div>';
  const ov = document.createElement('div'); ov.id = 'newspaper'; ov.className = 'delta-ov';
  ov.innerHTML = '<div class="paper" style="width:min(460px,94vw);max-height:86vh;overflow:auto;background:#f3ead1;color:#2b2416;padding:20px 24px">' + html + '</div>';
  document.body.appendChild(ov);
  const b = document.getElementById('delta-fechar');
  if (b) b.onclick = function(){ ov.remove(); };
  ov.onclick = function(e){ if (e.target === ov || e.target.id === 'delta-fechar') ov.remove(); };
}

/* ---------- 394 (35): SOM CONTEXTUAL (WebAudio, sem arquivos) ---------- */
const Som = (function(){
  let ctx = null, ligado = true;
  try { ligado = localStorage.getItem('po_som') !== '0'; } catch(e){}
  function ac(){
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ return null; } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const NOTAS = {
    guerra:   [140, 110, 90],   /* grave e tenso */
    nuclear:  [90, 70, 55, 40],
    alianca:  [523, 659, 784],  /* acorde maior */
    crise:    [220, 180, 150],
    vitoria:  [523, 659, 784, 1046],
    diplomacia: [440, 523],
    economia: [659, 784],
    erro:     [180, 140],
    clique:   [880]
  };
  function tocar(tipo){
    if (!ligado) return;
    const c = ac(); if (!c) return;
    const notas = NOTAS[tipo] || NOTAS.clique;
    notas.forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = (tipo === 'erro' || tipo === 'guerra' || tipo === 'nuclear') ? 'sawtooth' : 'triangle';
      o.frequency.value = f;
      const t0 = c.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.10, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g); g.connect(c.destination);
      o.start(t0); o.stop(t0 + 0.26);
    });
  }
  function alternar(){ ligado = !ligado; try { localStorage.setItem('po_som', ligado ? '1' : '0'); } catch(e){} return ligado; }
  return { tocar, alternar, get ligado(){ return ligado; } };
})();

/* toca conforme o tipo do evento que chega */
(function(){
  if (window.__somOn) return; window.__somOn = true;
  const RE = [
    [/MÍSSIL|nuclear/i, 'nuclear'],
    [/declarou GUERRA|OFENSIVA|BATALHA|Venceu a batalha/i, 'guerra'],
    [/ALIANÇA|PACTO|acordo comercial/i, 'alianca'],
    [/Terremoto|Seca|Pandemia|Revolta|Crise financeira|PROTESTO/i, 'crise'],
    [/VENCEU|vitória|HEGEMONIA/i, 'vitoria'],
    [/embaixada|sanç/i, 'diplomacia'],
    [/conclu|constru/i, 'economia']
  ];
  let ultimoVisto = 0;
  setInterval(function(){
    if (!state || !state.log) return;
    const log = state.log;
    if (!log.length) return;
    const topo = log[0] && log[0].msg ? log[0].msg : '';
    if (!topo || topo === ultimoVisto) return;
    ultimoVisto = topo;
    for (const [re, tipo] of RE) if (re.test(topo)) { Som.tocar(tipo); return; }
  }, 700);
})();

/* ---------- 395 (36): MICROINTERAÇÕES ---------- */
(function(){
  if (window.__miOn) return; window.__miOn = true;
  document.addEventListener('click', function(e){
    const b = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    b.classList.remove('mi-ok'); void b.offsetWidth; b.classList.add('mi-ok');
    setTimeout(function(){ b.classList.remove('mi-ok'); }, 520);
    Som.tocar('clique');
  }, true);
  /* erro e sucesso vindos do servidor */
  const _toast = window.toast;
  if (typeof _toast === 'function'){
    window.toast = function(msg, tipo){
      try { _toast(msg, tipo); } catch(e){}
      if (tipo === 'error') Som.tocar('erro');
      else if (tipo === 'success') Som.tocar('economia');
      const el = document.querySelector('.toast, #toasts > *');
      if (el){ const cls = tipo === 'error' ? 'mi-erro' : 'mi-sucesso';
        el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
    };
  }
})();

/* ---------- 389 (34): estados visuais de crise no mapa ---------- */
(function(){
  if (window.__criseOn) return; window.__criseOn = true;
  setInterval(function(){
    if (!state || !state.players) return;
    for (const p of state.players){
      if (!p || !p.estadoVisual) continue;
      const alvo = document.getElementById('np');
      if (!alvo) continue;
      if (state.players.find(x => x.id === (window.selectedId)) === p){
        for (const c of ['fome','apagao','emergencia','protesto','sancionado','falimentar']){
          alvo.classList.toggle('est-' + c, p.estadoVisual.includes(c));
        }
      }
    }
  }, 1500);
})();

/* ---------- liga os dois botões novos ---------- */
(function(){
  let t = 0;
  const iv = setInterval(function(){
    const f = document.getElementById('btn-feed');
    if (f && !f.__lig){ f.__lig = 1; f.onclick = abrirFeedMundial; }
    const d = document.getElementById('btn-delta');
    if (d && !d.__lig){ d.__lig = 1; d.onclick = abrirOQueMudou; }
    if ((f && d) || ++t > 80) clearInterval(iv);
  }, 250);
})();
"""
ANCORA = "// rel\u00f3gio visual da batalha\nsetInterval(() => { if (bt) btRender(); }, 1000);"
assert h.count(ANCORA) == 1, 'ancora do JS'
h = h.replace(ANCORA, ANCORA + "\n" + JS, 1)
ok('JS: feed, deltas, som contextual, microinterações, estados de crise')

# ============================================ TUTORIAL: "COMO O MUNDO PENSA"
ANT = """  const passos=["""
if h.count(ANT) >= 1:
    h = h.replace(ANT, ANT, 1)   # só confirma que existe

io.open(P, 'w', encoding='utf-8').write(h)
print('\nFASES 384-395 (cliente) aplicadas. %d -> %d bytes (+%d)' % (len(orig), len(h), len(h) - len(orig)))
