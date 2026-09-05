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
const ASSET_VERSION = '33';
const SHOW_ARENA_TEXT = false;
const SHOW_STAGE_INTRO = true;

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
  otavio: { icon: '🍔', attack: 'Promessa de Lanche', special: 'Gulodice', passive: 'cura quando está ferido e atrai para armadilha', specialMax: 6.8 },
  anielle: { icon: '🗣️', attack: 'Língua Grande', special: 'Falsidade', passive: 'primeiro golpe reduzido e ilusão absorve dano', specialMax: 5.5 },
  mito: { icon: '🌟', attack: 'Testa Astral', special: 'Gloss Caótico', passive: 'feixe da testa, esquiva leve e chão escorregadio', specialMax: 4.8 },
  lenda: { icon: '🏍️', attack: 'Barrigada Lendária', special: 'Bros/Capacete Rosa', passive: 'investida de moto, defesa e reflexão de dano', specialMax: 5.8 },
  silvanna: { icon: '💢', attack: 'Tapas da Mamãe', special: 'Massagem Final', passive: 'Mamãe Má: some nas sombras e volta furiosa, fúria cresce com a luta', specialMax: 7.8 },
  napoleao: { icon: '🐶', attack: 'Mordida de Lanche', special: 'Cara de Coitado/Forma Garfield', passive: 'Fome extrema: cresce, cura e entra em fases', specialMax: 6.3 }
};

const STAGE_BACKGROUNDS = {
  stage1_lama_esgoto: 'assets/stages/stage1_beco_2d.jpg',
  stage2_ifs_mito: 'assets/stages/stage2_ifs_2d.jpg',
  stage3_terreiro_lenda: 'assets/stages/stage3_terreiro_2d.jpg',
  stage4_supermercado_vanjo: 'assets/stages/stage4_quarto_2d.jpg',
  stage5_reino_comidas: 'assets/stages/stage5_reino_2d.jpg'
};


const SPRITE_FILES = {
  albert: 'assets/spritesheets/albert.webp',
  anielle: 'assets/spritesheets/anielle.webp',
  arthur: 'assets/spritesheets/arthur.webp',
  geovanna: 'assets/spritesheets/geovanna.webp',
  guilherme: 'assets/spritesheets/guilherme.webp',
  lenda: 'assets/spritesheets/lenda.webp',
  mito: 'assets/spritesheets/mito.webp',
  napoleao: 'assets/spritesheets/napoleao.webp',
  otavio: 'assets/spritesheets/otavio.webp',
  romulo: 'assets/spritesheets/romulo.webp',
  vanjo: 'assets/spritesheets/vanjo.webp',
  silvanna: 'assets/spritesheets/silvanna.webp'
};


const PORTRAIT_FILES = {
  albert: 'assets/faces/albert.png',
  geovanna: 'assets/faces/geovanna.png',
  romulo: 'assets/faces/romulo.png',
  arthur: 'assets/faces/arthur.png',
  guilherme: 'assets/faces/guilherme.png'
};
function versionedAsset(src) { return `${src}${src.includes('?') ? '&' : '?'}v=${ASSET_VERSION}`; }

const SPRITE_HEIGHT = {
  // Altura do arquivo completo já com margem transparente. A parte visível fica do tamanho correto.
  albert: 191, geovanna: 173, romulo: 182, arthur: 177, guilherme: 177,
  otavio: 199, anielle: 188, mito: 244, lenda: 249, vanjo: 276, silvanna: 241, napoleao: 239
};

const SPRITE_SHEETS = {"albert":{"frameW":148,"frameH":256,"cols":4,"rows":4,"pad":18},"anielle":{"frameW":130,"frameH":256,"cols":4,"rows":4,"pad":18},"arthur":{"frameW":107,"frameH":256,"cols":4,"rows":4,"pad":18},"geovanna":{"frameW":121,"frameH":256,"cols":4,"rows":4,"pad":18},"guilherme":{"frameW":140,"frameH":256,"cols":4,"rows":4,"pad":18},"lenda":{"frameW":212,"frameH":256,"cols":4,"rows":4,"pad":18},"mito":{"frameW":163,"frameH":256,"cols":4,"rows":4,"pad":18},"napoleao":{"frameW":231,"frameH":256,"cols":4,"rows":4,"pad":18},"otavio":{"frameW":125,"frameH":256,"cols":4,"rows":4,"pad":18},"romulo":{"frameW":150,"frameH":256,"cols":4,"rows":4,"pad":18},"vanjo":{"frameW":155,"frameH":272,"cols":4,"rows":4,"pad":34},"silvanna":{"frameW":119,"frameH":256,"cols":4,"rows":4,"pad":18}};

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
  silvanna: { color: '#e83e8c', aura: '#ff6fae', fx: 'anger' },
  napoleao: { color: '#ffcf72', aura: '#ffcf72', fx: 'royal' }
};


const SPRITE_ROWS = { idle: 0, run: 1, attack: 2, melee: 2, hit: 2, dead: 2, defeat: 2, special: 3, ultimate: 3, revive: 3, stun: 3 };
function actionDuration(actionName) {
  return actionName === 'ultimate' ? .95 : actionName === 'special' ? .72 : actionName === 'melee' ? .45 : actionName === 'attack' ? .34 : actionName === 'hit' ? .22 : .8;
}

// Rostos REAIS (fotos tratadas) aplicados sobre a cabeça dos personagens na arena
// Rostos REAIS das pessoas reais (heróis + Otávio/Anielle/Silvanna + o cachorro Napoleão).
// Mito e Lenda NÃO usam foto: são caricaturas cômicas (a foto antiga era o demônio assustador).
const FACE_FILES = {
  albert: 'assets/faces/albert.png', geovanna: 'assets/faces/geovanna.png',
  romulo: 'assets/faces/romulo.png', arthur: 'assets/faces/arthur.png',
  guilherme: 'assets/faces/guilherme.png',
  otavio: 'assets/faces/otavio.png', anielle: 'assets/faces/anielle.png',
  silvanna: 'assets/faces/silvanna.png', napoleao: 'assets/faces/napoleao.png'
};
// cx/cy = centro da cabeça em fração da altura visível; rx/ry = raios da elipse da cabeça.
// A elipse cobre a cabeça INTEIRA (cabelo da foto incluído) para manter o estereótipo real.
const FACE_CONF = {
  albert:     { cy: .150, rx: .105, ry: .140 }, geovanna: { cy: .150, rx: .105, ry: .145 },
  romulo:     { cy: .150, rx: .105, ry: .140 }, arthur:   { cy: .150, rx: .105, ry: .140 },
  guilherme:  { cy: .150, rx: .105, ry: .140 },
  otavio:     { cy: .150, rx: .110, ry: .145 }, anielle:  { cy: .150, rx: .110, ry: .150 },
  silvanna:   { cy: .150, rx: .110, ry: .150 }, napoleao: { cy: .235, rx: .190, ry: .175 }
};
const assets = { arena: null, sprites: {}, stages: {}, faces: {} };
function getFaceAsset(key) {
  const src = FACE_FILES[key];
  if (!src) return null;
  if (!assets.faces[key]) assets.faces[key] = loadAsset(src);
  return assets.faces[key];
}
function drawFaceHead(key, x, topY, visibleH, alpha = 1) {
  const img = getFaceAsset(key);
  if (!assetReady(img)) return;
  const cfg = FACE_CONF[key] || { cy: .15, rx: .105, ry: .14 };
  const cx = x;
  const cy = topY + visibleH * cfg.cy;
  const rx = cfg.rx * visibleH;
  const ry = cfg.ry * visibleH;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const sc = Math.max((rx * 2) / iw, (ry * 2) / ih);
  const dw = iw * sc, dh = ih * sc;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}
function loadAsset(src) {
  const img = new Image();
  img.decoding = 'async';
  img.src = versionedAsset(src);
  return img;
}
function assetReady(img) { return !!img && img.complete && img.naturalWidth > 0; }
function getSpriteAsset(key) {
  const src = SPRITE_FILES[key];
  if (!src) return null;
  if (!assets.sprites[key]) assets.sprites[key] = loadAsset(src);
  return assets.sprites[key];
}
function getStageAsset(key) {
  const src = STAGE_BACKGROUNDS[key];
  if (!src) return null;
  if (!assets.stages[key]) assets.stages[key] = loadAsset(src);
  return assets.stages[key];
}

function prewarmCurrentAssets() {
  if (game?.stageBackground) getStageAsset(game.stageBackground);
  for (const p of game?.players || []) { getSpriteAsset(p.hero); getFaceAsset(p.hero); }
  for (const e of game?.enemies || []) { getSpriteAsset(e.type); getFaceAsset(e.type); }
}

const keys = {};
const inputState = { mx: 0, my: 0, aimX: null, aimY: null, attack: false, special: false, ultimate: false, dash: false };
let mouseDownAttack = false;
let pointerAim = { x: 1000, y: 450 };
let aimManual = false;
let joystickVec = { x: 0, y: 0 };
let specialPulseUntil = 0;
let ultimatePulseUntil = 0;
let dashPulseUntil = 0;
let attackTouchDown = false;
let keyEdgeDash = false;
let lastSocketInput = 0;

const canvas = $('gameCanvas');
const ctx = canvas.getContext('2d');
const device = {
  mobile: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1,
  app: /ArenaSeteChamasAPK/i.test(navigator.userAgent),
  memory: navigator.deviceMemory || 4,
  cores: navigator.hardwareConcurrency || 4
};
let qualitySetting = 'performance';
let quality = 'performance';
let dpr = 1;
let view = { scale: 1, ox: 0, oy: 0, w: 1600, h: 900, cssW: 1600, cssH: 900 };
let camera = { x: 800, y: 450, initialized: false };
let lastCanvasW = 0;
let lastCanvasH = 0;
let lastDrawTime = 0;
let lastHudUpdate = 0;
const spriteMotion = new Map();
let bgCache = { key: null, quality: null, canvas: null };
let stageIntroUntil = 0;
let stageIntroData = null;
let lastStageKey = '';
let perfLevel = 0;
const perfStats = { samples: [], lastCheck: 0, badChecks: 0, goodChecks: 0 };

function resolveQuality() {
  // v12: modo único leve/universal. Sem escolha de gráfico, sem troca manual e sem layout quebrando no celular.
  return 'performance';
}

function qualityDprCap() {
  // Resolução nativa: nunca renderiza ABAIXO de 1x (que borrava ao esticar).
  // Em celular bom chega a ~1.6x (tela nítida); se travar, cai p/ 1.0x.
  let cap = device.mobile ? 1.6 : 1.25;
  if (perfLevel >= 1) cap = Math.min(cap, 1.1);
  return cap;
}

function minDprCap() {
  return device.mobile ? 1.0 : 1.0;
}

function getTargetFps() {
  if (perfLevel >= 1) return 28;
  return device.mobile ? 30 : 36;
}

function setPerfLevel(level) {
  level = clamp(level, 0, 1);
  if (level === perfLevel) return;
  perfLevel = level;
  document.body.classList.toggle('perf-guard-1', perfLevel >= 1);
  document.body.classList.toggle('perf-guard-2', perfLevel >= 2);
  bgCache = { key: null, quality: null, canvas: null };
  resizeCanvas(true);
}

function recordFrameCost(dt) {
  if (!game || currentScreen !== 'gameScreen') return;
  perfStats.samples.push(dt);
  if (perfStats.samples.length > 75) perfStats.samples.shift();
  const t = performance.now();
  if (t - perfStats.lastCheck < 2500 || perfStats.samples.length < 35) return;
  perfStats.lastCheck = t;
  const avg = perfStats.samples.reduce((a, b) => a + b, 0) / perfStats.samples.length;
  const slowFrames = perfStats.samples.filter(v => v > 45).length / perfStats.samples.length;
  const fps = 1000 / Math.max(1, avg);
  if (fps < 18 || slowFrames > .45) {
    perfStats.badChecks++;
    perfStats.goodChecks = 0;
    if (perfStats.badChecks >= 2) setPerfLevel(perfLevel + 1);
  } else if (fps > 29 && slowFrames < .12) {
    perfStats.goodChecks++;
    perfStats.badChecks = 0;
    if (perfStats.goodChecks >= 6) setPerfLevel(perfLevel - 1);
  } else {
    perfStats.badChecks = 0;
    perfStats.goodChecks = 0;
  }
}


function applyQuality() {
  quality = resolveQuality();
  document.body.classList.toggle('is-mobile', device.mobile);
  document.body.classList.toggle('quality-performance', quality === 'performance');
  document.body.classList.toggle('is-app', !!device.app);
  const badge = document.getElementById('deviceBadge');
  if (badge) badge.textContent = device.mobile ? '📱 Modo celular detectado' : '💻 Modo PC detectado';
  resizeCanvas(true);
}

function toast(message) {
  const el = $('toast');
  if (!el) return;
  if (currentScreen === 'gameScreen') {
    el.textContent = '';
    el.classList.remove('show');
    return;
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); el.textContent = ''; }, 1500);
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
function isStageIntroActive() { return !!(SHOW_STAGE_INTRO && game && currentScreen === 'gameScreen' && !game.gameOver && ((game.stageStartTimer || 0) > 0.08 || performance.now() < stageIntroUntil)); }
function updateStageIntroClass() { document.body.classList.toggle('stage-intro-active', isStageIntroActive()); }
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
  window.game = data; window.meId = meId;
  window.dispatchEvent(new Event('state:applied'));
  updateStageIntroClass();
  prewarmCurrentAssets();
  if (currentScreen !== 'gameScreen') showScreen('gameScreen');
  updateStageIntroClass();
  const stageChanged = oldStage !== game.stageIndex;
  const stageKey = `${game.stageIndex}-${game.stageBackground}`;
  if (stageChanged || stageKey !== lastStageKey) {
    lastStageKey = stageKey;
    stageIntroData = { title: game.stageTitle, venue: game.stageVenue, subtitle: game.stageSubtitle, idx: game.stageIndex, count: game.stageCount };
    stageIntroUntil = performance.now() + Math.max(1800, (game.stageStartTimer || 2.6) * 1000);
    resizeCanvas(true);
  }
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

function optionalClick(id, fn) { const el = $(id); if (el) el.addEventListener('click', fn); }
function openHowTo() { const m = document.getElementById('howToModal'); if (m) m.classList.remove('hidden'); }
function closeHowTo() { const m = document.getElementById('howToModal'); if (m) m.classList.add('hidden'); }
optionalClick('howToBtn', openHowTo);
optionalClick('lobbyHowToBtn', openHowTo);
optionalClick('closeHowToBtn', closeHowTo);
const howToBackdrop = document.getElementById('howToModal');
if (howToBackdrop) howToBackdrop.addEventListener('click', (e) => { if (e.target.id === 'howToModal') closeHowTo(); });

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
  const box = document.getElementById('howSkillsList');
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
    box.innerHTML = '<div class="empty-rooms">Nenhuma sala aberta.</div>';
    return;
  }
  box.innerHTML = openRooms.map(room => `
    <div class="open-room">
      <div>
        <strong>Sala ${room.code}</strong>
        <small>${room.players}/${room.maxPlayers}</small>
      </div>
      <button class="small-btn primary" data-join-room="${room.code}">Entrar</button>
    </div>`).join('');
  box.querySelectorAll('[data-join-room]').forEach(btn => {
    btn.addEventListener('click', () => joinRoomByCode(btn.dataset.joinRoom));
  });
}

function renderDifficultyButtons() {
  const box = $('difficultyButtons');
  if (!box || !Object.keys(difficulties).length) return;
  box.innerHTML = Object.values(difficulties).map(d => `
    <div class="diff-card" data-diff="${d.key}">
      <strong>${d.label}</strong>
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
          <img class="hero-thumb" src="${versionedAsset(PORTRAIT_FILES[key] || SPRITE_FILES[key])}" alt="${h.name}" loading="lazy" />
        </div>
        <h4>${h.name}</h4>
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
  $('hudDiff').textContent = `${diffLabel(game.difficulty)}`;
  $('hudStage').textContent = `${game.stageIndex + 1}/${game.stageCount} · ${game.stageTitle}`;
  $('hudSub').textContent = '';
  const backBtn = $('backLobbyBtn');
  if (backBtn) backBtn.style.display = game.gameOver ? 'inline-flex' : 'none';

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
  boss.innerHTML = game.enemies.filter(e => e.hp > 0).map(e => `
    <div class="boss-line" title="${e.name}">
      <div class="bar boss-only-bar"><span class="hpbar" style="width:${pct(e.hp, e.maxHp)}%; background:linear-gradient(90deg,#ff6262,#ffcc5c)"></span></div>
    </div>`).join('');

  const msgHud = $('messagesHud');
  if (msgHud) msgHud.innerHTML = '';

  const overlay = $('endOverlay');
  if (game.gameOver) {
    overlay.classList.remove('hidden');
    $('endTitle').textContent = game.victory ? 'Vitória final!' : 'Ainda não acabou...';
    $('endText').textContent = game.victory
      ? 'Agora que você venceu seus piores medos, apenas seja feliz. Vocês derrotaram Napoleão juntos e podem seguir leves.'
      : 'Vocês caíram nesta tentativa, mas coragem também é levantar de novo e proteger quem está do lado.';
    $('playAgainBtn').textContent = isHost() ? 'Voltar ao lobby' : 'Aguardando host';
  } else {
    overlay.classList.add('hidden');
  }
}

function renderAbilityHud() {
  const box = $('abilityHud');
  if (!box) return;
  box.innerHTML = '';
}


function enemyIcon(type) {
  return ENEMY_INFO[type]?.icon || '👾';
}

function resizeCanvas(force = false) {
  if (!canvas) return;
  const vv = window.visualViewport;
  const cssW = Math.max(1, Math.round(vv?.width || innerWidth || canvas.getBoundingClientRect().width || 1));
  const cssH = Math.max(1, Math.round(vv?.height || innerHeight || canvas.getBoundingClientRect().height || 1));
  const cap = qualityDprCap();
  const nextDpr = Math.max(minDprCap(), Math.min(window.devicePixelRatio || 1, cap));
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
  bgCache = { key: null, quality: null, canvas: null };
}
function resetMobileInput() {
  joystickVec = { x: 0, y: 0 };
  joyPointer = null;
  attackTouchDown = false;
  const stickEl = $('stick');
  if (stickEl) stickEl.style.transform = 'translate(-50%, -50%)';
}
function isFollowCameraMode() {
  const ratio = Math.max(view.cssW, 1) / Math.max(view.cssH, 1);
  return currentScreen === 'gameScreen' && !!game && (device.mobile || view.cssH < 520 || ratio > 2.05);
}
function getCameraTarget() {
  const me = myGamePlayer();
  if (me && !me.dead) return { x: me.x, y: me.y + 20 };
  const alive = (game?.players || []).filter(p => !p.dead);
  if (alive.length) return { x: alive.reduce((a,p)=>a+p.x,0)/alive.length, y: alive.reduce((a,p)=>a+p.y,0)/alive.length };
  return { x: view.w / 2, y: view.h / 2 };
}
function updateCameraTransform() {
  const world = game?.world || { w: 1600, h: 900 };
  // SEMPRE encaixa a arena inteira na tela (fit), centralizada. Não corta nada,
  // em qualquer tamanho/forma: PC, ultrawide, janela estreita, celular deitado, APK.
  const scale = Math.min(view.cssW / world.w, view.cssH / world.h);
  view = { ...view, scale, ox: (view.cssW - world.w * scale) / 2, oy: (view.cssH - world.h * scale) / 2, w: world.w, h: world.h };
  camera.initialized = false;
}
window.addEventListener('resize', () => resizeCanvas(true));
window.addEventListener('orientationchange', () => {
  resetMobileInput();
  [80, 250, 600, 1000].forEach(ms => setTimeout(() => resizeCanvas(true), ms));
});
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => resizeCanvas(true));
document.addEventListener('touchmove', (e) => { if (currentScreen === 'gameScreen') e.preventDefault(); }, { passive: false });

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
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (currentScreen === 'gameScreen' && [' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  if (currentScreen === 'gameScreen' && (k === 'shift' || k === 'f') && !e.repeat) dashPulseUntil = performance.now() + 160;
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

function setupActionButton(id, action) {
  const btn = $(id);
  const down = (e) => {
    e.preventDefault();
    if (action === 'attack') attackTouchDown = true;
    if (action === 'special') specialPulseUntil = performance.now() + 180;
    if (action === 'ultimate') ultimatePulseUntil = performance.now() + 180;
    if (action === 'dash') dashPulseUntil = performance.now() + 160;
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
setupActionButton('dashTouch', 'dash');

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
  inputState.dash = keys.shift || t < dashPulseUntil;
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
  const key = `${bgKey || 'fallback'}-${img.src}-${quality}-p${perfLevel}-${view.w}x${view.h}-${img.naturalWidth}x${img.naturalHeight}`;
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

// Fundo em ESPAÇO DE TELA: cobre 100% da viewport (preenche faixas letterbox).
let screenBgCache = { key: null, canvas: null };
function buildScreenBg(img, bgKey) {
  if (!assetReady(img)) return null;
  const key = `screen-${bgKey}-${img.src}-${view.cssW}x${view.cssH}-${img.naturalWidth}x${img.naturalHeight}`;
  if (screenBgCache.key === key && screenBgCache.canvas) return screenBgCache.canvas;
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(view.cssW * dpr));
  c.height = Math.max(2, Math.round(view.cssH * dpr));
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawImageCoverOn(g, img, 0, 0, view.cssW, view.cssH);
  g.fillStyle = 'rgba(12, 6, 18, .55)';
  g.fillRect(0, 0, view.cssW, view.cssH);
  screenBgCache = { key, canvas: c };
  return c;
}
function drawScreenBackground() {
  const bgKey = game?.stageBackground || 'stage1_lama_esgoto';
  const bg = getStageAsset(bgKey);
  const fallback = getStageAsset('stage1_lama_esgoto');
  const img = assetReady(bg) ? bg : fallback;
  const cached = buildScreenBg(img, bgKey);
  if (cached) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(cached, 0, 0, view.cssW * dpr, view.cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

function drawArena() {
  const bgKey = game?.stageBackground || 'stage1_lama_esgoto';
  const bg = getStageAsset(bgKey);
  const fallback = getStageAsset('stage1_lama_esgoto');
  const img = assetReady(bg) ? bg : fallback;
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

  if (quality !== 'performance' && perfLevel < 1) {
    ctx.save();
    const runePulse = .18 + Math.sin(performance.now() / 420) * .07;
    ctx.globalAlpha = runePulse;
    ctx.strokeStyle = game?.stageIndex === 1 ? '#ffb45f' : game?.stageIndex === 4 ? '#ffd166' : '#ff77ea';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(view.w / 2, view.h / 2, 132, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

function drawStageAnimation() {
  if (!game) return;
  const t = performance.now() / 1000;
  const key = game.stageBackground || '';
  const light = perfLevel >= 1;
  ctx.save();
  if (key.includes('lama_esgoto')) {
    // Poças de lama/esgoto borbulhando; detalhes leves para não travar.
    const count = light ? 5 : 11;
    for (let i = 0; i < count; i++) {
      const x = 150 + (i * 137) % 1280;
      const y = 260 + (i * 89) % 360;
      const r = 20 + (i % 4) * 10 + Math.sin(t * 2 + i) * 4;
      ctx.globalAlpha = light ? .18 : .32;
      ctx.fillStyle = i % 2 ? '#2b3a31' : '#4d3b21';
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.35, r * .42, Math.sin(i) * .3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = light ? .24 : .42;
      ctx.strokeStyle = '#9ed38b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x + Math.sin(t + i) * 12, y - 3, 4 + Math.sin(t * 4 + i) * 2, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (key.includes('ifs_mito')) {
    // Pátio tecnológico: linhas digitais e brilhos rosa/roxo da Testa Astral.
    ctx.globalAlpha = light ? .16 : .30;
    ctx.strokeStyle = '#80d8ff'; ctx.lineWidth = 2;
    for (let i = 0; i < (light ? 4 : 8); i++) {
      const y = 150 + i * 64 + Math.sin(t * 1.4 + i) * 4;
      ctx.beginPath(); ctx.moveTo(270, y); ctx.lineTo(1320, y + Math.sin(t + i) * 9); ctx.stroke();
    }
    for (let i = 0; i < (light ? 5 : 12); i++) {
      const x = 310 + (i * 83) % 920;
      const y = 145 + (i * 47) % 430;
      drawSparkShape(x, y, 5 + (i % 3), i % 2 ? '#ff70df' : '#d9f2ff', (light ? .20 : .38) + Math.sin(t * 3 + i) * .05);
    }
  } else if (key.includes('terreiro_lenda')) {
    // Velas, fumaça e energia mística sem caricaturar religião.
    const candles = light ? 6 : 13;
    for (let i = 0; i < candles; i++) {
      const x = 125 + (i * 121) % 1350;
      const y = 115 + (i * 77) % 630;
      ctx.globalAlpha = .25 + Math.sin(t * 5 + i) * .08;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.ellipse(x, y, 8, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = light ? .18 : .34;
      ctx.fillStyle = '#d7d2ff';
      ctx.beginPath(); ctx.ellipse(x + Math.sin(t + i) * 12, y - 32 - (Math.sin(t * .8 + i) + 1) * 11, 12, 30, .25, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = light ? .18 : .34;
    ctx.strokeStyle = '#ffb12c'; ctx.lineWidth = light ? 2 : 4; ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.arc(view.w/2, view.h/2 + 40, 120 + Math.sin(t)*7, 0, Math.PI*2); ctx.stroke();
  } else if (key.includes('supermercado_vanjo')) {
    // Luz de supermercado e carrinhos/caixas nas bordas.
    for (let i = 0; i < (light ? 6 : 14); i++) {
      const x = 140 + (i * 102) % 1320;
      const y = 95 + (i % 4) * 135;
      ctx.globalAlpha = (light ? .16 : .32) + Math.sin(t * 5 + i) * .05;
      ctx.fillStyle = i % 3 ? '#ffffff' : '#ffef9a';
      roundRect(ctx, x, y, 58, 9, 5); ctx.fill();
    }
    ctx.strokeStyle = '#ff5757'; ctx.lineWidth = 3; ctx.globalAlpha = light ? .18 : .34;
    for (let i = 0; i < (light ? 3 : 7); i++) {
      const x = (t * 22 + i * 210) % view.w;
      const y = 690 - (i % 2) * 45;
      ctx.beginPath(); ctx.rect(x, y, 35, 22); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 6, y + 25, 4, 0, Math.PI*2); ctx.arc(x + 30, y + 25, 4, 0, Math.PI*2); ctx.stroke();
    }
  } else if (key.includes('reino_comidas')) {
    // Reino final: molho borbulhando e brilho dourado épico.
    const bubbles = light ? 8 : 18;
    for (let i = 0; i < bubbles; i++) {
      const x = 120 + (i * 91) % 1370;
      const y = 120 + (i * 67) % 610;
      const r = 5 + (i % 5) + Math.sin(t * 2.6 + i) * 2;
      ctx.globalAlpha = light ? .18 : .34;
      ctx.fillStyle = i % 2 ? '#ff9f1c' : '#ffd166';
      ctx.beginPath(); ctx.arc(x, y + Math.sin(t + i) * 8, Math.max(2, r), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = light ? .16 : .30;
    ctx.strokeStyle = '#fff1a8'; ctx.lineWidth = light ? 3 : 6;
    for (let i = 0; i < (light ? 2 : 4); i++) {
      ctx.beginPath();
      ctx.ellipse(view.w/2, view.h/2 + 35, 170 + i*55 + Math.sin(t+i)*7, 58 + i*20, 0, 0, Math.PI*2);
      ctx.stroke();
    }
  }
  drawStageAmbient(t, light, key);
  ctx.restore();
}

// partículas ambientes que atravessam a fase (folhas, brasas, faíscas, poeira, migalhas)
function drawStageAmbient(t, light, key) {
  const count = light ? 6 : 14;
  const W = view.w, H = view.h;
  let color = '#ffd166', color2 = '#ffffff', drift = 18, size = 4, mode = 'float';
  if (key.includes('lama_esgoto')) { color = '#9ed38b'; color2 = '#c9e6b4'; drift = 10; size = 3; mode = 'float'; }
  else if (key.includes('ifs_mito')) { color = '#80d8ff'; color2 = '#ff70df'; drift = 26; size = 3; mode = 'spark'; }
  else if (key.includes('terreiro_lenda')) { color = '#ffb032'; color2 = '#ff6b3d'; drift = 14; size = 3.5; mode = 'ember'; }
  else if (key.includes('supermercado_vanjo')) { color = '#ffffff'; color2 = '#cfe8ff'; drift = 22; size = 3; mode = 'leaf'; }
  else if (key.includes('reino_comidas')) { color = '#ffd166'; color2 = '#ff9f1c'; drift = 12; size = 4; mode = 'food'; }
  ctx.save();
  for (let i = 0; i < count; i++) {
    const seed = i * 97.13;
    const ph = t * (0.14 + (i % 5) * 0.028) + seed;
    let x, y;
    if (mode === 'ember' || mode === 'spark') {
      x = (seed * 13.7) % W;
      y = H - ((ph * 46) % (H + 60)) + 30;
      x += Math.sin(t * 1.6 + seed) * drift;
    } else {
      x = W - ((ph * 52) % (W + 80)) + 40;
      y = (seed * 7.9) % (H * .85) + Math.sin(t * 1.1 + seed) * drift;
    }
    const s2 = size * (0.7 + ((i * 37) % 10) / 14);
    const tw = 0.5 + Math.sin(t * 2.6 + seed) * 0.28;
    ctx.globalAlpha = (light ? .16 : .30) * tw;
    ctx.fillStyle = i % 2 ? color : color2;
    if (mode === 'leaf') {
      ctx.beginPath(); ctx.ellipse(x, y, s2 * 1.7, s2 * .62, t + seed, 0, Math.PI * 2); ctx.fill();
    } else if (mode === 'food') {
      ctx.beginPath(); ctx.arc(x, y, s2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha *= .8; ctx.fillStyle = '#fff3c4';
      ctx.beginPath(); ctx.arc(x - s2 * .3, y - s2 * .3, s2 * .38, 0, Math.PI * 2); ctx.fill();
    } else if (mode === 'ember') {
      ctx.beginPath(); ctx.arc(x, y, s2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha *= .5; ctx.fillStyle = '#ffe9a8';
      ctx.beginPath(); ctx.arc(x, y - s2 * 1.5, s2 * .5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(x, y, s2, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawIntroSprite(key, x, footY, height, facing, alpha = 1, actionName = 'special') {
  const fakeMotion = { moving: false, phase: performance.now() / 240, facing };
  try {
    return drawSpriteImage(key, x, footY, height, facing, alpha, CHARACTER_ANIM[key]?.aura || '#ffd166', fakeMotion, { name: actionName, timer: .45, hit: 0 });
  } catch (err) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = CHARACTER_ANIM[key]?.color || '#fff'; ctx.beginPath(); ctx.arc(x, footY - height * .48, height * .18, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    return null;
  }
}

function drawStageIntro() {
  if (!SHOW_STAGE_INTRO || !game) return;
  const now = performance.now();
  const serverHold = Math.max(0, game.stageStartTimer || 0);
  if (now > stageIntroUntil && serverHold <= 0) return;
  const data = stageIntroData || { title: game.stageTitle, venue: game.stageVenue, subtitle: game.stageSubtitle, idx: game.stageIndex, count: game.stageCount };
  const total = 4.8;
  const remain = Math.max(serverHold, (stageIntroUntil - now) / 1000);
  const progress = clamp(1 - remain / total, 0, 1);
  const shake = progress > .46 && progress < .72 && quality !== 'performance' ? Math.sin(now / 28) * 3 : 0;
  const enemies = (game.enemies || []).filter(e => e.hp > 0);
  const heroesAlive = (game.players || []).filter(p => p.hero);
  const enemyNames = enemies.map(e => e.name).join(' + ') || 'Chefes';
  const heroNames = heroesAlive.map(p => heroName(p.hero)).join(' · ');

  ctx.save();
  ctx.translate(shake, 0);
  ctx.fillStyle = `rgba(3, 2, 7, ${serverHold > 0 ? .80 : .50})`;
  ctx.fillRect(-8, -8, view.w + 16, view.h + 16);

  // Painéis laterais de versus, inspirados em jogos de luta, mas com identidade própria.
  const slide = Math.min(1, progress * 2.4);
  const leftW = view.w * .47;
  const rightW = view.w * .47;
  const leftX = -leftW * (1 - slide);
  const rightX = view.w - rightW + rightW * (1 - slide);
  const top = 88;
  const panelH = view.h - 190;
  const grdL = ctx.createLinearGradient(leftX, top, leftX + leftW, top + panelH);
  grdL.addColorStop(0, 'rgba(255, 209, 102, .30)');
  grdL.addColorStop(.48, 'rgba(35, 21, 50, .86)');
  grdL.addColorStop(1, 'rgba(20, 10, 25, .88)');
  ctx.fillStyle = grdL; roundRect(ctx, leftX, top, leftW, panelH, 30); ctx.fill();
  const grdR = ctx.createLinearGradient(rightX, top, rightX + rightW, top + panelH);
  grdR.addColorStop(0, 'rgba(60, 12, 18, .90)');
  grdR.addColorStop(.55, 'rgba(105, 18, 30, .84)');
  grdR.addColorStop(1, 'rgba(255, 80, 72, .30)');
  ctx.fillStyle = grdR; roundRect(ctx, rightX, top, rightW, panelH, 30); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.24)'; roundRect(ctx, leftX, top, leftW, panelH, 30); ctx.stroke(); roundRect(ctx, rightX, top, rightW, panelH, 30); ctx.stroke();

  // Retratos/sprites do time e dos chefes.
  const heroHeight = Math.min(205, Math.max(120, view.h * .22));
  const heroGap = Math.min(86, leftW / Math.max(2.5, heroesAlive.length + .4));
  const baseHeroX = leftX + leftW * .18;
  heroesAlive.slice(0, 5).forEach((p, i) => {
    const x = baseHeroX + i * heroGap;
    const bob = Math.sin(now / 220 + i) * 4;
    drawIntroSprite(p.hero, x, top + panelH - 58 + bob, heroHeight, 1, .95, i % 2 ? 'attack' : 'special');
  });
  const enemyHeight = Math.min(300, Math.max(170, view.h * (enemies.length > 1 ? .27 : .34)));
  const enemyGap = Math.min(165, rightW / Math.max(2, enemies.length + .5));
  const baseEnemyX = rightX + rightW * .73;
  enemies.slice(0, 3).forEach((e, i) => {
    const x = baseEnemyX - i * enemyGap;
    const bob = Math.sin(now / 190 + i) * 5;
    drawIntroSprite(e.type, x, top + panelH - 54 + bob, enemyHeight * (e.type === 'napoleao' ? 1.05 : 1), -1, .98, 'ultimate');
  });

  // Textos ficam só na cinemática antes da luta, não poluem a arena durante gameplay.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd166'; ctx.font = '900 24px system-ui, sans-serif';
  ctx.fillText('HERÓIS', leftX + 32, top + 48);
  ctx.fillStyle = '#fff6dd'; ctx.font = heroesAlive.length > 2 ? '900 24px system-ui, sans-serif' : '900 34px system-ui, sans-serif';
  ctx.fillText(heroNames || 'TIME', leftX + 32, top + 90);
  ctx.fillStyle = '#d7c7aa'; ctx.font = '700 18px system-ui, sans-serif';
  ctx.fillText(`Nível ${Number(data.idx || 0) + 1}/${data.count || game.stageCount}`, leftX + 34, top + 124);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ff9a76'; ctx.font = '900 24px system-ui, sans-serif';
  ctx.fillText('CHEFE', rightX + rightW - 32, top + 48);
  ctx.fillStyle = '#fff6dd'; ctx.font = '900 34px system-ui, sans-serif';
  ctx.fillText(enemyNames, rightX + rightW - 32, top + 90);
  ctx.fillStyle = '#ffd4c0'; ctx.font = '700 18px system-ui, sans-serif';
  ctx.fillText(data.venue || '', rightX + rightW - 34, top + 124);

  const vsPulse = 1 + Math.sin(now / 110) * .06;
  ctx.save();
  ctx.translate(view.w / 2, view.h / 2 + 4);
  ctx.scale(vsPulse, vsPulse);
  ctx.textAlign = 'center';
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#210505';
  ctx.font = '1000 112px system-ui, sans-serif';
  ctx.strokeText('VS', 0, 0);
  const grd = ctx.createLinearGradient(-80, -90, 80, 30);
  grd.addColorStop(0, '#fff1a8'); grd.addColorStop(.5, '#ff9f1c'); grd.addColorStop(1, '#ff4040');
  ctx.fillStyle = grd;
  ctx.fillText('VS', 0, 0);
  ctx.restore();

  const barW = Math.min(650, view.w - 180);
  const barX = (view.w - barW) / 2;
  const barY = view.h - 95;
  ctx.fillStyle = 'rgba(0,0,0,.58)'; roundRect(ctx, barX, barY, barW, 46, 23); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2; roundRect(ctx, barX, barY, barW, 46, 23); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.font = '900 20px system-ui, sans-serif'; ctx.textAlign = 'center';
  const cue = serverHold > 0 ? `A batalha começa em ${Math.max(1, Math.ceil(remain))}` : 'LUTEM!';
  ctx.fillText(cue, view.w / 2, barY + 30);

  ctx.fillStyle = 'rgba(255,255,255,.90)'; ctx.font = '900 28px system-ui, sans-serif';
  ctx.fillText(data.title || 'Arena das Sete Chamas', view.w / 2, 52);
  ctx.fillStyle = 'rgba(255,255,255,.58)'; ctx.font = '700 18px system-ui, sans-serif';
  ctx.fillText(data.subtitle || '', view.w / 2, 78);
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
  if (!SHOW_ARENA_TEXT) {
    drawBar(x - w/2, y + 8, w, 8, entity.hp, entity.maxHp, '#45ed82');
    if (entity.shield > 0) drawBar(x - w/2, y + 19, w, 5, entity.shield, 60, '#77e6ff', '#0005');
    ctx.restore();
    return;
  }
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

// cor da poeira levantada ao pisar, combinando com o chão de cada fase
function stageDustColor() {
  const k = game?.stageBackground || '';
  if (k.includes('lama_esgoto')) return '#8a6f42';      // lama
  if (k.includes('ifs_mito')) return '#7fd8ff';         // pátio tecnológico
  if (k.includes('terreiro_lenda')) return '#ffb032';   // terra/brasas
  if (k.includes('supermercado_vanjo')) return '#e8ecf2'; // piso limpo
  if (k.includes('reino_comidas')) return '#ffd166';    // migalhas douradas
  return '#f2d7a7';
}

function drawStepDust(x, y, phase, color = '#f2d7a7') {
  const a = Math.abs(Math.sin(phase * 1.7));
  if (a < .58) return;
  ctx.save();
  ctx.globalAlpha = (quality === 'performance' ? .10 : .18) * a;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x - 18, y + 2, 13 * a, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 18, y + 2, 13 * a, 4, 0, 0, Math.PI * 2); ctx.fill();
  // partículas subindo (dão vida ao passo)
  if (quality !== 'performance' && perfLevel < 1) {
    ctx.globalAlpha = .28 * a;
    const t = performance.now() / 260;
    for (let i = 0; i < 2; i++) {
      const px = x + Math.sin(t + i * 2.4) * 14, py = y - ((t * .5 + i * .5) % 1) * 22;
      ctx.beginPath(); ctx.arc(px, py, 2.4 + (i ? 1.4 : 0), 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawOrbitParticles(x, y, radius, color, phase, count = 5) {
  if ((quality === 'performance' || perfLevel >= 1) && count > 3) count = 3;
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


function drawHeartShape(x, y, size, color, alpha = .85) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size * .35);
  ctx.bezierCurveTo(x - size * 1.15, y - size * .35, x - size * .55, y - size * 1.05, x, y - size * .42);
  ctx.bezierCurveTo(x + size * .55, y - size * 1.05, x + size * 1.15, y - size * .35, x, y + size * .35);
  ctx.fill(); ctx.restore();
}

function drawDiamondShape(x, y, size, color, alpha = .82) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x + size * .72, y); ctx.lineTo(x, y + size); ctx.lineTo(x - size * .72, y); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawSparkShape(x, y, size, color, alpha = .85) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 4;
    const r = i % 2 === 0 ? size : size * .34;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

function drawBoxShape(x, y, size, color, angle = 0, alpha = .9) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = color; ctx.strokeStyle = '#fff8'; ctx.lineWidth = 2;
  roundRect(ctx, -size, -size * .8, size * 2, size * 1.6, 4); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-size, -size * .15); ctx.lineTo(size, -size * .15); ctx.stroke();
  ctx.restore();
}

function drawFoodShape(x, y, size, color, angle = 0, alpha = .9) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(0, 0, size * 1.15, size * .72, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff3c5'; ctx.beginPath(); ctx.arc(size * .45, -size * .05, size * .42, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawExpressionMark(x, y, size, facing, mood = 'focus', color = '#fff') {
  if (quality === 'performance' && mood === 'idle') return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = mood === 'hit' ? '#ff6060' : color;
  ctx.fillStyle = mood === 'evil' ? '#ff4a7d' : color;
  ctx.globalAlpha = mood === 'idle' ? .30 : .72;
  ctx.lineWidth = Math.max(2, size * .12);
  // sobrancelhas/olhos
  ctx.beginPath();
  ctx.moveTo(x - size * .55, y - size * .22); ctx.lineTo(x - size * .12, y - size * .08);
  ctx.moveTo(x + size * .55, y - size * .22); ctx.lineTo(x + size * .12, y - size * .08);
  ctx.stroke();
  ctx.globalAlpha *= .75;
  ctx.beginPath(); ctx.arc(x - size * .28, y + size * .03, size * .09, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + size * .28, y + size * .03, size * .09, 0, Math.PI * 2); ctx.fill();
  // boca expressiva
  ctx.globalAlpha = mood === 'evil' ? .75 : .46;
  ctx.strokeStyle = mood === 'evil' ? '#ff4a7d' : '#ffffff';
  ctx.lineWidth = Math.max(2, size * .09);
  ctx.beginPath();
  if (mood === 'hit') ctx.arc(x, y + size * .38, size * .20, Math.PI * 1.08, Math.PI * 1.92);
  else ctx.arc(x, y + size * .16, size * .34, 0.10, Math.PI - 0.10);
  ctx.stroke();
  ctx.restore();
}

function spriteDimensions(key, height) {
  const img = getSpriteAsset(key);
  const sheet = SPRITE_SHEETS[key] || { frameW: Math.round(height * .55), frameH: height, cols: 1, rows: 1, pad: 0 };
  const ratio = sheet.frameW / Math.max(1, sheet.frameH);
  const pad = (sheet.pad || 0) / Math.max(1, sheet.frameH) * height;
  return { img, sheet, w: height * ratio, h: height, pad, visibleH: Math.max(1, height - pad * 2) };
}

function drawSpriteFrame(img, sheet, frameCol, frameRow, w, h) {
  const sx = clamp(frameCol, 0, sheet.cols - 1) * sheet.frameW;
  const sy = clamp(frameRow, 0, sheet.rows - 1) * sheet.frameH;
  ctx.drawImage(img, sx, sy, sheet.frameW, sheet.frameH, -w / 2, -h / 2, w, h);
}

function drawSpriteImage(key, x, footY, height, facing = 1, alpha = 1, glow = null, motion = null, action = {}) {
  const { img, sheet, w, h, pad, visibleH } = spriteDimensions(key, height);
  const actionName = action.name || action.action || 'idle';
  const actionTimer = Number(action.timer || 0);
  const hitFlash = Number(action.hit || 0);
  const moving = !!motion?.moving || actionName === 'run';
  const phase = motion?.phase || performance.now() / 220;
  const perf = perfLevel >= 1;
  const attackLike = actionName === 'attack' || actionName === 'melee';
  const specialLike = actionName === 'special' || actionName === 'ultimate' || actionName === 'revive';
  const hitLike = actionName === 'hit' || hitFlash > 0;
  const duration = actionDuration(actionName);
  const actionProgress = actionTimer > 0 ? clamp(1 - actionTimer / duration, 0, 1) : 0;
  const row = SPRITE_ROWS[actionName] ?? (moving ? SPRITE_ROWS.run : SPRITE_ROWS.idle);
  const frameCol = (actionTimer > 0 && row !== SPRITE_ROWS.idle && actionName !== 'run')
    ? Math.min(sheet.cols - 1, Math.floor(actionProgress * sheet.cols))
    : Math.floor((phase * (moving ? 1.28 : .55)) % sheet.cols);
  const speed = Math.hypot(motion?.speed || 0) || 0;
  const dashing = speed > 560; // esquiva: corpo esticado e inclinado pra frente
  const runEnergy = Math.min(1, speed / 320);
  const bob = moving ? Math.abs(Math.sin(phase * 1.9)) * (perf ? 2.6 : 4.6) * (0.6 + runEnergy * 0.7) : Math.sin(phase) * (perf ? .45 : 1.0);
  const tilt = ((moving ? Math.sin(phase * 1.9) * (0.030 + runEnergy * 0.05) : 0) + (dashing ? 0.22 * facing : 0)) * facing;
  const lunge = attackLike ? facing * (perf ? 16 : 26) * Math.sin(actionProgress * Math.PI) : 0;
  const hitShake = hitLike ? (Math.random() - .5) * 6 : 0;
  const specialPulse = specialLike ? Math.sin(actionProgress * Math.PI) : 0;
  const sx = facing * (dashing ? 1.16 : (1 + specialPulse * (perf ? .03 : .06))); // estica no dash / expande na habilidade
  const sy = (dashing ? 0.9 : (1 - specialPulse * (perf ? .02 : .045)));
  const pulse = 1;
  const imageBottom = footY + pad + bob - (attackLike ? Math.sin(actionProgress * Math.PI) * 6 : 0);
  const centerY = imageBottom - h / 2;
  const visualTop = imageBottom - h + pad;
  const visualBottom = imageBottom - pad;

  ctx.save();
  ctx.globalAlpha *= alpha;
  if (glow && quality !== 'performance' && perfLevel < 1) { ctx.shadowColor = glow; ctx.shadowBlur = quality === 'max' ? 16 : 9; }

  if (assetReady(img)) {
    ctx.translate(x + lunge + hitShake, centerY);
    ctx.rotate(tilt);
    ctx.scale(sx, sy);
    drawSpriteFrame(img, sheet, frameCol, row, w, h);

    if (hitLike) {
      // Flash barato: tinge só os pixels do personagem (source-atop), sem o custo do ctx.filter.
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = .22 + Math.min(.4, hitFlash * 1.5);
      ctx.fillStyle = '#fff0b0';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }
  } else {
    ctx.fillStyle = glow || CHARACTER_ANIM[key]?.color || '#fff';
    ctx.beginPath(); ctx.arc(x, footY - h / 2, h * .22, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  if (attackLike && perfLevel < 2) drawActionArc(x + facing * 26, visualTop + visibleH * .52, Math.max(38, visibleH * .26), facing, CHARACTER_ANIM[key]?.color || glow || '#fff', .8 + Math.sin(actionProgress * Math.PI) * .4);
  if (specialLike && quality !== 'performance' && perfLevel < 1) {
    drawOrbitParticles(x, visualTop + visibleH * .56, Math.max(42, visibleH * .30), CHARACTER_ANIM[key]?.aura || '#fff', phase, actionName === 'ultimate' ? 8 : 5);
  }

  return { w, h, pad, visibleH, top: visualTop - Math.abs(tilt) * 18, bottom: visualBottom, footY };
}


function drawBananaWand(x, y, size, facing, phase, alpha = .85) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(facing, 1); ctx.rotate(Math.sin(phase) * .08);
  ctx.strokeStyle = '#ffe36e'; ctx.lineWidth = Math.max(3, size * .18); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, size, -1.05, .9); ctx.stroke();
  ctx.fillStyle = '#ff8ad6'; ctx.beginPath(); ctx.arc(size * .55, -size * .20, size * .22, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawController(x, y, size, facing, phase, alpha = .80) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(facing, 1); ctx.rotate(Math.sin(phase) * .06);
  ctx.fillStyle = '#20242b'; ctx.strokeStyle = '#bff3ff'; ctx.lineWidth = 2;
  roundRect(ctx, -size * 1.1, -size * .55, size * 2.2, size * 1.1, size * .35); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-size*.63, 0); ctx.lineTo(-size*.32,0); ctx.moveTo(-size*.47,-size*.16); ctx.lineTo(-size*.47,size*.16); ctx.stroke();
  ctx.fillStyle = '#7deda3'; ctx.beginPath(); ctx.arc(size*.45, -size*.1, size*.11, 0, Math.PI*2); ctx.arc(size*.70, size*.10, size*.11, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawStaff(x, y, length, color, facing, phase, alpha = .85) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(facing, 1); ctx.rotate(-0.72 + Math.sin(phase) * .08);
  ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, length * .45); ctx.lineTo(0, -length * .55); ctx.stroke();
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(0, -length * .58, 9, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawDigitalBlade(x, y, length, facing, phase, alpha = .88) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(facing, 1); ctx.rotate(-0.72 + Math.sin(phase * 1.5) * .08);
  ctx.strokeStyle = '#18d4ff'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.shadowColor = '#18d4ff'; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.moveTo(0, length * .35); ctx.lineTo(0, -length * .55); ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(5, length * .05); ctx.lineTo(5, -length * .45); ctx.stroke();
  ctx.restore();
}

function drawHeroWeapon(p, x, y, footY, drawn, facing, motion) {
  const phase = motion.phase;
  const handY = drawn.top + drawn.visibleH * .48;
  const active = ['attack', 'special', 'ultimate'].includes(p.action);
  const power = active ? 1 : .72;
  if (p.hero === 'albert') {
    ctx.save(); ctx.globalAlpha = .82 * power; ctx.fillStyle = '#ffd84a'; ctx.strokeStyle = '#5c2a00'; ctx.lineWidth = 2;
    const swing = p.action === 'attack' ? 18 : Math.sin(phase * 1.7) * 5;
    ctx.beginPath(); ctx.arc(x + facing * (drawn.w * .24 + swing), handY - 2, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - facing * drawn.w * .18, handY + 6, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  } else if (p.hero === 'geovanna') {
    drawBananaWand(x + facing * drawn.w * .24, handY - 4, 20, facing, phase, .90 * power);
  } else if (p.hero === 'romulo') {
    drawController(x + facing * drawn.w * .23, handY, 17, facing, phase, .88 * power);
  } else if (p.hero === 'arthur') {
    drawDigitalBlade(x + facing * drawn.w * .25, handY, 62, facing, phase, .92 * power);
  } else if (p.hero === 'guilherme') {
    drawStaff(x + facing * drawn.w * .25, handY + 6, 82, '#8ff7ff', facing, phase, .90 * power);
  }
}

function drawEnemyWeapon(e, x, y, footY, drawn, facing, motion) {
  const phase = motion.phase;
  const handY = drawn.top + drawn.visibleH * .50;
  if (e.type === 'otavio') {
    drawFoodShape(x + facing * drawn.w * .26, handY - 4, 13, '#ffcf72', phase, .86);
  } else if (e.type === 'anielle') {
    ctx.save(); ctx.globalAlpha = .55; ctx.strokeStyle = '#ba7cff'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + facing * 18, handY - 8); ctx.quadraticCurveTo(x + facing * 45, handY - 20 + Math.sin(phase)*6, x + facing * 70, handY - 3); ctx.stroke();
    ctx.restore();
  } else if (e.type === 'mito') {
    drawSparkShape(x + facing * drawn.w * .20, drawn.top + drawn.visibleH * .14, 16, '#ff70df', .85);
  } else if (e.type === 'lenda') {
    ctx.save(); ctx.globalAlpha = .62; ctx.strokeStyle = '#ffb12c'; ctx.lineWidth = 6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x - facing * 50, footY - 32); ctx.lineTo(x + facing * 56, footY - 34); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x - facing * 44, footY - 26, 15, 0, Math.PI*2); ctx.arc(x + facing * 42, footY - 26, 15, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  } else if (e.type === 'silvanna' || e.type === 'vanjo') {
    drawBoxShape(x + facing * drawn.w * .25, handY + 8, 17, '#ff5757', phase * .5, .86);
  } else if (e.type === 'napoleao') {
    drawFoodShape(x + facing * drawn.w * .18, drawn.top + drawn.visibleH * .45, 16, '#ffd88a', phase, .82);
  }
}

function drawHeroPersonality(p, x, y, footY, drawn, facing, motion) {
  const meta = CHARACTER_ANIM[p.hero] || { color: '#fff', aura: '#fff' };
  const phase = motion.phase;
  const action = p.action || 'idle';
  const active = action === 'attack' || action === 'special' || action === 'ultimate';
  const mood = p.hitFlash > 0 ? 'hit' : active ? 'focus' : 'idle';
  const headY = drawn.top + drawn.visibleH * .19;
  const handY = drawn.top + drawn.visibleH * .48;
  ctx.save();

  drawExpressionMark(x + facing * drawn.w * .02, headY, Math.max(14, drawn.visibleH * .09), facing, mood, meta.color);
  drawHeroWeapon(p, x, y, footY, drawn, facing, motion);

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
  if (p.dodgeTimer > 0) {
    ctx.globalAlpha = .26; ctx.strokeStyle = '#bff3ff'; ctx.lineWidth = 4; ctx.setLineDash([8, 7]);
    ctx.beginPath(); ctx.ellipse(x, y + 8, 64, 48, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  if (p.hero === 'arthur' && (p.ego || 0) > 0) {
    ctx.globalAlpha = .18 + Math.min(.18, p.ego * .035); ctx.strokeStyle = '#18d4ff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, headY + 28, 38 + p.ego * 4, 0, Math.PI * 2); ctx.stroke();
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
    for (let i = 0; i < count; i++) {
      const a = phase * .9 + i * Math.PI * 2 / count;
      drawHeartShape(x + Math.cos(a) * 36, headY + 20 + Math.sin(a) * 13, 7 + (i % 2), '#ff8ad6', .28 + .20 * Math.sin(a + phase));
    }
  } else if (p.hero === 'romulo') {
    ctx.strokeStyle = '#bff3ff'; ctx.lineWidth = 2;
    ctx.globalAlpha = .50;
    for (let i = 0; i < 3; i++) {
      const a = phase + i * 2.1;
      ctx.save(); ctx.translate(x + Math.cos(a) * 34, handY + Math.sin(a) * 12); ctx.rotate(a);
      roundRect(ctx, -7, -10, 14, 20, 3); ctx.stroke();
      drawDiamondShape(0, 0, 3, '#bff3ff', .75);
      ctx.restore();
    }
  } else if (p.hero === 'arthur') {
    ctx.globalAlpha = active ? .62 : .34;
    ctx.strokeStyle = '#18d4ff'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const yy = headY + 4 + i * 11 + Math.sin(phase * 2 + i) * 3;
      ctx.beginPath(); ctx.moveTo(x - 32 + i * 4, yy); ctx.lineTo(x + 32 - i * 3, yy + Math.sin(phase + i) * 4); ctx.stroke();
    }
    drawBoxShape(x + facing * 35, handY - 8, 6, '#18d4ff', phase, .55);
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
  const headY = drawn.top + drawn.visibleH * (e.type === 'napoleao' ? .34 : .18);
  const handY = drawn.top + drawn.visibleH * .50;
  ctx.save();
  drawExpressionMark(x + facing * drawn.w * .02, headY, Math.max(15, drawn.visibleH * .10), facing, e.hitFlash > 0 ? 'hit' : 'evil', meta.color);
  drawEnemyWeapon(e, x, y, footY, drawn, facing, motion);
  if (e.defenseTimer > 0) {
    ctx.globalAlpha = .30; ctx.strokeStyle = '#ffb12c'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.ellipse(x, y + 8, drawn.w * .48, drawn.visibleH * .34, 0, 0, Math.PI * 2); ctx.stroke();
  }
  if ((e.type === 'silvanna' || e.type === 'vanjo') && (e.rage || 0) > 6) {
    ctx.globalAlpha = Math.min(.30, .08 + e.rage * .008); ctx.strokeStyle = (e.type === 'silvanna' ? '#e83e8c' : '#ff5757'); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, y + 4, 62 + Math.sin(phase*2)*4, 0, Math.PI * 2); ctx.stroke();
  }
  if (e.type === 'napoleao' && (e.phase || 1) > 1) {
    ctx.globalAlpha = e.phase >= 3 ? .36 : .22; ctx.strokeStyle = '#ffd166'; ctx.lineWidth = e.phase >= 3 ? 8 : 5;
    ctx.beginPath(); ctx.arc(x, y + 10, 72 + e.phase * 14, 0, Math.PI * 2); ctx.stroke();
  }

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
    ctx.globalAlpha = action === 'attack' || action === 'special' ? .42 : .24;
    ctx.strokeStyle = '#ba7cff'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.arc(x + facing * (34 + i * 10), headY + 18 + Math.sin(phase * 2 + i) * 4, 9 + i * 6, -0.8, 0.9); ctx.stroke();
    }
  } else if (e.type === 'otavio') {
    ctx.globalAlpha = .52;
    for (let i = 0; i < 4; i++) {
      const a = phase + i * 1.4;
      drawFoodShape(x + Math.cos(a) * 34, handY + Math.sin(a * 1.3) * 10, 5, '#ffcf72', a, .55);
    }
  } else if (e.type === 'mito') {
    ctx.globalAlpha = .48 + .18 * Math.sin(phase * 2.2);
    ctx.fillStyle = '#ffd6ff';
    // brilho saindo da testa enorme: poder é Testa Astral, não arremesso de gloss.
    ctx.beginPath(); ctx.ellipse(x, headY - 8, 19 + Math.sin(phase * 2) * 2, 8, 0, 0, Math.PI * 2); ctx.fill();
    drawSparkShape(x + facing * 26, headY - 8, 8, '#ff70df', .65);
    drawOrbitParticles(x, y, 58, '#ff70df', phase, 7);
  } else if (e.type === 'lenda') {
    ctx.globalAlpha = .58;
    ctx.strokeStyle = '#ffb12c'; ctx.lineWidth = 4;
    const wheel = Math.sin(phase * 2);
    ctx.beginPath(); ctx.arc(x - facing * 36, footY - 16, 12 + wheel * 2, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + facing * 25, footY - 14, 10 - wheel * 1.5, 0, Math.PI * 2); ctx.stroke();
    if (motion.moving || action === 'special') drawActionArc(x + facing * 38, handY + 20, 60, facing, '#ffb12c', .65);
  } else if (e.type === 'silvanna' || e.type === 'vanjo') {
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
    drawSparkShape(x + Math.cos(phase) * 58, headY + 24 + Math.sin(phase) * 14, 10, '#ffd88a', .55);
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
  const footY = y + 30;
  const facing = Math.abs(p.dirX || 0) > .12 ? ((p.dirX || 1) < 0 ? -1 : 1) : motion.facing;

  ctx.save();
  ctx.globalAlpha = alpha;

  if (p.id === meId) {
    ctx.save();
    ctx.globalAlpha *= .34;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(x, footY - 28, 60, 76, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(0,0,0,.36)';
  ctx.beginPath(); ctx.ellipse(x, footY + 3, motion.moving ? 52 : 44, motion.moving ? 17 : 14, 0, 0, Math.PI * 2); ctx.fill();
  if (motion.moving) drawStepDust(x, footY + 2, motion.phase, stageDustColor());

  const glow = p.hitFlash > 0 ? '#ff6b6b' : p.ultimate >= 100 ? '#ffd166' : (p.hero === 'guilherme' ? '#7bd3ff' : null);
  const drawn = drawSpriteImage(p.hero, x, footY, height, facing, 1, glow, motion, { name: p.action, timer: p.actionTimer, hit: p.hitFlash });
  drawHeroPersonality(p, x, y, footY, drawn, facing, motion);

  if (p.dead) {
    ctx.save();
    ctx.globalAlpha = .45;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x - 18, y - 18); ctx.lineTo(x + 18, y + 18); ctx.moveTo(x + 18, y - 18); ctx.lineTo(x - 18, y + 18); ctx.stroke();
    ctx.restore();
  }

  drawNameplate({ name: p.name, hp: p.hp, maxHp: p.maxHp, shield: p.shield }, x, Math.max(24, drawn.top - 30), 98);
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
  const footY = y + e.radius + 18 * grow;
  const facing = Math.abs(e.vx || 0) > 8 ? ((e.vx || 1) < 0 ? -1 : 1) : (x > view.w / 2 ? -1 : 1);
  const glow = e.hitFlash > 0 ? '#ff6b6b' : e.mark > 0 ? '#ff73cc' : (e.type === 'napoleao' ? '#ffd166' : e.color);

  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,.40)';
  ctx.beginPath(); ctx.ellipse(x, footY + 4, Math.max(45, e.radius * 1.45) * grow, Math.max(14, e.radius * .40) * grow, 0, 0, Math.PI*2); ctx.fill();
  if (motion.moving) drawStepDust(x, footY + 4, motion.phase, e.type === 'lenda' ? '#ffb032' : stageDustColor());

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

  if (e.decoyHits > 0) {
    const cloneMotion = { ...motion, moving: false, phase: motion.phase + 1.4 };
    drawSpriteImage(e.type, x - facing * 56, footY + 4, height * .96, facing, .30, '#ba7cff', cloneMotion, { name: 'idle', timer: 0, hit: 0 });
  }

  const drawn = drawSpriteImage(e.type, x, footY, height, facing, 1, glow, motion, { name: e.action, timer: e.actionTimer, hit: e.hitFlash });
  drawEnemyPersonality(e, x, y, footY, drawn, facing, motion);

  if (e.stun > 0) drawStatusText(x, Math.max(24, drawn.top - 44), 'stun', '#7bd3ff');
  if (e.mark > 0) drawStatusText(x, Math.max(24, drawn.top - 26), 'mark', '#ff78cc');
  drawNameplate({ name: e.name, hp: e.hp, maxHp: e.maxHp }, x, Math.max(24, drawn.top - 18), Math.max(108, e.radius * 2.7));
  ctx.restore();
}

function drawStatusText(x, y, text, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.globalAlpha = .78;
  if (text === 'stun') {
    ctx.setLineDash([7, 6]);
    ctx.beginPath(); ctx.ellipse(x, y + 8, 24, 9, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 10, y + 8, 3, 0, Math.PI * 2); ctx.arc(x + 10, y + 8, 3, 0, Math.PI * 2); ctx.stroke();
  } else {
    drawSparkShape(x, y + 8, 13, color, .8);
  }
  ctx.restore();
}

function drawSmoke(x, y, r) {
  ctx.fillStyle = '#c9c6d2';
  for (let i = 0; i < 8; i++) {
    const a = i/8*Math.PI*2 + performance.now()/600;
    ctx.beginPath(); ctx.arc(x + Math.cos(a)*r*.45, y + Math.sin(a)*r*.22, r*.24, 0, Math.PI*2); ctx.fill();
  }
}


function drawPickup(pk) {
  const age = (performance.now() / 1000) - (pk.born || 0);
  const bob = Math.sin(age * 4) * 4;
  const isHp = pk.kind === 'hp';
  const col = isHp ? '#56e08a' : '#c07dff';
  const colDark = isHp ? '#1f8f4d' : '#6d3fb0';
  const r = 15;
  ctx.save();
  ctx.translate(pk.x, pk.y + bob);
  // pisca quando está prestes a sumir
  if (pk.ttl < 3 && Math.floor(age * 6) % 2 === 0) ctx.globalAlpha = 0.35;
  // brilho
  ctx.shadowColor = col; ctx.shadowBlur = 22;
  // frasco
  ctx.fillStyle = colDark;
  ctx.beginPath(); ctx.roundRect(-9, -6, 18, 20, 7); ctx.fill();
  // líquido
  ctx.shadowBlur = 12;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.roundRect(-6, 0, 12, 11, 5); ctx.fill();
  // rolha
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#caa46a';
  ctx.fillRect(-4, -11, 8, 6);
  // símbolo
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(isHp ? '✚' : '★', 0, 7);
  // aro no chão
  ctx.globalAlpha *= 0.5;
  ctx.strokeStyle = col; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 18 - bob, 14, 5, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawProjectile(pr) {
  ctx.save();
  const color = pr.color || '#fff';
  const speed = Math.hypot(pr.vx || 0, pr.vy || 0);
  const dx = speed > 1 ? (pr.vx || 0) / speed : 1;
  const dy = speed > 1 ? (pr.vy || 0) / speed : 0;
  const angle = Math.atan2(dy, dx);
  if (quality !== 'performance' && perfLevel < 1) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    const grd = ctx.createLinearGradient(pr.x - dx * pr.radius * 5, pr.y - dy * pr.radius * 5, pr.x, pr.y);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(.45, alphaColor(color, '77'));
    grd.addColorStop(1, color);
    ctx.strokeStyle = grd;
    ctx.lineWidth = pr.radius * 1.15;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(pr.x - dx * pr.radius * 5, pr.y - dy * pr.radius * 5); ctx.lineTo(pr.x, pr.y); ctx.stroke();
  }

  const shape = pr.shape || '';
  if (shape === 'heart') {
    drawHeartShape(pr.x, pr.y, pr.radius * .92, color, .95);
  } else if (shape === 'card') {
    ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(angle); ctx.fillStyle = '#eefbff'; ctx.strokeStyle = color; ctx.lineWidth = 2;
    roundRect(ctx, -pr.radius * .7, -pr.radius, pr.radius * 1.4, pr.radius * 2, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
  } else if (shape === 'codeSlash') {
    ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(angle); ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-pr.radius * 1.4, pr.radius * .8); ctx.lineTo(pr.radius * 1.4, -pr.radius * .8); ctx.stroke();
    drawSparkShape(0, 0, pr.radius * .7, '#ffffff', .75); ctx.restore();
  } else if (shape === 'auraBlade') {
    drawDiamondShape(pr.x, pr.y, pr.radius * 1.2, color, .92);
    ctx.strokeStyle = color; ctx.globalAlpha = .45; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.radius * 1.8, 0, Math.PI * 2); ctx.stroke();
  } else if (shape === 'box') {
    drawBoxShape(pr.x, pr.y, pr.radius, color, angle, .92);
  } else if (shape === 'food' || shape === 'lure') {
    drawFoodShape(pr.x, pr.y, pr.radius, color, angle, .92);
  } else {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff9'; ctx.beginPath(); ctx.arc(pr.x - pr.radius*.25, pr.y - pr.radius*.25, pr.radius*.35, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawEffect(fx) {
  const progress = 1 - (fx.ttl / Math.max(.001, fx.life || 1));
  const remain = 1 - progress;
  ctx.save();
  const color = fx.color || '#fff';
  if (fx.type === 'text') {
    ctx.restore();
    return;
  } else if (fx.type === 'beam') {
    const x2 = Number.isFinite(fx.x2) ? fx.x2 : fx.x;
    const y2 = Number.isFinite(fx.y2) ? fx.y2 : fx.y;
    ctx.globalAlpha = .82 * remain;
    ctx.strokeStyle = color; ctx.lineCap = 'round';
    if (quality !== 'performance') { ctx.shadowColor = color; ctx.shadowBlur = 18; }
    ctx.lineWidth = (fx.r || 14) * (.55 + progress * .45);
    ctx.beginPath(); ctx.moveTo(fx.x, fx.y); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.globalAlpha = .55 * remain;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(fx.x, fx.y); ctx.lineTo(x2, y2); ctx.stroke();
    drawSparkShape(x2, y2, (fx.r || 14) * 1.2, color, .55 * remain);
  } else if (fx.type === 'gossipWave') {
    const x2 = Number.isFinite(fx.x2) ? fx.x2 : fx.x;
    const y2 = Number.isFinite(fx.y2) ? fx.y2 : fx.y;
    ctx.globalAlpha = .58 * remain;
    ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.lineCap = 'round';
    if (quality !== 'performance') { ctx.shadowColor = color; ctx.shadowBlur = 12; }
    for (let i = 0; i < 3; i++) {
      const off = (i - 1) * 18;
      ctx.beginPath();
      ctx.moveTo(fx.x, fx.y + off * .25);
      ctx.quadraticCurveTo((fx.x + x2) / 2, (fx.y + y2) / 2 + off + Math.sin(progress * Math.PI + i) * 22, x2, y2 + off * .2);
      ctx.stroke();
    }
    drawSparkShape(x2, y2, 12 + progress * 10, color, .50 * remain);
  } else if (fx.type === 'puddle') {
    const r = fx.r || 90;
    ctx.globalAlpha = .30 * remain;
    const grd = ctx.createRadialGradient(fx.x, fx.y, 5, fx.x, fx.y, r);
    grd.addColorStop(0, alphaColor(color, 'bb'));
    grd.addColorStop(.65, alphaColor(color, '55'));
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.ellipse(fx.x, fx.y + 14, r, r * .45, Math.sin(progress * 5) * .08, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = .55 * remain;
    ctx.strokeStyle = '#ffd6ff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(fx.x, fx.y + 14, r * (.65 + progress * .25), r * .28, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (fx.type === 'illusion') {
    const sprite = fx.sprite || 'anielle';
    const h = (SPRITE_HEIGHT[sprite] || 210) * .82;
    const fakeMotion = { moving: false, phase: performance.now() / 260 };
    drawSpriteImage(sprite, fx.x, fx.y + 58, h, Math.sin(progress * 8) > 0 ? 1 : -1, .26 * remain, color, fakeMotion, { name: 'special', timer: .4, hit: 0 });
  } else if (fx.type === 'illusionBreak') {
    ctx.globalAlpha = .75 * remain;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI * 2 / 8 + progress * 2.4;
      drawDiamondShape(fx.x + Math.cos(a) * (fx.r || 40) * progress, fx.y + Math.sin(a) * (fx.r || 40) * .55 * progress, 6 + i % 2, color, .75 * remain);
    }
  } else if (fx.type === 'pity') {
    ctx.globalAlpha = .55 * remain;
    drawHeartShape(fx.x, fx.y - 8 - progress * 12, Math.max(12, (fx.r || 60) * .22), color, .55 * remain);
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(fx.x, fx.y + 18, (fx.r || 70) * (.55 + progress*.2), (fx.r || 70) * .26, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (fx.type === 'sparkDodge') {
    ctx.globalAlpha = .76 * remain;
    for (let i = 0; i < 7; i++) {
      const a = i * Math.PI * 2 / 7 + progress * 2;
      drawSparkShape(fx.x + Math.cos(a) * (fx.r || 38) * progress, fx.y + Math.sin(a) * (fx.r || 38) * .5 * progress, 7, color, .76 * remain);
    }
  } else if (fx.type === 'dash') {
    // Rastro de esquiva: elipse alongada que desfaz, dando sensação de velocidade.
    ctx.globalAlpha = remain * .5;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(fx.x, fx.y, (fx.r || 34) * (0.6 + progress), (fx.r || 34) * .42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = remain * .85;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(fx.x, fx.y, (fx.r || 34) * (0.6 + progress), (fx.r || 34) * .42, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (fx.type === 'hazard' && fx.x2 != null) {
    // Aviso de tiro do chefe: linha de mira + alvo no jogador, piscando para dar tempo de desviar.
    const blink = .35 + .35 * Math.sin(progress * Math.PI * 6);
    ctx.globalAlpha = Math.max(0, remain * (0.35 + blink));
    ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.setLineDash([18, 12]);
    ctx.beginPath(); ctx.moveTo(fx.x, fx.y); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = remain * (0.5 + blink * 0.5);
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(fx.x2, fx.y2, 30 * (0.7 + progress * 0.5), 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(fx.x2, fx.y2, 10, 0, Math.PI*2); ctx.fill();
  } else if (fx.type === 'ring' || fx.type === 'hit' || fx.type === 'hazard' || fx.type === 'slash') {
    ctx.globalAlpha = remain;
    ctx.strokeStyle = color; ctx.lineWidth = fx.type === 'hazard' ? 10 : 6;
    if (fx.type === 'hazard') ctx.setLineDash([15, 10]);
    ctx.beginPath(); ctx.arc(fx.x, fx.y, (fx.r || 50) * (.45 + progress*.65), 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
    if (fx.type === 'hazard') {
      ctx.globalAlpha = .13 * remain;
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r || 50, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawAimLine() {
  // Mira AUTOMÁTICA: mostra um cadeado no inimigo vivo mais próximo do meu jogador.
  const me = myGamePlayer();
  if (!me || me.dead || !game) return;
  let best = null, bd = Infinity;
  for (const e of game.enemies || []) {
    if (e.hp <= 0 || e.invisible) continue;
    const d = Math.hypot(e.x - me.x, e.y - me.y);
    if (d < bd) { bd = d; best = e; }
  }
  if (!best) return;
  const autoRange = me.hero === 'albert' ? 230 : 700;
  if (bd > autoRange) return;
  const t = performance.now() / 300;
  const r = (best.radius || 34) + 14 + Math.sin(t) * 2;
  ctx.save();
  ctx.globalAlpha = .8;
  ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 3;
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2 + t * 0.4;
    ctx.beginPath();
    ctx.arc(best.x, best.y, r, a + 0.18, a + Math.PI / 2 - 0.18);
    ctx.stroke();
  }
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
  const compact = device.mobile || view.cssH < 430;
  setButtonHtml('attackTouch', compact ? 'ATK' : (h.attackName || 'ATACAR'), attackReady ? (compact ? 'pronto' : 'clique/espaço') : `${Math.ceil(me.attackCd)}s`);
  setButtonHtml('specialTouch', compact ? 'HAB' : (h.specialName || 'HABILIDADE'), specialReady ? (compact ? 'Q' : 'Q pronto') : `Q · ${Math.ceil(me.specialCd)}s`);
  setButtonHtml('ultimateTouch', compact ? 'ULT' : (h.ultimateName || 'ULTIMATE'), ultimateReady ? (compact ? 'E' : 'E pronto') : `E · ${Math.round(me.ultimate || 0)}%`);
}


function draw(t = 0) {
  requestAnimationFrame(draw);
  updateStageIntroClass();
  const targetFps = getTargetFps();
  const minFrame = 1000 / targetFps;
  if (t - lastDrawTime < minFrame) return;
  const frameDt = t - lastDrawTime;
  lastDrawTime = t;

  updateCameraTransform();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, view.cssW, view.cssH);
  ctx.fillStyle = '#120914'; ctx.fillRect(0, 0, view.cssW, view.cssH);
  // fundo cobre a tela inteira (sem faixas pretas) em qualquer formato
  if (game) drawScreenBackground();

  ctx.save();
  ctx.translate(view.ox, view.oy);
  ctx.scale(view.scale, view.scale);
  drawArena();
  drawStageAnimation();

  if (game) {
    const effects = game.effects || [];
    for (const fx of effects) if (fx.type !== 'text') drawEffect(fx);
    for (const pr of (game.projectiles || [])) drawProjectile(pr);
    for (const pk of (game.pickups || [])) drawPickup(pk);
    const entities = [
      ...(game.players || []).map(p => ({ kind: 'player', y: p.y, data: p })),
      ...(game.enemies || []).map(e => ({ kind: 'enemy', y: e.y, data: e }))
    ].sort((a, b) => a.y - b.y);
    for (const item of entities) item.kind === 'player' ? drawPlayer(item.data) : drawEnemy(item.data);
    drawAimLine();
    for (const fx of effects) if (fx.type === 'text') drawEffect(fx);
    drawStageIntro();
  } else {
    ctx.fillStyle = '#fff6dd'; ctx.font = 'bold 42px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Arena das Sete Chamas', view.w/2, view.h/2);
  }
  ctx.restore();
  recordFrameCost(frameDt);
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

// APK: avisa para desinstalar o antigo antes de instalar (assinatura nova)
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('apkBtn');
  if (btn) btn.addEventListener('click', () => {
    try {
      toast('Baixando o APK novo. IMPORTANTE: desinstale o app antigo antes de instalar este (a assinatura foi renovada).');
    } catch (e) {}
  });
});

// ============================================================
// SOM (procedural via WebAudio, sem baixar arquivo) + VIBRAÇÃO
// ============================================================
(function () {
  const SND_KEY = 'asc_snd_on', VIB_KEY = 'asc_vib_on';
  let soundOn = localStorage.getItem(SND_KEY) !== '0';
  let vibOn = localStorage.getItem(VIB_KEY) !== '0';
  let actx = null, master = null;

  function ensureCtx() {
    if (!soundOn) return null;
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
      master = actx.createGain();
      master.gain.value = 0.5;
      master.connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume().catch(() => {});
    return actx;
  }
  // Tom básico com envelope
  function tone(freq, dur, type = 'sine', vol = 0.25, when = 0, glideTo = null) {
    const ac = ensureCtx(); if (!ac) return;
    const t0 = ac.currentTime + when;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, glideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function noise(dur, vol = 0.25, when = 0, freq = 1200, q = 0.8) {
    const ac = ensureCtx(); if (!ac) return;
    const t0 = ac.currentTime + when;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
  }
  const sfx = {
    attack()  { noise(0.10, 0.14, 0, 900, 0.7); tone(180, 0.08, 'square', 0.07, 0, 120); },
    hit()     { noise(0.08, 0.18, 0, 500, 0.6); tone(120, 0.10, 'triangle', 0.14, 0, 70); },
    hurt()    { tone(220, 0.18, 'sawtooth', 0.20, 0, 90); noise(0.12, 0.12, 0, 350, 0.6); },
    ultimate(){ tone(160, 0.5, 'sawtooth', 0.22, 0, 720); tone(320, 0.5, 'square', 0.10, 0.05, 900); noise(0.4, 0.16, 0.05, 1500, 0.5); },
    special() { tone(420, 0.28, 'sine', 0.16, 0, 840); tone(630, 0.22, 'triangle', 0.10, 0.04); },
    pickupHp(){ tone(523, 0.10, 'sine', 0.20, 0); tone(784, 0.14, 'sine', 0.20, 0.09); },
    pickupUl(){ tone(440, 0.10, 'triangle', 0.20, 0); tone(660, 0.10, 'triangle', 0.20, 0.08); tone(880, 0.16, 'triangle', 0.18, 0.16); },
    bossDie() { tone(300, 0.5, 'sawtooth', 0.22, 0, 60); noise(0.45, 0.20, 0.05, 400, 0.5); },
    level()   { [523,659,784,1046].forEach((f,i)=>tone(f, 0.16, 'triangle', 0.18, i*0.09)); },
    victory() { [523,659,784,1046,784,1046].forEach((f,i)=>tone(f, 0.22, 'triangle', 0.18, i*0.13)); },
    defeat()  { [392,330,262,196].forEach((f,i)=>tone(f, 0.3, 'sawtooth', 0.16, i*0.16, f*0.85)); },
    ui()      { tone(660, 0.06, 'sine', 0.12); }
  };
  function vibrate(pattern) {
    if (!vibOn) return;
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
  }
  // Destrava o áudio no primeiro toque/clique (política dos navegadores)
  function unlock() { ensureCtx(); }
  window.addEventListener('pointerdown', unlock, { once: false });
  window.addEventListener('keydown', unlock, { once: false });

  // Botões de ligar/desligar (ícones) no canto superior
  function makeToggle(id, label, on, onToggle) {
    const b = document.createElement('button');
    b.id = id; b.type = 'button';
    b.style.cssText = 'position:fixed;top:52px;z-index:99999;width:40px;height:40px;border-radius:50%;border:2px solid rgba(255,215,120,.6);background:rgba(20,10,28,.72);color:#ffd87a;font-size:18px;line-height:1;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4);';
    b.setAttribute('aria-label', label);
    const render = () => { b.textContent = on() ? b.dataset.onIcon : b.dataset.offIcon; b.style.opacity = on() ? '1' : '.45'; };
    b.addEventListener('click', (e) => { e.stopPropagation(); onToggle(); render(); sfx.ui && unlock(); });
    return { b, render };
  }
  window.addEventListener('DOMContentLoaded', () => {
    const sBtn = makeToggle('sndToggle', 'Som', () => soundOn, () => {
      soundOn = !soundOn; localStorage.setItem(SND_KEY, soundOn ? '1' : '0');
      if (soundOn) ensureCtx();
    });
    sBtn.b.dataset.onIcon = '🔊'; sBtn.b.dataset.offIcon = '🔇'; sBtn.b.style.right = '58px';
    const vBtn = makeToggle('vibToggle', 'Vibração', () => vibOn, () => {
      vibOn = !vibOn; localStorage.setItem(VIB_KEY, vibOn ? '1' : '0');
      if (vibOn) vibrate([30]);
    });
    vBtn.b.dataset.onIcon = '📳'; vBtn.b.dataset.offIcon = '📴'; vBtn.b.style.right = '10px';
    document.body.appendChild(sBtn.b); document.body.appendChild(vBtn.b);
    sBtn.render(); vBtn.render();
  });

  // ---- Gatilhos de som/vibração a partir do estado do jogo ----
  const seenFx = new Set();
  let prevMe = null, prevEnemies = null, prevStage = null, prevOver = null, prevVictory = null, prevStageClear = null;
  function me() { return (window.game && (window.game.players || []).find(p => p.id === (window.meId || null))) || null; }

  window.__sfx = sfx; // para testes
  window.addEventListener('state:applied', () => {
    const g = window.game; if (!g) return;
    // Efeitos novos do servidor (poção coletada)
    for (const fx of (g.effects || [])) {
      if (fx.type === 'pickup' && !seenFx.has(fx.id)) {
        seenFx.add(fx.id);
        const m = me();
        if (m && Math.hypot((fx.x || m.x) - m.x, (fx.y || m.y) - m.y) < 160) {
          if (fx.kind === 'hp') { sfx.pickupHp(); vibrate([25]); }
          else { sfx.pickupUl(); vibrate([18, 30, 18]); }
        }
      }
    }
    if (seenFx.size > 400) seenFx.clear();

    const m = me();
    if (m && prevMe) {
      // levei dano
      if (m.hp < prevMe.hp && !m.dead) { sfx.hurt(); vibrate([45, 40, 45]); }
      // morri
      if (m.dead && !prevMe.dead) { sfx.defeat(); vibrate([80, 60, 80, 60, 120]); }
      // ultimate usada (carga zerou de repente)
      if (prevMe.ultimate > 70 && (m.ultimate || 0) <= 12 && (m.action === 'ultimate' || m.actionTimer > 0.3)) { sfx.ultimate(); vibrate([30, 20, 30, 20, 60]); }
      else if (m.action === 'special' && prevMe.action !== 'special') { sfx.special(); }
      else if ((m.action === 'attack' || m.action === 'melee') && prevMe.action !== 'attack' && prevMe.action !== 'melee') { sfx.attack(); }
    }
    // chefe morrendo
    if (prevEnemies) {
      for (const e of (g.enemies || [])) {
        const pe = prevEnemies.find(x => x.id === e.id);
        if (pe && pe.hp > 0 && e.hp <= 0) { sfx.bossDie(); vibrate([20, 30, 20]); }
      }
    }
    // fase nova
    if (prevStage !== null && g.stageIndex > prevStage) { sfx.level(); vibrate([25, 50, 25]); }
    // vitória / derrota
    if (g.gameOver && !prevOver) { g.victory ? sfx.victory() : sfx.defeat(); vibrate(g.victory ? [60, 60, 60] : [120, 80, 160]); }

    prevMe = m ? { hp: m.hp, dead: m.dead, ultimate: m.ultimate || 0, action: m.action } : null;
    prevEnemies = (g.enemies || []).map(e => ({ id: e.id, hp: e.hp }));
    prevStage = g.stageIndex; prevOver = g.gameOver;
  });
})();
