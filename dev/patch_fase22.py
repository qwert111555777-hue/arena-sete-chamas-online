#!/usr/bin/env python3
"""FASE 22 (cliente) — tela 🚨 CRISES (toolbar): crise ativa c/ 3 escolhas ou calma."""
import io
P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = '<button id="btn-gov" title="Governo">🏛️</button>'
assert h.count(a) == 1
h = h.replace(a, a + '\n    <button id="btn-crise" title="Crises">🚨</button>')
ok.append('R1 botao hud')

a = ',#btn-gov'
assert h.count(a) == 1, 'css %d' % h.count(a)
h = h.replace(a, a + ',#btn-crise')
ok.append('R2 estilo')

a = "'btn-med','btn-gov']"
assert h.count(a) == 1, 'move %d' % h.count(a)
h = h.replace(a, "'btn-med','btn-gov','btn-crise']")
ok.append('R3 move toolbar')

MOD = """$('btn-crise').onclick = () => {
  const m = me(); if (!m || !state) return;
  const ov = document.createElement('div'); ov.id='newspaper';
  const CRI = {
    terremoto: { ic:'🏚️', nm:'TERREMOTO', opts:[['🏗️ Reconstrução total','+2 infra, +4❤️',1,400],['🆘 Pedir ajuda','Pedido internacional, +1❤️',0,0],['🙈 Ignorar','−8❤️, −1 militar',0,0]] },
    pandemia: { ic:'🦠', nm:'PANDEMIA', opts:[['💉 Vacinação em massa','+5❤️',1,350],['🔒 Lockdown','−$150, +2❤️',1,0],['🙈 Ignorar','−10 pop, −10❤️',0,0]] },
    seca: { ic:'🏜️', nm:'SECA SEVERA', opts:[['🚰 Caminhões-pipa','+50 comida, +3❤️',1,250],['🌧️ Transposição','+120 comida, +5❤️',2,500],['🙈 Ignorar','−5 pop, −8❤️',0,0]] },
    enchente: { ic:'🌊', nm:'ENCHENTE', opts:[['🚤 Resgate','+4❤️',1,200],['🏗️ Drenagem','+1 infra, +6❤️',2,450],['🙈 Ignorar','−$150, −8❤️',0,0]] }
  };
  let s = '<div class="paper" style="width:min(600px,94vw)"><h1 style="font-size:20px">🚨 CRISES</h1><img src="headers/crise.jpg" style="width:100%;height:110px;object-fit:cover;border-radius:8px;border:2px solid #8a6a1f;margin-bottom:8px">';
  const c = m.crise;
  if (c && CRI[c.tipo]) {
    const d = CRI[c.tipo];
    const dias = Math.max(0, state.day - (c.desde||state.day));
    s += '<div style="background:#fff8e6;border:2px solid #a33;border-radius:8px;padding:8px 10px;margin-bottom:8px"><b style="font-size:15px">'+d.ic+' '+d.nm+'</b><div style="font-size:11px;color:#6b5a33">Há '+dias+' dias — escolha UMA resposta:</div></div>';
    s += d.opts.map((o,i)=>{
      const custo = o[2]+'⚡' + (o[3]?' + $'+o[3]:'');
      const okB = m.ap>=o[2] && m.money>=o[3];
      return '<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:8px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px"><div style="flex:1"><b style="font-size:13px">'+o[0]+'</b><div style="font-size:11px;color:#6b5a33">'+o[1]+'</div></div><button data-crise="'+i+'" style="padding:8px 12px;cursor:pointer;white-space:nowrap" '+(okB?'':'disabled')+'>'+(o[2]||o[3]?custo:'Grátis')+'</button></div>';
    }).join('');
  } else {
    s += '<div style="background:#fff8e6;border:2px solid #2e7d32;border-radius:8px;padding:12px;text-align:center;font-size:13px">✅ <b>Nenhuma crise ativa.</b><div style="font-size:11px;color:#6b5a33;margin-top:4px">Desastres (terremoto, pandemia, seca, enchente) podem atingir qualquer nação. Mantenha caixa e ⚡ de reserva — e ajude vizinhos em crise pela diplomacia.</div></div>';
  }
  s += '<div style="text-align:center;margin-top:6px"><button id="cr-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
  ov.innerHTML = s;
  document.body.appendChild(ov);
  ov.querySelector('#cr-x').onclick=()=>ov.remove();
  ov.onclick = e => { if (e.target===ov) ov.remove(); };
  ov.querySelectorAll('[data-crise]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'crise',choice:+b.dataset.crise}); ov.remove(); });
};
"""
a = "$('btn-gov').onclick = () => {"
assert h.count(a) == 1
h = h.replace(a, MOD + a)
ok.append('R4 modal crises')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE22 OK')
