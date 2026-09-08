import io, re, sys
F = {'server': '/home/user/presidente-online/server.js', 'client': '/home/user/presidente-online/public/index.html'}
T = {k: io.open(v, encoding='utf-8').read() for k, v in F.items()}
errs = []
def rep(which, old, new, tag, strict=True):
    n = T[which].count(old)
    if n != 1:
        errs.append(('STRICT-FAIL' if strict else 'warn') + f': {which} [{tag}] count={n}')
        return
    T[which] = T[which].replace(old, new)
def rep_all(which, old, new, tag, expect):
    n = T[which].count(old)
    if n != expect:
        errs.append(f'STRICT-FAIL: {which} [{tag}] count={n} expect={expect}')
        return
    T[which] = T[which].replace(old, new)
def rep_re(which, pat, new, tag):
    t2, n = re.subn(pat, new, T[which], count=1, flags=re.S)
    if n != 1:
        errs.append(f'STRICT-FAIL: {which} [{tag}] regex n={n}')
        return
    T[which] = t2

# ================= SERVIDOR =================
rep('server', "const TICK_BASE = 45;   // segundos de um ciclo em 1x",
"""/* ===== tempo real: 1 dia = 1 segundo em 1x; semana = 7 dias ===== */
const DAY_DIV = 7;            // economia diária = valores semanais / 7
const WEEK_DAYS = 7;          // dias por semana (ciclo estratégico)
const dayMsFor = mul => Math.round(1000 / ([1, 2, 3, 5].includes(mul) ? mul : 1));
const buildDays = cost => cost >= 800 ? 4 : cost >= 500 ? 3 : cost >= 300 ? 2 : 1;  // dias p/ concluir obra
function restartDayTimer(room){ if (room.timer){ try{ clearInterval(room.timer); }catch{} } room.timer = setInterval(() => dayTick(room), room.dayMs || 1000); }
function ensureDayTimer(room){ if (room.phase === 'game' && !room.paused && !room.timer) restartDayTimer(room); }""", 'S1-consts')
rep('server', "code: makeCode(), phase: 'lobby', turn: 0, timerEnd: 0, speed: 45,",
    "code: makeCode(), phase: 'lobby', turn: 0, day: 1, dayMs: 1000, speedMul: 1, timerEnd: 0, speed: 45,", 'S2-newRoom')
rep('server', "function snapshot(room) {",
    "function floorRec(rec){ const o = {}; for (const k of ['comida','minerio','energia','concreto','madeira','terras_raras','uranio','borracha']) o[k] = Math.floor((rec && rec[k]) || 0); return o; }\nfunction snapshot(room) {", 'S3a-floorRec')
rep('server', "    t: 'state', phase: room.phase, code: room.code, turn: room.turn,\n    timerEnd: room.timerEnd, speed: room.speed, winner: room.winner,",
    "    t: 'state', phase: room.phase, code: room.code, turn: room.turn, day: room.day || 1,\n    winner: room.winner,", 'S3b-state-day')
rep('server', "      money: Math.round(p.money), eco: p.eco, mil: p.mil, aprov: p.aprov, ap: p.ap,",
    "      money: Math.round(p.money), eco: p.eco, mil: p.mil, aprov: Math.round(p.aprov), ap: p.ap,", 'S3c-aprov')
rep('server', "      nuclear: p.nuclear, influencia: p.influencia, fe: p.fe, wars: p.wars,",
    "      nuclear: p.nuclear, influencia: Math.round(p.influencia), fe: Math.round(p.fe), wars: p.wars,", 'S3d-feinf')
rep('server', "      pop: p.pop, rec: p.rec, xp: p.xp, bot: p.bot, customName: p.customName, customFlag: p.customFlag,",
    "      pop: Math.round(p.pop), rec: floorRec(p.rec), xp: p.xp, bot: p.bot, customName: p.customName, customFlag: p.customFlag,", 'S3e-poprec')
rep('server', "      dailyIncome: Math.round(incomeOf(room, p)),",
    "      dailyIncome: Math.round(incomeOf(room, p) / DAY_DIV),", 'S3f-daily')
rep('server', "function err(conn, msg) { if (conn) conn.send({ t: 'error', msg }); }",
"""/* atualização leve diária: dia + números de cada jogador (sem re-render pesado) */
function broadcastDay(room) {
  const light = { t: 'day', day: room.day, turn: room.turn, phase: room.phase,
    players: room.players.map(p => ({ id: p.id, money: Math.round(p.money), eco: p.eco, mil: p.mil,
      aprov: Math.round(p.aprov), ap: p.ap, alive: p.alive, pop: Math.round(p.pop),
      nuclear: p.nuclear, influencia: Math.round(p.influencia), fe: Math.round(p.fe),
      rec: floorRec(p.rec), builds: p.builds })) };
  const msg = JSON.stringify(light);
  for (const p of room.players) {
    if (!p.conn || !p.connected) continue;
    try { p.conn.sendText(msg); } catch {}
  }
}
function err(conn, msg) { if (conn) conn.send({ t: 'error', msg }); }""", 'S4-broadcastDay')
rep('server', "  room.phase = 'game'; room.turn = 1; room.proposals = [];",
    "  room.phase = 'game'; room.turn = 1; room.day = 1; room.proposals = [];", 'S5a-startday')
rep('server', """  room.timerEnd = Date.now() + room.speed * 1000;
  log(room, '🏳️ Cada jogador fundou sua própria nação: $10.000, 0 habitantes, reserva natural de 12⚙️ terras raras — tudo por construir.');
  log(room, `🤖 As ${COUNTRIES.length} nações do mundo estão sob controle da IA. É vocês contra elas!`);
  if (!room.timer) {
    room.timer = setInterval(() => {
      if (room.phase !== 'game' || room.paused) return;
      if (Date.now() >= room.timerEnd) resolveTurn(room);
      if (room.un && Date.now() >= room.un.deadline) resolveUN(room);
    }, 1000);
  }
  broadcast(room);""",
"""  room.dayMs = dayMsFor(room.speedMul || 1);
  log(room, '🏳️ Cada jogador fundou sua própria nação: $10.000, 0 habitantes, reserva natural de 12⚙️ terras raras — tudo por construir.');
  log(room, `🤖 As ${COUNTRIES.length} nações do mundo estão sob controle da IA. É vocês contra elas!`);
  restartDayTimer(room);
  broadcast(room);""", 'S5b-starttimer')
# --- resolveTurn -> dayTick + resolveWeek ---
rep('server', "function resolveTurn(room) {\n  room.turn++;",
"""function dayTick(room) {
  if (room.phase !== 'game' || room.paused) return;
  if (room.un && Date.now() >= room.un.deadline) resolveUN(room);
  if (room.phase !== 'game') return;
  room.day++;""", 'S6a-dayhead')
rep('server', "    const done = p.builds.filter(b => b.until <= room.turn);",
    "    const done = p.builds.filter(b => (b.untilDay != null ? b.untilDay : room.day) <= room.day);", 'S6b-done')
rep('server', "    p.builds = p.builds.filter(b => b.until > room.turn);",
    "    p.builds = p.builds.filter(b => (b.untilDay != null ? b.untilDay : room.day) > room.day);", 'S6b-todo')
rep('server', "    p.money += incomeOf(room, p);",
    "    p.money += incomeOf(room, p) / DAY_DIV;", 'S6b-money')
rep('server', "    p.aprov = Math.max(0, Math.min(100, p.aprov + dAprov));",
    "    p.aprov = Math.max(0, Math.min(100, p.aprov + dAprov / DAY_DIV));", 'S6b-aprov')
rep('server', "    if (p.religion && p.religion !== 'laico') p.fe += 1;",
    "    if (p.religion && p.religion !== 'laico') p.fe += 1 / DAY_DIV;", 'S6b-fe')
rep('server', "    if (p.ministers.dip === 'inf') p.influencia += 1;",
    "    if (p.ministers.dip === 'inf') p.influencia += 1 / DAY_DIV;", 'S6b-inf')
rep('server', "    p.influencia += techLevel(p, 'influencia_cult');",
    "    p.influencia += techLevel(p, 'influencia_cult') / DAY_DIV;", 'S6b-inf2')
rep('server', "    p.rec.energia += 3 + infra * 2;",
    "    p.rec.energia += (3 + infra * 2) / DAY_DIV;", 'S6c-ene1')
rep('server', "    if (nBld > 0 && p.rec.energia < needEn) {",
    "    if (nBld > 0 && p.rec.energia < needEn / DAY_DIV) {", 'S6c-ene2')
rep('server', "    } else { p.blackout = false; p.rec.energia -= needEn; }",
    "    } else { p.blackout = false; p.rec.energia -= needEn / DAY_DIV; }", 'S6c-ene3')
rep('server', "    p.rec.comida += Math.round((4 + infra * 3) * mult);",
    "    p.rec.comida += ((4 + infra * 3) * mult) / DAY_DIV;", 'S6c-com')
rep('server', "    p.rec.minerio += Math.round((2 + Math.round(p.eco * 0.8)) * mult);",
    "    p.rec.minerio += ((2 + Math.round(p.eco * 0.8)) * mult) / DAY_DIV;", 'S6c-min')
rep('server', "    p.rec.concreto += Math.round(1 * mult);",
    "    p.rec.concreto += mult / DAY_DIV;", 'S6c-con')
rep('server', "      p.rec[o.res] = (p.rec[o.res] || 0) + Math.round(n * o.qtd * upM(p, k) * mult);",
    "      p.rec[o.res] = (p.rec[o.res] || 0) + (n * o.qtd * upM(p, k) * mult) / DAY_DIV;", 'S6c-bld')
rep('server', "    if (dep.includes('petroleo')) p.rec.energia += 2;",
    "    if (dep.includes('petroleo')) p.rec.energia += 2 / DAY_DIV;", 'S6c-d1')
rep('server', "    if (dep.includes('minerio')) p.rec.minerio += 2;",
    "    if (dep.includes('minerio')) p.rec.minerio += 2 / DAY_DIV;", 'S6c-d2')
rep('server', "    if (dep.includes('madeira')) p.rec.madeira += 3;",
    "    if (dep.includes('madeira')) p.rec.madeira += 3 / DAY_DIV;", 'S6c-d3')
rep('server', "    if (dep.includes('comida')) p.rec.comida += 3;",
    "    if (dep.includes('comida')) p.rec.comida += 3 / DAY_DIV;", 'S6c-d4')
rep('server', "    if (dep.includes('terras_raras')) p.rec.terras_raras += 1;",
    "    if (dep.includes('terras_raras')) p.rec.terras_raras += 1 / DAY_DIV;", 'S6c-d5')
rep('server', "    if (dep.includes('uranio')) p.rec.uranio += 1;",
    "    if (dep.includes('uranio')) p.rec.uranio += 1 / DAY_DIV;", 'S6c-d6')
rep('server', "    let g = 4 + infra * 2;",
    "    let g = (4 + infra * 2) / DAY_DIV;", 'S6c-g')
rep('server', "    if (p.rec.comida >= need) p.rec.comida -= need; else { p.rec.comida = 0; g = Math.max(1, Math.floor(g / 3)); }",
    "    if (p.rec.comida >= need) p.rec.comida -= need; else { p.rec.comida = 0; g = g / 3; }", 'S6c-g2')
rep('server', "      p.pop = Math.max(0, p.pop - 2); p.aprov = Math.max(0, p.aprov - 3);",
    "      p.pop = Math.max(0, p.pop - 2 / DAY_DIV); p.aprov = Math.max(0, p.aprov - 3 / DAY_DIV);", 'S6c-fam')
rep('server', "  for (const k of Object.keys(room.market)) room.market[k] = Math.max(3, Math.min(40, Math.round(room.market[k] * (0.88 + Math.random() * 0.3))));",
"""  if (room.day > 1 && (room.day - 1) % WEEK_DAYS === 0) resolveWeek(room);
  else broadcastDay(room);
}

/* ciclo estratégico semanal: mercado, diplomacia, IA, missões, ONU */
function resolveWeek(room) {
  room.turn++;
  for (const k of Object.keys(room.market)) room.market[k] = Math.max(3, Math.min(40, Math.round(room.market[k] * (0.88 + Math.random() * 0.3))));""", 'S6d-split')
rep('server', "  randomEvent(room);\n  worldNews(room);\n  if (room.turn % 4 === 0 && !room.un) openUN(room);\n  aiTurn(room);",
    "  if ((room.day - 1) % 14 === 0){ randomEvent(room); worldNews(room); }\n  if ((room.day - 1) % 28 === 0 && !room.un) openUN(room);\n  if ((room.day - 1) % 14 === 0) aiTurn(room);", 'S6e-gates')
rep('server', "  checkEliminations(room);\n  checkVictory(room);\n  if (room.phase === 'game') room.timerEnd = Date.now() + room.speed * 1000;\n  broadcast(room);\n}",
    "  checkEliminations(room);\n  checkVictory(room);\n  broadcast(room);\n}", 'S6f-tail')
# --- builds.push -> untilDay ---
rep('server', "b.builds.push({ kind: 'infra', prov: b.provinces.indexOf(pr), until: room.turn + 1 });",
    "b.builds.push({ kind: 'infra', prov: b.provinces.indexOf(pr), untilDay: room.day + 2 });", 'S7a-botinfra')
rep('server', "b.builds.push({ kind, until: room.turn + 1 });",
    "b.builds.push({ kind, untilDay: room.day + buildDays(PROD_BUILDS[kind] || 300) });", 'S7b-botbld')
rep('server', "p.builds.push({ kind: 'espacial', until: room.turn + 1 });",
    "p.builds.push({ kind: 'espacial', untilDay: room.day + 4 });", 'S7c-esp')
rep('server', "p.builds.push({ kind: 'infra', prov: msg.prov, until: room.turn + 1 });",
    "p.builds.push({ kind: 'infra', prov: msg.prov, untilDay: room.day + 2 });", 'S7d-infra')
rep('server', "p.builds.push({ kind: 'nuclear', until: room.turn + 1 });",
    "p.builds.push({ kind: 'nuclear', untilDay: room.day + 5 });", 'S7e-nuc')
rep('server', "      p.builds.push({ kind: msg.kind, until: room.turn + 1 });\n      log(room, `🏗️ ${cname(p)} inicia ${PROD_NAMES[msg.kind]} (conclui no próximo turno).`);",
    "      const diasObra = buildDays(cCost);\n      p.builds.push({ kind: msg.kind, untilDay: room.day + diasObra });\n      log(room, `🏗️ ${cname(p)} inicia ${PROD_NAMES[msg.kind]} (pronto em ${diasObra} dia(s)).`);", 'S7f-construir')
# --- velocidade / pausar / fim_turno / load ---
rep('server', "room.speedMul = mul; room.speed = Math.round(TICK_BASE / mul); if (room.phase === 'game' && !room.paused) room.timerEnd = Date.now() + room.speed * 1000; broadcast(room); break; }",
    "room.speedMul = mul; room.dayMs = dayMsFor(mul); if (room.phase === 'game' && !room.paused) restartDayTimer(room); broadcast(room); break; }", 'S8-vel')
rep('server', "      if (!room.paused) { room.paused = true; room.pausedRemaining = Math.max(0, room.timerEnd - Date.now()); log(room, '⏸️ O anfitrião pausou a partida.'); }\n      else { room.paused = false; room.timerEnd = Date.now() + room.pausedRemaining; log(room, '▶️ Partida retomada.'); }",
    "      if (!room.paused) { room.paused = true; log(room, '⏸️ O anfitrião pausou a partida.'); }\n      else { room.paused = false; ensureDayTimer(room); log(room, '▶️ Partida retomada.'); }", 'S9-pausar')
rep('server', "    case 'fim_turno': { const { room, player } = conn.meta || {}; if (!room || room.phase !== 'game' || player.id !== room.hostId) return; resolveTurn(room); break; }\n", "", 'S10-fimturno')
rep('server', "    room.timer = null; room.timerEnd = 0;\n    room.paused = true;               // volta pausado",
    "    room.timer = null; room.timerEnd = 0;\n    room.paused = true;               // volta pausado\n    if (!room.day) room.day = 1;\n    if (!room.dayMs) room.dayMs = 1000;\n    for (const pl of (room.players || [])) for (const b of (pl.builds || [])) if (b.untilDay == null) b.untilDay = room.day + 1;", 'S11-load')
rep('server', "    case 'action': { const { room, player } = conn.meta || {}; if (!room) return; performAction(room, player, msg); break; }",
    "    case 'action': { const { room, player } = conn.meta || {}; if (!room) return; performAction(room, player, msg); if (room.phase === 'game') broadcastDay(room); break; }", 'S12-actionday')
# --- textos servidor ---
rep('server', "+1 aprovação por turno por nível", "+1 aprovação por semana por nível", 'S13a-seg', strict=False)
rep_all('server', "'+$10/turno'", "'+$10/semana'", 'S13b-leis', 2)
rep('server', "proibição de novas guerras por 3 turnos!", "proibição de novas guerras por 3 semanas!", 'S13c-un1', strict=False)
rep('server', "proibição de recrutamento por 3 turnos!", "proibição de recrutamento por 3 semanas!", 'S13c-un2', strict=False)
rep('server', "Válido por 8 turnos.", "Válido por 8 semanas.", 'S13c-un3', strict=False)

# ================= CLIENTE =================
rep('client', "  if (m.t === 'state'){ applyState(m); return; }",
    "  if (m.t === 'state'){ applyState(m); return; }\n  if (m.t === 'day'){ applyDay(m); return; }", 'C1-daycase')
rep('client', "function handle(m){",
"""function applyDay(m){
  if (!state || state.phase !== 'game' || !m.players) return;
  state.day = m.day; state.turn = m.turn;
  for (const lp of m.players){ const p = state.players.find(x => x.id === lp.id); if (p) Object.assign(p, lp); }
  updateDayHUD();
}
/* HUD leve diário: só textos, sem reconstruir nada (não come cliques) */
function updateDayHUD(){
  const m = me(); if (!m || !state) return;
  $('g-date').textContent = gameDate(state.day || 1);
  $('g-timer').textContent = '📅 DIA ' + (state.day || 1);
  $('m-money').textContent = fmt(m.money);
  $('m-pop').textContent = m.pop;
  $('m-comida').textContent = m.rec ? m.rec.comida : 0;
  $('m-eco').textContent = m.eco;
  $('m-mil').textContent = m.mil;
  $('m-aprov').textContent = m.aprov + '%';
  $('m-aprov').style.color = m.aprov > 55 ? 'var(--green)' : (m.aprov > 25 ? 'var(--gold2)' : 'var(--red)');
  document.querySelectorAll('.round-btn').forEach(b => {
    const costs = { investir:[1,250], militar:[1,300], propaganda:[1,150], nuclear:[2,600], ideologia:[1,200], fe:[1,200], treinar:[1,150] };
    const cc = costs[b.dataset.act]; if (!cc) return;
    b.disabled = state.phase!=='game' || !m.alive || m.ap < cc[0] || m.money < cc[1] || (b.dataset.act==='nuclear' && m.nuclear>=5);
  });
}
function handle(m){""", 'C2-applyday')
rep('client', """function gameDate(turn){
  const d = new Date(2024, 6, 1);
  d.setMonth(d.getMonth() + Math.max(0, turn-1));""",
"""function gameDate(day){
  const d = new Date(2025, 0, 1);
  d.setDate(d.getDate() + Math.max(0, (day||1)-1));""", 'C2b-gamedate')
rep('client', "  $('g-date').textContent = gameDate(state.turn);",
    "  $('g-date').textContent = gameDate(state.day || 1);", 'C2c-gdatecall')
rep('client', '<span class="date-badge" id="g-date">01-07-2024</span>',
    '<span class="date-badge" id="g-date">01-01-2025</span>', 'C2d-gdatedef')
rep('client', """/* ================= timer ================= */
setInterval(() => {
  if (!state || state.phase !== 'game') return;
  const left = Math.max(0, Math.ceil((state.timerEnd - Date.now())/1000));
  const el = $('g-timer');
  el.textContent = String(Math.floor(left/60)).padStart(2,'0') + ':' + String(left%60).padStart(2,'0');
  el.style.color = left <= 10 ? 'var(--red)' : 'var(--gold2)';
}, 250);""",
    "/* ================= relógio: o dia chega do servidor em tempo real (applyDay) ================= */", 'C3-notimer')
rep('client', "  else { showScreen('scr-game'); renderGame(); renderOverlay(); renderMarket(); }",
    "  else { showScreen('scr-game'); renderGame(); updateDayHUD(); renderOverlay(); renderMarket(); }", 'C3b-render')
rep('client', '    <button id="btn-endturn" title="Encerrar turno agora (só o anfitrião)">⏭</button>\n', "", 'C4a-endhtml')
rep('client', "  $('btn-endturn').classList.toggle('hidden', !m.isHost || state.phase!=='game');\n", "", 'C4b-endtog')
rep('client', "$('btn-endturn').onclick = () => send({t:'fim_turno'});\n", "", 'C4c-endclick')
rep('client', "$('btn-speed').onclick = () => send({t:'velocidade', speed: (state.speed===45) ? 15 : 45});",
    "$('btn-speed').onclick = () => { const seq = [1,2,3,5]; const cur = state.speedMul || 1; send({t:'velocidade', speed: seq[(seq.indexOf(cur)+1) % seq.length]}); };", 'C5a-speedclick')
rep('client', "  bs.textContent = `⏱️ Turnos de ${state.speed || 45}s`;",
    "  bs.textContent = `⏱️ Velocidade ${state.speedMul || 1}x`;", 'C5b-speedtxt')
rep('client', 'title="Alternar velocidade dos turnos (só o anfitrião)"',
    'title="Velocidade do tempo: 1x, 2x, 3x ou 5x (só o anfitrião)"', 'C5c-speedtitle')
rep('client', "⏱️ Turnos de 45s", "⏱️ Velocidade 1x", 'C5d-speeddef')
# --- mapa: sem nomes, sem losangos de província, bandeiras de verdade ---
rep_re('client', r"  const gP = document\.getElementById\('map-prov'\);.*?gP\.appendChild\(d\);\n    \}\);\n  \}\);\n",
    "  /* províncias removidas do mapa a pedido — só marcadores com bandeiras */\n", 'C6a-prov')
rep('client', """    const lbl = document.createElementNS('http://www.w3.org/2000/svg','text');
    lbl.setAttribute('text-anchor','middle'); lbl.setAttribute('y', String(r + 13));
    lbl.setAttribute('font-size','10'); lbl.setAttribute('fill','#ffffff');
    lbl.setAttribute('paint-order','stroke'); lbl.setAttribute('stroke','#081120'); lbl.setAttribute('stroke-width','2.5');
    lbl.setAttribute('font-weight','700');
    lbl.textContent = p.alive ? `${c.name} ${p.isHost?'👑':''}` : '💀 ' + c.name;
    mk.appendChild(lbl);""", "    /* nome removido do mapa a pedido */", 'C6b-lbl')
rep('client', """    const ring = document.createElementNS('http://www.w3.org/2000/svg','circle');
    ring.setAttribute('class','ring');
    ring.setAttribute('r', r);
    ring.setAttribute('fill', PALETTE[p.color % PALETTE.length]);
    ring.setAttribute('fill-opacity', '0.3');
    ring.setAttribute('stroke', ringColor);
    ring.setAttribute('stroke-width', p.id===selectedId ? '3.5' : '2.5');
    mk.appendChild(ring);

    const fl = document.createElementNS('http://www.w3.org/2000/svg','text');
    fl.setAttribute('text-anchor','middle'); fl.setAttribute('dominant-baseline','central');
    fl.setAttribute('font-size', '15');
    fl.textContent = c.flag;
    mk.appendChild(fl);""",
"""    const isoM = isoOf(p.country);
    if (isoM){
      const fo = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
      fo.setAttribute('x', '-12'); fo.setAttribute('y', '-12');
      fo.setAttribute('width', '24'); fo.setAttribute('height', '24');
      const fim = document.createElementNS('http://www.w3.org/1999/xhtml','img');
      fim.setAttribute('src', 'flags/' + isoM + '.svg');
      fim.setAttribute('style', 'width:24px;height:24px;border-radius:50%;object-fit:cover;border:2px solid ' + ringColor + ';box-sizing:border-box;background:#0c1324;display:block;');
      fo.appendChild(fim); mk.appendChild(fo);
    } else {
      const fl = document.createElementNS('http://www.w3.org/2000/svg','text');
      fl.setAttribute('text-anchor','middle'); fl.setAttribute('dominant-baseline','central');
      fl.setAttribute('font-size', '15');
      fl.textContent = c.flag;
      mk.appendChild(fl);
    }""", 'C6c-flag')
rep('client', "      nb.setAttribute('x', String(r+1)); nb.setAttribute('y', String(-r-1));",
    "      nb.setAttribute('x', '11'); nb.setAttribute('y', '-15');", 'C6d-nb')
rep('client', "      wb.setAttribute('x', String(-r-8)); wb.setAttribute('y', String(-r-1));",
    "      wb.setAttribute('x', '-20'); wb.setAttribute('y', '-15');", 'C6d-wb')
# --- ranking com países criados + bandeiras ---
rep('client', """  cats.forEach(([nm, fn, fm]) => {
    const top = ps.slice().sort((a,b)=>fn(b)-fn(a)).slice(0,8);
    html += '<div style="margin:8px 0"><b>'+nm+'</b><ol style="margin:4px 0 0 18px;padding:0">';
    top.forEach(p => { html += '<li'+(p.id===myId?' style="color:#ffd76a;font-weight:bold"':'')+'>'+cname(p)+' — '+fm(fn(p))+'</li>'; });
    html += '</ol></div>';
  });""",
"""  cats.forEach(([nm, fn, fm]) => {
    const sorted = ps.slice().sort((a,b)=>fn(b)-fn(a));
    const top = sorted.slice(0,8);
    html += '<div style="margin:8px 0"><b>'+nm+'</b><ol style="margin:4px 0 0 18px;padding:0">';
    top.forEach(p => { html += '<li'+(p.id===myId?' style="color:#ffd76a;font-weight:bold"':'')+'>'+cname(p)+' — '+fm(fn(p))+'</li>'; });
    sorted.forEach(p => { if (!p.bot && !top.includes(p)) html += '<li'+(p.id===myId?' style="color:#ffd76a;font-weight:bold"':'')+'>'+cname(p)+' — '+fm(fn(p))+' (#'+(sorted.indexOf(p)+1)+')</li>'; });
    html += '</ol></div>';
  });""", 'C7a-rankcustom')
rep('client', "    const rn=document.createElement('span'); rn.className='rn'; rn.textContent=cflag(p)+' '+((cbid(p.country)||{}).name||p.name)+(p.bot?' 🤖':'')+(p.alive?'':' 💀');",
    "    const rn=document.createElement('span'); rn.className='rn'; const rIso=isoOf(p.country); const rNm=String((cbid(p.country)||{}).name||p.name).replace(/[<>&]/g,''); rn.innerHTML=(rIso?'<img src=\"flags/'+rIso+'.svg\" style=\"width:20px;height:14px;vertical-align:-2px;border-radius:2px;border:1px solid #000\"> ':cflag(p)+' ')+rNm+(p.bot?' 🤖':'')+(p.alive?'':' 💀');", 'C7b-rankflag')
# --- textos (tolerantes) ---
rep('client', "4 pontos de ação por turno · turnos de 45s (1 mês no calendário)", "4 pontos de ação por dia · 1 dia passa a cada segundo (1x)", 'C8a-help1', strict=False)
rep('client', "Províncias geram $6/turno por ponto de infra", "Províncias geram $6/semana por ponto de infra", 'C8a-help2', strict=False)
rep('client', "Sanções drenam $50/turno do alvo e $20/turno de quem aplica", "Sanções drenam $50/semana do alvo e $20/semana de quem aplica", 'C8a-help3', strict=False)
rep('client', "Aliados não se atacam e rendem +$25/turno cada", "Aliados não se atacam e rendem +$25/semana cada", 'C8a-help4', strict=False)
rep('client', "+1 de aprovação por turno por nível", "+1 de aprovação por semana por nível", 'C8b-seg', strict=False)
rep('client', "(+1 fé/turno, exceto laico)", "(+1 fé/semana, exceto laico)", 'C8c-fe', strict=False)
rep_all('client', "+$10/turno", "+$10/semana", 'C8d-leis', 2)
rep('client', "' (conclui no turno ' + b.until + ')'", "' (pronto dia ' + b.untilDay + ')'", 'C8e-until', strict=False)
rep('client', "(+$30/turno)", "(+$30/semana)", 'C8f-space', strict=False)
rep('client', "8 turnos, rel. 40+", "8 semanas, rel. 40+", 'C8g-pacto', strict=False)
rep('client', "Proibir novas guerras (3 turnos)", "Proibir novas guerras (3 semanas)", 'C8h-un1', strict=False)
rep('client', "Proibir recrutamento (3 turnos)", "Proibir recrutamento (3 semanas)", 'C8h-un2', strict=False)
rep('client', "Os preços oscilam a cada turno.", "Os preços oscilam a cada semana.", 'C8i-mkt1', strict=False)
rep('client', "Suas províncias produzem recursos todo turno:", "Suas províncias produzem recursos todo dia:", 'C8i-mkt2', strict=False)
rep('client', "-$40/dia por nível, +segurança", "-$40/semana por nível, +segurança", 'C8j-orc1', strict=False)
rep_all('client', "+1 ❤️/turno no nível 2+", "+1 ❤️/semana no nível 2+", 'C8j-orc2', 2)
rep('client', "['👶 Nascimentos / turno'", "['👶 Nascimentos / semana'", 'C8k-b1', strict=False)
rep('client', "['🪦 Mortes / turno'", "['🪦 Mortes / semana'", 'C8k-b2', strict=False)
rep('client', "Edição do turno '+state.turn", "Edição do dia '+state.day", 'C8l-news', strict=False)
rep('client', "embaixadas custam $10/dia de manutenção", "embaixadas custam $10/semana de manutenção", 'C8m-dica', strict=False)
rep_re('client', r"^.*Sua produção por turno.*$",
"""  { const pd_up = m.upgrades || {}, pd_dep = m.depositos || [];
    const pd_um = k => 1 + 0.5*(pd_up[k]||0);
    let pdCom = 4+infra*3, pdMin = 2+Math.round(m.eco*0.8), pdEne = 3+infra*2, pdCon = 1, pdMad = 0, pdTer = 0, pdUra = 0, pdBor = 0, pdMny = 0;
    for (const k in bd){ const n = bd[k]||0; if (!n) continue; const o = BUILD_OUT[k]; if (!o) continue;
      if (o.money) pdMny += n*o.money*pd_um(k);
      else if (o.res==='comida') pdCom += n*o.qtd*pd_um(k); else if (o.res==='minerio') pdMin += n*o.qtd*pd_um(k);
      else if (o.res==='energia') pdEne += n*o.qtd*pd_um(k); else if (o.res==='concreto') pdCon += n*o.qtd*pd_um(k);
      else if (o.res==='madeira') pdMad += n*o.qtd*pd_um(k); else if (o.res==='terras_raras') pdTer += n*o.qtd*pd_um(k);
      else if (o.res==='uranio') pdUra += n*o.qtd*pd_um(k); else if (o.res==='borracha') pdBor += n*o.qtd*pd_um(k); }
    if (pd_dep.includes('petroleo')) pdEne += 2; if (pd_dep.includes('minerio')) pdMin += 2; if (pd_dep.includes('madeira')) pdMad += 3;
    if (pd_dep.includes('comida')) pdCom += 3; if (pd_dep.includes('terras_raras')) pdTer += 1; if (pd_dep.includes('uranio')) pdUra += 1;
    const pd_d1 = v => Math.round(v/7*10)/10;
    info.textContent='Sua produção por dia: 🌾+'+pd_d1(pdCom)+' · ⛏️+'+pd_d1(pdMin)+' · ⚡+'+pd_d1(pdEne)+' · 🧱+'+pd_d1(pdCon)+' · 🪵+'+pd_d1(pdMad)+' · ⚙️+'+pd_d1(pdTer)+' · ☢️+'+pd_d1(pdUra)+' · 🌳+'+pd_d1(pdBor)+' · 💰+$'+pd_d1(pdMny)+' — 4 prédios consomem 1⚡ (sem energia = apagão: produção pela metade)'; }""", 'C9-prodinfo')

print('---- avisos/falhas ----')
print('\n'.join(errs) if errs else '(nenhum)')
strict = [e for e in errs if e.startswith('STRICT')]
if strict:
    print(f"ABORTADO: {len(strict)} falhas strict")
    sys.exit(1)
for k, v in F.items():
    io.open(v, 'w', encoding='utf-8').write(T[k])
print('PATCH DIAS OK')
