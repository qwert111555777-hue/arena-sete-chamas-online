#!/usr/bin/env python3
"""FASE 20 (cliente) — tela 🏅 CONQUISTAS (toolbar): 20 conquistas c/ progresso ao vivo,
mapeadas das 20 do MA2 Steam e melhoradas (barra de progresso em todas)."""
import io
P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = '<button id="btn-eco" title="Ecologia">🌍</button>'
assert h.count(a) == 1
h = h.replace(a, a + '\n    <button id="btn-med" title="Conquistas">🏅</button>')
ok.append('M1 botao hud')

a = ',#btn-eco'
assert h.count(a) == 1, 'css %d' % h.count(a)
h = h.replace(a, a + ',#btn-med')
ok.append('M2 estilo')

a = "'btn-space','btn-eco']"
assert h.count(a) == 1, 'move %d' % h.count(a)
h = h.replace(a, "'btn-space','btn-eco','btn-med']")
ok.append('M3 move toolbar')

MOD = """$('btn-med').onclick = () => {
  const m = me(); if (!m || !state) return;
  const st = m.stats || {};
  const alive = state.players.filter(p=>p.alive);
  const need = Math.ceil((m.pop||0)/10)+10;
  const shareR = (m.religion && m.religion!=='laico') ? alive.filter(o=>o.religion===m.religion).length/Math.max(1,alive.length)*100 : 0;
  const shareI = m.ideology ? alive.filter(o=>o.ideology===m.ideology).length/Math.max(1,alive.length)*100 : 0;
  const revPos = alive.slice().sort((a,b)=>(b.dailyIncome||0)-(a.dailyIncome||0)).findIndex(p=>p.id===myId)+1;
  const nTech = Object.keys(m.techLv||{}).length;
  const minF = (m.ministers && (m.ministers.eco?1:0)+(m.ministers.def?1:0)+(m.ministers.dip?1:0)) || 0;
  const bmax = m.budget ? ['exe','int','tra','edu','ambm'].filter(k=>m.budget[k]>=3).length : 0;
  const ACH = [
    ['☢️','Programa Nuclear','Inicie o programa nuclear', Math.min(m.nuclear||0,1), 1],
    ['🏴','Conquistador','Anexe uma nação por acordo diplomático', st.anexacoes||0, 1],
    ['🍞','Pão na Mesa','Estoque de comida acima da necessidade ('+Math.floor(m.rec.comida||0)+'/'+need+')', Math.min(m.rec.comida||0,need), need],
    ['🎖️','Potência Global','Top 3 em receita diária (você: #'+revPos+')', revPos<=3?1:0, 1],
    ['🏛️','Governo Completo','Preencha as 3 pastas de ministros', minF, 3],
    ['💰','Capitalista','Acumule $50.000 no caixa', Math.min(m.money||0,50000), 50000],
    ['🤝','Benfeitor','Envie ajuda humanitária 5 vezes', st.ajuda||0, 5],
    ['🕊️','Diplomata','Tenha 3 aliados ao mesmo tempo', Math.min((m.allies||[]).length,3), 3],
    ['💼','Mercador','Venda 100 unidades no mercado', Math.min(st.vendidas||0,100), 100],
    ['🎖️','Coronel','Vença 10 batalhas', Math.min(st.vitorias||0,10), 10],
    ['🏦','Investidor','Contraia $5.000 em dívidas', Math.min(m.debt||0,5000), 5000],
    ['🔬','Gênio da Ciência','Pesquise as 124 tecnologias ('+nTech+'/124)', nTech, 124],
    ['🗺️','Explorador','Controle 10 províncias', Math.min((m.provinces||[]).length,10), 10],
    ['📣','Doutrinador','Sua ideologia em 100% do mundo ('+Math.round(shareI)+'%)', shareI, 100],
    ['💼','Cofres Cheios','Orçamento máximo nos 5 ministérios', bmax, 5],
    ['🛐','Messias','Sua religião em 100% do mundo ('+Math.round(shareR)+'%)', shareR, 100],
    ['📈','Magnata','Receita de $2.000/dia', Math.min(m.dailyIncome||0,2000), 2000],
    ['🌐','Polo Geopolítico','3 aliados + 3 comércios + 3 embaixadas', Math.min((m.allies||[]).length,3)+Math.min((m.trades||[]).length,3)+Math.min((m.embassies||[]).length,3), 9],
    ['🧨','Mestre Espião','Serviço Secreto no Nv 3', (m.seguranca&&m.seguranca.secreto)||0, 3],
    ['⭐','General','Vença 50 batalhas', Math.min(st.vitorias||0,50), 50]
  ];
  const done = ACH.filter(a=>a[3]>=a[4]).length;
  const ov = document.createElement('div'); ov.id='newspaper';
  let s = '<div class="paper" style="width:min(640px,94vw)"><h1 style="font-size:20px">🏅 CONQUISTAS</h1><img src="headers/med.jpg" style="width:100%;height:110px;object-fit:cover;border-radius:8px;border:2px solid #8a6a1f;margin-bottom:8px">';
  s += '<div style="font-size:12px;color:#6b5a33;margin-bottom:8px"><b>'+done+'/20</b> desbloqueadas — cada uma com progresso ao vivo.</div>';
  s += ACH.map(a=>{
    const ok = a[3]>=a[4], pct = Math.min(100,Math.round(a[3]/a[4]*100));
    return '<div style="background:#fff8e6;border:2px solid '+(ok?'#2e7d32':'#c9b98b')+';border-radius:8px;padding:7px 10px;margin-bottom:6px"><b style="font-size:13px">'+a[0]+' '+a[1]+(ok?' ✓':'')+'</b><div style="font-size:11px;color:#6b5a33">'+a[2]+'</div><div style="background:#d8cba0;border:1px solid #8a6a1f;border-radius:4px;height:10px;margin-top:3px"><div style="height:100%;width:'+pct+'%;background:'+(ok?'#2e7d32':'#c9a227')+';border-radius:3px"></div></div></div>';
  }).join('');
  s += '<div style="text-align:center;margin-top:6px"><button id="md-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
  ov.innerHTML = s;
  document.body.appendChild(ov);
  ov.querySelector('#md-x').onclick=()=>ov.remove();
  ov.onclick = e => { if (e.target===ov) ov.remove(); };
};
"""
a = "$('btn-space').onclick = () => {"
assert h.count(a) == 1
h = h.replace(a, MOD + a)
ok.append('M4 modal conquistas')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE20 OK')
