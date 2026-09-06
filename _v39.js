const { chromium } = require('playwright');
const { io } = require('socket.io-client');

const BASE = 'https://arena-sete-chamas-online.onrender.com/';

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const errors = [];
  const notFound = [];
  const faceReqs = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('response', r => {
    const u = r.url();
    if (r.status() === 404) notFound.push(u);
    if (u.includes('/faces/')) faceReqs.push(u);
  });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.fill('#nameInput', 'TesteV39');
  await page.click('#createBtn');
  await page.waitForSelector('#readyBtn', { timeout: 15000 });

  // pega o codigo da sala
  await page.waitForFunction(() => /Sala\s+[A-Z0-9]{4}/.test(document.getElementById('roomTitle').textContent), { timeout: 10000 });
  const code = await page.evaluate(() => document.getElementById('roomTitle').textContent.match(/Sala\s+([A-Z0-9]{4})/)[1]);

  // 3 bots que entram, escolhem heroi, ficam prontos e mexem/atacam
  const heroKeys = ['geovanna', 'romulo', 'arthur'];
  const bots = [];
  for (let i = 0; i < 3; i++) {
    const b = io(BASE, { transports: ['websocket'] });
    await new Promise((res, rej) => {
      b.on('connect', res);
      setTimeout(res, 4000);
    });
    await new Promise(res => b.emit('joinRoom', { code, name: 'Bot' + i }, () => res()));
    await new Promise(res => b.emit('selectHero', heroKeys[i], () => res()));
    bots.push(b);
  }
  await new Promise(r => setTimeout(r, 800));

  // host seleciona heroi (albert, que os bots nao usam) e fica pronto
  await page.click('.hero-card[data-hero="albert"]');
  await page.waitForFunction(() => {
    const c = document.querySelector('.hero-card[data-hero="albert"]');
    return c && c.classList.contains('selected');
  }, { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 300));
  await page.click('#readyBtn');
  await new Promise(r => setTimeout(r, 300));
  const lobbyState = await page.evaluate(() => ({
    started: window.game ? 'game-existe' : 'sem-game',
    readyBtn: document.getElementById('readyBtn').textContent,
    startVisible: document.getElementById('startBtn').style.display,
    startDisabled: document.getElementById('startBtn').disabled
  }));
  console.log('LOBBY:', JSON.stringify(lobbyState));
  for (const b of bots) await new Promise(res => b.emit('setReady', true, () => res()));
  await new Promise(r => setTimeout(r, 700));
  // HOST inicia (o host e a pagina; bots nao podem iniciar)
  const startRes = await page.evaluate(() => new Promise(res => {
    window.socket && window.socket.emit ? res('sem-socket-global') : res();
  }));
  await page.click('#startBtn').catch(e => console.log('start click err', e.message));
  await new Promise(r => setTimeout(r, 500));
  console.log('apos start, game?', await page.evaluate(() => !!(window.game && window.game.players)));

  // bots jogam: andam em circulo, dash, special, ultimate
  const botInput = setInterval(() => {
    const t = Date.now() / 1000;
    bots.forEach((b, i) => {
      const a = t * 0.9 + i * 2.1;
      b.emit('input', { mx: Math.cos(a), my: Math.sin(a), aimX: null, aimY: null, attack: true, special: ((t | 0) % 5 === 0), ultimate: ((t | 0) % 7 === 0), dash: ((Math.floor(t * 2) + i) % 4 === 0) });
    });
  }, 90);

  await page.waitForTimeout(2000);

  // Amostrador continuo no browser: observa poções, brilho de atração e fx de coleta.
  await page.evaluate(() => new Promise(res => {
    window.__v39 = { maxGround: 0, sawAttractGlow: false, sawPickupFx: false, pickupFxKinds: {}, frames: 0 };
    const iv = setInterval(() => {
      const g = window.game; if (!g) return;
      window.__v39.frames++;
      const me = (g.players || []).find(p => p.id === window.meId);
      const ground = g.pickups || [];
      if (ground.length > window.__v39.maxGround) window.__v39.maxGround = ground.length;
      if (me && !me.dead) {
        for (const pk of ground) {
          if (Math.hypot(me.x - pk.x, me.y - pk.y) < 175) window.__v39.sawAttractGlow = true;
        }
      }
      for (const fx of (g.effects || [])) {
        if (fx.type === 'pickup') {
          window.__v39.sawPickupFx = true;
          window.__v39.pickupFxKinds[fx.kind] = (window.__v39.pickupFxKinds[fx.kind] || 0) + 1;
        }
      }
    }, 60);
    setTimeout(() => { clearInterval(iv); res(); }, 22000);
  }));
  // jogador humano fica parado perto do centro pra coletar drops
  await page.waitForTimeout(1000);

  const safe = async (fn, fb) => { try { return await page.evaluate(fn); } catch { return fb; } };
  // ler amostrador cedo (pode acabar a partida)
  let v = await safe(() => window.__v39 || {}, {});

  // mede FPS
  const fps = await safe(() => new Promise(res => {
    let n = 0; const t0 = performance.now();
    function tick() { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else res(Math.round(n * 1000 / (performance.now() - t0))); }
    requestAnimationFrame(tick);
  }), 0);

  const diag = await safe(() => ({
    version: (typeof ASSET_VERSION !== 'undefined') ? ASSET_VERSION : 'n/a',
    sparks: window.__sparksLen,
    shakeNow: window.__shakeNow,
    shakeUsed: !!window.__shakeUsed,
    addShakeType: typeof window.__addShake,
    hasPickupFx: (window.game?.effects || []).some(f => f.type === 'pickup'),
    pickupsOnGround: (window.game?.pickups || []).length,
    enemiesAlive: (window.game?.enemies || []).filter(e => e.hp > 0).length,
    stage: window.game ? window.game.stageIndex + 1 : 0,
    gameOver: window.game?.gameOver,
    victory: window.game?.victory,
    meDead: (window.game?.players || []).find(p => p.id === window.meId)?.dead
  }), { version: 'n/a' });
  v = await safe(() => window.__v39 || {}, v);

  await page.screenshot({ path: '/home/user/fotos/V39_batalha.png' }).catch(() => {});

  // testa addShake isolado
  const shakeTest = await safe(() => {
    const before = window.__shakeNow || 0;
    window.__addShake(15);
    return { before, afterCall: window.__shakeNow };
  }, { before: -1, afterCall: -1 });
  await page.waitForTimeout(400);
  const shakeDecayed = await safe(() => window.__shakeNow, -1);

  clearInterval(botInput);
  bots.forEach(b => b.close());
  await browser.close();

  console.log('=== V39 PRODUCAO ===');
  console.log('FPS:', fps, '| versão:', diag.version, '| fase:', diag.stage, '| gameOver:', diag.gameOver, '| vitória:', diag.victory);
  console.log('faíscas agora:', diag.sparks, '| addShake:', diag.addShakeType, '| shake usado em jogo:', diag.shakeUsed);
  console.log('>>> AMOSTRADOR v39 (22s): máx poções no chão =', v.maxGround, '| brilho atração visto =', v.sawAttractGlow, '| explosão coleta vista =', v.sawPickupFx, '| tipos =', JSON.stringify(v.pickupFxKinds), '| amostras =', v.frames);
  console.log('chefes vivos:', diag.enemiesAlive, '| eu morto:', diag.meDead);
  console.log('shake isolado: antes', shakeTest.before, '-> addShake(15) =', shakeTest.afterCall, '-> após 0.4s =', (typeof shakeDecayed === 'number' ? shakeDecayed.toFixed(2) : shakeDecayed));
  console.log('JS errors:', errors.length, errors.slice(0, 5).join(' | '));
  console.log('404:', notFound.length, notFound.slice(0, 5).join(' | '));
  console.log('reqs /faces/:', faceReqs.length);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
