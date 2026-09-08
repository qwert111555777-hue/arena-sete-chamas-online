#!/usr/bin/env python3
"""Move os blocos Q3 (Fase 4) e M1 (Fase 5/MA3) para o FIM do <style>.
Regra CSS: mesma especificidade, o ULTIMO vence — os blocos estavam no topo e perdiam tudo.
Uso: python3 fix_css_order.py (a partir de /home/user/presidente-online). Idempotente: falha se ja movido."""
import io, sys

IDX = 'public/index.html'
h = io.open(IDX, encoding='utf-8').read()

M1_START = "  /* ===== TEMA MA3: papel bege + teal + ouro ===== */"
M1_END = "  .side-tools{display:none;}\n"
Q3_START = "  .rank-panel{right:12px;top:60px;width:330px;max-height:calc(100% - 150px);"
Q3_END = "  .tool-btn{border:2px solid #2a3a5f;}\n"

assert h.count('</style>') == 1, 'esperava 1 </style>'
assert h.count(M1_START) == 1 and h.count(M1_END) == 1, 'bloco M1'
assert h.count(Q3_START) == 1 and h.count(Q3_END) == 1, 'bloco Q3'

i0, i1 = h.index(M1_START), h.index(M1_END) + len(M1_END)
m1 = h[i0:i1]
h = h[:i0] + h[i1:]
print('M1 extraido:', len(m1), 'chars')

j0, j1 = h.index(Q3_START), h.index(Q3_END) + len(Q3_END)
q3 = h[j0:j1]
h = h[:j0] + h[j1:]
print('Q3 extraido:', len(q3), 'chars')

assert '</style>' in h
h = h.replace('</style>', q3 + m1 + '</style>', 1)

# prova da ordem: tema DEPOIS das regras base
lines = h.split('\n')
n_base = next(i for i, l in enumerate(lines) if l.strip() == '.rank-panel{')
n_q3 = next(i for i, l in enumerate(lines) if Q3_START in l)
n_m1 = next(i for i, l in enumerate(lines) if M1_START in l)
n_end = next(i for i, l in enumerate(lines) if '</style>' in l)
print(f'base={n_base} Q3={n_q3} M1={n_m1} fim-style={n_end}')
assert n_base < n_q3 < n_m1 < n_end, 'ordem errada!'
io.open(IDX, 'w', encoding='utf-8').write(h)
print('FIX CSS ORDER OK')
