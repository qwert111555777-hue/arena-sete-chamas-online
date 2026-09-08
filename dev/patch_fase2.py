# FASE 2: mapa quadrado s/ territorios, home/lobby objetivos, cor na fundacao,
# carregar save, ranking destaca meu pais s/ icones, obras lentas, widget construir.
import io, sys
F = {'server': '/home/user/presidente-online/server.js', 'client': '/home/user/presidente-online/public/index.html'}
T = {k: io.open(v, encoding='utf-8').read() for k, v in F.items()}
errs = []
def rep(which, old, new, tag, strict=True):
    n = T[which].count(old)
    if n != 1:
        errs.append(('STRICT-FAIL' if strict else 'warn') + f': {which} [{tag}] count={n}')
        return
    T[which] = T[which].replace(old, new)
def drop_line_with(which, marker, tag):
    global T
    ls = T[which].split('\n')
    idx = [i for i, l in enumerate(ls) if marker in l]
    if len(idx) != 1:
        errs.append(f'STRICT-FAIL: {which} [{tag}] linhas={len(idx)}'); return
    ls.pop(idx[0]); T[which] = '\n'.join(ls)
def swap_line_with(which, marker, newlines, tag):
    global T
    ls = T[which].split('\n')
    idx = [i for i, l in enumerate(ls) if marker in l]
    if len(idx) != 1:
        errs.append(f'STRICT-FAIL: {which} [{tag}] linhas={len(idx)}'); return
    ls[idx[0]] = newlines; T[which] = '\n'.join(ls)
def drop_block(which, start_marker, end_marker, tag):
    global T
    ls = T[which].split('\n')
    a = [i for i, l in enumerate(ls) if start_marker in l]
    if len(a) != 1:
        errs.append(f'STRICT-FAIL: {which} [{tag}] inicios={len(a)}'); return
    b = [i for i in range(a[0], len(ls)) if end_marker in ls[i]]
    if not b:
        errs.append(f'STRICT-FAIL: {which} [{tag}] sem fim'); return
    del ls[a[0]:b[0]+1]; T[which] = '\n'.join(ls)

# ---- servidor: cor na fundacao + obras lentas ----
rep('server', "      player.customName = sanitizeName(msg.name).slice(0, 24) || player.name;\n      player.customFlag = FLAGS_ALLOWED.includes(msg.flag) ? msg.flag : '🏳️';",
    "      player.customName = sanitizeName(msg.name).slice(0, 24) || player.name;\n      player.customFlag = FLAGS_ALLOWED.includes(msg.flag) ? msg.flag : '🏳️';\n      const cor = parseInt(msg.color, 10); if (Number.isInteger(cor) && cor >= 0 && cor < 60) player.color = cor;", 'S-cor')
rep('server', "const buildDays = cost => cost >= 800 ? 4 : cost >= 500 ? 3 : cost >= 300 ? 2 : 1;  // dias p/ concluir obra",
    "const buildDays = cost => Math.min(30, Math.max(4, 3 + Math.round(cost / 40)));  // dias p/ concluir obra (varia por construção)", 'S-dias')
rep('server', "p.builds.push({ kind: 'infra', prov: msg.prov, untilDay: room.day + 2 });",
    "p.builds.push({ kind: 'infra', prov: msg.prov, untilDay: room.day + 6 });", 'S-infra')
rep('server', "b.builds.push({ kind: 'infra', prov: b.provinces.indexOf(pr), untilDay: room.day + 2 });",
    "b.builds.push({ kind: 'infra', prov: b.provinces.indexOf(pr), untilDay: room.day + 6 });", 'S-botinfra')
rep('server', "p.builds.push({ kind: 'espacial', untilDay: room.day + 4 });",
    "p.builds.push({ kind: 'espacial', untilDay: room.day + 12 });", 'S-esp')
rep('server', "p.builds.push({ kind: 'nuclear', untilDay: room.day + 5 });",
    "p.builds.push({ kind: 'nuclear', untilDay: room.day + 18 });", 'S-nuc')

# ---- cliente: home objetiva + carregar ----
drop_block('client', '<div class="subtitle">', '</div>', 'C-homesub')
drop_block('client', '<div class="features">', '  </div>', 'C-homefeat')
rep('client', "<!-- ============ LOBBY ============ -->",
    """  <div class="card">
    <div class="label">📂 Continuar jogo salvo</div>
    <div style="color:var(--muted);font-size:12px;margin-bottom:8px;">Digite o código acima e carregue (mesmo navegador).</div>
    <button style="width:100%" id="btn-load">Carregar</button>
  </div>
</div>

<!-- ============ LOBBY ============ -->""", 'C-homeload')
rep('client', "$('inp-name').value = myName();",
    """$('btn-load').onclick = () => {
  const code = $('inp-code').value.trim().toUpperCase();
  if (code.length < 4) return toast('Digite o código de 4 letras do jogo salvo.', 'error');
  send({t:'tem_save', code});
};
$('inp-name').value = myName();""", 'C-loadbtn')
rep('client', "  if (m.t === 'day'){ applyDay(m); return; }",
    """  if (m.t === 'day'){ applyDay(m); return; }
  if (m.t === 'tem_save'){
    if (!m.tem){ toast('Nenhum jogo salvo com esse código.', 'error'); return; }
    let s = null; try{ s = JSON.parse(sessionStorage.getItem(SS_KEY) || 'null'); }catch(e){}
    if (s && s.code && s.token && String(s.code).toUpperCase() === String(m.code).toUpperCase()){ send({t:'reconnect', code:s.code, token:s.token}); toast('📂 Save encontrado! Voltando ao jogo...', 'info'); }
    else toast('Save encontrado, mas é de outra sessão. Só quem jogou pode continuar (mesmo navegador).', 'info');
    return;
  }""", 'C-temsave')

# ---- cliente: lobby sem velocidade + fundacao objetiva (nome/cor/simbolo) ----
rep('client', '    <button id="btn-speed" title="Velocidade do tempo: 1x, 2x, 3x ou 5x (só o anfitrião)">⏱️ Velocidade 1x</button>\n', "", 'C-speedhtml')
rep('client', "  const bs = $('btn-speed');\n  bs.classList.toggle('hidden', !isHost);\n  bs.textContent = `⏱️ Velocidade ${state.speedMul || 1}x`;\n", "", 'C-speedlob')
drop_line_with('client', "$('btn-speed').onclick", 'C-speedclick')
swap_line_with('client', 'FUNDA a sua própria nação',
    '  wrap.innerHTML = \'<div style="font-weight:800;font-size:14px;">Funde sua nação: nome, cor e símbolo.</div>\';', 'C-fundinfo')
rep('client', "  wrap.appendChild(fl);",
    """  const lbCor = document.createElement('div'); lbCor.style.cssText = 'font-weight:700;font-size:12px;color:var(--muted)'; lbCor.textContent = 'Cor da nação:'; wrap.appendChild(lbCor);
  const corRow = document.createElement('div'); corRow.style.cssText = 'display:flex; flex-wrap:wrap; gap:6px;';
  const selCor = (mine && mine.color != null) ? mine.color : 0;
  for (let ci = 0; ci < 12; ci++){
    const cb = document.createElement('button');
    cb.style.cssText = 'width:30px;height:30px;border-radius:6px;cursor:pointer;border:2px solid ' + (ci===selCor?'var(--gold2)':'#000') + ';background:hsl(' + ((ci*137)%360) + ',55%,' + (42+(ci%4)*8) + '%);';
    cb.title = 'Cor ' + (ci+1);
    cb.onclick = () => send({t:'fundar', name: inp.value || (mine?mine.name:''), flag: selFlag, color: ci});
    corRow.appendChild(cb);
  }
  wrap.appendChild(corRow);
  const lbSim = document.createElement('div'); lbSim.style.cssText = 'font-weight:700;font-size:12px;color:var(--muted)'; lbSim.textContent = 'Símbolo:'; wrap.appendChild(lbSim);
  wrap.appendChild(fl);""", 'C-cor')
rep('client', "  grid.appendChild(wrap);",
    """  if (!isHost){ const w = document.createElement('div'); w.style.cssText = 'color:var(--gold2); font-size:13px; font-weight:700;'; w.textContent = '⏳ Aguarde o dono da sala iniciar o jogo.'; wrap.appendChild(w); }
  grid.appendChild(wrap);""", 'C-wait')

# ---- cliente: mapa quadrado + sem territorios ----
rep('client', """    const isoM = isoOf(p.country);
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
    }""",
"""    const isoM = isoOf(p.country);
    if (isoM){
      const fim = document.createElementNS('http://www.w3.org/2000/svg','image');
      fim.setAttribute('x', '-13'); fim.setAttribute('y', '-9');
      fim.setAttribute('width', '26'); fim.setAttribute('height', '18');
      fim.setAttribute('preserveAspectRatio', 'none');
      fim.setAttribute('href', 'flags/' + isoM + '.svg');
      mk.appendChild(fim);
      const fb = document.createElementNS('http://www.w3.org/2000/svg','rect');
      fb.setAttribute('x', '-13'); fb.setAttribute('y', '-9');
      fb.setAttribute('width', '26'); fb.setAttribute('height', '18');
      fb.setAttribute('fill', 'none'); fb.setAttribute('stroke', ringColor); fb.setAttribute('stroke-width', '2');
      mk.appendChild(fb);
    } else {
      const csq = document.createElementNS('http://www.w3.org/2000/svg','rect');
      csq.setAttribute('x', '-13'); csq.setAttribute('y', '-9');
      csq.setAttribute('width', '26'); csq.setAttribute('height', '18');
      csq.setAttribute('fill', PALETTE[p.color % PALETTE.length]);
      csq.setAttribute('stroke', ringColor); csq.setAttribute('stroke-width', '2');
      mk.appendChild(csq);
      const fl = document.createElementNS('http://www.w3.org/2000/svg','text');
      fl.setAttribute('text-anchor','middle'); fl.setAttribute('dominant-baseline','central');
      fl.setAttribute('font-size', '13');
      fl.textContent = c.flag;
      mk.appendChild(fl);
    }""", 'C-square')
rep('client', """  state.players.forEach(pl => {
    const poly = terrFor(pl.country);
    if (!poly) return;
    const el = document.createElementNS('http://www.w3.org/2000/svg','polygon');
    el.setAttribute('points', poly.map(pt=>pt.join(',')).join(' '));
    const col = pl.alive ? PALETTE[pl.color % PALETTE.length] : '#3a4356';
    el.setAttribute('fill', col);
    el.setAttribute('fill-opacity', pl.alive ? '0.26' : '0.10');
    el.setAttribute('stroke', col);
    el.setAttribute('stroke-opacity', pl.alive ? '0.85' : '0.3');
    el.setAttribute('stroke-width', '1.6');
    gT.appendChild(el);
  });""",
    "  /* territórios removidos do mapa a pedido — só bandeiras definem os países */", 'C-terr')

# ---- cliente: ranking meu pais destacado, sem caveira/robo ----
rep('client', "    const div = document.createElement('div'); div.className='rank-row';",
    "    const div = document.createElement('div'); div.className='rank-row'; if (p.id===myId){ div.style.border='2px solid #ffd76a'; div.style.background='#2a2410'; }", 'C-rankme')
rep('client', ")+rNm+(p.bot?' 🤖':'')+(p.alive?'':' 💀');", ")+rNm;", 'C-rankicon')

# ---- cliente: widget construir ----
rep('client', "  #btn-pause,#btn-speed2,#btn-endturn,#btn-rank,#btn-news{",
    "  #btn-pause,#btn-speed2,#btn-endturn,#btn-rank,#btn-news,#btn-build{", 'C-buildcss')
rep('client', '    <button id="btn-speed2" title="Velocidade: 1x, 2x, 3x ou 5x (anfitrião)">⏱️ 1x</button>',
    '    <button id="btn-build" title="Construir (suas construções)">🏗️</button>\n    <button id="btn-speed2" title="Velocidade: 1x, 2x, 3x ou 5x (anfitrião)">⏱️ 1x</button>', 'C-buildhtml')
rep('client', "$('btn-speed2').onclick = () => {",
    """$('btn-build').onclick = () => {
  if (!state || state.phase !== 'game' || !me()) return;
  selectedId = myId; renderPanel(); renderMap();
  const secs = document.querySelectorAll('#np-extra .np-sub');
  for (const s of secs){ if (s.textContent.includes('Construções')){ s.scrollIntoView({behavior:'smooth', block:'start'}); break; } }
};
$('btn-speed2').onclick = () => {""", 'C-buildjs')

print('---- avisos/falhas ----')
print('\n'.join(errs) if errs else '(nenhum)')
strict = [e for e in errs if e.startswith('STRICT')]
if strict:
    print(f"ABORTADO: {len(strict)} falhas strict")
    sys.exit(1)
for k, v in F.items():
    io.open(v, 'w', encoding='utf-8').write(T[k])
print('PATCH FASE2 OK')
