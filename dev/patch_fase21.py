#!/usr/bin/env python3
"""FASE 21 (cliente) — tela 🏛️ GOVERNO (toolbar): ministros + orçamento + setores +
eleições + mandatos. + labels dos 3 novos ministros."""
import io
P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = '<button id="btn-med" title="Conquistas">🏅</button>'
assert h.count(a) == 1
h = h.replace(a, a + '\n    <button id="btn-gov" title="Governo">🏛️</button>')
ok.append('O1 botao hud')

a = ',#btn-med'
assert h.count(a) == 1, 'css %d' % h.count(a)
h = h.replace(a, a + ',#btn-gov')
ok.append('O2 estilo')

a = "'btn-eco','btn-med']"
assert h.count(a) == 1, 'move %d' % h.count(a)
h = h.replace(a, "'btn-eco','btn-med','btn-gov']")
ok.append('O3 move toolbar')

a = "const MINISTERS = { eco:{tec:'Tecocrata +10% renda', pop:'Populista +1❤️'}, def:{fal:'Falcão +10% atq', estr:'Estrategista +10% def'}, dip:{neg:'Negociador dip -50%', inf:'Influenciador +1⚖️'} };"
assert h.count(a) == 1, 'min %d' % h.count(a)
h = h.replace(a, "const MINISTERS = { eco:{tec:'Tecocrata +10% renda', pop:'Populista +1❤️', ind:'Industrialista +20% prédios'}, def:{fal:'Falcão +10% atq', estr:'Estrategista +10% def', pac:'Pacifista +2❤️ −10%'}, dip:{neg:'Negociador dip -50%', inf:'Influenciador +1⚖️', esp:'Mestre-Espião +10% sab'} };")
ok.append('O4 labels ministros')

MOD = """$('btn-gov').onclick = () => {
  const m = me(); if (!m || !state) return;
  const ov = document.createElement('div'); ov.id='newspaper';
  const nx = 57 + Math.floor(Math.max(0,state.day-1)/56)*56;
  const faltam = Math.max(0, nx - state.day);
  const mand = (m.stats&&m.stats.mandatos)||0;
  const GDEF = [['exe','⚔️ Exército','−$40/sem por Nv'],['int','🚔 Interior','+1❤️/sem no Nv2+'],['tra','🛣️ Transporte','+3% renda/Nv'],['edu','🎓 Educação','+2% renda/Nv'],['ambm','🌳 Meio Ambiente','+1❤️/sem no Nv2+']];
  const GB = Object.assign({exe:1,int:1,tra:1,edu:1,ambm:1}, m.budget||{});
  const SECS = [['educacao','🎓 Educação'],['saude','🏥 Saúde'],['cultura','🎭 Cultura'],['esportes','⚽ Esportes'],['habitacao','🏠 Habitação'],['justica','⚖️ Justiça'],['turismo','🧳 Turismo']];
  const POSTS = [['eco','💰 Economia'],['def','🛡️ Defesa'],['dip','🤝 Diplomacia']];
  let s = '<div class="paper" style="width:min(640px,94vw)"><h1 style="font-size:20px">🏛️ GOVERNO</h1><img src="headers/gov.jpg" style="width:100%;height:110px;object-fit:cover;border-radius:8px;border:2px solid #8a6a1f;margin-bottom:8px">';
  s += '<div style="background:#fff8e6;border:2px solid #145a6b;border-radius:8px;padding:8px 10px;margin-bottom:8px;font-size:12px">🗳️ Próxima eleição: <b>dia '+nx+'</b> (faltam '+faltam+' dias) · 🏆 Mandatos vencidos: <b>'+mand+'</b><div style="font-size:11px;color:#6b5a33">Aprovação 50%+: reeleito (+$300, +3❤️) · 35–49%: vitória apertada · abaixo de 35%: derrota + emergência.</div></div>';
  s += '<div class="stat-h">💼 Ministros (1⚡ + $100 cada)</div>';
  s += POSTS.map(pt=>{
    const cur = (m.ministers||{})[pt[0]];
    return '<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:6px 10px;margin-bottom:6px"><b style="font-size:12px">'+pt[1]+'</b><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">'+Object.keys(MINISTERS[pt[0]]).map(v=>'<button data-min="'+pt[0]+':'+v+'" title="'+MINISTERS[pt[0]][v]+'" style="padding:6px 10px;cursor:pointer;font-size:12px;'+(cur===v?'border:2px solid #2e7d32':'')+'" '+((cur===v||m.ap<1||m.money<100)?'disabled':'')+'>'+MINISTERS[pt[0]][v].split(' ')[0]+(cur===v?' ✓':'')+'</button>').join('')+'</div></div>';
  }).join('');
  s += '<div class="stat-h">🏛️ Orçamento dos ministérios (Nv 0–3)</div>';
  s += GDEF.map(d=>'<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:6px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px"><div style="flex:1"><b style="font-size:12px">'+d[1]+'</b> <span style="font-size:11px;color:#6b5a33">'+d[2]+'</span></div><button data-gk="'+d[0]+'" data-gd="-1" style="width:30px;cursor:pointer">−</button><b id="gv-'+d[0]+'" style="width:20px;text-align:center">'+GB[d[0]]+'</b><button data-gk="'+d[0]+'" data-gd="1" style="width:30px;cursor:pointer">+</button></div>').join('');
  s += '<div style="margin-bottom:6px"><button data-govok style="padding:8px 16px;cursor:pointer">Aplicar orçamento</button></div>';
  s += '<div class="stat-h">🏙️ Setores sociais (1⚡ + $150, máx Nv 5)</div>';
  s += SECS.map(sc=>{
    const lv = (m.sectors&&m.sectors[sc[0]])||0;
    return '<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:6px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px"><div style="flex:1"><b style="font-size:12px">'+sc[1]+'</b><div style="margin-top:2px">'+[0,1,2,3,4].map(i=>'<span style="display:inline-block;width:22px;height:10px;margin-right:2px;border-radius:2px;background:'+(i<lv?'#c9a227':'#d8cba0')+';border:1px solid #8a6a1f"></span>').join('')+'</div></div><button data-sec="'+sc[0]+'" style="padding:6px 10px;cursor:pointer" '+((lv>=5||m.ap<1||m.money<75)?'':'disabled')+'>'+(lv>=5?'MÁX':'Investir')+'</button></div>';
  }).join('');
  s += '<div style="text-align:center;margin-top:6px"><button id="gv-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
  ov.innerHTML = s;
  document.body.appendChild(ov);
  ov.querySelector('#gv-x').onclick=()=>ov.remove();
  ov.onclick = e => { if (e.target===ov) ov.remove(); };
  ov.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>{ const pv=b.dataset.min.split(':'); send({t:'action',action:'ministro',post:pv[0],value:pv[1]}); b.disabled=true; });
  ov.querySelectorAll('button[data-gk]').forEach(bt=>bt.onclick=()=>{ const el=ov.querySelector('#gv-'+bt.dataset.gk); el.textContent=Math.max(0,Math.min(3,(+el.textContent)+(+bt.dataset.gd))); });
  ov.querySelector('[data-govok]').onclick=()=>{ const g=k=>+ov.querySelector('#gv-'+k).textContent; send({t:'orcamento',budget:{exe:g('exe'),int:g('int'),tra:g('tra'),edu:g('edu'),ambm:g('ambm')}}); ov.remove(); };
  ov.querySelectorAll('[data-sec]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'setor',value:b.dataset.sec}); b.disabled=true; });
};
"""
a = "$('btn-med').onclick = () => {"
assert h.count(a) == 1
h = h.replace(a, MOD + a)
ok.append('O5 modal governo')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE21 OK')
