#!/usr/bin/env python3
"""Reverte T2 quebrado + reinsere secoes via DOM (insertBefore)."""
import io
P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()

# 1) reverter span quebrado
i0 = h.index("    + '<div class=\"stat-h\">Sua fe</div>")
j = h.index(".join('')", i0)
i1 = h.index('\n', j) + 1
h = h[:i0] + h[i1:]
assert 'Sua fe' not in h, 'revert falhou'
print('ok revert')

# 2) inserir secoes via DOM antes do appendChild do modal rl
a = """  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target===ov || e.target.id==='rl-x') ov.remove(); };"""
assert h.count(a) == 1, 'dom %d' % h.count(a)
js = """  const paper = ov.querySelector('.paper');
  const secDiv = document.createElement('div');
  let secH = '<div class="stat-h">SUA FE</div>';
  secH += '<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:8px 10px;margin-bottom:6px">';
  secH += '<div style="font-size:12px">Fe: <b>' + Math.round(m.fe||0) + '/60</b> (hegemonia religiosa) - Conversoes: <b>' + ((m.stats&&m.stats.conversoes)||0) + '</b></div>';
  secH += '<div style="background:#d8cba0;border:1px solid #8a6a1f;border-radius:4px;height:12px;margin:4px 0"><div style="width:' + Math.min(100,Math.round((m.fe||0)/60*100)) + '%;height:100%;background:#7b1fa2;border-radius:3px"></div></div>';
  secH += '<button id="rl-templo" style="padding:6px 12px;cursor:pointer" ' + ((m.ap>=1&&m.money>=200)?'':'disabled') + '>Erguer templo (1AP + $200 = +4 fe, +2 coracao)</button></div>';
  secH += '<div class="stat-h">MISSIONARIOS (1AP + $300)</div>';
  secH += state.players.filter(o=>o.alive&&o.id!==m.id&&o.religion!==m.religion).map(o=>'<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:6px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px"><div style="flex:1;font-size:12px"><b>' + o.name + '</b> <span style="color:#6b5a33">' + (R[o.religion]||o.religion||'?') + '</span></div><button data-miss="' + o.id + '" style="padding:6px 10px;cursor:pointer" ' + ((!m.religion||m.religion==='laico'||m.ap<1||m.money<300)?'disabled':'') + '>Enviar</button></div>').join('');
  secDiv.innerHTML = secH;
  paper.insertBefore(secDiv, paper.lastChild);
"""
h = h.replace(a, js + a)
io.open(P, 'w', encoding='utf-8').write(h)
print('ok dom')
print('\nFIX FASE23 OK')
