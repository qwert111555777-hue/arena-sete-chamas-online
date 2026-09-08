#!/usr/bin/env python3
"""FASE 7: topo MA3 completo (renda/ap/doutrina/fe), estatisticas em secoes, ministerios MA3.
So cliente (server.js intocado). Uso: python3 patch_fase7.py (a partir de /home/user/presidente-online)"""
import io, sys

IDX = 'public/index.html'
fails = []

def rep(buf, old, new, tag):
    if buf.count(old) != 1:
        fails.append(f'{tag}: achou {buf.count(old)}x')
        return buf
    print(f'  ok {tag}')
    return buf.replace(old, new)

h = io.open(IDX, encoding='utf-8').read()
print('== CLIENTE ==')

h = rep(h, '    <div class="res">🌾 <b id="m-comida">0</b></div>',
"""    <div class="res">🌾 <b id="m-comida">0</b></div>
    <div class="res" title="Receita por dia">📈 <b id="m-inc">+$0/d</b></div>
    <div class="res" title="Pontos de ação">⚡ <b id="m-ap2">4</b></div>
    <div class="res" title="Doutrina">⚖️ <b id="m-ideo">—</b></div>
    <div class="res" title="Religião">🕌 <b id="m-rel">—</b></div>""", 'H1 chips topo')
h = rep(h, """  $('g-timer').textContent = '📅 DIA ' + (state.day || 1);
  $('m-money').textContent = fmt(m.money);""",
"""  $('g-timer').textContent = '📅 DIA ' + (state.day || 1);
  $('m-money').textContent = fmt(m.money);
  $('m-inc').textContent = '+$' + fmt(m.dailyIncome||0) + '/d';
  $('m-ap2').textContent = m.ap;
  $('m-ideo').textContent = (IDEOLOGIES[m.ideology]||'—').split(' ')[0];
  $('m-rel').textContent = ({islamismo:'Islã',cristianismo:'Cristã',budismo:'Bud.',hinduismo:'Hindu',judaismo:'Jud.',laico:'Laico'})[m.religion]||'—';""", 'H2 update main')
h = rep(h, """  $('btn-pause').textContent = state.paused ? '▶️' : '⏸️';
  $('m-money').textContent = fmt(m.money);""",
"""  $('btn-pause').textContent = state.paused ? '▶️' : '⏸️';
  $('m-money').textContent = fmt(m.money);
  $('m-inc').textContent = '+$' + fmt(m.dailyIncome||0) + '/d';
  $('m-ap2').textContent = m.ap;
  $('m-ideo').textContent = (IDEOLOGIES[m.ideology]||'—').split(' ')[0];
  $('m-rel').textContent = ({islamismo:'Islã',cristianismo:'Cristã',budismo:'Bud.',hinduismo:'Hindu',judaismo:'Jud.',laico:'Laico'})[m.religion]||'—';""", 'H3 update light')
h = rep(h, "  const rows = [\n    ['💰 PIB nacional',",
           "  const rows = [\n    ['H','🏛️ NAÇÃO'],\n    ['💰 PIB nacional',", 'S1 secao nacao')
h = rep(h, "    ['🏭 Indústria', num(m.eco + Object.values(m.buildings).reduce((a,b)=>a+b,0))],\n", "", 'S2 tira industria')
h = rep(h, "    ['💰 PIB nacional', num(m.money*4 + m.eco*1500 + m.pop*120)],\n",
           "    ['💰 PIB nacional', num(m.money*4 + m.eco*1500 + m.pop*120)],\n    ['🏭 Indústria', num(m.eco + Object.values(m.buildings).reduce((a,b)=>a+b,0))],\n", 'S3 industria cima')
h = rep(h, "    ['👶 Nascimentos / semana',",
           "    ['H','👥 POVO'],\n    ['👶 Nascimentos / semana',", 'S4 secao povo')
h = rep(h, "+ rows.map(([k,v])=>`<div style=\"display:flex;justify-content:space-between;border-bottom:1px solid #c9b98b;padding:7px 2px;font-size:13px\"><span>${k}</span><b>${v}</b></div>`).join('')",
           "+ rows.map(([k,v])=>k==='H'?`<div class=\"stat-h\">${v}</div>`:`<div style=\"display:flex;justify-content:space-between;border-bottom:1px solid #c9b98b;padding:7px 2px;font-size:13px\"><span>${k}</span><b>${v}</b></div>`).join('')", 'S5 render secoes')
h = rep(h, """  ov.innerHTML = '<div class="paper" style="width:min(560px,92vw)"><h1 style="font-size:22px">🏛️ ORÇAMENTO DOS MINISTÉRIOS</h1>'
    + DEF.map(([k,lb,ef])=>`<div style="display:flex;align-items:center;gap:10px;margin:9px 0"><span style="width:190px;font-weight:700">${lb}</span><button data-k="${k}" data-d="-1" style="width:30px;cursor:pointer">−</button><b id="bv-${k}" style="width:20px;text-align:center">${b[k]}</b><button data-k="${k}" data-d="1" style="width:30px;cursor:pointer">+</button><small style="color:#6b5a33">${ef}</small></div>`).join('')""",
"""  ov.innerHTML = '<div class="paper" style="width:min(560px,92vw)"><h1 style="font-size:22px">🏛️ MINISTÉRIOS</h1>'
    + DEF.map(([k,lb,ef])=>`<div data-card="${k}" style="background:#fff8e6;border:2px solid #8a6a1f;border-radius:8px;margin:10px 0;overflow:hidden"><div style="background:linear-gradient(#1f7a8c,#145a6b);color:#fff;font-weight:800;font-size:13px;padding:6px 10px">${lb}</div><div style="display:flex;align-items:center;gap:8px;padding:8px 10px"><span class="segs">${[0,1,2,3].map(i=>`<span class="seg${i<b[k]?' on':''}"></span>`).join('')}</span><button data-k="${k}" data-d="-1" style="width:30px;cursor:pointer">−</button><b id="bv-${k}" style="width:20px;text-align:center">${b[k]}</b><button data-k="${k}" data-d="1" style="width:30px;cursor:pointer">+</button><small style="color:#6b5a33">${ef}</small></div></div>`).join('')""", 'O1 ministerios MA3')
h = rep(h, """  ov.querySelectorAll('button[data-k]').forEach(bt => bt.onclick = () => {
    const k = bt.dataset.k; const el = document.getElementById('bv-'+k);
    el.textContent = Math.max(0, Math.min(3, (+el.textContent) + (+bt.dataset.d)));
  });""",
"""  ov.querySelectorAll('button[data-k]').forEach(bt => bt.onclick = () => {
    const k = bt.dataset.k; const el = document.getElementById('bv-'+k);
    const v = Math.max(0, Math.min(3, (+el.textContent) + (+bt.dataset.d)));
    el.textContent = v;
    ov.querySelector('[data-card="'+k+'"]').querySelectorAll('.seg').forEach((sg,i)=>sg.classList.toggle('on', i<v));
  });""", 'O2 stepper barra')
h = rep(h, "</style>",
"""  /* MA3 dados */
  .rank-panel h3{font-family:Georgia,'Times New Roman',serif;}
  .stat-h{background:linear-gradient(#1f7a8c,#145a6b);color:#fff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;border-radius:6px;padding:5px 10px;margin:10px 0 4px;}
  .seg{display:inline-block;width:22px;height:12px;background:#3a3220;border:1px solid #8a6a1f;border-radius:2px;margin-right:3px;}
  .seg.on{background:linear-gradient(#ffe9a8,#d9a93c);}
  .segs{white-space:nowrap;}
</style>""", 'C1 css dados')

if fails:
    print('\nFALHAS:'); [print(' -', f) for f in fails]; sys.exit(1)
io.open(IDX, 'w', encoding='utf-8').write(h)
print('\nPATCH FASE7 OK (server.js intocado)')
