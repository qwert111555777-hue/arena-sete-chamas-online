#!/usr/bin/env python3
"""FASE 24 (cliente) — botao DOUTRINA + modal (sua doutrina + sociedade perfeita + doutrinar)."""
import io
P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = '<button id="btn-crise" title="Crises">🚨</button>'
assert h.count(a) == 1
h = h.replace(a, a + '\n    <button id="btn-doc" title="Doutrina">🗽</button>')
ok.append('W1 botao hud')

a = ',#btn-crise'
assert h.count(a) == 1, 'css %d' % h.count(a)
h = h.replace(a, a + ',#btn-doc')
ok.append('W2 estilo')

a = "'btn-med','btn-gov','btn-crise']"
assert h.count(a) == 1, 'move %d' % h.count(a)
h = h.replace(a, "'btn-med','btn-gov','btn-crise','btn-doc']")
ok.append('W3 move toolbar')

MOD = """$('btn-doc').onclick = () => {
  const m = me(); if (!m || !state) return;
  const ov = document.createElement('div'); ov.id='newspaper';
  const SECS = [['educacao','Educação'],['saude','Saúde'],['cultura','Cultura'],['esportes','Esportes'],['habitacao','Habitação'],['justica','Justiça'],['turismo','Turismo']];
  const lv = k => ((m.sectors||{})[k])||0;
  const perf = SECS.filter(sc=>lv(sc[0])>=4).length;
  let s = '<div class="paper" style="width:min(600px,94vw)"><h1 style="font-size:20px">🗽 DOUTRINA</h1><img src="headers/doutrina.jpg" style="width:100%;height:100px;object-fit:cover;border-radius:8px;border:2px solid #8a6a1f;margin-bottom:8px">';
  s += '<div class="stat-h">SUA DOUTRINA</div><div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:8px 10px;margin-bottom:6px"><div style="font-size:12px">Doutrina: <b>'+Math.round(m.influencia||0)+'/60</b> (hegemonia ideológica) · Doutrinações: <b>'+((m.stats&&m.stats.doutrinacoes)||0)+'</b></div><div style="background:#d8cba0;border:1px solid #8a6a1f;border-radius:4px;height:12px;margin:4px 0"><div style="width:'+Math.min(100,Math.round((m.influencia||0)/60*100))+ '%;height:100%;background:#1565c0;border-radius:3px"></div></div><button id="dc-centro" style="padding:6px 12px;cursor:pointer" '+((m.ap>=1&&m.money>=200)?'':'disabled')+'>🗽 Centro cultural (1AP + $200 = +4 doutrina, +2 coracao)</button></div>';
  s += '<div class="stat-h">SOCIEDADE PERFEITA ('+perf+'/7 setores Nv4+)</div>' + SECS.map(sc=>'<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:4px 10px;margin-bottom:4px;display:flex;align-items:center;gap:8px"><div style="width:90px;font-size:12px"><b>'+sc[1]+'</b></div><div>'+[0,1,2,3,4].map(i=>'<span style="display:inline-block;width:20px;height:10px;margin-right:2px;border-radius:2px;background:'+(i<lv(sc[0])?'#1565c0':'#d8cba0')+';border:1px solid #8a6a1f"></span>').join('')+'</div><span style="font-size:11px;color:#6b5a33">'+(lv(sc[0])>=4?'IDEAL':(lv(sc[0])+'/5'))+'</span></div>').join('');
  s += '<div class="stat-h">DOUTRINAR NAÇÕES (1AP + $300)</div>' + state.players.filter(o=>o.alive&&o.id!==m.id&&o.ideology!==m.ideology).map(o=>'<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:6px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px"><div style="flex:1;font-size:12px"><b>'+o.name+'</b> <span style="color:#6b5a33">'+((typeof IDEOLOGIES!=='undefined'&&(IDEOLOGIES[o.ideology]||o.ideology))||'?')+'</span></div><button data-doc="'+o.id+'" style="padding:6px 10px;cursor:pointer" '+((!m.ideology||m.ap<1||m.money<300)?'disabled':'')+'>Enviar</button></div>').join('');
  s += '<div style="text-align:center;margin-top:6px"><button id="dc-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
  ov.innerHTML = s;
  document.body.appendChild(ov);
  ov.querySelector('#dc-x').onclick=()=>ov.remove();
  ov.onclick = e => { if (e.target===ov) ov.remove(); };
  const cc = ov.querySelector('#dc-centro'); if (cc) cc.onclick=()=>{ send({t:'action',action:'centro_cultural'}); cc.disabled=true; };
  ov.querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>{ send({t:'action',action:'espalhar_ideologia',target:b.dataset.doc}); b.disabled=true; });
};
"""
a = "$('btn-crise').onclick = () => {"
assert h.count(a) == 1, 'w4 %d' % h.count(a)
h = h.replace(a, MOD + a)
ok.append('W4 modal doutrina')

io.open(P, 'w', encoding='utf-8').read() if False else None
io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE24 OK')
