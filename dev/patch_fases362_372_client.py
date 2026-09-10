# -*- coding: utf-8 -*-
"""
FASES 362-372 (CLIENTE) — itens 4, 5, 6, 13, 14, 15, 16, 17, 18, 20

371: TIPOGRAFIA DE JOGO    -> fonte display + hierarquia real
372: PROFUNDIDADE          -> painéis com vidro, camadas e bordas internas
373: TRANSIÇÕES            -> 150-250ms consistentes em tudo
374: MOVIMENTO             -> números flutuantes, contadores, pulse
375: MAPA VIVO             -> hover, brilho, seleção pulsante
376: JORNAL / ONU          -> acabamento editorial e de votação
377: POLIMENTO             -> microanimações, brilhos, separadores
"""
import io, sys

P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
orig = h
ok = lambda m: sys.stdout.write('  ok: %s\n' % m)

# ================================================== 371: FONTE DE JOGO
FONTE = """  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet">
"""
assert h.count('<title>') == 1, 'ancora <title>'
h = h.replace('<title>', FONTE + '  <title>', 1)
ok('fonte display (Rajdhani) carregada')

# ================================================== tokens de fonte
ANT = "    --ease:cubic-bezier(.2,.8,.3,1);\n    --t-fast:.14s; --t:.2s; --t-slow:.32s;"
NOVO = """    --ease:cubic-bezier(.2,.8,.3,1);
    --t-fast:.14s; --t:.2s; --t-slow:.32s;
    /* tipografia */
    --font-display:'Rajdhani','Segoe UI',system-ui,-apple-system,Roboto,sans-serif;"""
assert h.count(ANT) == 1, 'tokens de movimento'
h = h.replace(ANT, NOVO)
ok('token --font-display criado')

# ================================================== 371/372/373/377: CSS
CSS_NOVO = """
  /* ============================================================
     FASES 371-377 — ACABAMENTO VISUAL
     371 Tipografia · 372 Profundidade · 373 Transições
     375 Mapa vivo · 376 Jornal/ONU · 377 Polimento
     ============================================================ */

  /* 371 — hierarquia tipográfica de jogo (o jornal mantém sua serif) */
  .paper h1, .paper h2, .card h1, .card h2,
  #ov-title, #tut-title, .panel h1, .panel h2{
    font-family:var(--font-display)!important;
    font-weight:700!important;
    letter-spacing:.7px!important;
    line-height:1.15!important;
  }
  .paper h1, .card h1{ text-transform:uppercase; }
  /* números em destaque ganham a fonte de jogo */
  .numero-grande, .stat-num, .rec-valor{
    font-family:var(--font-display)!important;
    font-weight:700!important; letter-spacing:.3px;
  }

  /* 372 — profundidade real nos painéis */
  .paper{
    position:relative;
    border-radius:14px!important;
    box-shadow:
      0 18px 50px rgba(0,0,0,.62),
      0 0 0 1px rgba(0,0,0,.4),
      inset 0 1px 0 rgba(255,255,255,.10)!important;
  }
  .paper::before{
    content:''; position:absolute; inset:0; border-radius:11px; pointer-events:none;
    background:linear-gradient(180deg,rgba(255,255,255,.055),transparent 34%);
  }
  .card{
    background:linear-gradient(180deg,#16203a,#101830)!important;
    border:1px solid rgba(232,185,60,.20)!important;
    border-radius:15px!important;
    box-shadow:var(--e2), inset 0 1px 0 rgba(255,255,255,.06)!important;
  }
  .panel{
    background:var(--glass)!important;
    border:1px solid var(--glass-brd)!important;
    border-radius:var(--r-m)!important;
    box-shadow:var(--e2)!important;
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  }

  /* 373 — transições consistentes (150-250ms) */
  .paper, .card, .panel, button, .ov, input, select{
    transition:opacity var(--t) var(--ease),
               transform var(--t) var(--ease),
               box-shadow var(--t) var(--ease),
               background var(--t) var(--ease),
               border-color var(--t) var(--ease);
  }
  .card:hover{ transform:translateY(-2px); box-shadow:var(--e3), inset 0 1px 0 rgba(255,255,255,.08)!important; }
  button:hover{ filter:brightness(1.08); }
  button:active{ transform:scale(.975); }

  /* 375 — mapa vivo: hover e seleção */
  .leaflet-interactive{
    transition:filter var(--t) var(--ease), stroke-width var(--t) var(--ease), opacity var(--t) var(--ease);
  }
  .leaflet-interactive:hover{
    filter:brightness(1.4) drop-shadow(0 0 9px rgba(232,185,60,.85));
    cursor:pointer;
  }
  @keyframes mapPulse{
    0%,100%{ filter:drop-shadow(0 0 4px rgba(232,185,60,.5)); }
    50%    { filter:drop-shadow(0 0 16px rgba(232,185,60,1)) brightness(1.18); }
  }
  .pais-sel{ animation:mapPulse 1.9s ease-in-out infinite; }

  /* 376 — jornal com acabamento editorial */
  #newspaper .paper{ border-radius:8px!important; }
  #newspaper .cols p:first-child::first-letter{
    font-family:var(--font-display); font-size:26px; font-weight:700; float:left;
    line-height:.9; padding:2px 6px 0 0; color:#8a6a1f;
  }
  /* 376 — votação da ONU com destaque */
  .un-opcao, .un-voto{
    border-left:3px solid rgba(232,185,60,.55)!important;
    padding-left:10px!important;
    transition:background var(--t) var(--ease), border-color var(--t) var(--ease);
  }
  .un-opcao:hover, .un-voto:hover{ background:rgba(232,185,60,.10)!important; }

  /* 377 — polimento: separadores, brilho, estado de alerta */
  hr{ border:0; border-top:1px solid rgba(232,185,60,.18); margin:12px 0; }
  @keyframes alerta{
    0%,100%{ box-shadow:var(--e2); }
    50%    { box-shadow:var(--e2), 0 0 22px rgba(255,92,92,.55); }
  }
  .em-crise{ animation:alerta 1.6s ease-in-out infinite; }
  @keyframes brilho{ 0%{opacity:0} 12%{opacity:.9} 100%{opacity:0} }
  .brilho-rapido{ position:relative; overflow:hidden; }
  .brilho-rapido::after{
    content:''; position:absolute; inset:0; pointer-events:none;
    background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.30) 50%,transparent 60%);
    animation:brilho 1.1s var(--ease);
  }
"""
ANCORA_CSS = "  hr, .separador{"
if h.count(ANCORA_CSS):
    h = h.replace(ANCORA_CSS, CSS_NOVO + "\n" + ANCORA_CSS, 1)
else:
    ANCORA_CSS = "</style>"
    assert h.count(ANCORA_CSS) >= 1, 'ancora </style>'
    h = h.replace(ANCORA_CSS, CSS_NOVO + "\n  " + ANCORA_CSS, 1)
ok('CSS de tipografia/profundidade/transições/mapa/polimento injetado')

# ================================================== 374: MOVIMENTO (JS)
JS = """
/* ============================================================
   FASE 374 — CAMADA DE MOVIMENTO
   Números flutuantes, contadores suaves e feedback de mudança.
   ============================================================ */
(function(){
  if (window.__movimentoOn) return; window.__movimentoOn = true;

  function flutuar(el, txt, cor){
    if (!el || !el.getBoundingClientRect) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const f = document.createElement('div');
    f.textContent = txt;
    f.setAttribute('aria-hidden','true');
    f.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;font-weight:800;' +
      'font-size:14px;letter-spacing:.4px;color:' + cor + ';' +
      'text-shadow:0 2px 7px rgba(0,0,0,.85);left:' + Math.round(Math.min(r.right - 4, innerWidth - 90)) +
      'px;top:' + Math.round(r.top) + 'px;' +
      'transition:transform 1.15s cubic-bezier(.2,.8,.3,1),opacity 1.15s ease-out;';
    document.body.appendChild(f);
    requestAnimationFrame(function(){
      f.style.transform = 'translateY(-40px)';
      f.style.opacity = '0';
    });
    setTimeout(function(){ if (f.parentNode) f.remove(); }, 1250);
  }

  function lerNum(txt){
    const n = parseFloat(String(txt).replace(/[^0-9.,-]/g,'').replace(/\\./g,'').replace(',', '.'));
    return isFinite(n) ? n : null;
  }

  /* procura o mostrador de dinheiro do HUD */
  function acharDinheiro(){
    var els = document.querySelectorAll('*');
    for (var i = 0; i < els.length; i++){
      var e = els[i];
      if (e.children.length) continue;
      var t = (e.textContent || '').trim();
      if (/^\\$?[0-9][0-9.,]*$/.test(t) && t.length > 3 && t.length < 16) return e;
    }
    return null;
  }

  var ultimo = null, tick = 0;
  setInterval(function(){
    var el = acharDinheiro(); if (!el) return;
    var v = lerNum(el.textContent); if (v == null) return;
    if (ultimo != null && v !== ultimo){
      var d = v - ultimo;
      if (Math.abs(d) >= 2 && Math.abs(d) < 100000){
        flutuar(el, (d > 0 ? '+' : '−') + '$' + Math.abs(Math.round(d)).toLocaleString('pt-BR'),
                d > 0 ? '#39d98a' : '#ff5c5c');
      }
    }
    ultimo = v;
    /* microanimação periódica de "vivo" nos cards */
    if (++tick % 14 === 0){
      var c = document.querySelector('.card, .panel');
      if (c && !c.classList.contains('brilho-rapido')){
        c.classList.add('brilho-rapido');
        setTimeout(function(){ c.classList.remove('brilho-rapido'); }, 1200);
      }
    }
  }, 1000);

  /* mapa: marca o país selecionado com pulso */
  document.addEventListener('click', function(e){
    var alvo = e.target;
    if (!alvo || !alvo.classList) return;
    if (alvo.classList.contains('leaflet-interactive') || (alvo.tagName === 'path')){
      document.querySelectorAll('.pais-sel').forEach(function(x){ x.classList.remove('pais-sel'); });
      alvo.classList.add('pais-sel');
    }
  }, true);
})();
"""
ANCORA_JS = "// rel\u00f3gio visual da batalha\nsetInterval(() => { if (bt) btRender(); }, 1000);"
assert h.count(ANCORA_JS) == 1, 'ancora do JS'
h = h.replace(ANCORA_JS, ANCORA_JS + "\n" + JS, 1)
ok('camada de movimento: números flutuantes + pulso no mapa')

io.open(P, 'w', encoding='utf-8').write(h)
print('\nFASES 371-377 (cliente) aplicadas. %d -> %d bytes (+%d)' % (len(orig), len(h), len(h) - len(orig)))
