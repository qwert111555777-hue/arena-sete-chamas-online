#!/usr/bin/env python3
"""FASE 5: sem assessor, multi-mundos com nomes, TEMA MA3 (papel+teal+ouro, toolbar esquerda).
So cliente (server.js intocado). Uso: python3 patch_fase5.py (a partir de /home/user/presidente-online)"""
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

# ---- sem assessor ----
h = rep(h, '<div id="advisor" class="hidden"><img src="assessor.jpg" alt="assessor"><div id="advisor-bubble"></div></div>', "", 'A1 sem assessor html')
h = rep(h, """  // assessor presidencial com balão de dicas (tutorial estilo MA)
  const adv = $('advisor');
  if (state.phase==='game' && m && m.alive){
    adv.classList.remove('hidden');
    const DICAS = ['construa a Fábrica de concreto primeiro — quase tudo exige 🧱.','sem ⚡ suficiente seus prédios apagam: produção pela metade.','jazidas naturais definem o que seu país produz de graça.','relações 85+ garantem anexação pacífica de nações da IA.','embaixadas custam $10/semana de manutenção — escolha bem.','o programa nuclear exige 10 de ☢️ urânio no mercado.'];
    const k = Math.floor(state.turn/2) % (DICAS.length+1);
    $('advisor-bubble').textContent = 'Senhor Presidente: ' + (k < DICAS.length ? DICAS[k] : '');
  } else adv.classList.add('hidden');
""", "", 'A2 sem assessor js')

# ---- multi-mundos ----
h = rep(h, "  try{localStorage.setItem('po_room',state.code);}catch(e){}",
"""  try{localStorage.setItem('po_room',state.code);
    const ws0 = JSON.parse(localStorage.getItem('po_worlds')||'[]');
    const nm0 = (m&&(m.customName||m.name))||'';
    const rec0 = {code:state.code, name:nm0, day:state.day||1, at:Date.now()};
    const ix0 = ws0.findIndex(w=>w.code===state.code);
    if (ix0>=0) ws0[ix0]=rec0; else ws0.unshift(rec0);
    localStorage.setItem('po_worlds', JSON.stringify(ws0.slice(0,8)));
  }catch(e){}""", 'W1 salva mundos')
h = rep(h, """$('btn-load').onclick = () => {
  const code = $('inp-code').value.trim().toUpperCase() || (localStorage.getItem('po_room')||'').toUpperCase();
  if (code.length < 4) return toast('Nenhum jogo salvo neste navegador. Crie ou entre numa sala primeiro.', 'error');
  send({t:'tem_save', code});
};""",
"""$('btn-load').onclick = () => {
  const typed = $('inp-code').value.trim().toUpperCase();
  if (typed.length >= 4) return send({t:'tem_save', code: typed});
  let ws = [];
  try{ ws = JSON.parse(localStorage.getItem('po_worlds')||'[]'); }catch(e){}
  const solo = (localStorage.getItem('po_room')||'').toUpperCase();
  if (solo && !ws.some(w=>w.code===solo)) ws.unshift({code:solo, name:'', day:0, at:0});
  if (!ws.length) return toast('Nenhum mundo salvo neste navegador. Crie ou entre numa sala primeiro.', 'error');
  const ov = document.createElement('div'); ov.id='newspaper';
  ov.innerHTML = '<div class="paper" style="width:min(480px,92vw)"><h1 style="font-size:20px">🌍 MEUS MUNDOS</h1><div style="font-size:11px;text-align:center;margin-bottom:10px">Escolha qual mundo carregar:</div>' +
    ws.map(w=>'<button data-w="'+w.code+'" style="display:block;width:100%;margin-bottom:8px;padding:10px;cursor:pointer;text-align:left;background:#fff8e6;border:2px solid #8a6a1f;border-radius:8px;color:#2b2416"><b>'+String(w.name||'Mundo sem nome').replace(/[<>&]/g,'')+'</b><br><span style="font-size:11px">sala '+w.code+(w.day?' · dia '+w.day:'')+(w.at?' · '+new Date(w.at).toLocaleDateString('pt-BR'):'')+'</span></button>').join('') +
    '<div style="text-align:center"><button id="np-close" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
  document.body.appendChild(ov);
  ov.onclick = e => {
    if (e.target.id==='np-close' || e.target===ov) return ov.remove();
    const b = e.target.closest('[data-w]'); if (!b) return;
    $('inp-code').value = b.dataset.w; ov.remove(); send({t:'tem_save', code: b.dataset.w});
  };
};""", 'W2 modal mundos')

# ---- TEMA MA3 ----
h = rep(h, "  .tool-btn{border:2px solid #2a3a5f;}",
"""  .tool-btn{border:2px solid #2a3a5f;}
  /* ===== TEMA MA3: papel bege + teal + ouro ===== */
  .hud{background:linear-gradient(180deg,#1c2438,#121829);border-bottom:2px solid #8a6a1f;}
  .hud .res{background:#0c1324;border:1px solid #2a3a5f;color:#ffe9a8;}
  .hud .res b{color:#ffd76a;}
  .hud .date-badge{background:#0c1324;border:1px solid #2a3a5f;color:#ffe9a8;border-radius:8px;padding:5px 10px;font-size:13px;}
  .ma3-tools{position:absolute;left:8px;top:12px;display:flex;flex-direction:column;gap:6px;z-index:6;}
  .ma3-tools button{width:46px!important;height:46px!important;font-size:20px!important;background:linear-gradient(#fdf6e3,#e2cd96)!important;border:2px solid #8a6a1f!important;border-radius:10px!important;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.5);position:relative;padding:0!important;}
  .ma3-tools button:hover{transform:translateX(2px);}
  .ma3-tools button.active{background:linear-gradient(#ffe9a8,#d9a93c)!important;}
  .rank-panel{right:12px;top:60px;width:340px;max-height:calc(100% - 150px);background:#f3ead1;color:#2b2416;border:2px solid #8a6a1f;border-radius:10px;z-index:6;box-shadow:0 12px 32px rgba(0,0,0,.6);}
  .rank-panel h3{color:#7a2e1f;font-size:12px;}
  .rank-row{background:#fff8e6;border:1px solid #c9b98b;color:#2b2416;border-radius:8px;padding:7px 9px;margin-bottom:6px;}
  .rank-row:hover{border-color:#8a6a1f;}
  .rank-row .rn{color:#2b2416;}
  .rank-row .rs{color:#6b5a33;}
  .rank-row .rk{color:#8a6a1f;}
  .rank-panel button:not(.px){background:#145a6b;color:#fff;border:1px solid #0d3d47;border-radius:6px;padding:6px 10px;font-weight:700;cursor:pointer;}
  .rank-panel button:not(.px):disabled{opacity:.45;cursor:default;}
  .rank-panel button:not(.px):hover:not(:disabled){background:#1f7a8c;}
  .rank-panel .px,.nation-panel .px{background:#7a2e1f;border-color:#5a1f14;}
  .rank-panel .px:hover,.nation-panel .px:hover{background:#5a1f14;border-color:#3d130c;}
  .nation-panel{position:absolute;left:66px;top:12px;width:340px;max-height:calc(100% - 130px);overflow-y:auto;background:#f3ead1;color:#2b2416;border:2px solid #8a6a1f;border-radius:10px;padding:12px;z-index:6;box-shadow:0 12px 32px rgba(0,0,0,.6);}
  .nation-panel .np-head .nm{color:#2b2416;}
  .nation-panel .np-head .nm small{color:#6b5a33;}
  .nation-panel .ms{background:#fff8e6;border-color:#c9b98b;}
  .nation-panel .ms span{color:#4a3d20;}
  .nation-panel .ms b{color:#7a5a10;}
  .nation-panel .np-note{color:#6b5a33;}
  .nation-panel button:not(.px){background:#145a6b;color:#fff;border:1px solid #0d3d47;border-radius:6px;padding:8px 4px;cursor:pointer;font-weight:700;}
  .nation-panel button:not(.px):hover:not(:disabled){background:#1f7a8c;}
  .nation-panel button:not(.px):disabled{opacity:.45;cursor:default;}
  .np-sub{background:linear-gradient(#1f7a8c,#145a6b);color:#fff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;border-radius:6px;padding:5px 10px;margin:10px 0 6px;}
  .np-provs .prov{background:#fff8e6;border:1px solid #c9b98b;border-radius:6px;padding:4px 8px;color:#2b2416;}
  .np-provs .prov .pips{color:#8a6a1f;}
  .np-provs .prov .owner{color:#7a2e1f;}
  .bottom-bar{flex-wrap:wrap;justify-content:center;max-width:96vw;}
  .round-btn small{color:#ffd76a;}
  #newspaper .paper button{background:#2e7d32;color:#fff;border:none;border-radius:6px;padding:8px 22px;font-weight:800;cursor:pointer;}
  #newspaper .paper button:hover{background:#256b29;}
  .side-tools{display:none;}""", 'M1 tema MA3')
h = rep(h, "      <div id=\"propose-bar\"></div>",
           "      <div id=\"propose-bar\"></div>\n      <div class=\"ma3-tools\" id=\"ma3-tools\"></div>", 'M2 toolbar div')
h = rep(h, '    <span class="hcat">MUNDO</span>\n', "", 'M3 sem hcat mundo')
h = rep(h, '    <span class="hcat">PAÍS</span>\n', "", 'M4 sem hcat pais')
h = rep(h, "['btn-rank','btn-market','btn-help'].forEach(id => { const prev = $(id).onclick; $(id).onclick = e => { $('notif-panel').classList.add('hidden'); if (prev) prev.call($(id), e); }; });",
"""['btn-rank','btn-market','btn-help'].forEach(id => { const prev = $(id).onclick; $(id).onclick = e => { $('notif-panel').classList.add('hidden'); if (prev) prev.call($(id), e); }; });
/* MA3: widgets na barra esquerda, pausa/velocidade na barra inferior (handlers preservados) */
['btn-rank','btn-news','btn-notif','btn-tax','btn-stats','btn-miss','btn-orc','btn-rel','btn-build'].forEach(id => { const b = $(id); if (b) $('ma3-tools').appendChild(b); });
['btn-market','btn-help','btn-snd'].forEach(id => { const b = $(id); if (b) { b.classList.remove('tool-btn'); $('ma3-tools').appendChild(b); } });
['btn-speed2','btn-pause'].forEach(id => { const b = $(id); if (b) document.querySelector('.bottom-bar').prepend(b); });""", 'M5 move botoes')
h = rep(h, '<div style="font-size:12px; line-height:1.7; color:var(--text);">',
           '<div style="font-size:12px; line-height:1.7; color:#2b2416;">', 'M6 help papel')
h = rep(h, '<h3>💰 Compras e vendas</h3><div style="color:var(--muted);font-size:11px;margin-bottom:8px;line-height:1.5;">',
           '<h3>💰 Compras e vendas</h3><div style="color:#6b5a33;font-size:11px;margin-bottom:8px;line-height:1.5;">', 'M7 market papel')
h = rep(h, '<div style="color:var(--muted);font-size:12px">Nenhuma notificação.</div>',
           '<div style="color:#6b5a33;font-size:12px">Nenhuma notificação.</div>', 'M8 notif papel')

if fails:
    print('\nFALHAS:'); [print(' -', f) for f in fails]; sys.exit(1)
io.open(IDX, 'w', encoding='utf-8').write(h)
print('\nPATCH FASE5 OK (server.js intocado)')
