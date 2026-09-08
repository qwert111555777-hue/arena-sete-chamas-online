#!/usr/bin/env python3
"""FASE 26 (cliente) — rede de agentes + recrutar + botoes roubar/cacar no modal spy."""
import io
P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = "  s += '<div style=\"font-size:11px;color:#6b5a33;margin-bottom:6px\">🔍 Espionar revela"
assert h.count(a) == 1, 'aa1 %d' % h.count(a)
bar = """  const maxE = 3 + sec * 2, nE = m.espioes || 0;
  s += '<div style="background:#fff8e6;border:2px solid #c9b98b;border-radius:8px;padding:8px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px"><div style="flex:1;font-size:13px">🕵️ Rede: <b>'+nE+'/'+maxE+'</b> agentes <span style="font-size:11px;color:#6b5a33">(+5% sabotagem/roubo cada)</span></div>' + (nE>=maxE?'<b style="color:#2e7d32">MÁX</b>':'<button data-spyrec style="padding:8px 12px;cursor:pointer;white-space:nowrap" '+((m.ap>=1&&m.money>=150)?'':'disabled')+'>Recrutar (1AP+$150)</button>') + '</div>';
""" + a
h = h.replace(a, bar)
ok.append('AA1 barra rede')

a = """Ministro diplomata/coroa reduz custos.</div>';"""
assert h.count(a) == 1, 'aa2 %d' % h.count(a)
h = h.replace(a, """Ministro diplomata/coroa reduz custos. 📡 Roubo copia 1 Nv de tech · 🔍 Caça mata agentes inimigos.</div>';""")
ok.append('AA2 descricao')

a = '    const okE = m.ap>=1 && m.money>=50, okS = m.ap>=1 && m.money>=75;'
assert h.count(a) == 1, 'aa3a %d' % h.count(a)
h = h.replace(a, '    const okE = m.ap>=1 && m.money>=50, okS = m.ap>=1 && m.money>=75, okR = m.ap>=1 && m.money>=100, okC = m.ap>=1 && m.money>=50;')
ok.append('AA3a flags')

a = ">🧨 Sabotar</button></div>';"
assert h.count(a) == 1, 'aa3b %d' % h.count(a)
h = h.replace(a, ">🧨 Sabotar</button><button data-rou=\"'+p.id+'\" style=\"padding:6px 10px;cursor:pointer\" '+(okR?'':'disabled')+'>📡 Roubar</button><button data-cac=\"'+p.id+'\" style=\"padding:6px 10px;cursor:pointer\" '+(okC?'':'disabled')+'>🔍 Caçar</button></div>';")
ok.append('AA3b botoes')

a = "  ov.querySelectorAll('[data-sab]').forEach(b=>b.onclick=()=>send({t:'action',action:'sabotagem',target:b.dataset.sab}));"
assert h.count(a) == 1, 'aa4 %d' % h.count(a)
h = h.replace(a, a + "\n  const rc = ov.querySelector('[data-spyrec]'); if (rc) rc.onclick=()=>{ send({t:'action',action:'recrutar_espiao'}); ov.remove(); };\n  ov.querySelectorAll('[data-rou]').forEach(b=>b.onclick=()=>send({t:'action',action:'roubar_tech',target:b.dataset.rou}));\n  ov.querySelectorAll('[data-cac]').forEach(b=>b.onclick=()=>send({t:'action',action:'cacar_espioes',target:b.dataset.cac}));")
ok.append('AA4 fios')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE26 OK')
