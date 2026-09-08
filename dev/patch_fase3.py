#!/usr/bin/env python3
"""FASE 3: jogo infinito, IA cautelosa, fundar ao vivo, mapa organizado, widgets quadrados com X.
Uso: python3 patch_fase3.py   (rodar a partir de /home/user/presidente-online)
Toda ancora e estrita: falha alto se nao achar exatamente 1 ocorrencia."""
import io, re, sys

IDX = 'public/index.html'
SRV = 'server.js'
fails = []

def rep(buf, old, new, tag):
    global fails
    if buf.count(old) != 1:
        fails.append(f'{tag}: encontrou {buf.count(old)}x (esperava 1)')
        return buf
    print(f'  ok {tag}')
    return buf.replace(old, new)

def reprep(buf, pattern, new, tag):
    global fails
    m = re.findall(pattern, buf)
    if len(m) != 1:
        fails.append(f'{tag}: regex achou {len(m)}x (esperava 1)')
        return buf
    print(f'  ok {tag}')
    return re.sub(pattern, new, buf, count=1)

h = io.open(IDX, encoding='utf-8').read()
s = io.open(SRV, encoding='utf-8').read()

print('== CLIENTE ==')
# ---- CSS: bolas -> quadrados + categorias + X ----
h = rep(h, "#btn-pause,#btn-speed2,#btn-endturn,#btn-rank,#btn-news,#btn-build{width:38px;height:38px;border-radius:50%;border:2px solid #8a6a1f;background:radial-gradient(circle at 35% 30%, #ffe9a8, #d9a93c 60%, #8a6a1f);",
           "#btn-pause,#btn-speed2,#btn-endturn,#btn-rank,#btn-news,#btn-build{width:38px;height:38px;border-radius:10px;border:2px solid #8a6a1f;background:linear-gradient(#ffe9a8,#d9a93c);", 'C1 hud quadrado')
h = rep(h, "/* barra circular inferior (estilo MA3) */", "/* barra inferior de acoes (estilo MA3) */", 'C2 comentario barra')
h = rep(h, "width:54px; height:54px; border-radius:50%; border:2px solid var(--border);",
           "width:54px; height:54px; border-radius:12px; border:2px solid var(--border);", 'C3 round-btn quadrado')
h = rep(h, "background:radial-gradient(circle at 35% 30%, #223054, #131c36);",
           "background:linear-gradient(#223054,#131c36);", 'C4 round-btn flat')
h = rep(h, ".flimg{width:46px; height:46px; border-radius:50%;", ".flimg{width:46px; height:46px; border-radius:6px;", 'C5 flimg quadrado')
h = rep(h, ".pchip{background:#101830; border:1px solid var(--border); border-radius:999px;",
           ".pchip{background:#101830; border:1px solid var(--border); border-radius:8px;", 'C6 pchip quadrado')
h = rep(h, "background:rgba(14,21,38,.9); border:1px solid var(--border); border-radius:99px;",
           "background:rgba(14,21,38,.9); border:1px solid var(--border); border-radius:10px;", 'C7 ap-dock quadrado')
h = rep(h, ".hidden{display:none !important;}",
           ".hidden{display:none !important;}\n  .hcat{font-size:10px;font-weight:800;color:var(--gold2);letter-spacing:1px;align-self:center;margin:0 2px 0 10px;}\n  .px{float:right;background:#1a2440;border:1px solid var(--border);color:#fff;border-radius:6px;font-size:12px;line-height:1;padding:4px 8px;cursor:pointer;margin:0 0 4px 4px;}\n  .px:hover{background:#5a1620;border-color:#ff6b6b;}", 'C8 css hcat+px')
h = rep(h, "width:300px; background:var(--panel);", "width:240px; background:var(--panel);", 'C9 sidebar estreita (mapa maior)')

# ---- HUD: categorias MUNDO/PAIS ----
h = rep(h, '<button id="btn-pause" title="Pausar/retomar (anfitrião)">⏸️</button>',
           '<span class="hcat">MUNDO</span>\n    <button id="btn-pause" title="Pausar/retomar (anfitrião)">⏸️</button>', 'H1 cat MUNDO')
h = rep(h, '<button id="btn-tax" title="Impostos (4 sliders, estilo MA3)">🧾</button>',
           '<span class="hcat">PAÍS</span>\n    <button id="btn-tax" title="Impostos (4 sliders, estilo MA3)">🧾</button>', 'H2 cat PAIS')
h = rep(h, '<button class="tool-btn" id="btn-rank" title="Ranking das nações">📊</button>',
           '<button class="tool-btn" id="btn-rank2" title="Ranking das nações">📊</button>', 'H3 dedup btn-rank')

# ---- sidebar: so Noticias ----
h = rep(h, '      <h3>📜 Acontecimentos</h3>\n      <div class="feed" id="feed"></div>\n      <h3>📰 Notícias</h3>\n',
           '      <h3>📰 Notícias do mundo</h3>\n      <div class="feed" id="feed"></div>\n', 'N1 sidebar noticias')

# ---- botoes X ----
h = rep(h, '        <div class="np-head">\n          <span class="fl" id="np-flag">🏳️</span>',
           '        <div class="np-head">\n          <button class="px" title="Fechar painel">✕</button>\n          <span class="fl" id="np-flag">🏳️</span>', 'X1 np-x')
h = rep(h, '      <div class="rank-panel hidden" id="help-panel">\n        <h3>❓ Como jogar</h3>',
           '      <div class="rank-panel hidden" id="help-panel">\n        <button class="px" title="Fechar">✕</button>\n        <h3>❓ Como jogar</h3>', 'X2 help-x')
h = rep(h, "panel.innerHTML = '<h3>📊 Ranking das nações</h3>';",
           "panel.innerHTML = '<button class=\"px\" title=\"Fechar\">✕</button><h3>📊 Ranking das nações</h3>';", 'X3 rank-x')
h = rep(h, "panel.innerHTML = '<h3>🛒 Mercado global de recursos</h3>",
           "panel.innerHTML = '<button class=\"px\" title=\"Fechar\">✕</button><h3>🛒 Mercado global de recursos</h3>", 'X4 market-x')
h = rep(h, '<div class="big" id="ov-emoji">🏆</div>',
           '<button class="px" id="ov-x" title="Fechar">✕</button><div class="big" id="ov-emoji">🏆</div>', 'X5 ov-x')
h = rep(h, """$('ov-btn').onclick = () => {
  if (state && state.phase === 'over') location.reload();
  else { deadShown = true; $('overlay').classList.add('hidden'); }
};""",
"""$('ov-btn').onclick = () => {
  if (state && state.phase === 'over') location.reload();
  else { deadShown = true; $('overlay').classList.add('hidden'); }
};
$('ov-x').onclick = () => { if (state && state.phase === 'over') location.reload(); else $('overlay').classList.add('hidden'); };
$('btn-rank2').onclick = () => $('btn-rank').click();
document.addEventListener('click', e => {
  const x = e.target.closest('.px'); if (!x || x.id === 'ov-x') return;
  const p = x.closest('.rank-panel,.nation-panel'); if (!p) return;
  p.classList.add('hidden');
  if (p.id === 'np'){ selectedId = null; renderMap(); }
  if (p.id === 'rank-panel') $('btn-rank').classList.remove('active');
  if (p.id === 'market-panel') $('btn-market').classList.remove('active');
  if (p.id === 'help-panel') $('btn-help').classList.remove('active');
});""", 'X6 handlers fechar')

# ---- mapa: sem bordas + anticolisao ----
h = rep(h, """      const fb = document.createElementNS('http://www.w3.org/2000/svg','rect');
      fb.setAttribute('x', '-13'); fb.setAttribute('y', '-9');
      fb.setAttribute('width', '26'); fb.setAttribute('height', '18');
      fb.setAttribute('fill', 'none'); fb.setAttribute('stroke', ringColor); fb.setAttribute('stroke-width', '2');
      mk.appendChild(fb);
""", "", 'M1 sem borda real')
h = rep(h, "      csq.setAttribute('stroke', ringColor); csq.setAttribute('stroke-width', '2');\n", "", 'M2 sem borda custom')
h = reprep(h, r"    if \(p\.id === selectedId\)\{\n(?:.*\n)*?      mk\.appendChild\(halo\);\n    \}\n",
           "    if (p.id === selectedId){ mk.style.filter = 'drop-shadow(0 0 6px ' + ringColor + ')'; }\n", 'M3 halo->brilho')
h = rep(h, "function renderMap(){",
"""/* separa bandeiras sobrepostas (Europa etc.) — relaxamento simples, 10 iteracoes */
function declutter(list){
  const pts = list.map(p => { const c = cbid(p.country) || {lat:8,lon:-40}; const q = proj(c); return {id:p.id, x:q.x, y:q.y}; });
  for (let k = 0; k < 10; k++){
    for (let i = 0; i < pts.length; i++) for (let j = i+1; j < pts.length; j++){
      const a = pts[i], b = pts[j]; let dx = b.x-a.x, dy = b.y-a.y;
      if (Math.abs(dx) < 30 && Math.abs(dy) < 22){
        if (!dx && !dy){ dx = (i%2?1:-1)*2; dy = 1; }
        const px = (30-Math.abs(dx))*Math.sign(dx||1)*0.5, py = (22-Math.abs(dy))*Math.sign(dy||1)*0.5;
        a.x -= px; a.y -= py; b.x += px; b.y += py;
      }
    }
  }
  const m = new Map();
  pts.forEach(p => m.set(p.id, {x:Math.min(982,Math.max(18,p.x)), y:Math.min(508,Math.max(12,p.y))}));
  return m;
}
function renderMap(){""", 'M4 declutter fn')
h = rep(h, "  gT.innerHTML = ''; gLines.innerHTML = ''; g.innerHTML = '';",
           "  gT.innerHTML = ''; gLines.innerHTML = ''; g.innerHTML = '';\n  const _mkPos = declutter(state.players.filter(p=>p.country));", 'M5 declutter call')
h = rep(h, "    const pos = proj(c);", "    const pos = _mkPos.get(p.id) || proj(c);", 'M6 pos ajustada')

# ---- load sem codigo ----
h = rep(h, "  $('g-code').textContent = state.code;",
           "  $('g-code').textContent = state.code;\n  try{localStorage.setItem('po_room',state.code);}catch(e){}", 'L1 salva sala')
h = rep(h, """$('btn-load').onclick = () => {
  const code = $('inp-code').value.trim().toUpperCase();
  if (code.length < 4) return toast('Digite o código de 4 letras do jogo salvo.', 'error');
  send({t:'tem_save', code});
};""",
"""$('btn-load').onclick = () => {
  const code = $('inp-code').value.trim().toUpperCase() || (localStorage.getItem('po_room')||'').toUpperCase();
  if (code.length < 4) return toast('Nenhum jogo salvo neste navegador. Crie ou entre numa sala primeiro.', 'error');
  send({t:'tem_save', code});
};""", 'L2 load automatico')

# ---- fundar ao vivo ----
h = rep(h, "  wrap.style.cssText = 'padding:14px; display:flex; flex-direction:column; gap:10px;';",
           "  wrap.style.cssText = 'padding:10px; display:flex; flex-direction:column; gap:8px;';", 'F1 compacto')
h = rep(h, """  wrap.innerHTML = '<div style="font-weight:800;font-size:14px;">Funde sua nação: nome, cor e símbolo.</div>';""",
"""  wrap.innerHTML = '<div style="font-weight:800;font-size:14px;">Sua nação (atualiza na hora, sem botão):</div>';
  const pvC = (mine && mine.color != null) ? mine.color : 0;
  const pvF = (mine && mine.customFlag) || '🏳️';
  const pvN = String((mine && mine.customName) || '(sem nome — digite abaixo)').replace(/[<>&]/g,'');
  const pv = document.createElement('div');
  pv.style.cssText = 'display:flex;align-items:center;gap:10px;background:#0c1324;border:1px solid var(--border);border-radius:8px;padding:8px 10px;';
  pv.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:36px;font-size:22px;background:' + PALETTE[pvC % 60] + ';">' + pvF + '</span><b style="font-size:15px;">' + pvN + '</b>';
  wrap.appendChild(pv);""", 'F2 preview')
h = rep(h, "  inp.value = (mine && mine.customName) || '';",
           "  if (mine && mine.customName === window._ld) window._ld = '';\n  inp.value = window._ld || ((mine && mine.customName) || '');", 'F3 rascunho')
h = rep(h, "  wrap.appendChild(inp);",
"""  wrap.appendChild(inp);
  let fundT = null;
  inp.oninput = () => { window._ld = inp.value; clearTimeout(fundT); fundT = setTimeout(() => { const nm = inp.value.trim(); if (nm) send({t:'fundar', name: nm, flag: (mine && mine.customFlag) || '🏳️', color: (mine && mine.color != null) ? mine.color : 0}); }, 600); };""", 'F4 nome live')
h = rep(h, "  const FLAGS = ['🏳️','🦅','🐺','🦁','🐉','🐻','⭐','☀️','🌙','🔥','❄️','🌊','⚡','🛡️','⚔️','🌹','🌻','🍀','💎','🏴','🚩','👑','🕊️','🎌'];",
           "  const FLAGS = ['🏳️','🦅','🐺','🦁','🐉','🐻','⭐','☀️','🌙','🔥','❄️','🌊','⚡','🛡️','⚔️','🌹','🌻','🍀','💎','🏴','🚩','👑','🕊️','🎌','🐯','🐆','🦈','🐍','🦉','🦚','🐢','🐙','🦀','🐊','🦒','🦩','🦜','🐼','🦘','🌵','🌴','🌍','🔱','⚓','🚀','🛸','♛','⚜️'];", 'F5 48 simbolos')
h = rep(h, "  for (let ci = 0; ci < 12; ci++){", "  for (let ci = 0; ci < 60; ci++){", 'F6 60 cores')
h = rep(h, "cb.style.cssText = 'width:30px;height:30px;", "cb.style.cssText = 'width:22px;height:22px;", 'F7 swatch menor')
h = rep(h, """  const fbtn = document.createElement('button'); fbtn.className = 'primary'; fbtn.textContent = '🏳️ Fundar minha nação';
  fbtn.onclick = () => send({t:'fundar', name: inp.value || (mine?mine.name:''), flag: selFlag});
  wrap.appendChild(fbtn);
""", "", 'F8 sem botao fundar')

# ---- textos: infinito ----
h = rep(h, "🎯 <b>Vitórias:</b> conquista (última nação / todas as províncias), econômica (🏭 60+), ideológica (⚖️ 60+) ou religiosa (🕌 60+).<br>",
           "♾️ <b>Jogo infinito:</b> nunca termina — eco/influência/fé 60+ rendem MARCOS 🏆 e o mundo continua.<br>", 'T1 help infinito')
h = rep(h, "❤️ Aprovação ≤ 5% = deposto pelo povo.<br>",
           "❤️ Aprovação 0% = governo REFORMADO (perde metade do caixa) — humanos nunca caem.<br>", 'T2 help reforma')
h = rep(h, "🏗️ Províncias geram $6/semana por ponto de infra; vencer guerras ocupa províncias.<br>",
           "🏗️ Províncias geram $6/semana por ponto de infra; só ANIQUILAR o exército inimigo ocupa província.<br>", 'T3 help conquista')
h = rep(h, "60 vence por hegemonia ideológica", "marco de hegemonia aos 60", 'T4 titulo doutrina')
h = rep(h, "60 vence por hegemonia religiosa", "marco de hegemonia aos 60", 'T5 titulo fe')

print('== SERVIDOR ==')
s = rep(s, "'🕊️','🎌'];", "'🕊️','🎌','🐯','🐆','🦈','🐍','🦉','🦚','🐢','🐙','🦀','🐊','🦒','🦩','🦜','🐼','🦘','🌵','🌴','🌍','🔱','⚓','🚀','🛸','♛','⚜️'];", 'S1 FLAGS_ALLOWED 48')
s = rep(s, """function checkVictory(room) {
  if (room.phase !== 'game') return;
  const alive = room.players.filter(p => p.alive);
  let winner = null, reason = '';
  if (room.players.length > 1 && alive.length === 1) { winner = alive[0]; reason = 'Domínio global — última nação de pé'; }
  else {
    const ecoW = alive.find(p => p.eco >= 60);
    if (ecoW) { winner = ecoW; reason = 'Hegemonia econômica (economia 60+)'; }
    const ideoW = !winner && alive.find(p => p.influencia >= 60);
    if (ideoW) { winner = ideoW; reason = 'Hegemonia ideológica — sua doutrina dominou o mundo'; }
    const feW = !winner && alive.find(p => p.fe >= 60);
    if (feW) { winner = feW; reason = 'Hegemonia religiosa — sua fé unificou o mundo'; }
    const convRelW = !winner && alive.find(p => p.religion && p.religion !== 'laico' && alive.filter(o => o.religion === p.religion).length > alive.length / 2);
    if (convRelW) { winner = convRelW; reason = '🛐 Vitória religiosa — sua fé converteu a maioria das nações do mundo'; }
    const convIdeW = !winner && alive.find(p => p.ideology && alive.filter(o => o.ideology === p.ideology).length > alive.length / 2);
    if (convIdeW) { winner = convIdeW; reason = '🗽 Vitória ideológica — sua doutrina governa a maioria das nações'; }
  }
  if (winner) {
    room.phase = 'over';
    room.winner = { id: winner.id, name: winner.name, country: winner.country, reason };
    log(room, `🏆 ${cname(winner)} (${winner.name}) VENCEU: ${reason}!`);
    if (room.timer) { clearInterval(room.timer); room.timer = null; }
  }
}""",
"""function checkVictory(room) {
  // JOGO INFINITO: nunca termina — vitorias viraram MARCOS comemorativos (1x por nacao).
  if (room.phase !== 'game') return;
  if (!room.marcos) room.marcos = {};
  const alive = room.players.filter(p => p.alive);
  const marco = (id, p, txt) => { if (p && !room.marcos[id + '_' + p.id]) { room.marcos[id + '_' + p.id] = 1; log(room, `🏆 MARCO: ${cname(p)} — ${txt} (o jogo continua: o mundo é infinito!)`); } };
  if (room.players.length > 1 && alive.length === 1) marco('unica', alive[0], 'última nação de pé — o mundo é seu!');
  marco('eco', alive.find(p => p.eco >= 60), 'hegemonia econômica (economia 60+)');
  marco('ideo', alive.find(p => p.influencia >= 60), 'hegemonia ideológica (doutrina 60+)');
  marco('fe', alive.find(p => p.fe >= 60), 'hegemonia religiosa (fé 60+)');
  marco('convR', alive.find(p => p.religion && p.religion !== 'laico' && alive.filter(o => o.religion === p.religion).length > alive.length / 2), 'sua fé converteu a maioria das nações');
  marco('convI', alive.find(p => p.ideology && alive.filter(o => o.ideology === p.ideology).length > alive.length / 2), 'sua doutrina governa a maioria das nações');
}""", 'S2 vitoria->marcos')
s = rep(s, """function checkEliminations(room) {
  for (const p of room.players) {
    if (!p.alive) continue;
    if (p.aprov <= 5) { p.alive = false; p.eliminatedReason = 'Deposto por revolta popular'; }
    else if (p.provinces.length && ownProvinces(p).length === 0) { p.alive = false; p.eliminatedReason = 'Conquista total do território'; }""",
"""function checkEliminations(room) {
  for (const p of room.players) {
    if (!p.alive) continue;
    if (p.provinces.length && ownProvinces(p).length) p.exilio = 0;
    if (p.aprov <= 0 && p.bot) { p.alive = false; p.eliminatedReason = 'Deposto por revolta popular'; }
    else if (p.aprov <= 0) { p.aprov = 30; p.money = Math.round(p.money / 2); log(room, `🔄 ${cname(p)} (${p.name}) REFORMOU o governo após aprovação zerar! (-50% do caixa, o jogo continua)`); }
    else if (p.provinces.length && ownProvinces(p).length === 0 && p.bot) { p.alive = false; p.eliminatedReason = 'Conquista total do território'; }
    else if (p.provinces.length && ownProvinces(p).length === 0 && !p.exilio) { p.exilio = 1; log(room, `⛺ ${cname(p)} (${p.name}) perdeu todo o território — governo no exílio! Reconquiste suas províncias.`); }""", 'S3 humanos imortais')
s = rep(s, "  const dP = d.mil * dM * (0.9 + Math.random() * 0.45) * 1.08;",
           "  const dP = d.mil * dM * (0.9 + Math.random() * 0.45) * 1.08;\n  const sup = (a.mil * aM) > (d.mil * dM) * 1.3;", 'S4 superioridade bot')
s = rep(s, """    const loot = Math.round(d.money * 0.25);
    d.money -= loot; a.money += loot;
    d.mil = Math.max(1, Math.round(d.mil * 0.8)); a.mil = Math.max(1, Math.round(a.mil * 0.9));
    d.aprov = Math.max(0, d.aprov - 8); a.stats.vitorias++;""",
"""    const loot = Math.round(d.money * 0.12);
    d.money -= loot; a.money += loot;
    d.mil = Math.max(1, Math.round(d.mil * 0.8)); a.mil = Math.max(1, Math.round(a.mil * 0.9));
    d.aprov = Math.max(0, d.aprov - 4); a.stats.vitorias++;""", 'S5 saque/aprov bot')
s = rep(s, "    if (provs.length) { const pr = provs[Math.floor(Math.random() * provs.length)]; pr.owner = a.id; log(room, `🏴 ${cname(a)} OCUPA a província de ${pr.name}!`); }",
           "    if (provs.length && sup) { const pr = provs[Math.floor(Math.random() * provs.length)]; pr.owner = a.id; log(room, `🏴 ${cname(a)} OCUPA a província de ${pr.name}!`); }", 'S6 ocupa so superior')
s = rep(s, """    if (room.turn > 12 && humans.length && b.mil >= 4 && Math.random() * botsAlive < 0.3 && room.turn >= room.noWarUntil) {
      const ts = humans.filter(h => !b.allies.includes(h.id) && !b.wars.includes(h.id) && !(((b.pacts && b.pacts[h.id]) || 0) > room.turn));
      if (ts.length) {
        const h = ts[Math.floor(Math.random() * ts.length)];
        b.wars.push(h.id); h.wars.push(b.id);
        log(room, `🤖⚔️ ${cname(b)} declarou GUERRA a ${cname(h)}!`);
        if (Math.random() < 0.6) botAttack(room, b, h);
      }
    }""",
"""    if (room.turn > 20 && humans.length && b.mil >= 6 && Math.random() * botsAlive < 0.12 && room.turn >= room.noWarUntil) {
      const ts = humans.filter(h => !b.allies.includes(h.id) && !b.wars.includes(h.id) && !(((b.pacts && b.pacts[h.id]) || 0) > room.turn) && relBetween(b, h) < 45 && b.mil >= h.mil * 1.5 && h.wars.length < 2 && ownProvinces(h).length > 1 && h.money > 500);
      if (ts.length) {
        const h = ts[Math.floor(Math.random() * ts.length)];
        b.wars.push(h.id); h.wars.push(b.id);
        log(room, `🤖⚔️ ${cname(b)} declarou GUERRA a ${cname(h)}!`);
        if (Math.random() < 0.25) botAttack(room, b, h);
      }
    }""", 'S7 IA cautelosa')
s = rep(s, "  room.un = null; room.noWarUntil = 0; room.noArmsUntil = 0; room.embargo = null;",
           "  room.un = null; room.noWarUntil = 20; room.noArmsUntil = 0; room.embargo = null;", 'S8 tregua 20 dias')
s = rep(s, "    const loot = Math.round(def.money * 0.25);", "    const loot = Math.round(def.money * 0.12);", 'S9 saque batalha')
s = rep(s, "    def.aprov = Math.max(0, def.aprov - 8);", "    def.aprov = Math.max(0, def.aprov - 4);", 'S10 aprov batalha')
s = rep(s, "    atk.aprov = Math.max(0, atk.aprov - 6);", "    atk.aprov = Math.max(0, atk.aprov - 3);", 'S11 aprov derrota')
s = rep(s, """    const provs = ownProvinces(def);
    let capturou = null;
    if (provs.length) {""",
"""    const provs = ownProvinces(def);
    let capturou = null;
    if (provs.length && vivosD === 0) {""", 'S12 captura so aniquilacao')

if fails:
    print('\nFALHAS:'); [print(' -', f) for f in fails]; sys.exit(1)
io.open(IDX, 'w', encoding='utf-8').write(h)
io.open(SRV, 'w', encoding='utf-8').write(s)
print('\nPATCH FASE3 OK')
