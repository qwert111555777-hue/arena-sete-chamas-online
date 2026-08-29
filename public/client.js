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
const ASSET_VERSION = '7';

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
  // Altura do arquivo completo já com margem transparente. A parte visível fica do tamanho correto.
  albert: 222, geovanna: 204, romulo: 212, arthur: 207, guilherme: 207,
  otavio: 229, anielle: 217, mito: 279, lenda: 283, vanjo: 276, napoleao: 274
};

const SPRITE_PAD = {
  albert: 34, geovanna: 34, romulo: 34, arthur: 34, guilherme: 34,
  otavio: 34, anielle: 34, mito: 40, lenda: 40, vanjo: 40, napoleao: 46
};

const CHARACTER_ANIM = {
  albert: { color: '#ffd84a', aura: '#ffd84a', fx: 'fists' },
  geovanna: { color: '#ff7aca', aura: '#ff9bdc', fx: 'hearts' },
  romulo: { color: '#bff3ff', aura: '#9ee9ff', fx: 'cards' },
  arthur: { color: '#18d4ff', aura: '#18d4ff', fx: 'glitch' },
  guilherme: { color: '#8ff7ff', aura: '#8ff7ff', fx: 'aura' },
  otavio: { color: '#ff9861', aura: '#ff9861', fx: 'food' },
  anielle: { color: '#ba7cff', aura: '#ba7cff', fx: 'gossip' },
  mito: { color: '#ff70df', aura: '#ff70df', fx: 'sparkle' },
  lenda: { color: '#ffb12c', aura: '#ffb12c', fx: 'motor' },
  vanjo: { color: '#ff5757', aura: '#ff5757', fx: 'anger' },
  napoleao: { color: '#ffcf72', aura: '#ffcf72', fx: 'royal' }
};

const assets = { arena: null, sprites: {}, stages: {} };
function loadAsset(src) {
  const img = new Image();
  img.decoding = 'async';
  const sep = src.includes('?') ? '&' : '?';
  img.src = `${src}${sep}v=${ASSET_VERSION}`;
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
function alphaColor(color, alphaHex = '77') {
  const c = String(color || '#ffffff');
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return c + alphaHex;
  if (/^#[0-9a-fA-F]{3}$/.test(c)) return '#' + c[1]+c[1]+c[2]+c[2]+c[3]+c[3] + alphaHex;
  return 'rgba(255,255,255,.45)';
}

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

function drawImageCoverOn(targetCtx, img, x, y, w, h) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  targetCtx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawImageCover(img, x, y, w, h) {
  drawImageCoverOn(ctx, img, x, y, w, h);
}

function buildStageCache(img, bgKey) {
  if (!assetReady(img)) return null;
  const key = `${bgKey || 'fallback'}-${quality}-${view.w}x${view.h}-${img.naturalWidth}x${img.naturalHeight}`;
  if (bgCache.key === key && bgCache.canvas) return bgCache.canvas;
  const c = document.createElement('canvas');
  c.width = view.w;
  c.height = view.h;
  const g = c.getContext('2d');
  drawImageCoverOn(g, img, 0, 0, view.w, view.h);

  // Camadas estáticas: realçam o cenário sem recalcular escala pesada todo frame.
  const dark = quality === 'performance' ? .13 : .16;
  g.fillStyle = `rgba(16, 8, 24, ${dark})`;
  g.fillRect(0, 0, view.w, view.h);
  const rg = g.createRadialGradient(view.w / 2, view.h / 2, 80, view.w / 2, view.h / 2, view.w * .62);
  rg.addColorStop(0, 'rgba(255, 226, 128, .09)');
  rg.addColorStop(.58, 'rgba(90, 43, 116, .035)');
  rg.addColorStop(1, 'rgba(0, 0, 0, .32)');
  g.fillStyle = rg;
  g.fillRect(0, 0, view.w, view.h);
  g.strokeStyle = '#ffe08a88';
  g.lineWidth = quality === 'performance' ? 5 : 8;
  roundRect(g, 18, 18, view.w - 36, view.h - 36, 28); g.stroke();

  bgCache = { key, quality, canvas: c };
  return c;
}

function drawArena() {
  const bgKey = game?.stageBackground;
  const bg = bgKey ? assets.stages[bgKey] : null;
  const img = assetReady(bg) ? bg : assets.arena;
  const cached = buildStageCache(img, bgKey);
  if (cached) {
    ctx.drawImage(cached, 0, 0, view.w, view.h);
  } else {
    const grd = ctx.createLinearGradient(0, 0, view.w, view.h);
    grd.addColorStop(0, '#5b2f5f');
    grd.addColorStop(.45, '#2c5a48');
    grd.addColorStop(1, '#26193e');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, view.w, view.h);
  }

  if (quality !== 'performance') {
    ctx.save();
    const runePulse = .18 + Math.sin(performance.now() / 420) * .07;
    ctx.globalAlpha = runePulse;
    ctx.strokeStyle = game?.stageIndex === 1 ? '#ffb45f' : game?.stageIndex === 4 ? '#ffd166' : '#ff77ea';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(view.w / 2, view.h / 2, 132, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
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

function getMotion(id, targetX, targetY, vx = 0, vy = 0) {
  const t = performance.now();
  let m = spriteMotion.get(id);
  if (!m) {
    m = { x: targetX, y: targetY, lastTargetX: targetX, lastTargetY: targetY, lastT: t, speed: 0, phase: Math.random() * 6.28, facing: 1 };
    spriteMotion.set(id, m);
  }
  const dt = clamp((t - m.lastT) / 1000, 0.001, 0.08);
  const targetStep = Math.hypot(targetX - m.lastTargetX, targetY - m.lastTargetY);
  const snapshotSpeed = Math.hypot(Number(vx) || 0, Number(vy) || 0);
  const instantSpeed = Math.max(targetStep / dt, snapshotSpeed);
  m.speed = m.speed * 0.70 + instantSpeed * 0.30;
  const distToTarget = Math.hypot(targetX - m.x, targetY - m.y);
  if (distToTarget > 260) {
    m.x = targetX;
    m.y = targetY;
  } else {
    // Interpolação: corrige “teleporte” e deixa caminhada fluida entre snapshots da rede.
    const follow = quality === 'performance' ? 0.48 : 0.34;
    m.x += (targetX - m.x) * follow;
    m.y += (targetY - m.y) * follow;
  }
  const moving = m.speed > 18 || distToTarget > 3;
  m.phase += (moving ? 9.6 : 2.2) * dt;
  if (Math.abs(vx) > 4) m.facing = vx < 0 ? -1 : 1;
  m.lastTargetX = targetX;
  m.lastTargetY = targetY;
  m.lastT = t;
  m.moving = moving;
  return m;
}

function drawStepDust(x, y, phase, color = '#f2d7a7') {
  const a = Math.abs(Math.sin(phase * 1.7));
  if (a < .58) return;
  ctx.save();
  ctx.globalAlpha = (quality === 'performance' ? .10 : .18) * a;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x - 18, y + 2, 13 * a, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 18, y + 2, 13 * a, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawOrbitParticles(x, y, radius, color, phase, count = 5) {
  if (quality === 'performance' && count > 3) count = 3;
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const a = phase * .85 + i * Math.PI * 2 / count;
    const px = x + Math.cos(a) * radius;
    const py = y + Math.sin(a) * radius * .34;
    ctx.globalAlpha = .22 + .22 * Math.sin(a + phase);
    ctx.beginPath(); ctx.arc(px, py, 3.5 + (i % 2), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawActionArc(x, y, r, facing, color, power = 1) {
  ctx.save();
  ctx.globalAlpha = .55 * power;
  ctx.strokeStyle = color;
  ctx.lineWidth = 7 * power;
  ctx.lineCap = 'round';
  const start = facing > 0 ? -0.65 : Math.PI - 0.65;
  const end = facing > 0 ? 0.85 : Math.PI + 0.85;
  ctx.beginPath(); ctx.arc(x + facing * 18, y, r, start, end); ctx.stroke();
  ctx.globalAlpha = .25 * power;
  ctx.lineWidth = 18 * power;
  ctx.beginPath(); ctx.arc(x + facing * 18, y, r * .74, start, end); ctx.stroke();
  ctx.restore();
}


function spriteDimensions(key, height) {
  const img = assets.sprites[key];
  if (!assetReady(img)) return { img: null, w: height * .55, h: height, pad: 0, visibleH: height };
  const ratio = img.naturalWidth / Math.max(1, img.naturalHeight);
  const pad = (SPRITE_PAD[key] || 0) / Math.max(1, img.naturalHeight) * height;
  return { img, w: height * ratio, h: height, pad, visibleH: Math.max(1, height - pad * 2) };
}

function drawSpritePart(img, iw, ih, w, h, sy, sh) {
  ctx.drawImage(img, 0, sy, iw, sh, -w / 2, -h / 2 + (sy / ih) * h, w, (sh / ih) * h);
}

function drawSpriteImage(key, x, footY, height, facing = 1, alpha = 1, glow = null, motion = null, action = {}) {
  const { img, w, h, pad, visibleH } = spriteDimensions(key, height);
  const actionName = action.name || action.action || 'idle';
  const actionTimer = Number(action.timer || 0);
  const hitFlash = Number(action.hit || 0);
  const moving = !!motion?.moving || actionName === 'run';
  const phase = motion?.phase || performance.now() / 220;
  const perf = quality === 'performance';
  const walk = Math.sin(phase * 1.65);
  const step = Math.abs(walk);
  const attackLike = actionName === 'attack' || actionName === 'melee';
  const specialLike = actionName === 'special' || actionName === 'ultimate' || actionName === 'revive';
  const hitLike = actionName === 'hit' || hitFlash > 0;
  const actionPower = clamp(actionTimer / (actionName === 'ultimate' ? .95 : actionName === 'special' ? .72 : .36), 0, 1);
  const bob = (moving ? step * (perf ? 4.8 : 8.4) : Math.sin(phase) * (perf ? .7 : 1.45)) + (specialLike ? Math.sin(actionPower * Math.PI) * -8 : 0);
  const bodyTilt = (moving ? walk * (perf ? .035 : .07) : Math.sin(phase * .55) * .014) * facing + (attackLike ? facing * .075 * actionPower : 0);
  const upperTilt = (moving ? -walk * (perf ? .045 : .085) : Math.sin(phase * .7) * .018) * facing + (attackLike ? facing * .16 * actionPower : 0);
  const lowerTilt = moving ? walk * (perf ? .035 : .065) * facing : 0;
  const stretch = moving ? step * (perf ? .018 : .035) : Math.sin(phase * .8) * .006;
  const side = moving ? walk * (perf ? 1.1 : 2.7) : 0;
  const lunge = attackLike ? facing * (9 + 8 * actionPower) : 0;
  const scalePulse = specialLike ? 1 + Math.sin(actionPower * Math.PI) * .045 : 1;
  const imageBottom = footY + pad + bob;
  const centerY = imageBottom - h / 2;
  const visualTop = imageBottom - h + pad;
  const visualBottom = imageBottom - pad;

  ctx.save();
  ctx.globalAlpha *= alpha;
  if (glow && quality !== 'performance') { ctx.shadowColor = glow; ctx.shadowBlur = quality === 'max' ? 20 : 12; }

  if (assetReady(img)) {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const split = key === 'napoleao' ? Math.floor(ih * .58) : Math.floor(ih * .56);
    const overlap = Math.max(4, Math.floor(ih * .025));
    ctx.translate(x + side + lunge, centerY);
    ctx.scale(facing * scalePulse, scalePulse);

    // Pseudo-esqueleto em todos os modos: pernas/quadril e tronco/cabeça se mexem separados.
    // No modo desempenho a amplitude é menor, mas o corpo não fica mais “escorregando parado”.
    ctx.save();
    ctx.translate(-walk * (perf ? 1.15 : 2.2), moving ? step * (perf ? 1.6 : 2.8) : 0);
    ctx.rotate(lowerTilt);
    ctx.scale(1 + step * (perf ? .010 : .018), 1 + stretch * (perf ? .55 : .9));
    drawSpritePart(img, iw, ih, w, h, Math.max(0, split - overlap), ih - Math.max(0, split - overlap));
    ctx.restore();

    ctx.save();
    ctx.translate(walk * (perf ? 1.35 : 2.6), -step * (perf ? 1.1 : 2.1) - (specialLike ? Math.sin(actionPower * Math.PI) * (perf ? 2 : 4) : 0));
    ctx.rotate(upperTilt);
    ctx.scale(1 + (attackLike ? .035 * actionPower : 0), 1 - (attackLike ? .018 * actionPower : 0));
    drawSpritePart(img, iw, ih, w, h, 0, Math.min(ih, split + overlap));
    ctx.restore();

    if (hitLike) {
      ctx.save();
      ctx.globalAlpha = .18 + Math.min(.30, hitFlash * 1.4);
      ctx.filter = actionName === 'hit' ? 'brightness(1.8) sepia(.25) saturate(1.8)' : 'brightness(1.7)';
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  } else {
    ctx.fillStyle = glow || '#fff';
    ctx.beginPath(); ctx.arc(x, footY - h / 2, h * .22, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  if (attackLike) drawActionArc(x + facing * 26, visualTop + visibleH * .52, Math.max(38, visibleH * .26), facing, CHARACTER_ANIM[key]?.color || glow || '#fff', .8 + actionPower * .4);
  if (specialLike && quality !== 'performance') {
    drawOrbitParticles(x, visualTop + visibleH * .56, Math.max(42, visibleH * .30), CHARACTER_ANIM[key]?.aura || '#fff', phase, actionName === 'ultimate' ? 8 : 5);
  }

  return { w, h, pad, visibleH, top: visualTop - Math.abs(bodyTilt) * 24, bottom: visualBottom, footY };
}

function drawHeroPersonality(p, x, y, footY, drawn, facing, motion) {
  const meta = CHARACTER_ANIM[p.hero] || { color: '#fff', aura: '#fff' };
  const phase = motion.phase;
  const action = p.action || 'idle';
  const active = action === 'attack' || action === 'special' || action === 'ultimate';
  const headY = drawn.top + drawn.visibleH * .18;
  const handY = drawn.top + drawn.visibleH * .48;
  ctx.save();

  if (p.shield > 0) {
    ctx.globalAlpha = .20 + .06 * Math.sin(phase * 2);
    ctx.strokeStyle = '#7bd3ff'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(x, y + 4, 58, 45, 0, 0, Math.PI * 2); ctx.stroke();
  }

  if (p.damageBoostTimer > 0 || p.ultimate >= 100) {
    ctx.globalAlpha = .25 + .08 * Math.sin(phase * 2.7);
    ctx.strokeStyle = p.ultimate >= 100 ? '#ffd166' : '#ffe45d'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, y + 2, 54 + Math.sin(phase * 1.6) * 5, 0, Math.PI * 2); ctx.stroke();
  }

  if (p.hero === 'albert') {
    ctx.globalAlpha = .72;
    ctx.fillStyle = '#ffd84a';
    const punch = action === 'attack' ? 16 : Math.sin(phase * 1.65) * 5;
    ctx.beginPath(); ctx.arc(x + facing * (drawn.w * .19 + punch), handY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - facing * (drawn.w * .16), handY + Math.sin(phase * 1.65) * 5, 5, 0, Math.PI * 2); ctx.fill();
    if (active) drawActionArc(x + facing * 24, handY, 42, facing, '#ffd84a', 1.05);
  } else if (p.hero === 'geovanna') {
    const count = quality === 'performance' ? 2 : 4;
    ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < count; i++) {
      const a = phase * .9 + i * Math.PI * 2 / count;
      ctx.globalAlpha = .24 + .22 * Math.sin(a + phase);
      ctx.fillStyle = '#ff8ad6';
      ctx.fillText('♥', x + Math.cos(a) * 36, headY + 20 + Math.sin(a) * 13);
    }
  } else if (p.hero === 'romulo') {
    ctx.strokeStyle = '#bff3ff'; ctx.lineWidth = 2;
    ctx.globalAlpha = .50;
    for (let i = 0; i < 3; i++) {
      const a = phase + i * 2.1;
      ctx.save(); ctx.translate(x + Math.cos(a) * 34, handY + Math.sin(a) * 12); ctx.rotate(a);
      roundRect(ctx, -7, -10, 14, 20, 3); ctx.stroke(); ctx.restore();
    }
  } else if (p.hero === 'arthur') {
    ctx.globalAlpha = active ? .62 : .34;
    ctx.strokeStyle = '#18d4ff'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const yy = headY + 10 + i * 14 + Math.sin(phase * 2 + i) * 3;
      ctx.beginPath(); ctx.moveTo(x - 32, yy); ctx.lineTo(x + 32, yy + Math.sin(phase + i) * 4); ctx.stroke();
    }
    ctx.font = 'bold 12px monospace'; ctx.fillStyle = '#baf7ff'; ctx.fillText('01', x + facing * 34, handY - 8);
  } else if (p.hero === 'guilherme') {
    ctx.globalAlpha = .28 + .12 * Math.sin(phase * 1.8);
    ctx.strokeStyle = '#8ff7ff'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(x, y + 4, 60 + (p.aura || 0) * .18, 45 + (p.aura || 0) * .08, 0, 0, Math.PI * 2); ctx.stroke();
    drawOrbitParticles(x, y, 50 + (p.aura || 0) * .12, '#8ff7ff', phase, 6);
  }

  if (action === 'special' || action === 'ultimate') {
    ctx.globalAlpha = action === 'ultimate' ? .48 : .32;
    ctx.strokeStyle = meta.aura; ctx.lineWidth = action === 'ultimate' ? 9 : 5;
    ctx.beginPath(); ctx.arc(x, y + 8, action === 'ultimate' ? 108 : 74, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function drawEnemyPersonality(e, x, y, footY, drawn, facing, motion) {
  const meta = CHARACTER_ANIM[e.type] || { color: e.color || '#fff', aura: e.color || '#fff' };
  const phase = motion.phase;
  const action = e.action || 'idle';
  const headY = drawn.top + drawn.visibleH * .18;
  const handY = drawn.top + drawn.visibleH * .50;
  ctx.save();

  if (e.type === 'anielle') {
    // Reforço visual do cabelo cacheado e da fofoca: aparece por cima sem cortar o sprite.
    ctx.globalAlpha = .90;
    ctx.strokeStyle = '#2b1a14'; ctx.lineWidth = 3;
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI * .92 + i * Math.PI * 1.84 / 10;
      const hx = x + Math.cos(a) * (drawn.w * .27 + Math.sin(phase + i) * 1.6);
      const hy = headY + 8 + Math.sin(a) * 34 + Math.sin(phase * 1.8 + i) * 2.6;
      ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 1.55); ctx.stroke();
    }
    ctx.globalAlpha = action === 'attack' || action === 'special' ? .72 : .40;
    ctx.fillStyle = '#ba7cff'; ctx.font = 'bold 17px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('!', x + facing * 42, headY + 18 + Math.sin(phase * 2) * 4);
  } else if (e.type === 'otavio') {
    ctx.globalAlpha = .52;
    ctx.fillStyle = '#ffcf72';
    for (let i = 0; i < 4; i++) {
      const a = phase + i * 1.4;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * 34, handY + Math.sin(a * 1.3) * 10, 4, 0, Math.PI * 2); ctx.fill();
    }
  } else if (e.type === 'mito') {
    ctx.globalAlpha = .48 + .18 * Math.sin(phase * 2.2);
    ctx.fillStyle = '#ffd6ff';
    ctx.beginPath(); ctx.ellipse(x, headY - 6, 18, 8, 0, 0, Math.PI * 2); ctx.fill();
    drawOrbitParticles(x, y, 58, '#ff70df', phase, 7);
  } else if (e.type === 'lenda') {
    ctx.globalAlpha = .58;
    ctx.strokeStyle = '#ffb12c'; ctx.lineWidth = 4;
    const wheel = Math.sin(phase * 2);
    ctx.beginPath(); ctx.arc(x - facing * 36, footY - 16, 12 + wheel * 2, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + facing * 25, footY - 14, 10 - wheel * 1.5, 0, Math.PI * 2); ctx.stroke();
    if (motion.moving || action === 'special') drawActionArc(x + facing * 38, handY + 20, 60, facing, '#ffb12c', .65);
  } else if (e.type === 'vanjo') {
    ctx.globalAlpha = .48;
    ctx.strokeStyle = '#ff5757'; ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const xx = x - 22 + i * 22;
      ctx.beginPath(); ctx.moveTo(xx, headY - 8); ctx.quadraticCurveTo(xx + 8, headY - 25 - Math.sin(phase + i) * 8, xx + 2, headY - 42); ctx.stroke();
    }
  } else if (e.type === 'napoleao') {
    ctx.globalAlpha = .45 + .12 * Math.sin(phase * 2);
    ctx.strokeStyle = '#ffcf72'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(x, y + 18, drawn.w * .30, 48 * (e.grow || 1), 0, 0, Math.PI * 2); ctx.stroke();
    ctx.font = 'bold 20px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd88a';
    ctx.fillText('★', x + Math.cos(phase) * 58, headY + 24 + Math.sin(phase) * 14);
  }

  if (action === 'special' || action === 'melee') {
    ctx.globalAlpha = action === 'special' ? .42 : .30;
    ctx.strokeStyle = meta.aura; ctx.lineWidth = action === 'special' ? 8 : 5;
    ctx.beginPath(); ctx.arc(x, y + 8, action === 'special' ? drawn.visibleH * .44 : drawn.visibleH * .31, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer(p) {
  const motion = getMotion('p-' + p.id, p.x, p.y, p.vx, p.vy);
  const x = motion.x, y = motion.y;
  const alpha = p.dead ? .36 : 1;
  const height = SPRITE_HEIGHT[p.hero] || 210;
  const footY = y + 48;
  const facing = Math.abs(p.dirX || 0) > .12 ? ((p.dirX || 1) < 0 ? -1 : 1) : motion.facing;

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(0,0,0,.36)';
  ctx.beginPath(); ctx.ellipse(x, footY + 3, motion.moving ? 52 : 44, motion.moving ? 17 : 14, 0, 0, Math.PI * 2); ctx.fill();
  if (motion.moving) drawStepDust(x, footY + 2, motion.phase, '#f0d0a0');

  const glow = p.hitFlash > 0 ? '#ff6b6b' : p.ultimate >= 100 ? '#ffd166' : (p.hero === 'guilherme' ? '#7bd3ff' : null);
  const drawn = drawSpriteImage(p.hero, x, footY, height, facing, 1, glow, motion, { name: p.action, timer: p.actionTimer, hit: p.hitFlash });
  drawHeroPersonality(p, x, y, footY, drawn, facing, motion);

  if (p.dead) {
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = '#0009';
    const text = `revive ${Math.ceil(p.respawnTimer)}s`;
    const ty = Math.max(24, drawn.top - 18);
    ctx.strokeText(text, x, ty); ctx.fillText(text, x, ty);
  }

  drawNameplate({ name: p.name, hp: p.hp, maxHp: p.maxHp, shield: p.shield }, x, Math.max(24, drawn.top - 30), 98);
  if (p.id === meId) {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, y + 5, 60, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#ffd166'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = '#0009';
    ctx.strokeText('VOCÊ', x, Math.min(view.h - 18, footY + 34)); ctx.fillText('VOCÊ', x, Math.min(view.h - 18, footY + 34));
  }
  ctx.restore();
}

function drawEnemy(e) {
  if (e.hp <= 0) return;
  if (e.invisible) {
    ctx.save(); ctx.globalAlpha = .22; drawSmoke(e.x, e.y, e.radius + 26); ctx.restore();
    return;
  }
  const motion = getMotion('e-' + e.id, e.x, e.y, e.vx, e.vy);
  const x = motion.x, y = motion.y;
  const grow = e.type === 'napoleao' ? (e.grow || 1) : 1;
  const height = (SPRITE_HEIGHT[e.type] || 230) * grow;
  const footY = y + e.radius + 34 * grow;
  const facing = Math.abs(e.vx || 0) > 8 ? ((e.vx || 1) < 0 ? -1 : 1) : (x > view.w / 2 ? -1 : 1);
  const glow = e.hitFlash > 0 ? '#ff6b6b' : e.mark > 0 ? '#ff73cc' : (e.type === 'napoleao' ? '#ffd166' : e.color);

  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,.40)';
  ctx.beginPath(); ctx.ellipse(x, footY + 4, Math.max(45, e.radius * 1.45) * grow, Math.max(14, e.radius * .40) * grow, 0, 0, Math.PI*2); ctx.fill();
  if (motion.moving) drawStepDust(x, footY + 4, motion.phase, e.type === 'lenda' ? '#ffb032' : '#d7c7b0');

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

  const drawn = drawSpriteImage(e.type, x, footY, height, facing, 1, glow, motion, { name: e.action, timer: e.actionTimer, hit: e.hitFlash });
  drawEnemyPersonality(e, x, y, footY, drawn, facing, motion);

  if (e.stun > 0) drawStatusText(x, Math.max(24, drawn.top - 44), 'STUN', '#7bd3ff');
  if (e.mark > 0) drawStatusText(x, Math.max(24, drawn.top - 26), 'MARCADO', '#ff78cc');
  drawNameplate({ name: e.name, hp: e.hp, maxHp: e.maxHp }, x, Math.max(24, drawn.top - 18), Math.max(108, e.radius * 2.7));
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
  const color = pr.color || '#fff';
  const speed = Math.hypot(pr.vx || 0, pr.vy || 0);
  const dx = speed > 1 ? (pr.vx || 0) / speed : 1;
  const dy = speed > 1 ? (pr.vy || 0) / speed : 0;
  if (quality !== 'performance') {
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    const grd = ctx.createLinearGradient(pr.x - dx * pr.radius * 5, pr.y - dy * pr.radius * 5, pr.x, pr.y);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(.45, alphaColor(color, '77'));
    grd.addColorStop(1, color);
    ctx.strokeStyle = grd;
    ctx.lineWidth = pr.radius * 1.25;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(pr.x - dx * pr.radius * 5, pr.y - dy * pr.radius * 5); ctx.lineTo(pr.x, pr.y); ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff9'; ctx.beginPath(); ctx.arc(pr.x - pr.radius*.25, pr.y - pr.radius*.25, pr.radius*.35, 0, Math.PI*2); ctx.fill();
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
