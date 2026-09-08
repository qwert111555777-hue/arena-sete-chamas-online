#!/usr/bin/env python3
"""FASE 10 — skin MA3 na tela de batalha tática (SÓ CSS, lógica intocada).
E1: overrides .bt-* no FIM do <style> (papel + teal + ouro).
Impostos: já existe e completo (btn-tax, 4 sliders) — sem mudança.
"""
import io, sys

P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

CSS = """  /* FASE10 MA3 battle skin (papel+teal+ouro, lógica intocada) */
  .bt-wrap{background:#f3ead1;border:3px solid #8a6a1f;border-radius:12px;padding:12px;box-shadow:0 6px 24px rgba(0,0,0,.5);}
  .bt-top{background:#145a6b;border-radius:8px;padding:8px 12px;margin-bottom:10px;border:2px solid #c9a227;}
  #bt-titulo{font-family:Georgia,serif;font-weight:800;color:#f5d76e;font-size:18px;letter-spacing:.5px;}
  #bt-status{background:#fff8e6;color:#2b2416;font-weight:700;font-size:12px;padding:4px 12px;border-radius:20px;border:1px solid #c9b98b;}
  #bt-recuar{background:#a33;color:#fff;font-weight:800;border:2px solid #7a2e1f;border-radius:8px;padding:6px 14px;cursor:pointer;}
  #bt-recuar:disabled{opacity:.45;cursor:default;}
  .bt-grid{background:#0a0f1c;border:2px solid #c9a227;border-radius:10px;padding:8px;}
  .bt-cell{border-color:#5a4a22;}
  .bt-cell.atk-field{background:#10233a;}
  .bt-cell.def-field{background:#241a2e;}
  .bt-unidade,.bt-log{background:#fff8e6 !important;border:2px solid #c9b98b !important;color:#2b2416;}
  .bt-unidade b{color:#7a2e1f;}
  .bt-log div{border-bottom:1px solid #e0d3a8 !important;color:#4a3f28 !important;}
  .bt-acoes button{background:#145a6b;color:#fff;font-weight:800;border:2px solid #0d3d49;border-radius:8px;padding:6px 12px;cursor:pointer;}
  .bt-acoes span{color:#6b5a33 !important;}
  #bt-legenda{color:#6b5a33 !important;}
  #bt-legenda b{color:#7a2e1f !important;}
"""

anchor = '</style>'
assert h.count(anchor) == 1, 'anchor </style> nao unico: %d' % h.count(anchor)
h = h.replace(anchor, CSS + anchor)
ok.append('E1 skin batalha')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE10 OK (server.js intocado)')
