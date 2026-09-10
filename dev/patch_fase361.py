# -*- coding: utf-8 -*-
"""
FASE 361 — Overhaul visual da HUD (itens 1,2,3,4,5 do avaliador)

1. Substitui os 7 emojis da barra inferior por ícones SVG próprios
2. Redesenha a barra inferior (ícone + nome + estado ativo com brilho)
3. Cria sistema visual unificado (tokens de profundidade/elevação)
4. Dá profundidade à barra (camadas, sombras, blur)
5. Camada de movimento (transitions + glow pulsante)

Itens 6 (mapa) e 7-10 (sistemas) ficam para as próximas fases.
"""
import io, re, sys

P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
orig = h
ok = lambda m: sys.stdout.write('  ok: %s\n' % m)

# ---------------------------------------------------------------- 1. tokens
TOKENS_ANTES = "    --green:#39d98a; --red:#ff5c5c; --blue:#4da3ff;\n  }"
TOKENS_DEPOIS = """    --green:#39d98a; --red:#ff5c5c; --blue:#4da3ff;

    /* === FASE 361: sistema visual unificado === */
    /* profundidade / elevacao */
    --e0:0 1px 2px rgba(0,0,0,.35);
    --e1:0 3px 10px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.05);
    --e2:0 8px 22px rgba(0,0,0,.5),  inset 0 1px 0 rgba(255,255,255,.07);
    --e3:0 14px 38px rgba(0,0,0,.58), inset 0 1px 0 rgba(255,255,255,.09);
    /* vidro */
    --glass:linear-gradient(180deg,rgba(24,34,62,.90),rgba(11,17,36,.95));
    --glass-brd:rgba(232,185,60,.26);
    /* raios */
    --r-s:8px; --r-m:13px; --r-l:18px;
    /* movimento */
    --ease:cubic-bezier(.2,.8,.3,1);
    --t-fast:.14s; --t:.2s; --t-slow:.32s;
  }"""
assert h.count(TOKENS_ANTES) == 1, 'tokens :root'
h = h.replace(TOKENS_ANTES, TOKENS_DEPOIS)
ok('tokens de profundidade/movimento no :root')

# ------------------------------------------------- 2. icones SVG da HUD
ICONS = {
 'build': '<path d="M3 21h18"/><path d="M6 21V7l6-4 6 4v14"/><path d="M10 21v-6h4v6"/><path d="M9.5 10h.01M14.5 10h.01"/>',
 'tech':  '<path d="M9 3h6"/><path d="M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.2 15h9.6"/><path d="M10.6 18h2.8"/>',
 'war':   '<path d="M18 3 8 13"/><path d="M6 12l4 4"/><path d="M9 15l-3 3"/><path d="M6 3 16 13"/><path d="M14 12l4 4"/><path d="M15 15l3 3"/>',
 'dip':   '<path d="M7.5 11 5 8.5a2 2 0 0 0-2.8 2.8l3.3 3.3"/><path d="M16.5 11 19 8.5a2 2 0 0 1 2.8 2.8l-3.3 3.3"/><path d="M7.5 11h9l-3 6h-3z"/>',
 'spy':   '<path d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.6"/>',
 'nuke':  '<circle cx="12" cy="12" r="2.2"/><path d="M12 9.7 9.6 5.4a9 9 0 0 1 4.8 0L12 9.7z"/><path d="M9.85 13.25 5.3 14.7A9 9 0 0 1 5 9.6l4.85 3.65z"/><path d="M14.15 13.25l4.55 1.45a9 9 0 0 0-.3-5.1l-4.25 3.65z"/>',
 'onu':   '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 2.6 15.4 0 18"/><path d="M12 3c-2.6 2.6-2.6 15.4 0 18"/>',
}
LABELS = {'build':'Construir','tech':'Pesquisa','war':'Guerra','dip':'Diplomacia',
          'spy':'Espionagem','nuke':'Nuclear','onu':'ONU'}
TITLES = {'build':'Construir (suas construções)','tech':'Pesquisas e tecnologias',
          'war':'Exército e guerras','dip':'Diplomacia','spy':'Operações secretas',
          'nuke':'Programa nuclear','onu':'Nações Unidas'}

def svg(k):
    return ('<span class="bn-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">%s</svg></span>' % ICONS[k])

n = 0
for k, lab in LABELS.items():
    bid = 'btn-' + k
    antigo = re.search(r'<button id="%s"[^>]*>[^<]*</button>' % bid, h)
    if not antigo:
        sys.stdout.write('  AVISO: %s nao encontrado\n' % bid); continue
    novo = ('<button id="%s" title="%s">%s<span class="bn-lbl">%s</span></button>'
            % (bid, TITLES[k], svg(k), lab))
    h = h.replace(antigo.group(0), novo)
    n += 1
assert n == 7, 'esperava 7 botoes, troquei %d' % n
ok('7 emojis da HUD substituidos por icones SVG')

# ------------------------------------------------- 3. CSS da barra inferior
CSS_ANTES = """  #bottomnav{position:fixed;left:50%;transform:translateX(-50%);bottom:10px;display:flex;gap:10px;z-index:50;}
  #bottomnav button{width:56px!important;height:56px!important;border-radius:50%!important;font-size:24px!important;background:radial-gradient(circle at 35% 30%,#ffe9a8,#d9a93c 55%,#8a6a1f)!important;border:3px solid #f5e3c0!important;box-shadow:0 4px 14px rgba(0,0,0,.6),inset 0 2px 4px #fff8!important;padding:0!important;}
  #bottomnav button:hover{transform:scale(1.08);}"""

CSS_DEPOIS = """  /* === FASE 361: barra inferior redesenhada === */
  #bottomnav{
    position:fixed;left:50%;transform:translateX(-50%);bottom:10px;z-index:50;
    display:flex;gap:8px;padding:8px 10px;
    border-radius:var(--r-l);
    background:var(--glass);
    border:1px solid var(--glass-brd);
    box-shadow:var(--e3);
    backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  }
  #bottomnav button{
    width:68px!important;height:60px!important;border-radius:var(--r-m)!important;
    display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:3px;
    padding:0!important;
    background:linear-gradient(180deg,#22304f,#151e39)!important;
    border:1px solid rgba(232,185,60,.22)!important;
    color:#b9c5de!important;
    box-shadow:var(--e1)!important;
    transition:transform var(--t) var(--ease), box-shadow var(--t) var(--ease),
               background var(--t) var(--ease), color var(--t) var(--ease),
               border-color var(--t) var(--ease);
  }
  #bottomnav button .bn-ico{
    width:25px;height:25px;display:block;color:var(--gold2);
    transition:transform var(--t) var(--ease), filter var(--t) var(--ease), color var(--t) var(--ease);
  }
  #bottomnav button .bn-ico svg{width:100%;height:100%;display:block;}
  #bottomnav button .bn-lbl{
    font-size:8px!important;font-weight:800;letter-spacing:.35px;text-transform:uppercase;
    opacity:.72;line-height:1;transition:opacity var(--t) var(--ease), color var(--t) var(--ease);
  }
  #bottomnav button:hover{
    transform:translateY(-3px)!important;
    border-color:rgba(232,185,60,.55)!important;
    color:#fff!important;
    box-shadow:var(--e2), 0 0 16px rgba(232,185,60,.22)!important;
  }
  #bottomnav button:hover .bn-ico{transform:scale(1.1);}
  #bottomnav button:hover .bn-lbl{opacity:1;}
  #bottomnav button:active{transform:translateY(-1px) scale(.97)!important;}
  /* estado selecionado */
  @keyframes bnGlow{
    0%,100%{box-shadow:var(--e2), 0 0 0 1px rgba(232,185,60,.45), 0 0 16px rgba(232,185,60,.22), inset 0 1px 0 rgba(255,255,255,.12)!important;}
    50%    {box-shadow:var(--e2), 0 0 0 1px rgba(232,185,60,.8),  0 0 30px rgba(232,185,60,.45), inset 0 1px 0 rgba(255,255,255,.12)!important;}
  }
  #bottomnav button.sel{
    background:linear-gradient(180deg,rgba(232,185,60,.24),rgba(232,185,60,.06))!important;
    border-color:var(--gold)!important;color:#fff!important;
    transform:translateY(-3px)!important;
    animation:bnGlow 2.8s ease-in-out infinite;
  }
  #bottomnav button.sel .bn-ico{
    color:#fff;transform:scale(1.1);filter:drop-shadow(0 0 6px rgba(255,215,106,.9));
  }
  #bottomnav button.sel .bn-lbl{opacity:1;color:var(--gold2);}"""

assert h.count(CSS_ANTES) == 1, 'css da bottomnav'
h = h.replace(CSS_ANTES, CSS_DEPOIS)
ok('barra inferior redesenhada (icone+nome, hover, ativo com glow)')

# --------------------------------------------- 4. responsivo (2 breakpoints)
RESP_900_ANTES = """    #bottomnav{gap:5px;bottom:8px;}
    #bottomnav button{width:42px!important;height:42px!important;font-size:17px!important;}"""
RESP_900_DEPOIS = """    #bottomnav{gap:5px;bottom:8px;padding:6px 7px;border-radius:var(--r-m);}
    #bottomnav button{width:49px!important;height:47px!important;border-radius:11px!important;gap:2px!important;}
    #bottomnav button .bn-ico{width:20px!important;height:20px!important;}
    #bottomnav button .bn-lbl{font-size:6.4px!important;letter-spacing:.05px!important;}
    #leftdock{bottom:104px!important;}
    #transport{bottom:104px!important;}"""
assert h.count(RESP_900_ANTES) == 1, 'media 900px'
h = h.replace(RESP_900_ANTES, RESP_900_DEPOIS)
ok('breakpoint 900px ajustado (dock/transporte sobem)')

RESP_560_ANTES = """    #bottomnav{gap:4px;bottom:6px;}
    #bottomnav button{width:38px!important;height:38px!important;font-size:15px!important;}"""
RESP_560_DEPOIS = """    #bottomnav{gap:4px;bottom:6px;padding:5px 6px;}
    #bottomnav button{width:43px!important;height:42px!important;border-radius:10px!important;gap:1px!important;}
    #bottomnav button .bn-ico{width:18px!important;height:18px!important;}
    #bottomnav button .bn-lbl{font-size:5.8px!important;letter-spacing:0!important;}
    #leftdock{bottom:96px!important;}
    #transport{bottom:96px!important;}"""
assert h.count(RESP_560_ANTES) == 1, 'media 560px'
h = h.replace(RESP_560_ANTES, RESP_560_DEPOIS)
ok('breakpoint 560px ajustado')

# ------------------------------------------ 5. JS: marcar botao selecionado
JS = """
/* === FASE 361: estado selecionado da barra inferior === */
(function(){
  var nav=document.getElementById('bottomnav');
  if(!nav) return;
  function marca(b){ nav.querySelectorAll('button').forEach(function(x){ x.classList.toggle('sel', x===b); }); }
  function limpa(){ nav.querySelectorAll('button.sel').forEach(function(x){ x.classList.remove('sel'); }); }
  nav.addEventListener('click', function(e){
    var b=e.target && e.target.closest ? e.target.closest('button') : null;
    if(b) marca(b);
  });
  document.addEventListener('click', function(e){
    if(nav.contains(e.target)) return;
    var aberto=document.querySelector('.ov:not(.hidden),.modal:not(.hidden),#ov:not(.hidden)');
    if(!aberto) limpa();
  });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') limpa(); });
})();
"""
ANCORA = "// rel\u00f3gio visual da batalha\nsetInterval(() => { if (bt) btRender(); }, 1000);"
assert h.count(ANCORA) == 1, 'ancora do fim do script principal'
h = h.replace(ANCORA, ANCORA + "\n" + JS, 1)
ok('JS do estado selecionado injetado no fim do script principal')

io.open(P, 'w', encoding='utf-8').write(h)
print('\nFASE 361 aplicada. %d -> %d bytes (+%d)' % (len(orig), len(h), len(h)-len(orig)))
print('emojis restantes na HUD: %d (antes 7)' % len(re.findall(r'<button id="btn-(?:build|tech|war|dip|spy|nuke|onu)"[^>]*>\s*<span class="bn-ico">', h)))
