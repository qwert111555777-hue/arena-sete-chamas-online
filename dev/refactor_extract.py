#!/usr/bin/env python3
# Extrai blocos de dados puros do server.js para módulos lib/data/*.js
import re, sys, os

SRC = '/home/user/presidente-online/server.js'
OUT = '/home/user/presidente-online/lib/data'

lines = open(SRC, encoding='utf-8').read().split('\n')
# lines[i] = linha i+1 (0-indexed -> 1-indexed)

# Módulos: name -> dict(nome_const -> (start, end)) 1-indexed inclusive
MODULES = {
    'countries': {'COUNTRIES': (42, 238), 'NEWLANDS': (239, 239), 'FLAGS_ALLOWED': (240, 240)},
    'techs': {'IDEOLOGIES': (245, 252), 'RELIGIONS': (253, 259), 'MINISTERS': (260, 265),
              'TECH_COSTS': (268, 268), 'TECH_MAX': (269, 269), 'TECH_TREES': (270, 276),
              'TECHS': (278, 409), 'SPACE_COSTS': (429, 429)},
    'map': {'SECTORS': (415, 419), 'DEPOSIT_POOL': (420, 420), 'DEP_NAMES': (421, 421)},
    'un': {'UN_TYPES': (430, 439)},
    'personas': {'PERSONAS': (682, 690)},
    'leis': {'SEG': (803, 808), 'LEIS': (809, 829), 'LEI_GRUPOS': (1669, 1681), 'MINISTRO_EFEITOS': (1709, 1724)},
    'buildings': {'BUILD_MAX': (1252, 1252), 'BUILD_TABS': (1253, 1253), 'PROD_BUILDS': (1254, 1254),
                  'CONCRETE_NEED': (1255, 1255), 'PROD_NAMES': (1256, 1256), 'BUILD_TAB': (1257, 1257),
                  'BUILD_OUT': (1258, 1258)},
    'military': {'UNIT_COSTS': (1303, 1303), 'UNIT_MAX': (1304, 1304), 'BT': (7289, 7302),
                 'BT_VANTAGEM': (7306, 7320), 'BT_COLS_BT_LINHAS': (7339, 7339)},
    'feed': {'FEED_PESO': (1312, 1323)},
}

# Ordem em que os requires devem aparecer no topo do server.js
REQUIRE_ORDER = ['countries', 'techs', 'map', 'un', 'personas', 'leis', 'buildings', 'military', 'feed']

def extract_literal(name, start, end):
    first = lines[start-1].rstrip('\n')
    m = re.match(r'^const\s+' + re.escape(name) + r'\s*=\s*(.*)$', first)
    if not m:
        raise SystemExit(f'FALHA: bloco {name} linha {start} não casa com "const {name} = ...": {first[:80]}')
    head = m.group(1)
    if start == end:
        lit = head.rstrip()
        if lit.endswith(';'):
            lit = lit[:-1]
        return lit
    else:
        mid = [l.rstrip('\n') for l in lines[start:end-1]]
        last = lines[end-1].rstrip('\n').rstrip()
        if not last.endswith(';'):
            raise SystemExit(f'FALHA: bloco {name} última linha {end} não termina com ";": {last[:80]}')
        last = last[:-1]
        return '\n'.join([head] + mid + [last])

removed = set()   # índices 0-based a remover do server.js

# Gera os módulos
for mod in REQUIRE_ORDER:
    entries = MODULES[mod]
    exports = []
    for name, (s, e) in entries.items():
        if name == 'BT_COLS_BT_LINHAS':
            # linha única "const BT_COLS = 7, BT_LINHAS = 6;"
            raw = lines[s-1].rstrip('\n')
            if 'BT_COLS = 7' not in raw or 'BT_LINHAS = 6' not in raw:
                raise SystemExit(f'FALHA: BT_COLS/BT_LINHAS linha {s} inesperada: {raw[:80]}')
            exports.append('  BT_COLS: 7,')
            exports.append('  BT_LINHAS: 6,')
        else:
            lit = extract_literal(name, s, e)
            exports.append(f'  {name}: {lit},')
        for i in range(s-1, e):
            removed.add(i)
    body = 'module.exports = {\n' + '\n'.join(exports) + '\n};\n'
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, mod + '.js'), 'w', encoding='utf-8') as f:
        f.write(body)
    print(f'criado lib/data/{mod}.js  ({len(entries)} export(s))')

# Require lines no topo
require_lines = []
for mod in REQUIRE_ORDER:
    names = []
    for name in MODULES[mod].keys():
        if name == 'BT_COLS_BT_LINHAS':
            names += ['BT_COLS', 'BT_LINHAS']
        else:
            names.append(name)
    require_lines.append('const { ' + ', '.join(names) + " } = require('./lib/data/" + mod + "');")
require_block = '\n'.join(require_lines)

# Reconstroi server.js: remove blocos, insere requires após a linha do zlib (índice da linha 15 -> 14 em 0-based)
anchor = None
for i, l in enumerate(lines):
    if "require('zlib')" in l:
        anchor = i
        break
if anchor is None:
    raise SystemExit('FALHA: âncora zlib não encontrada')

new_lines = []
for i, l in enumerate(lines):
    if i in removed:
        continue
    new_lines.append(l)
    if i == anchor:
        new_lines.append('// ---- dados extraídos para lib/data/* ----')
        for rl in require_lines:
            new_lines.append(rl)

open(SRC, 'w', encoding='utf-8').write('\n'.join(new_lines))
print(f'server.js reescrito: {len(new_lines)} linhas (antes {len(lines)})')
print('removidas:', len(removed), 'linhas')
