#!/usr/bin/env python3
"""FASE 12 — tela ☢️ PROGRAMA NUCLEAR (toolbar). SÓ CLIENTE.
Contratos (server intocado): 'nuclear' 2AP+$600+10 uranio, 18 dias, Nv max 5;
'nuke' guerra + Nv3+ + 3AP, consome 1 Nv (alvo mil x0.4, -20 aprov, infra -2; propria -10 aprov)."""
import io

P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = '<button id="btn-spy" title="Operações secretas">🕵️</button>'
assert h.count(a) == 1
h = h.replace(a, a + '\n    <button id="btn-nuke" title="Programa nuclear">☢️</button>')
ok.append('G1 botao hud')

a = ',#btn-spy'
assert h.count(a) == 1, 'css %d' % h.count(a)
h = h.replace(a, a + ',#btn-nuke')
ok.append('G2 estilo')

a = "'btn-leis','btn-dip','btn-spy']"
assert h.count(a) == 1, 'move %d' % h.count(a)
h = h.replace(a, "'btn-leis','btn-dip','btn-spy','btn-nuke']")
ok.append('G3 move toolbar')

MOD = """$('btn-nuke').onclick = () => {
  const m = me(); if (!m || !state) return;
  const nv = m.nuclear || 0;
  const prog = (m.builds||[]).filter(b=>b.kind==='nuclear');
  const ura = (m.rec && m.rec.uranio) || 0;
  const wars = state.players.filter(p=>p.alive && (m.wars||[]).includes(p.id) && p.country);
  const ov = document.createElement('div'); ov.id='newspaper';
  const esc = s => String(s==null?'':s).replace(/[<>&]/g,'');
  const segs = [0,1,2,3,4].map(i=>'<span style="display:inline-block;width:34px;height:12px;margin-right:3px;border-radius:2px;background:'+(i<nv?'#c9a227':'#d8cba0')+';border:1px solid #8a6a1f"></span>').join('');
  let s = '<div class="paper" style="width:min(640px,94vw)"><h1 style="font-size:20px">☢️ PROGRAMA NUCLEAR</h1>';
  s += '<div style="background:#fff8e6;border:2px solid #c9b98b;border-radius:8px;padding:8px 10px;margin-bottom:8px"><b style="font-size:13px">Nível '+nv+'/5</b><div style="margin:4px 0">'+segs+'</div>';
  s += '<div style="font-size:11px;color:#6b5a33">🟡 Urânio em estoque: <b>'+ura+'</b> (cada etapa consome 10) · ⏳ Etapas em construção: <b>'+prog.length+'</b>'+(prog.length?' (pronta dia '+prog[0].untilDay+')':'')+'</div>';
  const podeEtapa = (nv + prog.length) < 5 && m.ap >= 2 && m.money >= 600 && ura >= 10;
  s += '<div style="margin-top:6px"><button data-nukestep style="padding:8px 12px;cursor:pointer" '+(podeEtapa?'':'disabled')+'>☢️ Nova etapa (2⚡ + $600 + 10 urânio, 18 dias)</button></div></div>';
  s += '<div style="font-size:11px;color:#6b5a33;margin-bottom:6px">🚀 Lançar exige <b>guerra + Nv 3+</b> e <b>consome 1 nível</b> (3⚡). Efeito: militar do alvo ×0.4, −20 aprovação dele, −2 infra em 2 províncias, −10 sua aprovação. Defesa antiaérea reduz o dano.</div>';
  s += '<div>' + (wars.length ? wars.map(p=>'<div style="background:#fff8e6;border:2px solid #a33;border-radius:8px;padding:6px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px"><div style="flex:1"><b style="font-size:13px">⚔️ '+esc(p.country)+'</b></div><button data-nukefire="'+p.id+'" style="padding:6px 10px;cursor:pointer;background:#a33;color:#fff;font-weight:800" '+((nv>=3&&m.ap>=3)?'':'disabled')+'>☢️💥 LANÇAR</button></div>').join('') : '<div style="font-size:12px;color:#6b5a33">Sem guerras ativas. Declare guerra para liberar o botão.</div>') + '</div>';
  s += '<div style="text-align:center;margin-top:10px"><button id="nk-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
  ov.innerHTML = s;
  document.body.appendChild(ov);
  ov.querySelector('#nk-x').onclick=()=>ov.remove();
  ov.onclick = e => { if (e.target===ov) ov.remove(); };
  const st = ov.querySelector('[data-nukestep]');
  if (st) st.onclick = () => { send({t:'action',action:'nuclear'}); ov.remove(); };
  ov.querySelectorAll('[data-nukefire]').forEach(b=>b.onclick=()=>{ if (confirm('LANÇAR MÍSSIL NUCLEAR? Isso consome 1 nível do programa e terá graves consequências.')) { send({t:'action',action:'nuke',target:b.dataset.nukefire}); ov.remove(); } });
};
"""
a = "$('btn-spy').onclick = () => {"
assert h.count(a) == 1
h = h.replace(a, MOD + a)
ok.append('G4 modal nuke')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE12 OK (server.js intocado)')
