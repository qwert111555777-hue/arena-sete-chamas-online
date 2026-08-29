const $ = (id) => document.getElementById(id);

const socket = io({ transports: ['websocket', 'polling'] });
let meId = null;
let heroes = {};
let difficulties = {};
let stages = [];
let lobby = null;
let game = null;
let openRooms = [];
let currentScreen = 'menuScreen';
let toastTimer = null;

const HERO_INFO = {
  albert: {
    icon: 'A', role: 'Tanque ofensivo', short: 'Competitivo, briga toda hora e fica mais forte quando apanha.',
    passive: 'Rivalidade aumenta o dano ao receber golpe.', attack: 'Soco curto que provoca inimigos próximos.', special: 'Briga Sem Fim: escudo e provoca chefes por alguns segundos.', ultimate: 'Eu Não Perco: explosão de dano em área.'
  },
  geovanna: {
    icon: 'G', role: 'Suporte/controle', short: 'Ciúmes, psicóloga e faz tudo para vencer.',
    passive: 'Cura melhor quando alguém está em perigo.', attack: 'Olhar de Ciúmes: projétil rosa que desacelera.', special: 'Sessão de Psicóloga: cura o aliado mais ferido.', ultimate: 'Ciúmes Estratégico: marca chefes e cura o time.'
  },
  romulo: {
    icon: 'R', role: 'Estrategista', short: 'Jogador nato, calculista e prevê movimentos.',
    passive: 'Escudos e lentidão nos chefes.', attack: 'Jogada Segura: projétil preciso.', special: 'Prever Movimento: escudo no time e lentidão nos chefes.', ultimate: 'Xeque-Mate Gamer: paralisa chefes e aumenta dano aliado.'
  },
  arthur: {
    icon: 'AR', role: 'Dano/controle', short: 'Ego alto e hacker de sistemas.',
    passive: 'Crítico carrega ego e aumenta dano.', attack: 'Código Cortante: disparo digital rápido.', special: 'Hack de Sistema: trava o chefe mais próximo.', ultimate: 'Admin Supremo: dano em todos os chefes.'
  },
  guilherme: {
    icon: 'GU', role: 'Buffer/aura', short: 'Beta que farma aura e usa estratégia de guerra.',
    passive: 'Acumula aura para um ultimate gigante.', attack: 'Corte Social: projétil que farma aura.', special: 'Estratégia de Guerra: escudo e bônus de dano para o time.', ultimate: 'Operação Aura Máxima: consome aura para dano em área.'
  }
};

const HERO_COLORS = {
  albert: ['#1e57d6', '#a0162c', '#ffe0bd'],
  geovanna: ['#ffd447', '#ff69b4', '#ffe6d2'],
  romulo: ['#858b95', '#3ea86d', '#9a5b3e'],
  arthur: ['#111111', '#18d4ff', '#8d4c35'],
  guilherme: ['#16a9ff', '#9df4ff', '#ffe2bd']
};

const ENEMY_INFO = {
  otavio: { icon: '🍔', attack: 'Promessa de Lanche', special: 'Gulodice', passive: 'cura quando está ferido', specialMax: 6.8 },
  anielle: { icon: '🗣️', attack: 'Língua Grande', special: 'Falsidade', passive: 'fofoca mágica reduz mobilidade', specialMax: 5.5 },
  mito: { icon: '💄', attack: 'Gloss Caótico', special: 'Testa Astral', passive: 'alta velocidade e dano de brilho', specialMax: 4.8 },
  lenda: { icon: '🏍️', attack: 'Barrigada Lendária', special: 'Bros 2009 Amarela', passive: 'investida de moto e capacete rosa', specialMax: 5.8 },
  vanjo: { icon: '📦', attack: 'Reposição Furiosa', special: 'Sumiço Rabugento', passive: 'some e volta causando dano', specialMax: 7.8 },
  napoleao: { icon: '🐶', attack: 'Mordida de Lanche', special: 'Forma Garfield', passive: 'Fome extrema: cresce e cura com comida', specialMax: 6.3 }
};

const STAGE_BACKGROUNDS = {
  stage1_lagoa_porta: 'assets/stages/stage1_lagoa_porta.jpg',
  stage2_feira_coruja: 'assets/stages/stage2_feira_coruja.jpg',
  stage3_tanque_missionarios: 'assets/stages/stage3_tanque_missionarios.jpg',
  stage4_recanto_serra: 'assets/stages/stage4_recanto_serra.jpg',
  stage5_riacho_curva: 'assets/stages/stage5_riacho_curva.jpg'
};


const SPRITE_FILES = {
  albert: 'assets/sprites_opt/albert.webp',
  geovanna: 'assets/sprites_opt/geovanna.webp',
  romulo: 'assets/sprites_opt/romulo.webp',
  arthur: 'assets/sprites_opt/arthur.webp',
  guilherme: 'assets/sprites_opt/guilherme.webp',
  otavio: 'assets/sprites_opt/otavio.webp',
  anielle: 'assets/sprites_opt/anielle.webp',
  mito: 'assets/sprites_opt/mito.webp',
  lenda: 'assets/sprites_opt/lenda.webp',
  vanjo: 'assets/sprites_opt/vanjo.webp',
  napoleao: 'assets/sprites_opt/napoleao.webp'
};

const SPRITE_HEIGHT = {
  albert: 185, geovanna: 168, romulo: 176, arthur: 172, guilherme: 172,
  otavio: 192, anielle: 182, mito: 230, lenda: 235, vanjo: 228, napoleao: 225
};

const assets = { arena: null, sprites: {}, stages: {} };
function loadAsset(src) {
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  return img;
}
function assetReady(img) { return !!img && img.complete && img.naturalWidth > 0; }
assets.arena = loadAsset('assets/stages/stage1_lagoa_porta.jpg');
Object.entries(SPRITE_FILES).forEach(([key, src]) => { assets.sprites[key] = loadAsset(src); });
Object.entries(STAGE_BACKGROUNDS).forEach(([key, src]) => { assets.stages[key] = loadAsset(src); });

const keys = {};
const inputState = { mx: 0, my: 0, aimX: null, aimY: null, attack: false, special: false, ultimate: false };
let mouseDownAttack = false;
let pointerAim = { x: 1000, y: 450 };
let aimManual = false;
let joystickVec = { x: 0, y: 0 };
let specialPulseUntil = 0;
let ultimatePulseUntil = 0;
let attackTouchDown = false;
let lastSocketInput = 0;

const canvas = $('gameCanvas');
const ctx = canvas.getContext('2d');
const device = {
  mobile: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1,
  memory: navigator.deviceMemory || 4,
  cores: navigator.hardwareConcurrency || 4
};
let qualitySetting = localStorage.getItem('arenaQuality') || 'auto';
let quality = 'balanced';
let dpr = 1;
let view = { scale: 1, ox: 0, oy: 0, w: 1600, h: 900, cssW: 1600, cssH: 900 };
let lastCanvasW = 0;
let lastCanvasH = 0;
let lastDrawTime = 0;
let lastHudUpdate = 0;
const spriteMotion = new Map();
let bgCache = { key: null, quality: null, canvas: null };

function resolveQuality() {
  if (qualitySetting === 'max') return 'max';
  if (qualitySetting === 'performance') return 'performance';
  if (qualitySetting === 'balanced') return 'balanced';
  // Auto prioriza não travar: celular fica desempenho, PC fica equilibrado.
  if (device.mobile || device.memory <= 3 || device.cores <= 4) return 'performance';
  return 'balanced';
}

function qualityDprCap() {
  if (quality === 'max') return device.mobile ? 1.15 : 1.35;
  if (quality === 'balanced') return 1;
  return 0.85;
}

function applyQuality() {
  quality = resolveQuality();
  document.body.classList.toggle('is-mobile', device.mobile);
  document.body.classList.toggle('quality-performance', quality === 'performance');
  const select = $('qualitySelect');
  if (select) select.value = qualitySetting;
  const badge = $('deviceBadge');
  if (badge) badge.textContent = device.mobile ? '📱 Modo celular detectado' : '💻 Modo PC detectado';
  resizeCanvas(true);
}

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2300);
}

function showScreen(id) {
  currentScreen = id;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  resizeCanvas();
}

function getPlayerName() {
  return $('nameInput').value.trim() || `Player${Math.floor(Math.random() * 99)}`;
}

function heroName(key) { return heroes[key]?.name || key; }
function diffLabel(key) { return difficulties[key]?.label || key; }
function myLobbyPlayer() { return lobby?.players?.find(p => p.id === meId) || null; }
function myGamePlayer() { return game?.players?.find(p => p.id === meId) || null; }
function isHost() { return lobby?.hostId === meId || game?.hostId === meId; }
function pct(a, b) { return Math.max(0, Math.min(100, Math.round((a / Math.max(1, b)) * 100))); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

socket.on('connect', () => {
  meId = socket.id;
});

socket.on('hello', (data) => {
  meId = data.id;
  heroes = data.heroes || {};
  difficulties = data.difficulties || {};
  stages = data.stages || [];
  renderDifficultyButtons();
  renderHeroCards();
  renderHowSkills();
  applyQuality();
  renderOpenRooms();
});

socket.on('lobby', (data) => {
  lobby = data;
  if (!game || !data.started) showScreen('lobbyScreen');
  renderLobby();
});

socket.on('state', (data) => {
  const oldStage = game?.stageIndex;
  game = data;
  if (currentScreen !== 'gameScreen') showScreen('gameScreen');
  const stageChanged = oldStage !== game.stageIndex;
  if (stageChanged) resizeCanvas(true);
  const t = performance.now();
  if (stageChanged || game.gameOver || t - lastHudUpdate > 220) {
    lastHudUpdate = t;
    updateGameHud();
  }
});

socket.on('roomList', (rooms) => {
  openRooms = Array.isArray(rooms) ? rooms : [];
  renderOpenRooms();
});

socket.on('disconnect', () => toast('Conexão perdida. Tentando reconectar...'));

$('createBtn').addEventListener('click', () => {
  socket.emit('createRoom', { name: getPlayerName() }, (res) => {
    if (!res?.ok) return toast(res?.error || 'Erro ao criar sala.');
    meId = res.playerId || socket.id;
    lobby = res.lobby;
    showScreen('lobbyScreen');
    renderLobby();
    toast(`Sala ${res.code} criada!`);
  });
});

$('joinBtn').addEventListener('click', () => joinTypedRoom());
$('roomInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') joinTypedRoom(); });
$('roomInput').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4); });

function joinTypedRoom() {
  const code = $('roomInput').value.trim().toUpperCase();
  joinRoomByCode(code);
}

function joinRoomByCode(code) {
  code = String(code || '').trim().toUpperCase();
  if (!code) return toast('Digite o código da sala.');
  socket.emit('joinRoom', { code, name: getPlayerName() }, (res) => {
    if (!res?.ok) return toast(res?.error || 'Não foi possível entrar.');
    meId = res.playerId || socket.id;
    lobby = res.lobby;
    showScreen('lobbyScreen');
    renderLobby();
    toast(`Entrou na sala ${res.code}!`);
  });
}

$('copyBtn').addEventListener('click', async () => {
  if (!lobby?.code) return;
  try {
    await navigator.clipboard.writeText(lobby.code);
    toast(`Código ${lobby.code} copiado!`);
  } catch {
    toast(`Código da sala: ${lobby.code}`);
  }
});

$('refreshRoomsBtn').addEventListener('click', () => {
  socket.emit('listRooms', (res) => {
    if (res?.ok) {
      openRooms = res.rooms || [];
      renderOpenRooms();
      toast('Lista de salas atualizada.');
    }
  });
});

function openHowTo() { $('howToModal').classList.remove('hidden'); }
function closeHowTo() { $('howToModal').classList.add('hidden'); }
$('howToBtn').addEventListener('click', openHowTo);
$('lobbyHowToBtn').addEventListener('click', openHowTo);
$('closeHowToBtn').addEventListener('click', closeHowTo);
$('howToModal').addEventListener('click', (e) => { if (e.target.id === 'howToModal') closeHowTo(); });

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
    setTimeout(() => resizeCanvas(true), 150);
  } catch {
    toast('Tela cheia não foi permitida pelo navegador.');
  }
}
['fullscreenMenuBtn', 'fullscreenLobbyBtn', 'fullscreenGameBtn'].forEach(id => {
  const btn = $(id);
  if (btn) btn.addEventListener('click', toggleFullscreen);
});
document.addEventListener('fullscreenchange', () => resizeCanvas(true));

$('qualitySelect').addEventListener('change', (e) => {
  qualitySetting = e.target.value;
  localStorage.setItem('arenaQuality', qualitySetting);
  applyQuality();
  toast(`Gráfico: ${e.target.options[e.target.selectedIndex].text}`);
});

$('leaveBtn').addEventListener('click', () => {
  location.href = location.pathname;
});

$('readyBtn').addEventListener('click', () => {
  const me = myLobbyPlayer();
  if (!me?.hero) return toast('Escolha um herói primeiro.');
  socket.emit('setReady', !me.ready, (res) => {
    if (!res?.ok) toast(res?.error || 'Não foi possível ficar pronto.');
  });
});

$('startBtn').addEventListener('click', () => {
  socket.emit('startGame', (res) => {
    if (!res?.ok) toast(res?.error || 'Não foi possível iniciar.');
  });
});

$('backLobbyBtn').addEventListener('click', () => {
  if (game?.gameOver && isHost()) {
    socket.emit('restartLobby', () => {});
  } else {
    toast(game?.gameOver ? 'Aguarde o host voltar ao lobby.' : 'A partida está rolando. Derrote os chefes!');
  }
});

$('playAgainBtn').addEventListener('click', () => {
  if (isHost()) socket.emit('restartLobby', () => {});
  else toast('Só o host pode voltar ao lobby.');
});

function renderHowSkills() {
  const box = $('howSkillsList');
  if (!box || !Object.keys(heroes).length) return;
  const heroCards = Object.keys(heroes).map(key => {
    const h = heroes[key];
    const info = HERO_INFO[key] || {};
    return `<div class="how-skill-card">
      <strong>${h.name} · ${h.title}</strong>
      <span><em>Ataque:</em> ${h.attackName} — ${info.attack || ''}</span><br>
      <span><em>Habilidade:</em> ${h.specialName} — ${Math.round(h.specialCd || 0)}s — ${info.special || ''}</span><br>
      <span><em>Ultimate:</em> ${h.ultimateName} — carrega causando dano — ${info.ultimate || ''}</span>
    </div>`;
  }).join('');
  const bossCards = Object.entries(ENEMY_INFO).map(([key, e]) => `<div class="how-skill-card">
    <strong>${e.icon} ${key[0].toUpperCase() + key.slice(1)}</strong>
    <span><em>Ataque:</em> ${e.attack}</span><br>
    <span><em>Especial:</em> ${e.special} — ${Math.round(e.specialMax || 0)}s</span><br>
    <span><em>Passiva:</em> ${e.passive}</span>
  </div>`).join('');
  box.innerHTML = heroCards + bossCards;
}

function renderOpenRooms() {
  const box = $('openRoomsList');
  if (!box) return;
  if (!openRooms.length) {
    box.innerHTML = '<div class="empty-rooms">Nenhuma sala criada ainda. Clique em <strong>Criar sala</strong> ou espere a sala dos seus amigos aparecer aqui.</div>';
    return;
  }
  box.innerHTML = openRooms.map(room => {
    const heroText = room.heroes?.length ? room.heroes.map(heroName).join(', ') : 'ninguém escolheu ainda';
    return `<div class="open-room">
      <div>
        <strong>Sala ${room.code}</strong>
        <small>Host: ${room.hostName || 'Host'} · ${room.players}/${room.maxPlayers} jogadores · ${diffLabel(room.difficulty)}</small>
        <div class="room-meta"><span>${room.ready || 0} prontos</span><span>Heróis: ${heroText}</span></div>
      </div>
      <button class="small-btn primary" data-join-room="${room.code}">Entrar</button>
    </div>`;
  }).join('');
  box.querySelectorAll('[data-join-room]').forEach(btn => {
    btn.addEventListener('click', () => joinRoomByCode(btn.dataset.joinRoom));
  });
}

function renderDifficultyButtons() {
  const box = $('difficultyButtons');
  if (!box || !Object.keys(difficulties).length) return;
  const text = {
    facil: 'Bem mais vida para heróis; chefes causam pouco dano.',
    medio: 'Luta longa, intensa e equilibrada.',
    dificil: 'Chefes com muita vida e dano maior.'
  };
  box.innerHTML = Object.values(difficulties).map(d => `
    <div class="diff-card" data-diff="${d.key}">
      <strong>${d.label}</strong>
      <span>${text[d.key] || ''}</span>
    </div>`).join('');
  box.querySelectorAll('.diff-card').forEach(card => {
    card.addEventListener('click', () => {
      if (!isHost()) return toast('Só o host muda a dificuldade.');
      socket.emit('setDifficulty', card.dataset.diff, () => {});
    });
  });
}

function renderHeroCards() {
  const box = $('heroCards');
  if (!box || !Object.keys(heroes).length) return;
  box.innerHTML = Object.keys(heroes).map(key => {
    const h = heroes[key];
    const info = HERO_INFO[key] || {};
    const colors = HERO_COLORS[key] || ['#777', '#aaa', '#fff'];
    return `
      <article class="hero-card" data-hero="${key}">
        <div class="hero-thumb-wrap" style="background:linear-gradient(135deg, ${colors[0]}55, ${colors[1]}55)">
          <img class="hero-thumb" src="${SPRITE_FILES[key]}" alt="${h.name}" loading="lazy" />
        </div>
        <h4>${h.name}</h4>
        <p><strong>${h.title}</strong></p>
        <p>${info.short || ''}</p>
        <div class="skills">
          <span>⚔️ ${h.attackName}</span>
          <span>✨ ${h.specialName}</span>
          <span>🔥 ${h.ultimateName}</span>
        </div>
        <div class="taken-by"></div>
      </article>`;
  }).join('');
  box.querySelectorAll('.hero-card').forEach(card => {
    card.addEventListener('click', () => {
      if (!lobby || lobby.started) return;
      if (card.classList.contains('taken') && !card.classList.contains('selected')) return toast('Esse herói já foi escolhido.');
      socket.emit('selectHero', card.dataset.hero, (res) => {
        if (!res?.ok) toast(res?.error || 'Não foi possível escolher.');
      });
    });
  });
}

function renderLobby() {
  if (!lobby) return;
  $('roomTitle').textContent = `Sala ${lobby.code}`;

  document.querySelectorAll('.diff-card').forEach(card => {
    card.classList.toggle('active', card.dataset.diff === lobby.difficulty);
    card.style.pointerEvents = isHost() && !lobby.started ? 'auto' : 'none';
  });

  const me = myLobbyPlayer();
  const list = $('playersList');
  list.innerHTML = lobby.players.map(p => {
    const hero = p.hero ? heroName(p.hero) : 'sem herói';
    const status = p.ready ? 'Pronto' : 'Aguardando';
    return `<div class="player-row ${p.ready ? 'ready' : ''}">
      <div>
        <strong>${p.host ? '👑 ' : ''}${p.name}</strong>
        <div class="status"><span class="hero-name">${hero}</span> · ${p.connected ? status : 'desconectado'}</div>
      </div>
      <div>${p.ready ? '✅' : '⏳'}</div>
    </div>`;
  }).join('') || '<p class="muted">Nenhum jogador ainda.</p>';

  $('readyBtn').textContent = me?.ready ? 'Cancelar pronto' : 'Estou pronto';
  $('readyBtn').disabled = !me?.hero || lobby.started;
  const connected = lobby.players.filter(p => p.connected);
  $('startBtn').style.display = isHost() ? 'block' : 'none';
  $('startBtn').disabled = lobby.started || !connected.length || connected.some(p => !p.hero || !p.ready);

  document.querySelectorAll('.hero-card').forEach(card => {
    const key = card.dataset.hero;
    const takenById = lobby.taken?.[key];
    const takenBy = lobby.players.find(p => p.id === takenById);
    const selected = me?.hero === key;
    card.classList.toggle('selected', selected);
    card.classList.toggle('taken', !!takenById && !selected);
    const takenDiv = card.querySelector('.taken-by');
    if (takenById && !selected) takenDiv.textContent = `Escolhido por ${takenBy?.name || 'alguém'}`;
    else if (selected) takenDiv.textContent = 'Selecionado por você';
    else takenDiv.textContent = '';
  });
}

function updateGameHud() {
  if (!game) return;
  $('hudRoom').textContent = game.code;
  $('hudDiff').textContent = `${diffLabel(game.difficulty)} · ${quality === 'max' ? 'gráfico máximo' : quality === 'performance' ? 'desempenho' : 'equilibrado'}`;
  $('hudStage').textContent = `${game.stageIndex + 1}/${game.stageCount} · ${game.stageTitle}`;
  $('hudSub').textContent = game.stageCleared ? `Próxima fase em ${Math.max(0, Math.ceil(game.stageTimer))}...` : `${game.stageVenue || ''} · ${game.stageSubtitle}`;

  const team = $('teamHud');
  team.innerHTML = game.players.map(p => {
    const h = heroes[p.hero] || {};
    const colors = HERO_COLORS[p.hero] || ['#777', '#aaa'];
    return `<div class="team-row">
      <div class="team-face" style="background:${colors[0]}">${(HERO_INFO[p.hero]?.icon || h.name?.[0] || '?')}</div>
      <div class="team-bars">
        <strong>${p.name}${p.id === meId ? ' (você)' : ''}</strong>
        <div class="bar"><span class="hpbar" style="width:${pct(p.hp, p.maxHp)}%"></span></div>
        <div class="bar"><span class="ultbar" style="width:${p.ultimate}%"></span></div>
      </div>
      <span>${p.dead ? Math.ceil(p.respawnTimer) + 's' : Math.round(p.hp)}</span>
    </div>`;
  }).join('');

  renderAbilityHud();
  drawCooldownOverlay();

  const boss = $('bossHud');
  boss.innerHTML = game.enemies.filter(e => e.hp > 0).map(e => {
    const info = ENEMY_INFO[e.type] || { icon: '👾', attack: 'Ataque', special: 'Especial', passive: '', specialMax: 6 };
    const specialCd = e.type === 'vanjo' ? e.vanishCd : e.type === 'napoleao' ? Math.min(e.specialCd || 0, e.foodTimer || 99) : e.specialCd;
    const specialPct = 100 - pct(Math.max(0, specialCd || 0), info.specialMax || 6);
    return `<div class="boss-line">
      <div class="boss-name"><span>${info.icon} ${e.name}</span><span>${Math.round(e.hp)}/${e.maxHp}</span></div>
      <div class="bar"><span class="hpbar" style="width:${pct(e.hp, e.maxHp)}%; background:linear-gradient(90deg,#ff6262,#ffcc5c)"></span></div>
      <div class="boss-skill"><b>${info.special}</b><span>${specialCd > .1 ? Math.ceil(specialCd) + 's' : 'pronto'}</span></div>
      <div class="bar"><span class="ultbar" style="width:${Math.max(0, Math.min(100, specialPct))}%"></span></div>
      <small>${info.passive}</small>
    </div>`;
  }).join('') || '<strong>Fase vencida!</strong>';

  $('messagesHud').innerHTML = (game.messages || []).slice(-4).reverse().map(m => `<div class="msg ${m.kind}">${m.text}</div>`).join('');

  const overlay = $('endOverlay');
  if (game.gameOver) {
    overlay.classList.remove('hidden');
    $('endTitle').textContent = game.victory ? 'Vitória!' : 'Derrota...';
    $('endText').textContent = game.victory
      ? 'Vocês derrotaram Napoleão e salvaram a arena.'
      : 'Todos os heróis caíram. Tentem de novo com outra estratégia.';
    $('playAgainBtn').textContent = isHost() ? 'Voltar ao lobby' : 'Aguardando host';
  } else {
    overlay.classList.add('hidden');
  }
}

function renderAbilityHud() {
  const box = $('abilityHud');
  const me = myGamePlayer();
  if (!box || !me) return;
  const h = heroes[me.hero] || {};
  const specialReady = me.specialCd <= .05 && !me.dead;
  const ultimateReady = me.ultimate >= 100 && !me.dead;
  const attackReady = me.attackCd <= .05 && !me.dead;
  const extra = me.hero === 'guilherme' ? `Aura ${Math.round(me.aura || 0)}%` : me.hero === 'albert' ? `Rivalidade ${me.rivalry || 0}` : me.damageBoostTimer > 0 ? 'Bônus de dano' : '';
  box.innerHTML = `<div class="ability-title"><strong>${h.name || 'Herói'} · ${h.title || ''}</strong><span>${me.dead ? 'Revive em ' + Math.ceil(me.respawnTimer) + 's' : extra}</span></div>
    <div class="ability-grid">
      <div class="ability-card ${attackReady ? 'ready' : 'wait'}"><b>${h.attackName || 'Ataque'}</b><span>${attackReady ? 'pronto' : Math.ceil(me.attackCd) + 's'} · clique/espaço</span></div>
      <div class="ability-card ${specialReady ? 'ready' : 'wait'}"><b>${h.specialName || 'Habilidade'}</b><span>${specialReady ? 'pronto' : Math.ceil(me.specialCd) + 's'} · Q</span></div>
      <div class="ability-card ${ultimateReady ? 'ready' : 'wait'}"><b>${h.ultimateName || 'Ultimate'}</b><span>${ultimateReady ? 'pronto' : Math.round(me.ultimate || 0) + '%'} · E</span></div>
    </div>`;
}


function enemyIcon(type) {
  return ENEMY_INFO[type]?.icon || '👾';
}

function resizeCanvas(force = false) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, Math.round(rect.width || innerWidth));
  const cssH = Math.max(1, Math.round(rect.height || innerHeight));
  const cap = qualityDprCap();
  const nextDpr = Math.max(0.85, Math.min(window.devicePixelRatio || 1, cap));
  const nextW = Math.floor(cssW * nextDpr);
  const nextH = Math.floor(cssH * nextDpr);
  const world = game?.world || { w: 1600, h: 900 };
  const scale = Math.min(cssW / world.w, cssH / world.h);
  view = { scale, ox: (cssW - world.w * scale) / 2, oy: (cssH - world.h * scale) / 2, w: world.w, h: world.h, cssW, cssH };
  if (!force && canvas.width === nextW && canvas.height === nextH && lastCanvasW === cssW && lastCanvasH === cssH && dpr === nextDpr) return;
  dpr = nextDpr;
  lastCanvasW = cssW; lastCanvasH = cssH;
  canvas.width = nextW;
  canvas.height = nextH;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
}
window.addEventListener('resize', () => resizeCanvas(true));
window.addEventListener('orientationchange', () => setTimeout(() => resizeCanvas(true), 250));

function screenToWorld(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left - view.ox) / view.scale;
  const y = (clientY - rect.top - view.oy) / view.scale;
  return { x: Math.max(0, Math.min(view.w, x)), y: Math.max(0, Math.min(view.h, y)) };
}

canvas.addEventListener('mousemove', (e) => { pointerAim = screenToWorld(e.clientX, e.clientY); aimManual = true; });
canvas.addEventListener('mousedown', (e) => {
  pointerAim = screenToWorld(e.clientX, e.clientY);
  aimManual = true;
  if (e.button === 0) mouseDownAttack = true;
});
window.addEventListener('mouseup', () => { mouseDownAttack = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (currentScreen === 'gameScreen' && [' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

function setupActionButton(id, action) {
  const btn = $(id);
  const down = (e) => {
    e.preventDefault();
    if (action === 'attack') attackTouchDown = true;
    if (action === 'special') specialPulseUntil = performance.now() + 180;
    if (action === 'ultimate') ultimatePulseUntil = performance.now() + 180;
  };
  const up = (e) => {
    e.preventDefault();
    if (action === 'attack') attackTouchDown = false;
  };
  btn.addEventListener('pointerdown', down);
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointercancel', up);
  btn.addEventListener('pointerleave', up);
}
setupActionButton('attackTouch', 'attack');
setupActionButton('specialTouch', 'special');
setupActionButton('ultimateTouch', 'ultimate');

const joy = $('joystick');
const stick = $('stick');
let joyPointer = null;
function updateJoy(e) {
  const rect = joy.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = e.clientX - cx;
  let dy = e.clientY - cy;
  const max = rect.width * 0.34;
  const len = Math.hypot(dx, dy);
  if (len > max) { dx = dx / len * max; dy = dy / len * max; }
  joystickVec = { x: dx / max, y: dy / max };
  stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
joy.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  joyPointer = e.pointerId;
  joy.setPointerCapture(e.pointerId);
  updateJoy(e);
});
joy.addEventListener('pointermove', (e) => { if (e.pointerId === joyPointer) updateJoy(e); });
function resetJoy(e) {
  if (e && e.pointerId !== joyPointer) return;
  joyPointer = null;
  joystickVec = { x: 0, y: 0 };
  stick.style.transform = 'translate(-50%, -50%)';
}
joy.addEventListener('pointerup', resetJoy);
joy.addEventListener('pointercancel', resetJoy);

function composeInput() {
  let mx = 0, my = 0;
  if (keys.a || keys.arrowleft) mx -= 1;
  if (keys.d || keys.arrowright) mx += 1;
  if (keys.w || keys.arrowup) my -= 1;
  if (keys.s || keys.arrowdown) my += 1;
  if (Math.abs(joystickVec.x) > 0.05 || Math.abs(joystickVec.y) > 0.05) {
    mx = joystickVec.x;
    my = joystickVec.y;
  }
  const len = Math.hypot(mx, my);
  if (len > 1) { mx /= len; my /= len; }
  inputState.mx = mx;
  inputState.my = my;
  inputState.aimX = aimManual ? pointerAim.x : null;
  inputState.aimY = aimManual ? pointerAim.y : null;
  inputState.attack = mouseDownAttack || attackTouchDown || keys[' '] || keys.enter;
  const t = performance.now();
  inputState.special = keys.q || t < specialPulseUntil;
  inputState.ultimate = keys.e || t < ultimatePulseUntil;
}

setInterval(() => {
  if (!game || currentScreen !== 'gameScreen' || !socket.connected) return;
  composeInput();
  socket.emit('input', inputState);
  lastSocketInput = performance.now();
}, device.mobile ? 75 : 60);

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawImageCover(img, x, y, w, h) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawArena() {
  const bgKey = game?.stageBackground;
  const bg = bgKey ? assets.stages[bgKey] : null;
  const img = assetReady(bg) ? bg : assets.arena;
  if (assetReady(img)) {
    drawImageCover(img, 0, 0, view.w, view.h);
    ctx.save();
    const pulse = quality === 'performance' ? .12 : .16 + Math.sin(performance.now() / 700) * .025;
    ctx.fillStyle = `rgba(16, 8, 24, ${pulse})`;
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.restore();
  } else {
    const grd = ctx.createLinearGradient(0, 0, view.w, view.h);
    grd.addColorStop(0, '#5b2f5f');
    grd.addColorStop(.45, '#2c5a48');
    grd.addColorStop(1, '#26193e');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, view.w, view.h);
  }

  ctx.save();
  const rg = ctx.createRadialGradient(view.w / 2, view.h / 2, 80, view.w / 2, view.h / 2, view.w * .62);
  rg.addColorStop(0, 'rgba(255, 226, 128, .09)');
  rg.addColorStop(.58, 'rgba(90, 43, 116, .035)');
  rg.addColorStop(1, 'rgba(0, 0, 0, .32)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, view.w, view.h);

  ctx.strokeStyle = '#ffe08a88';
  ctx.lineWidth = quality === 'performance' ? 5 : 8;
  roundRect(ctx, 18, 18, view.w - 36, view.h - 36, 28); ctx.stroke();

  if (quality !== 'performance') {
    const runePulse = .22 + Math.sin(performance.now() / 420) * .08;
    ctx.globalAlpha = runePulse;
    ctx.strokeStyle = game?.stageIndex === 1 ? '#ffb45f' : game?.stageIndex === 4 ? '#ffd166' : '#ff77ea';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(view.w / 2, view.h / 2, 132, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function drawBar(x, y, w, h, value, max, color, back = '#0008') {
  ctx.fillStyle = back;
  roundRect(ctx, x, y, w, h, h/2); ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w * Math.max(0, Math.min(1, value / Math.max(1, max))), h, h/2); ctx.fill();
  ctx.strokeStyle = '#fff5'; ctx.lineWidth = 1.5; roundRect(ctx, x, y, w, h, h/2); ctx.stroke();
}

function drawNameplate(entity, x, y, w = 82) {
  ctx.save();
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#0009';
  ctx.strokeText(entity.name, x, y);
  ctx.fillStyle = '#fff6dd';
  ctx.fillText(entity.name, x, y);
  drawBar(x - w/2, y + 8, w, 8, entity.hp, entity.maxHp, '#45ed82');
  if (entity.shield > 0) drawBar(x - w/2, y + 19, w, 5, entity.shield, 60, '#77e6ff', '#0005');
  ctx.restore();
}

function drawCurlyHair(x, y, color, scale = 1, amount = 9, spread = 18) {
  ctx.fillStyle = color;
  for (let i = 0; i < amount; i++) {
    const a = (i / amount) * Math.PI * 2;
    const rx = Math.cos(a) * spread * scale;
    const ry = Math.sin(a) * spread * .55 * scale;
    ctx.beginPath(); ctx.arc(x + rx, y + ry, 8 * scale, 0, Math.PI * 2); ctx.fill();
  }
}

function getMotion(id, targetX, targetY) {
  const t = performance.now();
  let m = spriteMotion.get(id);
  if (!m) {
    m = { x: targetX, y: targetY, lastTargetX: targetX, lastTargetY: targetY, lastT: t, speed: 0, phase: Math.random() * 6.28 };
    spriteMotion.set(id, m);
  }
  const dt = clamp((t - m.lastT) / 1000, 0.001, 0.08);
  const targetStep = Math.hypot(targetX - m.lastTargetX, targetY - m.lastTargetY);
  const instantSpeed = targetStep / dt;
  m.speed = m.speed * 0.78 + instantSpeed * 0.22;
  const distToTarget = Math.hypot(targetX - m.x, targetY - m.y);
  if (distToTarget > 240) {
    m.x = targetX;
    m.y = targetY;
  } else {
    const follow = quality === 'performance' ? 0.42 : 0.30;
    m.x += (targetX - m.x) * follow;
    m.y += (targetY - m.y) * follow;
  }
  const moving = m.speed > 22 || distToTarget > 4;
  m.phase += (moving ? 8.5 : 1.7) * dt;
  m.lastTargetX = targetX;
  m.lastTargetY = targetY;
  m.lastT = t;
  m.moving = moving;
  return m;
}

function drawStepDust(x, y, phase, color = '#f2d7a7') {
  if (quality === 'performance') return;
  const a = Math.abs(Math.sin(phase));
  if (a < .72) return;
  ctx.save();
  ctx.globalAlpha = .18 * a;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x - 18, y + 2, 13 * a, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 18, y + 2, 13 * a, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function spriteDimensions(key, height) {
  const img = assets.sprites[key];
  if (!assetReady(img)) return { img: null, w: height * .55, h: height };
  const ratio = img.naturalWidth / Math.max(1, img.naturalHeight);
  return { img, w: height * ratio, h: height };
}

function drawSpriteImage(key, x, footY, height, facing = 1, alpha = 1, glow = null, motion = null, action = {}) {
  const { img, w, h } = spriteDimensions(key, height);
  const moving = !!motion?.moving;
  const phase = motion?.phase || performance.now() / 220;
  const idleBob = quality === 'performance' ? 0 : Math.sin(phase) * 1.35;
  const walkBob = quality === 'performance' ? 0 : Math.abs(Math.sin(phase * 1.65)) * (moving ? 8 : 0);
  const bob = moving ? walkBob : idleBob;
  const tilt = quality === 'performance' ? 0 : (moving ? Math.sin(phase * 1.65) * 0.055 * facing : Math.sin(phase * .55) * 0.012);
  const stretch = quality === 'performance' ? 0 : (moving ? Math.abs(Math.cos(phase * 1.65)) * 0.035 : Math.sin(phase * .8) * 0.006);
  const sx = facing * (1 + (moving ? Math.sin(phase * 1.65) * 0.025 : 0));
  const sy = 1 + stretch;
  const side = quality === 'performance' ? 0 : (moving ? Math.sin(phase * 1.65) * 2.2 : 0);
  const attackPulse = action.attack ? 1 : 0;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (glow && quality !== 'performance') { ctx.shadowColor = glow; ctx.shadowBlur = quality === 'max' ? 18 : 10; }
  if (assetReady(img)) {
    ctx.translate(x + side + (attackPulse ? facing * 7 : 0), footY - h / 2 + bob);
    ctx.rotate(tilt);
    ctx.scale(sx * (attackPulse ? 1.035 : 1), sy * (attackPulse ? .98 : 1));
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = glow || '#fff';
    ctx.beginPath(); ctx.arc(x, footY - h / 2, h * .22, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  return { w, h, top: footY - h + bob - Math.abs(tilt) * 20, bottom: footY + bob };
}

function drawPlayer(p) {
  const colors = HERO_COLORS[p.hero] || ['#777', '#aaa', '#ffd8bd'];
  const motion = getMotion('p-' + p.id, p.x, p.y);
  const x = motion.x, y = motion.y;
  const alpha = p.dead ? .35 : 1;
  const height = SPRITE_HEIGHT[p.hero] || 146;
  const footY = y + 48;
  const facing = (p.dirX || 1) < -0.12 ? -1 : 1;

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(0,0,0,.34)';
  ctx.beginPath(); ctx.ellipse(x, footY + 2, motion.moving ? 46 : 40, motion.moving ? 16 : 14, 0, 0, Math.PI * 2); ctx.fill();
  drawStepDust(x, footY + 2, motion.phase);

  if (p.hero === 'guilherme' || p.aura > 20 || p.ultimate >= 100) {
    ctx.save();
    ctx.globalAlpha = .23 + Math.sin(performance.now()/170) * .06;
    ctx.strokeStyle = p.hero === 'guilherme' ? '#8ff7ff' : '#ffd166';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(x, y, 46 + Math.sin(performance.now()/220)*5, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }
  if (p.damageBoostTimer > 0) {
    ctx.save();
    ctx.globalAlpha = .22;
    ctx.strokeStyle = '#ffe45d'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, y + 2, 55, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  if (p.shield > 0) {
    ctx.save();
    ctx.globalAlpha = .24;
    ctx.fillStyle = '#7bd3ff';
    ctx.beginPath(); ctx.arc(x, y + 2, 54, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  const glow = p.ultimate >= 100 ? '#ffd166' : (p.hero === 'guilherme' ? '#7bd3ff' : null);
  const drawn = drawSpriteImage(p.hero, x, footY, height, facing, 1, glow, motion, { attack: p.attackCd > 0.32 });

  if (p.dead) {
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = '#0009';
    const text = `revive ${Math.ceil(p.respawnTimer)}s`;
    ctx.strokeText(text, x, drawn.top - 18); ctx.fillText(text, x, drawn.top - 18);
  }

  drawNameplate({ name: p.name, hp: p.hp, maxHp: p.maxHp, shield: p.shield }, x, drawn.top - 30, 96);
  if (p.id === meId) {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, y + 5, 58, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#ffd166'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = '#0009';
    ctx.strokeText('VOCÊ', x, footY + 34); ctx.fillText('VOCÊ', x, footY + 34);
  }
  ctx.restore();
}

function drawEnemy(e) {
  if (e.hp <= 0) return;
  if (e.invisible) {
    ctx.save(); ctx.globalAlpha = .22; drawSmoke(e.x, e.y, e.radius + 26); ctx.restore();
    return;
  }
  const motion = getMotion('e-' + e.id, e.x, e.y);
  const x = motion.x, y = motion.y;
  const grow = e.type === 'napoleao' ? (e.grow || 1) : 1;
  const height = (SPRITE_HEIGHT[e.type] || 160) * grow;
  const footY = y + e.radius + 34 * grow;
  const facing = x > view.w / 2 ? -1 : 1;
  const glow = e.mark > 0 ? '#ff73cc' : (e.type === 'napoleao' ? '#ffd166' : e.color);

  ctx.save();
  if (e.hitFlash > 0) ctx.globalAlpha = .68;

  ctx.fillStyle = 'rgba(0,0,0,.38)';
  ctx.beginPath(); ctx.ellipse(x, footY + 4, Math.max(42, e.radius * 1.4) * grow, Math.max(13, e.radius * .36) * grow, 0, 0, Math.PI*2); ctx.fill();
  drawStepDust(x, footY + 4, motion.phase, e.type === 'lenda' ? '#ffb032' : '#d7c7b0');

  if (e.stun > 0) {
    ctx.save();
    ctx.globalAlpha = .8;
    ctx.strokeStyle = '#7bd3ff'; ctx.lineWidth = 5;
    ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.arc(x, y - e.radius * .45, e.radius + 22, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  if (e.slow > 0) {
    ctx.save();
    ctx.globalAlpha = .25;
    ctx.fillStyle = '#7bd3ff';
    ctx.beginPath(); ctx.arc(x, y + 8, e.radius + 46, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  const drawn = drawSpriteImage(e.type, x, footY, height, facing, 1, glow, motion, { attack: e.attackCd > 0.85 || e.specialCd > 4.5 });

  if (e.stun > 0) drawStatusText(x, drawn.top - 44, 'STUN', '#7bd3ff');
  if (e.mark > 0) drawStatusText(x, drawn.top - 26, 'MARCADO', '#ff78cc');
  drawNameplate({ name: e.name, hp: e.hp, maxHp: e.maxHp }, x, drawn.top - 18, Math.max(100, e.radius * 2.7));
  ctx.restore();
}

function drawStatusText(x, y, text, color) {
  ctx.save(); ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeText(text, x, y); ctx.fillStyle = color; ctx.fillText(text, x, y); ctx.restore();
}

function drawSmoke(x, y, r) {
  ctx.fillStyle = '#c9c6d2';
  for (let i = 0; i < 8; i++) {
    const a = i/8*Math.PI*2 + performance.now()/600;
    ctx.beginPath(); ctx.arc(x + Math.cos(a)*r*.45, y + Math.sin(a)*r*.22, r*.24, 0, Math.PI*2); ctx.fill();
  }
}

function drawOtavio(e, x, y) {
  ctx.fillStyle = '#7b2638'; roundRect(ctx, x-28, y-24, 56, 58, 15); ctx.fill();
  ctx.fillStyle = '#8d563d'; ctx.beginPath(); ctx.arc(x, y-46, 25, 0, Math.PI*2); ctx.fill();
  drawCurlyHair(x-3, y-65, '#2a170f', .8, 8, 20);
  ctx.fillStyle = '#22140f'; ctx.beginPath(); ctx.ellipse(x, y-38, 13, 9, 0, 0, Math.PI*2); ctx.fill();
  evilEyes(x, y-50); evilSmile(x, y-38, true);
  ctx.fillStyle = '#f4c15d'; ctx.beginPath(); ctx.arc(x+42, y-38, 14, 0, Math.PI*2); ctx.fill();
}

function drawAnielle(e, x, y) {
  ctx.fillStyle = '#267a4a'; roundRect(ctx, x-22, y-22, 44, 54, 13); ctx.fill();
  ctx.fillStyle = '#9a5b3e'; ctx.beginPath(); ctx.ellipse(x, y-49, 21, 25, 0, 0, Math.PI*2); ctx.fill();
  drawCurlyHair(x, y-53, '#2b1c16', .8, 10, 23);
  evilEyes(x, y-52); evilSmile(x, y-43, false);
  ctx.strokeStyle = '#ff6fa9'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x+7,y-41); ctx.quadraticCurveTo(x+22,y-36,x+16,y-27); ctx.stroke();
}

function drawMito(e, x, y) {
  ctx.save();
  ctx.shadowColor = '#df7fff'; ctx.shadowBlur = 20;
  ctx.fillStyle = '#34204d'; roundRect(ctx, x-22, y-16, 44, 70, 18); ctx.fill();
  ctx.fillStyle = '#c471ff'; ctx.beginPath(); ctx.ellipse(x, y-72, 30, 46, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#2d1745'; ctx.beginPath(); ctx.ellipse(x-22, y-68, 9, 31, 0, 0, Math.PI*2); ctx.ellipse(x+22, y-68, 9, 31, 0, 0, Math.PI*2); ctx.fill();
  evilEyes(x, y-67, '#bbffff'); evilSmile(x, y-54, false, '#180a20');
  ctx.strokeStyle = '#ff77ea'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y-8, 50 + Math.sin(performance.now()/120)*4, 0, Math.PI*1.5); ctx.stroke();
  ctx.restore();
}

function drawLenda(e, x, y) {
  ctx.fillStyle = '#a45520'; ctx.beginPath(); ctx.ellipse(x, y+5, 44, 58, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#ffb032'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, y+5, 48, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = '#a2623e'; ctx.beginPath(); ctx.arc(x, y-58, 28, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#1c100c'; ctx.beginPath(); ctx.ellipse(x, y-47, 19, 15, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#21140e'; ctx.beginPath(); ctx.ellipse(x-20, y-58, 9, 18, .2, 0, Math.PI*2); ctx.fill();
  evilEyes(x, y-63); evilSmile(x, y-48, true);
  ctx.save(); ctx.translate(x+58, y-18); ctx.rotate(.12); ctx.fillStyle = '#ffde38'; roundRect(ctx, -25, -18, 50, 36, 12); ctx.fill(); ctx.fillStyle = '#ff68bd'; ctx.beginPath(); ctx.arc(0, -22, 16, 0, Math.PI*2); ctx.fill(); ctx.restore();
}

function drawVanjo(e, x, y) {
  ctx.fillStyle = '#ef3f3f'; ctx.beginPath(); ctx.ellipse(x, y+5, 43, 62, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f0c6ad'; ctx.beginPath(); ctx.arc(x, y-62, 28, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#2d241b'; roundRect(ctx, x-18, y-90, 36, 15, 5); ctx.fill();
  angryEyes(x, y-66); ctx.strokeStyle = '#5d1a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x-10,y-49); ctx.lineTo(x+10,y-49); ctx.stroke();
  ctx.fillStyle = '#fff'; roundRect(ctx, x-18, y-20, 36, 14, 4); ctx.fill(); ctx.fillStyle = '#c21'; ctx.font = 'bold 9px system-ui'; ctx.textAlign = 'center'; ctx.fillText('MERC', x, y-10);
}

function drawNapoleao(e, x, y) {
  const s = e.grow || 1;
  ctx.save();
  ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 16;
  ctx.fillStyle = '#b86d3c'; ctx.beginPath(); ctx.ellipse(x, y+8, 48*s, 38*s, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff2d8'; ctx.beginPath(); ctx.ellipse(x, y+15, 31*s, 23*s, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#b86d3c'; ctx.beginPath(); ctx.ellipse(x, y-35, 34*s, 30*s, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#5a2f20'; ctx.beginPath(); ctx.ellipse(x-30*s, y-29, 12*s, 32*s, -.2, 0, Math.PI*2); ctx.ellipse(x+30*s, y-29, 12*s, 32*s, .2, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff2d8'; ctx.beginPath(); ctx.ellipse(x, y-27, 22*s, 16*s, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#1b1110'; ctx.beginPath(); ctx.ellipse(x, y-27, 7*s, 5*s, 0, 0, Math.PI*2); ctx.fill();
  sadEyes(x, y-42, s); sadMouth(x, y-18, s);
  ctx.fillStyle = '#ffd84f'; ctx.beginPath(); ctx.moveTo(x-17*s, y-68); ctx.lineTo(x-8*s, y-88); ctx.lineTo(x, y-69); ctx.lineTo(x+9*s, y-88); ctx.lineTo(x+18*s, y-68); ctx.closePath(); ctx.fill();
  const foods = ['🍔','🍗','🧀','🍩'];
  ctx.font = `${18*s}px system-ui`;
  for (let i=0;i<4;i++) {
    const a = performance.now()/650 + i*Math.PI/2;
    ctx.fillText(foods[i], x + Math.cos(a)*72*s, y-16 + Math.sin(a)*45*s);
  }
  ctx.restore();
}

function evilEyes(x, y, color = '#111') {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x-8, y, 4, 3, -.2, 0, Math.PI*2); ctx.ellipse(x+8, y, 4, 3, .2, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x-14,y-5); ctx.lineTo(x-3,y-2); ctx.moveTo(x+14,y-5); ctx.lineTo(x+3,y-2); ctx.stroke();
}
function angryEyes(x, y) {
  ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x-16,y-7); ctx.lineTo(x-4,y-3); ctx.moveTo(x+16,y-7); ctx.lineTo(x+4,y-3); ctx.stroke();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x-8,y,2.5,0,Math.PI*2); ctx.arc(x+8,y,2.5,0,Math.PI*2); ctx.fill();
}
function sadEyes(x, y, s = 1) {
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(x-9*s,y,3*s,5*s,0,0,Math.PI*2); ctx.ellipse(x+9*s,y,3*s,5*s,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 2*s; ctx.beginPath(); ctx.arc(x-9*s,y-4*s,8*s,Math.PI*1.1,Math.PI*1.8); ctx.arc(x+9*s,y-4*s,8*s,Math.PI*1.2,Math.PI*1.9); ctx.stroke();
}
function evilSmile(x, y, beard = false, color = '#111') {
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 12, 0.05, Math.PI - 0.05); ctx.stroke();
  if (beard) { ctx.fillStyle = '#1c100c'; ctx.beginPath(); ctx.ellipse(x, y+7, 12, 7, 0, 0, Math.PI*2); ctx.fill(); }
}
function sadMouth(x, y, s = 1) {
  ctx.strokeStyle = '#111'; ctx.lineWidth = 2*s; ctx.beginPath(); ctx.arc(x, y+7*s, 10*s, Math.PI*1.1, Math.PI*1.9); ctx.stroke();
}

function drawProjectile(pr) {
  ctx.save();
  if (quality !== 'performance') { ctx.shadowColor = pr.color || '#fff'; ctx.shadowBlur = 16; }
  ctx.fillStyle = pr.color || '#fff';
  ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff8'; ctx.beginPath(); ctx.arc(pr.x - pr.radius*.25, pr.y - pr.radius*.25, pr.radius*.35, 0, Math.PI*2); ctx.fill();
  if (quality !== 'performance') {
    const icon = pr.hero === 'geovanna' ? '♥' : pr.hero === 'romulo' ? '◆' : pr.hero === 'arthur' ? '01' : pr.hero === 'guilherme' ? '✦' :
      pr.enemyType === 'napoleao' ? '🍗' : pr.enemyType === 'vanjo' ? '▣' : pr.enemyType === 'mito' ? '✧' : pr.enemyType === 'anielle' ? '!' : '';
    if (icon) {
      ctx.font = `bold ${Math.max(10, pr.radius * 1.05)}px system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(icon, pr.x, pr.y + 0.5);
    }
  }
  ctx.restore();
}

function drawEffect(fx) {
  const progress = 1 - (fx.ttl / Math.max(.001, fx.life || 1));
  ctx.save();
  if (fx.type === 'text') {
    ctx.globalAlpha = 1 - progress;
    ctx.font = 'bold 23px system-ui'; ctx.textAlign = 'center';
    ctx.lineWidth = 5; ctx.strokeStyle = '#0009'; ctx.strokeText(fx.text, fx.x, fx.y - progress * 32);
    ctx.fillStyle = fx.color || '#fff'; ctx.fillText(fx.text, fx.x, fx.y - progress * 32);
  } else if (fx.type === 'ring' || fx.type === 'hit' || fx.type === 'hazard' || fx.type === 'slash') {
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = fx.color || '#fff'; ctx.lineWidth = fx.type === 'hazard' ? 10 : 6;
    if (fx.type === 'hazard') ctx.setLineDash([15, 10]);
    ctx.beginPath(); ctx.arc(fx.x, fx.y, (fx.r || 50) * (.45 + progress*.65), 0, Math.PI*2); ctx.stroke();
    if (fx.type === 'hazard') {
      ctx.globalAlpha = .13 * (1-progress);
      ctx.fillStyle = fx.color || '#fff'; ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r || 50, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawAimLine() {
  const me = myGamePlayer();
  if (!me || me.dead || !aimManual) return;
  ctx.save();
  ctx.globalAlpha = .42;
  ctx.strokeStyle = '#fff6'; ctx.lineWidth = 3; ctx.setLineDash([10, 10]);
  ctx.beginPath(); ctx.moveTo(me.x, me.y); ctx.lineTo(pointerAim.x, pointerAim.y); ctx.stroke();
  ctx.fillStyle = '#fff8'; ctx.beginPath(); ctx.arc(pointerAim.x, pointerAim.y, 10, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function setButtonHtml(id, main, sub) {
  const btn = $(id);
  if (!btn) return;
  btn.innerHTML = `${main}<span>${sub}</span>`;
}

function drawCooldownOverlay() {
  const me = myGamePlayer();
  if (!me) return;
  const h = heroes[me.hero] || {};
  const specialReady = me.specialCd <= .05 && !me.dead;
  const ultimateReady = me.ultimate >= 100 && !me.dead;
  const attackReady = me.attackCd <= .05 && !me.dead;
  $('attackTouch').style.filter = attackReady ? 'brightness(1)' : 'grayscale(.25) brightness(.86)';
  $('specialTouch').style.filter = specialReady ? 'brightness(1)' : 'grayscale(.45) brightness(.75)';
  $('ultimateTouch').style.filter = ultimateReady ? 'brightness(1.15)' : 'grayscale(.45) brightness(.75)';
  setButtonHtml('attackTouch', h.attackName || 'ATACAR', attackReady ? 'clique/espaço' : `${Math.ceil(me.attackCd)}s`);
  setButtonHtml('specialTouch', h.specialName || 'HABILIDADE', specialReady ? 'Q pronto' : `Q · ${Math.ceil(me.specialCd)}s`);
  setButtonHtml('ultimateTouch', h.ultimateName || 'ULTIMATE', ultimateReady ? 'E pronto' : `E · ${Math.round(me.ultimate || 0)}%`);
}


function draw(t = 0) {
  requestAnimationFrame(draw);
  const targetFps = quality === 'performance' ? 30 : device.mobile && quality !== 'max' ? 38 : 45;
  const minFrame = 1000 / targetFps;
  if (t - lastDrawTime < minFrame) return;
  lastDrawTime = t;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, view.cssW, view.cssH);
  ctx.fillStyle = '#120914'; ctx.fillRect(0, 0, view.cssW, view.cssH);

  ctx.save();
  ctx.translate(view.ox, view.oy);
  ctx.scale(view.scale, view.scale);
  drawArena();

  if (game) {
    const effects = game.effects || [];
    for (const fx of effects) if (fx.type !== 'text') drawEffect(fx);
    for (const pr of (game.projectiles || [])) drawProjectile(pr);
    const entities = [
      ...(game.players || []).map(p => ({ kind: 'player', y: p.y, data: p })),
      ...(game.enemies || []).map(e => ({ kind: 'enemy', y: e.y, data: e }))
    ].sort((a, b) => a.y - b.y);
    for (const item of entities) item.kind === 'player' ? drawPlayer(item.data) : drawEnemy(item.data);
    drawAimLine();
    for (const fx of effects) if (fx.type === 'text') drawEffect(fx);
  } else {
    ctx.fillStyle = '#fff6dd'; ctx.font = 'bold 42px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Arena das Sete Chamas', view.w/2, view.h/2);
  }
  ctx.restore();
}

requestAnimationFrame(draw);

// Entrada automática via link ?room=ABCD
window.addEventListener('load', () => {
  applyQuality();
  $('nameInput').value = localStorage.getItem('arenaNome') || '';
  $('nameInput').addEventListener('input', () => localStorage.setItem('arenaNome', $('nameInput').value));
  const params = new URLSearchParams(location.search);
  const code = params.get('room');
  if (code) $('roomInput').value = code.toUpperCase().slice(0, 4);
  socket.emit('listRooms', (res) => {
    if (res?.ok) { openRooms = res.rooms || []; renderOpenRooms(); }
  });
});
