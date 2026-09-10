# -*- coding: utf-8 -*-
"""
FASES 378-382 (CLIENTE) — resposta à 2ª auditoria

CORREÇÕES DO QUE EU PIOREI:
  R1  excesso de animação  -> sai `input, select, .ov` da regra global;
                              info recorrente muda sem animação
  R2  Rajdhani em excesso  -> tutorial e textos longos voltam à fonte de leitura
  R3  vidro em excesso     -> escala E0..E3 explícita; só modal/alerta usa E3

ITENS NOVOS:
  380 (25) "Por que meu PIB mudou?" — PIB no HUD + painel de breakdown
  379 (26) Histórico diplomático — por que a relação está em +40 ou −60
"""
import io, sys

P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
orig = h
ok = lambda m: sys.stdout.write('  ok: %s\n' % m)

# ================================================== R2: Rajdhani fora de textos longos
ANT = """  .paper h1, .paper h2, .card h1, .card h2,
  #ov-title, #tut-title, .panel h1, .panel h2{
    font-family:var(--font-display)!important;
    font-weight:700!important;
    letter-spacing:.7px!important;
    line-height:1.15!important;
  }"""
NOVO = """  .paper h1, .paper h2, .card h1, .card h2,
  #ov-title, .panel h1, .panel h2{
    font-family:var(--font-display)!important;
    font-weight:700!important;
    letter-spacing:.7px!important;
    line-height:1.15!important;
  }
  /* R2 — textos longos priorizam LEGIBILIDADE, não identidade */
  #tut-title, #tut, .tut-body, .desc, .explicacao,
  .paper p, .card p, .panel p{
    font-family:'Segoe UI', system-ui, -apple-system, Roboto, sans-serif!important;
    letter-spacing:0!important;
  }"""
assert h.count(ANT) == 1, 'regra de tipografia'
h = h.replace(ANT, NOVO)
ok('R2: Rajdhani só em títulos/HUD; textos longos voltam à fonte de leitura')

# ================================================== R1: animação só onde importa
ANT = """  /* 373 — transições consistentes (150-250ms) */
  .paper, .card, .panel, button, .ov, input, select{
    transition:opacity var(--t) var(--ease),
               transform var(--t) var(--ease),
               box-shadow var(--t) var(--ease),
               background var(--t) var(--ease),
               border-color var(--t) var(--ease);
  }
  .card:hover{ transform:translateY(-2px); box-shadow:var(--e3), inset 0 1px 0 rgba(255,255,255,.08)!important; }
  button:hover{ filter:brightness(1.08); }
  button:active{ transform:scale(.975); }"""
NOVO = """  /* R1+373 — animação é para AÇÃO, não para informação recorrente.
     Controles e superfícies animam (são tocados). Campos de formulário,
     overlays e números que mudam o tempo todo NÃO animam — cansa a leitura. */
  .paper, .card, .panel, button{
    transition:box-shadow var(--t) var(--ease),
               border-color var(--t) var(--ease),
               transform var(--t) var(--ease);
  }
  .card:hover{ transform:translateY(-2px); box-shadow:var(--e3), inset 0 1px 0 rgba(255,255,255,.08)!important; }
  button:hover{ filter:brightness(1.08); }
  button:active{ transform:scale(.975); }
  /* números do HUD mudam a cada tick — atualização instantânea, sem animação */
  .res, .res b, #g-timer, #g-date{ transition:none!important; animation:none!important; }"""
assert h.count(ANT) == 1, 'regra de transicoes'
h = h.replace(ANT, NOVO)
ok('R1: animação só em controles; números do HUD atualizam instantâneo')

# ================================================== R3: escala de elevação explícita
ANT = """  .panel{
    background:var(--glass)!important;
    border:1px solid var(--glass-brd)!important;
    border-radius:var(--r-m)!important;
    box-shadow:var(--e2)!important;
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  }"""
NOVO = """  /* R3 — escala de elevação. Vidro é camada SECUNDÁRIA, não linguagem absoluta.
     E0 superfície · E1 card · E2 painel importante · E3 modal/alerta crítico */
  .panel{
    /* E2 — painel importante: sólido com leve profundidade */
    background:linear-gradient(180deg,#16203a,#101830)!important;
    border:1px solid var(--glass-brd)!important;
    border-radius:var(--r-m)!important;
    box-shadow:var(--e2), inset 0 1px 0 rgba(255,255,255,.06)!important;
  }
  /* vidro reservado para o que flutua sobre o mapa: HUD e barras */
  #bottomnav, #transport, #leftdock, #rightrail{
    background:var(--glass);
    backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  }
  /* E3 somente em modal/alerta — nunca em tudo */
  .modal, .alerta-critico{ box-shadow:var(--e3)!important; }"""
assert h.count(ANT) == 1, 'regra do .panel'
h = h.replace(ANT, NOVO)
ok('R3: escala E0-E3 explícita; vidro só no que flutua sobre o mapa')

# ================================================== 380: PIB no HUD
ANT = """    <div class="res" title="Religião">🕌 <b id="m-rel">—</b></div>"""
NOVO = """    <div class="res" title="Religião">🕌 <b id="m-rel">—</b></div>
    <div class="res" id="m-pib-wrap" title="PIB — clique para ver de onde vem" style="cursor:pointer">📊 <b id="m-pib">0</b></div>"""
assert h.count(ANT) == 1, 'res religiao'
h = h.replace(ANT, NOVO)
ok('PIB adicionado ao HUD')

# atualiza o valor
ANT = """  $('m-pop').textContent = m.pop;"""
NOVO = """  $('m-pop').textContent = m.pop;
  if ($('m-pib')) $('m-pib').textContent = fmtK(m.pib || 0);
  if ($('m-pib-wrap')) $('m-pib-wrap').style.display = (m.pib ? '' : 'none');"""
n = h.count(ANT)
assert n >= 1, 'updateDayHUD pop'
h = h.replace(ANT, NOVO)          # substitui nas duas funcoes de render
ok('valor do PIB atualizado no HUD (%d ponto(s) de render)' % n)

# ================================================== 380/379: paineis novos
JS = """
/* ============================================================
   FASE 380 (item 25) — "POR QUE MEU PIB MUDOU?"
   FASE 379 (item 26) — HISTÓRICO DIPLOMÁTICO
   Sem isso o jogador vê "indústria rende 30%" e acha que é bug.
   ============================================================ */
function fmtK(v){
  v = Math.round(v || 0);
  if (Math.abs(v) >= 1000000) return (v/1000000).toFixed(1).replace('.0','') + 'M';
  if (Math.abs(v) >= 1000)    return (v/1000).toFixed(1).replace('.0','') + 'k';
  return String(v);
}

function abrirPibExplicacao(){
  const m = me(); if (!m) return;
  const d = m.pibDetalhe || {};
  const linha = (rot, val, cor) =>
    '<div style="display:flex;justify-content:space-between;padding:7px 10px;margin-bottom:5px;' +
    'background:rgba(255,255,255,.04);border-radius:8px;border-left:3px solid ' + cor + '">' +
    '<span>' + rot + '</span><b style="font-family:var(--font-display);font-size:15px">' + val + '</b></div>';
  const total = d.total || 0;
  const pct = v => total ? ((v / total) * 100).toFixed(1) + '% do PIB' : '—';

  const html =
    '<h1 style="font-size:20px">📊 De onde vem o seu PIB</h1>' +
    '<div style="text-align:center;font-size:30px;font-family:var(--font-display);font-weight:700;' +
    'color:var(--gold2);margin:10px 0 4px">$' + fmtK(total) + '</div>' +
    '<div style="text-align:center;font-size:11px;opacity:.7;margin-bottom:14px">' +
    'Suprimento industrial: <b>' + (d.taxaSuprimento != null ? d.taxaSuprimento : 100) + '%</b></div>' +
    (d.aviso ? '<div style="background:rgba(255,92,92,.14);border:1px solid rgba(255,92,92,.45);' +
      'border-radius:10px;padding:11px 13px;margin-bottom:13px;font-size:12.5px;line-height:1.5">' +
      '⚠️ <b>' + d.aviso + '</b></div>' : '') +
    linha('🏭 Indústrias e construções', d.predios != null ? fmtK(d.predios) : '0', 'var(--gold)') +
    linha('👥 População e economia',    d.populacao != null ? fmtK(d.populacao) : '0', '#4da3ff') +
    linha('🏛️ Setores sociais',         d.setores != null ? fmtK(d.setores) : '0', '#39d98a') +
    linha('🤝 Comércio',                d.comercio != null ? fmtK(d.comercio) : '0', '#c9a227') +
    linha('🕊️ Alianças',                d.aliados != null ? fmtK(d.aliados) : '0', '#b48ead') +
    linha('📉 Perda por falta de insumo', d.suprimento != null ? fmtK(d.suprimento) : '0', '#ff5c5c') +
    '<div style="font-size:11px;opacity:.65;margin-top:12px;line-height:1.55">' +
    'Indústrias que dependem de insumos rendem <b>apenas 30%</b> quando o estoque falta. ' +
    'Construa quem produz o insumo (mina, fazenda, usina) antes de construir quem o consome ' +
    '(siderúrgica, padaria, refinaria).</div>' +
    '<div style="text-align:center;margin-top:14px"><button id="pib-fechar" class="btn">Fechar</button></div>';

  /* mesmo padrão dos outros painéis do jogo */
  document.querySelectorAll('#newspaper.pib-ov').forEach(function(x){ x.remove(); });
  const ov = document.createElement('div');
  ov.id = 'newspaper'; ov.className = 'pib-ov';
  ov.innerHTML = '<div class="paper" style="width:min(560px,94vw);max-height:86vh;overflow:auto;' +
                 'background:#f3ead1;color:#2b2416;padding:20px 24px">' + html + '</div>';
  document.body.appendChild(ov);
  ov.onclick = function(e){ if (e.target === ov || e.target.id === 'pib-fechar') ov.remove(); };
  const b = document.getElementById('pib-fechar');
  if (b) b.onclick = function(){ ov.remove(); };
}

function verHistoricoDiplomatico(outro){
  const m = me(); if (!m) return;
  const hist = (m.histRel && m.histRel[outro.id]) || [];
  const rel = (m.relations && m.relations[outro.id] != null) ? m.relations[outro.id] : 50;
  const cor = rel >= 60 ? '#39d98a' : (rel >= 30 ? '#e8b93c' : '#ff5c5c');
  let corpo;
  if (!hist.length){
    corpo = '<div style="text-align:center;opacity:.65;font-size:12.5px;padding:22px 10px;line-height:1.6">' +
            'Nenhum registro ainda.<br>Ataques, sanções, sabotagens, ajudas e acordos<br>' +
            'ficam marcados aqui — e os outros países se lembram deles.</div>';
  } else {
    corpo = hist.map(r =>
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;' +
      'margin-bottom:5px;background:rgba(255,255,255,.04);border-radius:8px;' +
      'border-left:3px solid ' + (r.v >= 0 ? '#39d98a' : '#ff5c5c') + '">' +
      '<span style="font-size:12.5px">' + r.m +
        (r.d ? ' <span style="opacity:.5;font-size:10.5px">· dia ' + r.d + '</span>' : '') + '</span>' +
      '<b style="font-family:var(--font-display);font-size:14px;color:' + (r.v >= 0 ? '#39d98a' : '#ff5c5c') + '">' +
        (r.v >= 0 ? '+' : '') + r.v + '</b></div>').join('');
  }
  const html =
    '<h1 style="font-size:19px">🤝 Relação com ' + (outro.customName || outro.name || '—') + '</h1>' +
    '<div style="text-align:center;font-size:34px;font-family:var(--font-display);font-weight:700;' +
    'color:' + cor + ';margin:8px 0 14px">' + rel + '</div>' +
    corpo +
    '<div style="text-align:center;margin-top:14px"><button id="hd-fechar" class="btn">Fechar</button></div>';
  document.querySelectorAll('#newspaper.hist-ov').forEach(function(x){ x.remove(); });
  const ov = document.createElement('div');
  ov.id = 'newspaper'; ov.className = 'hist-ov';
  ov.innerHTML = '<div class="paper" style="width:min(520px,94vw);max-height:86vh;overflow:auto;' +
                 'background:#f3ead1;color:#2b2416;padding:20px 24px">' + html + '</div>';
  document.body.appendChild(ov);
  const b = document.getElementById('hd-fechar');
  if (b) b.onclick = function(){ ov.remove(); };
  ov.onclick = function(e){ if (e.target === ov || e.target.id === 'hd-fechar') ov.remove(); };
}

/* liga o PIB do HUD ao painel de explicação */
(function(){
  var tentou = 0;
  var iv = setInterval(function(){
    var w = document.getElementById('m-pib-wrap');
    if (w && !w.__ligado){ w.__ligado = true; w.onclick = abrirPibExplicacao; clearInterval(iv); }
    if (++tentou > 60) clearInterval(iv);
  }, 250);
})();
"""
ANCORA = "// rel\u00f3gio visual da batalha\nsetInterval(() => { if (bt) btRender(); }, 1000);"
assert h.count(ANCORA) == 1, 'ancora do JS'
h = h.replace(ANCORA, ANCORA + "\n" + JS, 1)
ok('painel "De onde vem seu PIB" + histórico diplomático criados')

io.open(P, 'w', encoding='utf-8').write(h)
print('\nFASES 378-382 (cliente) aplicadas. %d -> %d bytes (+%d)' % (len(orig), len(h), len(h) - len(orig)))
