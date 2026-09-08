#!/usr/bin/env python3
"""FASE 4: cores em ordem, sair corrige+confirma, mapa travado, central de notificacoes,
sem sidebar, ajuda objetiva, compras-e-vendas, conquista dificil, 1x=3s, paineis padronizados.
Uso: python3 patch_fase4.py  (a partir de /home/user/presidente-online)"""
import io, sys

IDX = 'public/index.html'
SRV = 'server.js'
fails = []

def rep(buf, old, new, tag):
    if buf.count(old) != 1:
        fails.append(f'{tag}: achou {buf.count(old)}x')
        return buf
    print(f'  ok {tag}')
    return buf.replace(old, new)

def reprep(buf, pattern, new, tag):
    import re
    if len(re.findall(pattern, buf)) != 1:
        fails.append(f'{tag}: regex achou {len(re.findall(pattern, buf))}x')
        return buf
    print(f'  ok {tag}')
    return re.sub(pattern, new, buf, count=1)

h = io.open(IDX, encoding='utf-8').read()
s = io.open(SRV, encoding='utf-8').read()

print('== CLIENTE ==')
h = rep(h, "#btn-pause,#btn-speed2,#btn-endturn,#btn-rank,#btn-news,#btn-build{",
           "#btn-pause,#btn-speed2,#btn-endturn,#btn-rank,#btn-news,#btn-notif,#btn-build{", 'Q1 notif no estilo hud')
h = rep(h, "  .nation-panel{background:linear-gradient(#f6eed8,#ead9b4)!important;color:#2b2416!important;border:2px solid #8a6a1f!important;box-shadow:0 8px 30px rgba(0,0,0,.6)!important;}", "", 'Q2a del paper np')
h = rep(h, "  .nation-panel .np-head .nm{color:#2b2416;} .nation-panel .np-head .nm small{color:#6b5a33;}", "", 'Q2b del paper nm')
h = rep(h, "  .nation-panel .ms{background:#fff8e6!important;border-color:#c9b98b!important;} .nation-panel .ms span{color:#4a3d20!important;} .nation-panel .ms b{color:#7a5a10!important;}", "", 'Q2c del paper ms')
h = rep(h, "  .nation-panel .np-note{color:#4a3d20;} .nation-panel button{background:linear-gradient(#fdf6e3,#e2cd96);color:#3a2a05;border:1px solid #8a6a1f;border-radius:6px;}", "", 'Q2d del paper btn')
h = rep(h, "  .sidebar{background:linear-gradient(#f2e8cf,#e6d5ae)!important;color:#2b2416!important;border-left:2px solid #8a6a1f!important;}", "", 'Q2e del paper sidebar')
h = rep(h, "  .sidebar h3{color:#6b5a33!important;} .sidebar .feed-item{background:#fff8e6!important;border:1px solid #d9c795!important;color:#2b2416!important;}", "", 'Q2f del paper s-h3')
h = rep(h, "  .sidebar input{background:#fff8e6!important;color:#2b2416!important;border:1px solid #b7a578!important;}", "", 'Q2g del paper s-in')
h = rep(h, ".px:hover{background:#5a1620;border-color:#ff6b6b;}",
""".px:hover{background:#5a1620;border-color:#ff6b6b;}
  .rank-panel{right:12px;top:60px;width:330px;max-height:calc(100% - 150px);background:#101830;border:2px solid #8a6a1f;z-index:6;}
  .rank-panel h3{color:#ffd76a;font-size:12px;}
  .nation-panel{position:absolute;left:12px;top:100px;width:340px;max-height:calc(100% - 220px);overflow-y:auto;background:#101830;color:#e8e4d8;border:2px solid #8a6a1f;border-radius:12px;padding:12px;z-index:6;box-shadow:0 12px 32px rgba(0,0,0,.6);}
  .nation-panel button{background:#1a2440;border:1px solid #2a3a5f;color:#fff;border-radius:8px;padding:8px 4px;cursor:pointer;}
  .nation-panel button:hover:not(:disabled){border-color:#8a6a1f;}
  .nation-panel button:disabled{opacity:.45;cursor:default;}
  .rank-row{background:#0c1324;border:1px solid #2a3a5f;border-radius:8px;padding:7px 9px;margin-bottom:6px;}
  .rank-row:hover{border-color:#8a6a1f;}
  .nbadge{position:absolute;top:-7px;right:-7px;background:#c62828;color:#fff;font-size:10px;font-weight:800;border-radius:9px;padding:1px 6px;line-height:1.5;}
  .rank-panel::-webkit-scrollbar,.nation-panel::-webkit-scrollbar,#newspaper .paper::-webkit-scrollbar{width:8px;}
  .rank-panel::-webkit-scrollbar-thumb,.nation-panel::-webkit-scrollbar-thumb,#newspaper .paper::-webkit-scrollbar-thumb{background:#8a6a1f;border-radius:4px;}
  #newspaper .cols p{border-bottom:1px solid #d9c795;padding:6px 0;margin:0;font-size:13px;line-height:1.45;}
  .round-btn{border-color:#8a6a1f;}
  .round-btn:hover:not(:disabled){box-shadow:0 0 12px rgba(217,169,60,.5);}
  .hcat{color:#ffd76a;}
  .tool-btn{border:2px solid #2a3a5f;}""", 'Q3 tema paineis')
h = rep(h, '<button id="btn-news" title="Jornal mundial">📰</button>',
           '<button id="btn-news" title="Jornal mundial">📰</button>\n    <button id="btn-notif" title="Notificações" style="position:relative">🔔<b id="notif-n" class="nbadge hidden">0</b></button>', 'Q4 btn notif')
h = rep(h, '<button id="btn-sair" title="Sair do jogo (o anfitrião salva automaticamente)" style="background:radial-gradient(circle at 35% 30%, #ffd0d0, #d98a8a 60%, #8a3040);">⏻</button>',
           '<button id="btn-sair" title="Sair do jogo (o anfitrião salva automaticamente)" style="background:linear-gradient(#ffd0d0,#d98a8a);border:2px solid #8a3040;border-radius:10px;width:38px;height:38px;font-size:16px;cursor:pointer;">⏻</button>', 'Q5 sair quadrado')
h = rep(h, """$('btn-sair').onclick = () => {
  if (!confirm(m && m.isHost ? 'Salvar o jogo e encerrar a sala? Todos sairão.' : 'Sair da partida?')) return;
  send({t:'sair'});
};""",
"""$('btn-sair').onclick = () => {
  const meS = me();
  if (!confirm(meS && meS.isHost ? 'Salvar o jogo e encerrar a sala? Todos sairão.' : 'Sair da partida?')) return;
  send({t:'sair'});
};""", 'Q6 sair fix (m undefined)')
h = rep(h, '<div class="rank-panel hidden" id="market-panel"></div>',
           '<div class="rank-panel hidden" id="market-panel"></div>\n      <div class="rank-panel hidden" id="notif-panel"></div>', 'Q7 notif panel')
h = reprep(h, r'<h3>❓ Como jogar</h3>\n        <div style="font-size:11\.5px; line-height:1\.55; color:var\(--text\);">\n(?:.*\n)*?        </div>',
"""<h3>❓ Como jogar</h3>
        <div style="font-size:12px; line-height:1.7; color:var(--text);">
          ♾️ <b>Infinito:</b> 60+ vira MARCO 🏆, o jogo nunca acaba.<br>
          ⚡ 4 ações/dia · 1 dia = 3s (1x) · ⏱️ acelera até 5x.<br>
          🏗️ Construir: botão 🏗️ · obras levam dias.<br>
          💰 🛒 lotes de 10 · ⚔️ declare guerra antes de atacar.<br>
          ❤️ 0% = reforma (-50% caixa) · ☢️ nv3+ = míssil.<br>
          📰 Jornal: tudo que acontece · 🔔 seus avisos.
        </div>""", 'Q8 ajuda objetiva')
h = rep(h, '<button class="px" title="Fechar">✕</button><h3>🛒 Mercado global de recursos</h3><div style="color:var(--muted);font-size:11px;margin-bottom:8px;line-height:1.5;">Os preços oscilam a cada semana. Suas províncias produzem recursos todo dia: comida alimenta a população (sem comida, ela cresce 3x mais devagar); minério e energia podem ser vendidos por lucro.</div>',
           '<button class="px" title="Fechar">✕</button><h3>💰 Compras e vendas</h3><div style="color:var(--muted);font-size:11px;margin-bottom:8px;line-height:1.5;">Preços mudam toda semana. Compre barato, venda caro — lotes de 10.</div>', 'Q9 mercado->compra/venda')
h = rep(h, '<button class="tool-btn" id="btn-market" title="Mercado de recursos">🛒</button>',
           '<button class="tool-btn" id="btn-market" title="Compras e vendas">🛒</button>', 'Q10 tool title')
h = rep(h, "Venda 30 unidades no mercado", "Venda 30 unidades", 'Q11 missao texto')
h = rep(h, '    <div class="sidebar">\n      <h3>📰 Notícias do mundo</h3>\n      <div class="feed" id="feed"></div>\n\n    </div>\n', "", 'Q12 sem sidebar')
h = rep(h, """  // feed
  const feed = $('feed'); feed.innerHTML = '';
  state.log.forEach(item => {
    const div = document.createElement('div'); div.className='item';
    const t = document.createElement('span'); t.className='turn'; t.textContent = gameDate(item.turn) + ' ·';
    div.appendChild(t); div.appendChild(document.createTextNode(item.msg));
    feed.appendChild(div);
  });
""", "", 'Q13 sem feed js')
h = reprep(h, r"const itens = \(state\.log\|\|\[\]\)\.filter\(l=>[^;]*?\)\.slice\(0,24\);",
           "const itens = (state.log||[]).slice(0,60);", 'Q14 jornal tudo')
h = rep(h, """function toast(msg, kind){
  const d = document.createElement('div');
  d.className = 'toast ' + (kind||'');
  d.textContent = msg;
  $('toasts').appendChild(d);
  setTimeout(()=>d.remove(), 3800);
}""",
"""const NOTIFS = [];
function toast(msg, kind){
  if (!state || state.phase !== 'game'){
    const d = document.createElement('div');
    d.className = 'toast ' + (kind||'');
    d.textContent = msg;
    $('toasts').appendChild(d);
    setTimeout(()=>d.remove(), 3800);
    return;
  }
  NOTIFS.unshift({day: state.day||1, msg, kind: kind||''});
  if (NOTIFS.length > 60) NOTIFS.length = 60;
  const p = $('notif-panel');
  if (p && !p.classList.contains('hidden')) renderNotifs();
  else { const b = $('notif-n'); const n = parseInt(b.textContent||'0',10)+1; b.textContent = n > 9 ? '9+' : n; b.classList.remove('hidden'); }
}
function renderNotifs(){
  const p = $('notif-panel'); if (!p || p.classList.contains('hidden')) return;
  p.innerHTML = '<button class="px" title="Fechar">✕</button><h3>🔔 Notificações</h3>' + (NOTIFS.length ? NOTIFS.map(n => '<div class="rank-row"><span class="rs" style="flex:1;white-space:normal;">dia ' + n.day + ' · ' + String(n.msg).replace(/[<>&]/g,'') + '</span></div>').join('') : '<div style="color:var(--muted);font-size:12px">Nenhuma notificação.</div>');
}""", 'Q15 central notificacoes')
h = rep(h, "$('btn-rank2').onclick = () => $('btn-rank').click();",
"""$('btn-rank2').onclick = () => $('btn-rank').click();
$('btn-notif').onclick = () => {
  const p = $('notif-panel'); p.classList.toggle('hidden');
  $('rank-panel').classList.add('hidden'); $('market-panel').classList.add('hidden'); $('help-panel').classList.add('hidden');
  $('btn-rank').classList.remove('active'); $('btn-market').classList.remove('active'); $('btn-help').classList.remove('active');
  if (!p.classList.contains('hidden')){ $('notif-n').textContent = '0'; $('notif-n').classList.add('hidden'); renderNotifs(); }
};
['btn-rank','btn-market','btn-help'].forEach(id => { const prev = $(id).onclick; $(id).onclick = e => { $('notif-panel').classList.add('hidden'); if (prev) prev.call($(id), e); }; });""", 'Q16 notif toggle')
h = rep(h, "const PALETTE = Array.from({length:60},(_,i)=>'hsl('+((i*137)%360)+' 55% '+(42+(i%4)*8)+'%)');",
           "const PALETTE = Array.from({length:60},(_,i)=>'hsl('+(i*6)+',72%,'+(i%2?58:44)+'%)');", 'Q17 palette ordem')
h = rep(h, "+ ';background:hsl(' + ((ci*137)%360) + ',55%,' + (42+(ci%4)*8) + '%);';",
           "+ ';background:' + PALETTE[ci] + ';';", 'Q18 swatch palette')
h = rep(h, "lbCor.textContent = 'Cor da nação:';", "lbCor.textContent = 'Cor da nação (60 em ordem):';", 'Q19 label cores')
h = rep(h, '<div class="res" title="Missão atual">🎯 <b id="m-mission" style="font-size:11px;">—</b></div>', "", 'Q20 sem missao hud')
h = rep(h, """  $('m-mission').textContent = state.mission ? state.mission.desc + ' (+$' + state.mission.reward + ')' : '—';
""", "", 'Q21 sem missao js')
h = rep(h, "'Senhor Presidente: ' + (state.mission ? 'missão — ' + state.mission.desc + ' (+$' + state.mission.reward + '). ' : '') + (k",
           "'Senhor Presidente: ' + (k", 'Q22 advisor sem missao')
h = rep(h, """function applyView(){
  const g = document.getElementById('map-root');
  if (g) g.setAttribute('transform', `translate(${view.tx},${view.ty}) scale(${view.s})`);
}""",
"""function applyView(){
  if (view.s <= 1){ view.s = 1; view.tx = 0; view.ty = 0; }
  else {
    view.tx = Math.min(100, Math.max(1000*(1-view.s)-100, view.tx));
    view.ty = Math.min(60, Math.max(520*(1-view.s)-60, view.ty));
  }
  const g = document.getElementById('map-root');
  if (g) g.setAttribute('transform', `translate(${view.tx},${view.ty}) scale(${view.s})`);
}""", 'Q23 mapa travado')

print('== SERVIDOR ==')
s = rep(s, "const dayMsFor = mul => Math.round(1000 / ([1, 2, 3, 5].includes(mul) ? mul : 1));",
           "const dayMsFor = mul => Math.round(3000 / ([1, 2, 3, 5].includes(mul) ? mul : 1));", 'R1 1x=3s')
s = rep(s, "dayMs: 1000", "dayMs: 3000", 'R2 dayMs init')
s = rep(s, "* (0.9 + Math.random() * 0.45) * 1.08;", "* (0.9 + Math.random() * 0.45) * 1.3;", 'R3 defesa')
s = rep(s, "if (aP > dP) {", "if (aP > dP * 1.15) {", 'R4 margem ataque')
s = rep(s, "const sup = (a.mil * aM) > (d.mil * dM) * 1.3;", "const sup = (a.mil * aM) > (d.mil * dM) * 1.5;", 'R5 sup 1.5')
s = rep(s, "const loot = Math.round(d.money * 0.12);", "const loot = Math.round(d.money * 0.08);", 'R6 saque bot')
s = rep(s, "b.mil >= 6 &&", "b.mil >= 8 &&", 'R7 guerra mil8')
s = rep(s, "botsAlive < 0.12", "botsAlive < 0.08", 'R8 guerra rara')
s = rep(s, "b.mil >= h.mil * 1.5", "b.mil >= h.mil * 1.75", 'R9 guerra sup')
s = rep(s, "const loot = Math.round(def.money * 0.12);", "const loot = Math.round(def.money * 0.08);", 'R10 saque batalha')
s = rep(s, "if (provs.length && vivosD === 0) {", "if (provs.length && vivosD === 0 && atk.mil >= def.mil) {", 'R11 captura dura')

if fails:
    print('\nFALHAS:'); [print(' -', f) for f in fails]; sys.exit(1)
io.open(IDX, 'w', encoding='utf-8').write(h)
io.open(SRV, 'w', encoding='utf-8').write(s)
print('\nPATCH FASE4 OK')
