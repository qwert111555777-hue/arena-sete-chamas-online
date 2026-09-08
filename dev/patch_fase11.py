#!/usr/bin/env python3
"""FASE 11 — tela 🕵️ OPERAÇÕES SECRETAS (toolbar). SÓ CLIENTE.
F1: btn-spy no HUD. F2: CSS. F3: move list. F4: modal (serviço secreto + espionar/sabotar).
Contratos (server.js, intocado): espionar 1AP+dipCost(100) → relatório via info;
sabotagem 1AP+dipCost(150), chance min(85%,50%+8%/nv secreto); seguranca/secreto custos [350,800,1600]."""
import io

P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = '<button id="btn-dip" title="Diplomacia">🤝</button>'
assert h.count(a) == 1
h = h.replace(a, a + '\n    <button id="btn-spy" title="Operações secretas">🕵️</button>')
ok.append('F1 botao hud')

a = '#btn-leis,#btn-dip'
assert h.count(a) == 1, 'css %d' % h.count(a)
h = h.replace(a, a + ',#btn-spy')
ok.append('F2 estilo')

a = "'btn-leis','btn-dip']"
assert h.count(a) == 1, 'move %d' % h.count(a)
h = h.replace(a, "'btn-leis','btn-dip','btn-spy']")
ok.append('F3 move toolbar')

MOD = """$('btn-spy').onclick = () => {
  const m = me(); if (!m || !state) return;
  const sec = (m.seguranca && m.seguranca.secreto) || 0;
  const chance = Math.min(85, 50 + 8 * sec);
  const upCost = [350, 800, 1600][sec];
  const ov = document.createElement('div'); ov.id='newspaper';
  const esc = s => String(s==null?'':s).replace(/[<>&]/g,'');
  const others = state.players.filter(p=>p.alive && p.id!==myId && p.country);
  let s = '<div class="paper" style="width:min(640px,94vw)"><h1 style="font-size:20px">🕵️ OPERAÇÕES SECRETAS</h1>';
  s += '<div style="background:#fff8e6;border:2px solid #c9b98b;border-radius:8px;padding:8px 10px;margin-bottom:8px;display:flex;align-items:center;gap:8px"><div style="flex:1"><b style="font-size:13px">🕵️ Serviço Secreto — Nv '+sec+'/3</b><div style="font-size:11px;color:#6b5a33">Chance de sabotagem: '+chance+'% · +8% por nível · defesa contra sabotagem</div></div>';
  s += sec>=3 ? '<b style="color:#2e7d32">MÁX</b>' : '<button data-secup style="padding:8px 12px;cursor:pointer;white-space:nowrap" '+((m.ap>=1&&m.money>=upCost)?'':'disabled')+'>⬆️ $'+upCost+'</button>';
  s += '</div>';
  s += '<div style="font-size:11px;color:#6b5a33;margin-bottom:6px">🔍 Espionar revela caixa, eco, mil, aprovação, ☢️, dívida · 🧨 Sabotar destrói infra ou arsenal (1⚡ + ~$150). Ministro diplomata/coroa reduz custos.</div>';
  s += '<div>' + others.map(p=>{
    const okE = m.ap>=1 && m.money>=50, okS = m.ap>=1 && m.money>=75;
    return '<div style="background:#fff8e6;border:2px solid #c9b98b;border-radius:8px;padding:6px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px"><div style="flex:1"><b style="font-size:13px">'+esc(p.country)+'</b></div><button data-esp="'+p.id+'" style="padding:6px 10px;cursor:pointer" '+(okE?'':'disabled')+'>🔍 Espionar</button><button data-sab="'+p.id+'" style="padding:6px 10px;cursor:pointer" '+(okS?'':'disabled')+'>🧨 Sabotar</button></div>';
  }).join('') + '</div>';
  s += '<div style="text-align:center;margin-top:10px"><button id="sp-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
  ov.innerHTML = s;
  document.body.appendChild(ov);
  ov.querySelector('#sp-x').onclick=()=>ov.remove();
  ov.onclick = e => { if (e.target===ov) ov.remove(); };
  const up = ov.querySelector('[data-secup]');
  if (up) up.onclick = () => { send({t:'action',action:'seguranca',value:'secreto'}); ov.remove(); };
  ov.querySelectorAll('[data-esp]').forEach(b=>b.onclick=()=>send({t:'action',action:'espionar',target:b.dataset.esp}));
  ov.querySelectorAll('[data-sab]').forEach(b=>b.onclick=()=>send({t:'action',action:'sabotagem',target:b.dataset.sab}));
};
"""
a = "$('btn-leis').onclick = () => {"
assert h.count(a) == 1
h = h.replace(a, MOD + a)
ok.append('F4 modal spy')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE11 OK (server.js intocado)')
