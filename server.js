const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const WORLD = { w: 1600, h: 900 };
const PLAYER_BOUNDS = { minX: 92, maxX: WORLD.w - 92, minY: 215, maxY: WORLD.h - 300 };
const ENEMY_BOUNDS = { minX: 105, maxX: WORLD.w - 105, minY: 285, maxY: WORLD.h - 300 };
const MAX_PLAYERS = 5;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.apk': 'application/vnd.android.package-archive'
};

const HEROES = {
  albert: {
    key: 'albert', name: 'Albert', title: 'Brigão Competitivo', color: '#1e57d6', alt: '#a0162c',
    hp: 360, speed: 235, radius: 23, attackCd: 0.48, specialCd: 7.5,
    attackName: 'Soco de Discussão', specialName: 'Briga Sem Fim', ultimateName: 'Eu Não Perco'
  },
  geovanna: {
    key: 'geovanna', name: 'Geovanna', title: 'Psicóloga Ciumenta', color: '#ffd447', alt: '#ff69b4',
    hp: 275, speed: 245, radius: 21, attackCd: 0.55, specialCd: 7,
    attackName: 'Olhar de Ciúmes', specialName: 'Sessão de Psicóloga', ultimateName: 'Ciúmes Estratégico'
  },
  romulo: {
    key: 'romulo', name: 'Rômulo', title: 'Jogador Nato', color: '#858b95', alt: '#3ea86d',
    hp: 300, speed: 238, radius: 22, attackCd: 0.5, specialCd: 8,
    attackName: 'Jogada Segura', specialName: 'Prever Movimento', ultimateName: 'Xeque-Mate Gamer'
  },
  arthur: {
    key: 'arthur', name: 'Arthur', title: 'Hacker do Ego', color: '#111111', alt: '#18d4ff',
    hp: 285, speed: 252, radius: 21, attackCd: 0.44, specialCd: 7.5,
    attackName: 'Código Cortante', specialName: 'Hack de Sistema', ultimateName: 'Admin Supremo'
  },
  guilherme: {
    key: 'guilherme', name: 'Guilherme', title: 'General da Aura', color: '#16a9ff', alt: '#9df4ff',
    hp: 295, speed: 240, radius: 21, attackCd: 0.52, specialCd: 8.5,
    attackName: 'Corte Social', specialName: 'Estratégia de Guerra', ultimateName: 'Operação Aura Máxima'
  }
};

const DIFFICULTY = {
  // Levels corrigidos: fácil tem dano baixo e reviver rápido; médio é padrão; difícil é intenso sem virar injusto.
  facil: { key: 'facil', label: 'Fácil', enemyHp: 1.02, enemyDmg: 0.28, enemySpeed: 0.78, respawn: 2.0, healBetween: 1.0, levelHp: 0.07, levelDmg: 0.025 },
  medio: { key: 'medio', label: 'Médio', enemyHp: 1.32, enemyDmg: 0.50, enemySpeed: 0.90, respawn: 3.2, healBetween: 0.90, levelHp: 0.09, levelDmg: 0.035 },
  dificil: { key: 'dificil', label: 'Difícil', enemyHp: 1.66, enemyDmg: 0.66, enemySpeed: 0.98, respawn: 4.6, healBetween: 0.76, levelHp: 0.115, levelDmg: 0.045 }
};

const ENEMIES = {
  otavio: { type: 'otavio', name: 'Otávio', hp: 185, dmg: 20, speed: 92, radius: 31, color: '#8f3149', boss: true },
  anielle: { type: 'anielle', name: 'Anielle', hp: 155, dmg: 17, speed: 115, radius: 25, color: '#2f8a5a', boss: true },
  mito: { type: 'mito', name: 'Mito', hp: 310, dmg: 22, speed: 150, radius: 30, color: '#c96cff', boss: true },
  lenda: { type: 'lenda', name: 'Lenda', hp: 455, dmg: 30, speed: 82, radius: 42, color: '#ff9e2c', boss: true },
  silvanna: { type: 'silvanna', name: 'Silvanna', hp: 520, dmg: 32, speed: 82, radius: 42, color: '#e83e8c', boss: true },
  napoleao: { type: 'napoleao', name: 'Napoleão', hp: 680, dmg: 28, speed: 92, radius: 42, color: '#c58146', boss: true }
};

const STAGES = [
  {
    level: 1,
    title: 'Lama e Esgoto: Otávio + Anielle',
    venue: 'Lugar sujo de lama e esgoto',
    subtitle: 'Otávio manipula com promessa de lanche enquanto Anielle espalha fofoca venenosa.',
    background: 'stage1_lama_esgoto',
    enemies: ['otavio', 'anielle']
  },
  {
    level: 2,
    title: 'IFS: Brilho do Mito',
    venue: 'Campus inspirado no IFS',
    subtitle: 'Mito usa Testa Astral e transforma o pátio em chão de Gloss Caótico.',
    background: 'stage2_ifs_mito',
    enemies: ['mito']
  },
  {
    level: 3,
    title: 'Casa Mística: A Lenda',
    venue: 'Terreiro/casa mística da Lenda',
    subtitle: 'Velas, fumaça e a Bros 2009 amarela anunciam a investida da Lenda.',
    background: 'stage3_terreiro_lenda',
    enemies: ['lenda']
  },
  {
    level: 4,
    title: 'Quarto da Silvanna: Mamãe Má',
    venue: 'O quarto particular da Silvanna',
    subtitle: 'Silvanna, a mãe da Mito, some nas sombras e volta com a Massagem Final.',
    background: 'stage4_supermercado_vanjo',
    enemies: ['silvanna']
  },
  {
    level: 5,
    title: 'Reino de Comidas: Napoleão',
    venue: 'Reino final de comidas',
    subtitle: 'Napoleão domina mesas, lanches e molhos antes da batalha final.',
    background: 'stage5_reino_comidas',
    enemies: ['napoleao']
  }
];
let nextEntityId = 1;
const rooms = new Map();
const socketRoom = new Map();

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify({ ok: true, service: 'arena-sete-chamas-online', rooms: rooms.size }));
      return;
    }
    if (pathname === '/') pathname = '/index.html';
    const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Arquivo não encontrado');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const headers = {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' || ext === '.apk' ? 'no-cache' : 'public, max-age=3600'
      };
      if (ext === '.apk') headers['Content-Disposition'] = 'attachment; filename="ArenaSeteChamas.apk"';
      res.writeHead(200, headers);
      res.end(data);
    });
  } catch (err) {
    res.writeHead(500);
    res.end('Erro interno');
  }
});

const io = new Server(server, {
  cors: { origin: '*' },
  maxHttpBufferSize: 1e5
});

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function clampEntity(ent, bounds = PLAYER_BOUNDS) {
  ent.x = clamp(ent.x, bounds.minX, bounds.maxX);
  ent.y = clamp(ent.y, bounds.minY, bounds.maxY);
  return ent;
}
function setAction(ent, action, seconds = 0.35) {
  ent.action = action;
  ent.actionTimer = Math.max(ent.actionTimer || 0, seconds);
}
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function nowMs() { return Date.now(); }
function sanitizeName(name) {
  return String(name || 'Jogador').replace(/[<>]/g, '').trim().slice(0, 18) || 'Jogador';
}
function rand(min, max) { return min + Math.random() * (max - min); }
function makeId(prefix) { return `${prefix}${nextEntityId++}`; }
function randomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function makeRoom(hostId) {
  const code = randomCode();
  return {
    code,
    hostId,
    createdAt: nowMs(),
    lastActive: nowMs(),
    difficulty: 'medio',
    players: new Map(),
    started: false,
    gameOver: false,
    victory: false,
    stageIndex: 0,
    stageTimer: 0,
    stageStartTimer: 0,
    stageCleared: false,
    enemies: [],
    projectiles: [],
    pickups: [],
    effects: [],
    messages: [],
    tickCount: 0,
    lastTick: nowMs()
  };
}

function defaultInput() {
  return { mx: 0, my: 0, aimX: null, aimY: null, attack: false, special: false, ultimate: false, dash: false };
}

// Joga um inimigo para trás (knockback) — deixa as trocas de golpe mais fundamentadas.
function applyEnemyKnockback(room, e, fromX, fromY, force = 260) {
  if (!e || e.hp <= 0) return;
  let dx = e.x - fromX, dy = e.y - fromY;
  let len = Math.hypot(dx, dy);
  if (len < 1) { dx = (e.dirX || 1); dy = 0; len = 1; }
  const resist = e.knockResist || (e.type === 'napoleao' ? 0.45 : e.type === 'lenda' ? 0.7 : 1);
  const f = force * resist;
  e.kbx = (e.kbx || 0) + (dx / len) * f;
  e.kby = (e.kby || 0) + (dy / len) * f;
  e.knockTimer = Math.max(e.knockTimer || 0, 0.18);
}


function detachSocketFromCurrentRoom(socket, targetCode = null) {
  const oldCode = socketRoom.get(socket.id);
  if (!oldCode || oldCode === targetCode) return;
  const oldRoom = rooms.get(oldCode);
  if (oldRoom) {
    const oldPlayer = oldRoom.players.get(socket.id);
    if (oldPlayer) {
      if (!oldRoom.started) oldRoom.players.delete(socket.id);
      else { oldPlayer.connected = false; oldPlayer.input = defaultInput(); }
    }
    socket.leave(oldCode);
    if (oldRoom.hostId === socket.id) {
      const newHost = [...oldRoom.players.values()].find(p => p.connected);
      oldRoom.hostId = newHost ? newHost.id : null;
    }
    oldRoom.lastActive = nowMs();
    if ((oldRoom.players.size === 0 || !oldRoom.hostId) && !oldRoom.started) rooms.delete(oldCode);
    else emitLobby(oldRoom);
  }
  socketRoom.delete(socket.id);
  emitRoomList();
}

function addPlayer(room, socket, name) {
  const player = {
    id: socket.id,
    name: sanitizeName(name),
    hero: null,
    ready: false,
    connected: true,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    dirX: 1,
    dirY: 0,
    hp: 1,
    maxHp: 1,
    shield: 0,
    attackCd: 0,
    specialCd: 0,
    ultimate: 0,
    aura: 0,
    rivalry: 0,
    damageBoost: 1,
    damageBoostTimer: 0,
    slowTimer: 0,
    dodgeTimer: 0,
    dodgeChance: 0,
    ego: 0,
    egoTimer: 0,
    respawnTimer: 0,
    hitFlash: 0,
    action: 'idle',
    actionTimer: 0,
    dead: false,
    kills: 0,
    combo: 0,
    comboTimer: 0,
    dashCd: 0,
    dashTimer: 0,
    input: defaultInput()
  };
  room.players.set(socket.id, player);
  socketRoom.set(socket.id, room.code);
  socket.join(room.code);
  room.lastActive = nowMs();
  return player;
}

function removeOrDisconnectPlayer(socketId) {
  const code = socketRoom.get(socketId);
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;
  const player = room.players.get(socketId);
  if (!player) return;

  if (!room.started) {
    room.players.delete(socketId);
  } else {
    player.connected = false;
    player.input = defaultInput();
  }

  if (room.hostId === socketId) {
    const newHost = [...room.players.values()].find(p => p.connected);
    room.hostId = newHost ? newHost.id : null;
  }
  socketRoom.delete(socketId);

  room.lastActive = nowMs();
  if (room.players.size === 0 || !room.hostId) {
    if (!room.started) rooms.delete(code);
  } else {
    emitLobby(room);
  }
  emitRoomList();
}

function lobbySnapshot(room) {
  const taken = {};
  for (const p of room.players.values()) if (p.hero) taken[p.hero] = p.id;
  return {
    code: room.code,
    hostId: room.hostId,
    maxPlayers: MAX_PLAYERS,
    difficulty: room.difficulty,
    started: room.started,
    gameOver: room.gameOver,
    victory: room.victory,
    players: [...room.players.values()].map(p => ({
      id: p.id, name: p.name, hero: p.hero, ready: p.ready, connected: p.connected, host: p.id === room.hostId
    })),
    taken
  };
}

function emitLobby(room) {
  io.to(room.code).emit('lobby', lobbySnapshot(room));
}

function publicRoomsSnapshot() {
  const list = [];
  for (const room of rooms.values()) {
    const connectedPlayers = [...room.players.values()].filter(p => p.connected);
    if (room.started || room.gameOver || connectedPlayers.length <= 0 || connectedPlayers.length >= MAX_PLAYERS) continue;
    const host = room.players.get(room.hostId) || connectedPlayers[0];
    list.push({
      code: room.code,
      hostName: host ? host.name : 'Host',
      players: connectedPlayers.length,
      maxPlayers: MAX_PLAYERS,
      difficulty: room.difficulty,
      ready: connectedPlayers.filter(p => p.ready).length,
      heroes: connectedPlayers.map(p => p.hero).filter(Boolean),
      createdAt: room.createdAt
    });
  }
  list.sort((a, b) => b.createdAt - a.createdAt);
  return list.slice(0, 12);
}

function emitRoomList() {
  io.emit('roomList', publicRoomsSnapshot());
}

function addMessage(room, text, kind = 'info') {
  room.messages.push({ id: makeId('m'), text, kind, t: nowMs() });
  if (room.messages.length > 8) room.messages.shift();
}

function initializePlayers(room) {
  const positions = [
    { x: 250, y: 450 }, { x: 310, y: 370 }, { x: 310, y: 530 }, { x: 380, y: 420 }, { x: 380, y: 490 }
  ];
  let i = 0;
  for (const p of room.players.values()) {
    const h = HEROES[p.hero];
    const pos = positions[i % positions.length];
    p.x = pos.x; p.y = pos.y;
    clampEntity(p, PLAYER_BOUNDS);
    p.vx = 0; p.vy = 0; p.dirX = 1; p.dirY = 0;
    p.action = 'idle';
    p.actionTimer = 0;
    p.hitFlash = 0;
    p.maxHp = h.hp;
    p.hp = h.hp;
    p.shield = 0;
    p.attackCd = 0;
    p.specialCd = 0;
    p.ultimate = 0;
    p.aura = p.hero === 'guilherme' ? 12 : 0;
    p.rivalry = 0;
    p.damageBoost = 1;
    p.damageBoostTimer = 0;
    p.slowTimer = 0;
    p.dodgeTimer = 0;
    p.dodgeChance = 0;
    p.ego = 0;
    p.egoTimer = 0;
    p.respawnTimer = 0;
    p.dead = false;
    p.kills = 0;
    p.input = defaultInput();
    i++;
  }
}

function spawnStage(room) {
  const stage = STAGES[room.stageIndex];
  const diff = DIFFICULTY[room.difficulty];
  const playerCount = Math.max(1, [...room.players.values()].filter(p => p.hero).length);
  const stageLevelScale = 1 + room.stageIndex * (diff.levelHp || 0.09);
  const damageLevelScale = 1 + room.stageIndex * (diff.levelDmg || 0.035);
  const hpScale = diff.enemyHp * stageLevelScale * (1.18 + playerCount * 0.52);
  room.enemies = [];
  room.projectiles = [];
  room.pickups = [];
  room.effects = [];
  room.stageCleared = false;
  room.stageTimer = 0;
  room.stageStartTimer = 4.8;

  const spawnPositions = [
    [{ x: 1260, y: 370 }, { x: 1260, y: 530 }],
    [{ x: 1250, y: 450 }],
    [{ x: 1240, y: 450 }],
    [{ x: 1240, y: 450 }],
    [{ x: 1220, y: 450 }]
  ];
  const positions = spawnPositions[room.stageIndex] || [{ x: 1240, y: 450 }];

  stage.enemies.forEach((type, i) => {
    const base = ENEMIES[type];
    const pos = positions[i % positions.length];
    const enemy = {
      id: makeId('e'), type: base.type, name: base.name,
      x: pos.x + rand(-35, 35), y: pos.y + rand(-40, 40),
      vx: 0, vy: 0,
      maxHp: Math.round(base.hp * hpScale), hp: Math.round(base.hp * hpScale),
      dmg: base.dmg * diff.enemyDmg * damageLevelScale, speed: base.speed * diff.enemySpeed, radius: base.radius,
      color: base.color, boss: true,
      attackCd: rand(0.6, 1.2), specialCd: rand(4, 7),
      stun: 0, slow: 0, mark: 0, forcedTarget: null, forcedTimer: 0,
      invisible: false, vanishTimer: 0, vanishCd: 3.2,
      foodTimer: 5.5, grow: 1, rage: 0, phase: 1,
      defenseTimer: 0, pityTarget: null, pityTimer: 0,
      action: 'idle', actionTimer: 0, decoyHits: type === 'anielle' ? 1 : 0,
      hitFlash: 0
    };
    clampEntity(enemy, ENEMY_BOUNDS);
    room.enemies.push(enemy);
  });
  addMessage(room, `${stage.title} começou!`, 'stage');
}

function startGame(room) {
  initializePlayers(room);
  room.started = true;
  room.gameOver = false;
  room.victory = false;
  room.stageIndex = 0;
  room.tickCount = 0;
  room.lastTick = nowMs();
  spawnStage(room);
  emitLobby(room);
}

function nearestEnemy(room, p) {
  let best = null;
  let bestD = Infinity;
  for (const e of room.enemies) {
    if (e.hp <= 0 || e.invisible) continue;
    const d = dist(p, e);
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

function nearestPlayer(room, e) {
  let best = null;
  let bestD = Infinity;
  for (const p of room.players.values()) {
    if (p.dead || p.hp <= 0) continue;
    const d = dist(e, p);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

function lowestAlivePlayer(room) {
  const alive = [...room.players.values()].filter(p => !p.dead && p.hp > 0);
  alive.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
  return alive[0] || null;
}

function getAimDirection(room, p) {
  const input = p.input || defaultInput();
  let dx = Number(input.aimX) - p.x;
  let dy = Number(input.aimY) - p.y;
  let len = Math.hypot(dx, dy);
  if (!Number.isFinite(len) || len < 18) {
    const e = nearestEnemy(room, p);
    if (e) { dx = e.x - p.x; dy = e.y - p.y; len = Math.hypot(dx, dy); }
  }
  if (!Number.isFinite(len) || len < 0.001) {
    dx = p.dirX || 1; dy = p.dirY || 0; len = Math.hypot(dx, dy) || 1;
  }
  return { x: dx / len, y: dy / len };
}

function addEffect(room, effect) {
  room.effects.push({ id: makeId('fx'), ttl: effect.ttl || 0.45, life: effect.ttl || 0.45, ...effect });
  if (room.effects.length > 45) room.effects.splice(0, room.effects.length - 45);
}

function addFloatingText(room, x, y, text, color = '#fff') {
  // A pedido: sem números/frases flutuando na arena. Mantemos apenas efeitos visuais.
  return;
}

function giveUltimate(p, amount) {
  p.ultimate = clamp((p.ultimate || 0) + amount, 0, 100);
}

function damageEnemy(room, enemy, amount, fromPlayer, options = {}) {
  if (!enemy || enemy.hp <= 0 || enemy.invisible) return 0;
  const attacker = fromPlayer ? room.players.get(fromPlayer) : null;
  const boost = attacker ? (attacker.damageBoost || 1) : 1;
  let final = amount * boost;
  if (enemy.mark > 0) final *= 1.28;
  if (options.crit) final *= 1.45;
  final = Math.max(1, Math.round(final));
  if ((enemy.decoyHits || 0) > 0) {
    enemy.decoyHits = Math.max(0, enemy.decoyHits - 1);
    final = Math.max(1, Math.round(final * 0.35));
    addEffect(room, { type: 'illusionBreak', x: enemy.x + rand(-28, 28), y: enemy.y + rand(-18, 18), r: enemy.radius + 44, color: '#ba7cff', ttl: 0.55, life: 0.55 });
  }
  if (enemy.type === 'mito' && Math.random() < 0.08 && !options.guaranteed) {
    final = Math.max(1, Math.round(final * 0.45));
    addEffect(room, { type: 'sparkDodge', x: enemy.x, y: enemy.y - enemy.radius, r: enemy.radius + 18, color: '#ff70df', ttl: 0.32, life: 0.32 });
  }
  if (enemy.type === 'lenda' && (enemy.defenseTimer || 0) > 0) {
    const reflected = attacker ? Math.max(2, Math.round(final * 0.10)) : 0;
    final = Math.max(1, Math.round(final * 0.62));
    if (attacker && reflected > 0) damagePlayer(room, attacker, reflected, enemy.name);
    addEffect(room, { type: 'ring', x: enemy.x, y: enemy.y, r: enemy.radius + 56, color: '#ffb12c', ttl: 0.32, life: 0.32 });
  }
  if (enemy.type === 'napoleao' && enemy.pityTarget === fromPlayer && (enemy.pityTimer || 0) > 0) {
    final = Math.max(1, Math.round(final * 0.58));
    addEffect(room, { type: 'pity', x: enemy.x, y: enemy.y - enemy.radius, r: enemy.radius + 38, color: '#ffd88a', ttl: 0.38, life: 0.38 });
  }
  enemy.hp = Math.max(0, enemy.hp - final);
  enemy.hitFlash = 0.16;
  if ((enemy.actionTimer || 0) <= 0.12) setAction(enemy, enemy.hp <= 0 ? 'defeat' : 'hit', enemy.hp <= 0 ? 0.8 : 0.18);
  addFloatingText(room, enemy.x + rand(-12, 12), enemy.y - enemy.radius - 12, `-${final}`, options.color || '#ffe36e');
  addEffect(room, { type: 'hit', x: enemy.x, y: enemy.y, r: enemy.radius + 8, color: options.color || '#ffe36e', ttl: 0.25, life: 0.25 });
  if (attacker) {
    giveUltimate(attacker, final * 0.18);
    if (attacker.hero === 'guilherme') attacker.aura = clamp((attacker.aura || 0) + final * 0.07, 0, 100);
    if (enemy.hp <= 0) { attacker.kills++; dropBossLoot(room, enemy); }
  }
  return final;
}

// Poções que caem dos chefes: vida (hp) e energia de ultimate (ult)
function spawnPickup(room, x, y, kind) {
  room.pickups.push({
    id: makeId('pk'), kind, x: clamp(x, 90, WORLD.w - 90), y: clamp(y, 150, WORLD.h - 90),
    vx: rand(-60, 60), vy: rand(-60, 60), born: nowMs() / 1000, ttl: 14
  });
}
function dropBossLoot(room, enemy) {
  // Vida cai sempre (ajuda no coop); energia de ultimate cai de vez em quando
  spawnPickup(room, enemy.x + rand(-24, 24), enemy.y + rand(-10, 26), 'hp');
  if (Math.random() < 0.6) spawnPickup(room, enemy.x + rand(-40, 40), enemy.y + rand(-20, 30), 'ult');
}
function updatePickups(room, dt) {
  const t = nowMs() / 1000;
  for (const pk of room.pickups) {
    pk.ttl -= dt;
    // velocidade inicial some rápido (poção para de escorregar)
    pk.x += pk.vx * dt; pk.y += pk.vy * dt;
    pk.vx *= 0.86; pk.vy *= 0.86;
    pk.x = clamp(pk.x, 70, WORLD.w - 70);
    pk.y = clamp(pk.y, 130, WORLD.h - 80);
    // jogador vivo mais próximo: se chegar perto, coleta (ou atrai a poção)
    let best = null, bestD = 1e9;
    for (const p of room.players.values()) {
      if (!p.hero || p.dead || p.hp <= 0) continue;
      const d = Math.hypot(p.x - pk.x, p.y - pk.y);
      if (d < bestD) { bestD = d; best = p; }
    }
    if (best) {
      if (bestD < 150) { // atrai a poção até o jogador
        pk.x += (best.x - pk.x) * Math.min(1, dt * 6);
        pk.y += (best.y - pk.y) * Math.min(1, dt * 6);
      }
      if (bestD < 34) {
        let did = false;
        if (pk.kind === 'hp' && best.hp < best.maxHp) {
          best.hp = Math.min(best.maxHp, best.hp + Math.round(best.maxHp * 0.34) + 55);
          did = true;
        } else if (pk.kind === 'ult') {
          const before = best.ultimate || 0;
          giveUltimate(best, 34);
          if ((best.ultimate || 0) > before) did = true;
        }
        if (did) {
          addEffect(room, { type: 'pickup', kind: pk.kind, x: best.x, y: best.y - best.radius - 6, r: 40,
            color: pk.kind === 'hp' ? '#7df4a8' : '#c07dff', ttl: 0.55, life: 0.55 });
          pk.ttl = -1; // consumida
        }
      }
    }
  }
  room.pickups = room.pickups.filter(pk => pk.ttl > 0).slice(-24);
}

function shieldAbsorb(p, amount) {
  let remaining = amount;
  if (p.shield > 0) {
    const absorbed = Math.min(p.shield, remaining);
    p.shield -= absorbed;
    remaining -= absorbed;
  }
  return remaining;
}

function enemyDamage(e, amount) {
  let out = amount;
  if (e.mark > 0) out *= 0.82; // Geovanna: alvo marcado causa menos dano.
  if (e.type === 'silvanna') out *= Math.min(1.32, 1 + (e.rage || 0) * 0.012); // Mamãe Má: fúria crescente
  if (e.type === 'napoleao' && (e.phase || 1) >= 3) out *= 1.08;
  return out;
}

function damagePlayer(room, p, amount, sourceName = 'Inimigo', options = {}) {
  if (!p || p.dead || p.hp <= 0) return 0;
  let final = Math.max(1, Math.round(amount));
  if ((p.dashTimer || 0) > 0) { // esquiva: invulnerável durante o impulso
    addEffect(room, { type: 'sparkDodge', x: p.x, y: p.y, r: 40, color: '#bfe9ff', ttl: 0.22, life: 0.22 });
    return 0;
  }
  if ((p.dodgeTimer || 0) > 0 && Math.random() < (p.dodgeChance || 0)) {
    addEffect(room, { type: 'ring', x: p.x, y: p.y, r: 58, color: '#bff3ff', ttl: 0.28, life: 0.28 });
    return 0;
  }
  if (p.hero === 'arthur' && (p.ego || 0) > 0) final = Math.round(final * (1 + Math.min(0.12, (p.ego || 0) * 0.018)));
  const beforeShield = final;
  final = shieldAbsorb(p, final);
  if (p.hero === 'guilherme') p.aura = clamp((p.aura || 0) + Math.max(2, beforeShield * 0.10), 0, 100);
  if (final <= 0) {
    addFloatingText(room, p.x, p.y - 38, 'bloqueou', '#80f7ff');
    return 0;
  }
  p.hp = Math.max(0, p.hp - final);
  p.hitFlash = 0.2;
  setAction(p, p.hp <= 0 ? 'dead' : 'hit', p.hp <= 0 ? 1.0 : 0.22);
  addFloatingText(room, p.x, p.y - 38, `-${final}`, '#ff7777');
  addEffect(room, { type: 'hit', x: p.x, y: p.y, r: 32, color: '#ff6565', ttl: 0.28, life: 0.28 });
  if (p.hero === 'albert') p.rivalry = clamp((p.rivalry || 0) + 1, 0, 8);
  if (p.hero === 'geovanna' && p.hp / p.maxHp < 0.35) giveUltimate(p, 5);
  if (options.slow) p.slowTimer = Math.max(p.slowTimer || 0, options.slow);
  if (p.hp <= 0) {
    p.dead = true;
    p.respawnTimer = DIFFICULTY[room.difficulty].respawn;
    addMessage(room, `${p.name} foi derrubado por ${sourceName}!`, 'bad');
  }
  return final;
}

function spawnPlayerProjectile(room, p, cfg) {
  const dir = cfg.dir || getAimDirection(room, p);
  const start = cfg.startDist || 28;
  room.projectiles.push({
    id: makeId('pr'), owner: 'player', from: p.id, hero: p.hero,
    x: p.x + dir.x * start, y: p.y + dir.y * start,
    vx: dir.x * cfg.speed, vy: dir.y * cfg.speed,
    radius: cfg.radius || 9, damage: cfg.damage || 10,
    ttl: cfg.ttl || 1.2, color: cfg.color || '#fff', pierce: cfg.pierce || 0,
    shape: cfg.shape || '', knock: cfg.knock || 0,
    slow: cfg.slow || 0, stun: cfg.stun || 0, mark: cfg.mark || 0
  });
}

function spawnEnemyProjectile(room, e, target, cfg = {}) {
  if (!target) return;
  setAction(e, 'attack', 0.42);
  let dx = target.x - e.x, dy = target.y - e.y;
  let len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  room.projectiles.push({
    id: makeId('ep'), owner: 'enemy', from: e.id, enemyType: e.type,
    x: e.x + dx * (e.radius + 10), y: e.y + dy * (e.radius + 10),
    vx: dx * (cfg.speed || 430), vy: dy * (cfg.speed || 430),
    radius: cfg.radius || 11, damage: cfg.damage || e.dmg,
    ttl: cfg.ttl || 1.6, color: cfg.color || e.color, pierce: cfg.pierce || 0,
    shape: cfg.shape || '',
    slow: cfg.slow || 0, label: cfg.label || ''
  });
}

function playerNormalAttack(room, p) {
  const h = HEROES[p.hero];
  const dir = getAimDirection(room, p);
  p.dirX = dir.x; p.dirY = dir.y;

  // ===== COMBO: sequência de 3 golpes, o 3º é o FINALIZADOR (mais forte + knockback). =====
  p.combo = ((p.combo || 0) % 3) + 1;
  p.comboTimer = 1.6;
  const step = p.combo;                 // 1, 2 ou 3
  const finisher = step === 3;          // golpe final da sequência
  const cm = [1, 1.12, 1.55][step - 1]; // multiplicador de dano do combo
  const cdScale = [1, 0.82, 1.12][step - 1];
  p.attackCd = h.attackCd * cdScale;
  setAction(p, 'attack', finisher ? 0.42 : 0.3);
  if (step === 2) addFloatingText(room, p.x, p.y - 64, 'Combo x2', '#9fe6ff');
  if (finisher) addFloatingText(room, p.x, p.y - 78, 'COMBO x3!', '#ffe27a');

  if (p.hero === 'albert') {
    const reach = finisher ? 78 : 54;
    const cx = p.x + dir.x * reach, cy = p.y + dir.y * reach;
    const dmg = Math.round((18 + (p.rivalry || 0) * 2) * cm);
    let hits = 0;
    for (const e of room.enemies) {
      if (e.hp <= 0 || e.invisible) continue;
      if (Math.hypot(e.x - cx, e.y - cy) <= e.radius + (finisher ? 92 : 70)) {
        damageEnemy(room, e, dmg, p.id, { color: finisher ? '#fff07a' : '#ffdf58' });
        if (finisher) applyEnemyKnockback(room, e, p.x, p.y, 430);
        e.forcedTarget = p.id; e.forcedTimer = Math.max(e.forcedTimer || 0, 1.6);
        hits++;
      }
    }
    addEffect(room, { type: finisher ? 'ring' : 'slash', x: cx, y: cy, r: finisher ? 104 : 74, color: finisher ? '#fff07a' : '#ffdf58', ttl: finisher ? 0.3 : 0.2, life: finisher ? 0.3 : 0.2 });
    if (finisher && hits) addFloatingText(room, p.x, p.y - 60, 'FINALIZOU!', '#ffe27a');
    if (hits) giveUltimate(p, 4 + hits * 2 + (finisher ? 5 : 0));
    return;
  }

  const knock = finisher ? 300 : 0;
  const bonus = finisher ? 0 : 0;
  if (p.hero === 'geovanna') {
    const dmg = Math.round(13 * cm);
    spawnPlayerProjectile(room, p, { dir, speed: 560, radius: 12, damage: dmg, color: finisher ? '#ffd23f' : '#ff77c8', slow: finisher ? 1.8 : 1.1, ttl: 1.3, shape: finisher ? 'heart' : 'heart', knock });
    if (finisher) { spawnPlayerProjectile(room, p, { dir: { x: dir.x * 0.7 - dir.y * 0.7, y: dir.x * 0.7 + dir.y * 0.7 }, speed: 500, radius: 11, damage: Math.round(10 * cm), color: '#ff9ad0', ttl: 1.1, shape: 'heart', knock: 200 }); spawnPlayerProjectile(room, p, { dir: { x: dir.x * 0.7 + dir.y * 0.7, y: dir.y * 0.7 - dir.x * 0.7 }, speed: 500, radius: 11, damage: Math.round(10 * cm), color: '#ff9ad0', ttl: 1.1, shape: 'heart', knock: 200 }); addEffect(room, { type: 'ring', x: p.x + dir.x * 40, y: p.y + dir.y * 40, r: 90, color: '#ffd23f', ttl: 0.3, life: 0.3 }); }
  } else if (p.hero === 'romulo') {
    const dmg = Math.round(16 * cm);
    spawnPlayerProjectile(room, p, { dir, speed: 620, radius: finisher ? 13 : 10, damage: dmg, color: finisher ? '#eaf7ff' : '#c9f2ff', ttl: 1.25, shape: 'card', knock, pierce: finisher ? 2 : 0 });
    if (finisher) addEffect(room, { type: 'ring', x: p.x + dir.x * 44, y: p.y + dir.y * 44, r: 96, color: '#cfeeff', ttl: 0.3, life: 0.3 });
  } else if (p.hero === 'arthur') {
    const crit = Math.random() < 0.13;
    const dmg = Math.round((crit ? 23 : 15) * cm);
    spawnPlayerProjectile(room, p, { dir, speed: 690, radius: finisher ? 12 : 9, damage: dmg, color: crit ? '#fffb8a' : (finisher ? '#7ff3ff' : '#18d4ff'), ttl: 1.1, shape: 'codeSlash', knock, pierce: finisher ? 2 : 0 });
    if (finisher) { for (const a of [-0.35, 0.35]) spawnPlayerProjectile(room, p, { dir: { x: dir.x - dir.y * a, y: dir.y + dir.x * a }, speed: 720, radius: 9, damage: Math.round(13 * cm), color: '#18d4ff', ttl: 1.0, shape: 'codeSlash', knock: 220 }); addEffect(room, { type: 'ring', x: p.x + dir.x * 44, y: p.y + dir.y * 44, r: 92, color: '#18d4ff', ttl: 0.3, life: 0.3 }); }
    if (crit) {
      p.ego = clamp((p.ego || 0) + 1, 0, 6);
      p.egoTimer = Math.max(p.egoTimer || 0, 4.0);
      p.damageBoost = Math.max(p.damageBoost || 1, 1.10 + (p.ego || 0) * 0.025);
      p.damageBoostTimer = Math.max(p.damageBoostTimer || 0, 2.1);
      giveUltimate(p, 3);
    }
  } else if (p.hero === 'guilherme') {
    p.aura = clamp((p.aura || 0) + (finisher ? 8 : 4), 0, 100);
    const dmg = Math.round((13 + Math.floor((p.aura || 0) / 20)) * cm);
    spawnPlayerProjectile(room, p, { dir, speed: 600, radius: finisher ? 14 : 11, damage: dmg, color: finisher ? '#d6ffff' : '#8ff6ff', ttl: 1.25, shape: 'auraBlade', knock, pierce: finisher ? 1 : 0 });
    if (finisher) addEffect(room, { type: 'ring', x: p.x + dir.x * 44, y: p.y + dir.y * 44, r: 96, color: '#8ff6ff', ttl: 0.32, life: 0.32 });
  }
  if (finisher) giveUltimate(p, 4);
}

function playerSpecial(room, p) {
  const h = HEROES[p.hero];
  p.specialCd = h.specialCd;
  setAction(p, 'special', 0.72);

  if (p.hero === 'albert') {
    p.shield = Math.max(p.shield, 55);
    p.rivalry = clamp((p.rivalry || 0) + 2, 0, 8);
    for (const e of room.enemies) {
      if (e.hp <= 0) continue;
      if (dist(p, e) < 520) { e.forcedTarget = p.id; e.forcedTimer = 3.2; }
    }
    addEffect(room, { type: 'ring', x: p.x, y: p.y, r: 145, color: '#ffd24a', ttl: 0.55, life: 0.55 });
    addMessage(room, `${p.name}: Briga Sem Fim!`, 'good');
    return;
  }

  if (p.hero === 'geovanna') {
    const target = lowestAlivePlayer(room);
    if (target) {
      const lowBonus = target.hp / target.maxHp < 0.35 ? 18 : 0;
      const heal = Math.round(38 + lowBonus);
      target.hp = Math.min(target.maxHp, target.hp + heal);
      target.slowTimer = 0;
      addFloatingText(room, target.x, target.y - 45, `+${heal}`, '#7df4a8');
      addEffect(room, { type: 'ring', x: target.x, y: target.y, r: 95, color: '#ff8ad6', ttl: 0.65, life: 0.65 });
      giveUltimate(p, 9);
      addMessage(room, `${p.name} fez uma Sessão de Psicóloga em ${target.name}.`, 'good');
    }
    return;
  }

  if (p.hero === 'romulo') {
    for (const ally of room.players.values()) {
      if (!ally.dead) {
        ally.shield = Math.max(ally.shield, 34);
        ally.dodgeTimer = Math.max(ally.dodgeTimer || 0, 2.6);
        ally.dodgeChance = Math.max(ally.dodgeChance || 0, 0.38);
      }
    }
    for (const e of room.enemies) if (e.hp > 0) e.slow = Math.max(e.slow || 0, 2.2);
    addEffect(room, { type: 'ring', x: p.x, y: p.y, r: 220, color: '#9ee9ff', ttl: 0.65, life: 0.65 });
    addMessage(room, `${p.name} previu o movimento dos inimigos.`, 'good');
    giveUltimate(p, 8);
    return;
  }

  if (p.hero === 'arthur') {
    const e = nearestEnemy(room, p);
    if (e) {
      e.stun = Math.max(e.stun || 0, 2.0);
      damageEnemy(room, e, 24 + (p.ego || 0) * 4, p.id, { color: '#18d4ff', guaranteed: true });
      addEffect(room, { type: 'ring', x: e.x, y: e.y, r: 110, color: '#18d4ff', ttl: 0.55, life: 0.55 });
      addMessage(room, `${p.name} hackeou ${e.name}.`, 'good');
    }
    return;
  }

  if (p.hero === 'guilherme') {
    p.aura = clamp((p.aura || 0) + 18, 0, 100);
    for (const ally of room.players.values()) {
      if (!ally.dead) {
        ally.shield = Math.max(ally.shield, 28 + Math.floor((p.aura || 0) / 8));
        ally.damageBoost = Math.max(ally.damageBoost || 1, 1.18);
        ally.damageBoostTimer = Math.max(ally.damageBoostTimer || 0, 4.2);
      }
    }
    addEffect(room, { type: 'ring', x: p.x, y: p.y, r: 240, color: '#7ff5ff', ttl: 0.8, life: 0.8 });
    addMessage(room, `${p.name} ativou Estratégia de Guerra.`, 'good');
  }
}

function playerUltimate(room, p) {
  p.ultimate = 0;
  setAction(p, 'ultimate', 0.95);
  const dir = getAimDirection(room, p);
  p.dirX = dir.x; p.dirY = dir.y;

  if (p.hero === 'albert') {
    const target = nearestEnemy(room, p);
    const cx = target ? target.x : p.x + dir.x * 160;
    const cy = target ? target.y : p.y + dir.y * 160;
    let defeated = false;
    for (const e of room.enemies) {
      if (e.hp <= 0 || e.invisible) continue;
      if (Math.hypot(e.x - cx, e.y - cy) <= e.radius + 155) {
        const before = e.hp;
        damageEnemy(room, e, 58 + (p.rivalry || 0) * 4, p.id, { color: '#ffd84a', crit: true });
        if (before > 0 && e.hp <= 0) defeated = true;
      }
    }
    p.rivalry = 0;
    if (defeated) p.attackCd = 0;
    addEffect(room, { type: 'ring', x: cx, y: cy, r: 170, color: '#ffd84a', ttl: 0.8, life: 0.8 });
    addMessage(room, `${p.name} usou EU NÃO PERCO!`, 'ultimate');
    return;
  }

  if (p.hero === 'geovanna') {
    for (const ally of room.players.values()) {
      if (!ally.dead) {
        ally.hp = Math.min(ally.maxHp, ally.hp + 30);
        addFloatingText(room, ally.x, ally.y - 44, '+30', '#83ffae');
      }
    }
    for (const e of room.enemies) {
      if (e.hp <= 0) continue;
      e.mark = Math.max(e.mark || 0, 6);
      e.slow = Math.max(e.slow || 0, 3.5);
      damageEnemy(room, e, 16, p.id, { color: '#ff73cc' });
    }
    addEffect(room, { type: 'ring', x: p.x, y: p.y, r: 330, color: '#ff73cc', ttl: 1.0, life: 1.0 });
    addMessage(room, `${p.name} ativou CIÚMES ESTRATÉGICO!`, 'ultimate');
    return;
  }

  if (p.hero === 'romulo') {
    for (const e of room.enemies) {
      if (e.hp <= 0) continue;
      e.stun = Math.max(e.stun || 0, 3.0);
      damageEnemy(room, e, 18, p.id, { color: '#aeefff' });
    }
    for (const ally of room.players.values()) {
      if (!ally.dead) {
        ally.damageBoost = Math.max(ally.damageBoost || 1, 1.25);
        ally.damageBoostTimer = Math.max(ally.damageBoostTimer || 0, 5.0);
        ally.dodgeTimer = Math.max(ally.dodgeTimer || 0, 3.2);
        ally.dodgeChance = Math.max(ally.dodgeChance || 0, 0.44);
      }
    }
    addEffect(room, { type: 'ring', x: WORLD.w / 2, y: WORLD.h / 2, r: 430, color: '#baf2ff', ttl: 1.0, life: 1.0 });
    addMessage(room, `${p.name} declarou XEQUE-MATE GAMER!`, 'ultimate');
    return;
  }

  if (p.hero === 'arthur') {
    for (const e of room.enemies) {
      if (e.hp <= 0) continue;
      e.stun = Math.max(e.stun || 0, 1.6);
      damageEnemy(room, e, 46 + (p.ego || 0) * 7, p.id, { color: '#19e0ff', crit: true, guaranteed: true });
    }
    p.ego = 0;
    p.egoTimer = 0;
    addEffect(room, { type: 'ring', x: p.x, y: p.y, r: 380, color: '#19e0ff', ttl: 0.9, life: 0.9 });
    addMessage(room, `${p.name} virou ADMIN SUPREMO!`, 'ultimate');
    return;
  }

  if (p.hero === 'guilherme') {
    const aura = p.aura || 0;
    const dmg = 34 + Math.round(aura * 0.62);
    for (const e of room.enemies) {
      if (e.hp <= 0) continue;
      damageEnemy(room, e, dmg, p.id, { color: '#8ff7ff', crit: true });
    }
    for (const ally of room.players.values()) if (!ally.dead) ally.shield = Math.max(ally.shield, 35);
    p.aura = 0;
    addEffect(room, { type: 'ring', x: WORLD.w / 2, y: WORLD.h / 2, r: 520, color: '#8ff7ff', ttl: 1.1, life: 1.1 });
    addMessage(room, `${p.name} lançou OPERAÇÃO AURA MÁXIMA!`, 'ultimate');
  }
}

function updatePlayers(room, dt) {
  for (const p of room.players.values()) {
    const h = HEROES[p.hero];
    if (!h) continue;

    p.attackCd = Math.max(0, (p.attackCd || 0) - dt);
    p.specialCd = Math.max(0, (p.specialCd || 0) - dt);
    p.actionTimer = Math.max(0, (p.actionTimer || 0) - dt);
    p.hitFlash = Math.max(0, (p.hitFlash || 0) - dt);
    p.damageBoostTimer = Math.max(0, (p.damageBoostTimer || 0) - dt);
    if (p.damageBoostTimer <= 0) p.damageBoost = 1;
    p.slowTimer = Math.max(0, (p.slowTimer || 0) - dt);
    p.dodgeTimer = Math.max(0, (p.dodgeTimer || 0) - dt);
    if (p.dodgeTimer <= 0) p.dodgeChance = 0;
    p.egoTimer = Math.max(0, (p.egoTimer || 0) - dt);
    if (p.egoTimer <= 0) p.ego = 0;
    p.shield = Math.max(0, p.shield || 0);
    p.comboTimer = Math.max(0, (p.comboTimer || 0) - dt);
    if (p.comboTimer <= 0) p.combo = 0;
    p.dashCd = Math.max(0, (p.dashCd || 0) - dt);
    p.dashTimer = Math.max(0, (p.dashTimer || 0) - dt);

    if (p.dead) {
      p.action = 'dead';
      p.vx = 0; p.vy = 0;
      p.respawnTimer = Math.max(0, (p.respawnTimer || 0) - dt);
      const aliveCount = [...room.players.values()].filter(a => !a.dead && a.hp > 0).length;
      if (p.respawnTimer <= 0 && aliveCount > 0 && !room.gameOver) {
        p.dead = false;
        p.hp = Math.round(p.maxHp * 0.48);
        p.shield = 24;
        p.x = 240 + rand(-30, 30);
        p.y = 450 + rand(-80, 80);
        clampEntity(p, PLAYER_BOUNDS);
        setAction(p, 'revive', 0.8);
        addEffect(room, { type: 'ring', x: p.x, y: p.y, r: 100, color: '#83ffae', ttl: 0.65, life: 0.65 });
        addMessage(room, `${p.name} voltou para a arena!`, 'good');
      }
      continue;
    }

    // Regeneração leve para deixar a partida mais duradoura e intensa, sem morrer rápido.
    const regen = room.difficulty === 'facil' ? 6.0 : room.difficulty === 'medio' ? 3.8 : 2.2;
    if (p.hp > 0 && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + regen * dt);

    const input = p.input || defaultInput();
    let mx = clamp(Number(input.mx) || 0, -1, 1);
    let my = clamp(Number(input.my) || 0, -1, 1);
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    if (len > 0.05) { p.dirX = mx; p.dirY = my; }

    // ESQUIVA (dash): pulo rápido na direção do movimento/mira; enquanto desvia fica invulnerável.
    if (input.dash && p.dashCd <= 0 && !p.dead) {
      let ddx = mx, ddy = my;
      if (Math.hypot(ddx, ddy) < 0.1) {
        const aim = getAimDirection(room, p);
        ddx = aim.x; ddy = aim.y;
      }
      const dl = Math.hypot(ddx, ddy) || 1;
      p.dashDirX = ddx / dl; p.dashDirY = ddy / dl;
      p.dirX = p.dashDirX; p.dirY = p.dashDirY;
      p.dashTimer = 0.16;
      p.dashCd = 1.6;
      setAction(p, 'run', 0.22);
      addEffect(room, { type: 'dash', x: p.x, y: p.y, r: 34, color: '#bfe9ff', ttl: 0.32, life: 0.32 });
    }

    let speed = h.speed * (p.slowTimer > 0 ? 0.62 : 1);
    if (p.dashTimer > 0) speed = h.speed * 3.3; // impulsão da esquiva
    const prevX = p.x, prevY = p.y;
    if (p.dashTimer > 0) {
      p.x += (p.dashDirX || p.dirX || 1) * speed * dt;
      p.y += (p.dashDirY || p.dirY || 0) * speed * dt;
    } else {
      p.x += mx * speed * dt;
      p.y += my * speed * dt;
    }
    clampEntity(p, PLAYER_BOUNDS);
    p.vx = (p.x - prevX) / Math.max(dt, 0.001);
    p.vy = (p.y - prevY) / Math.max(dt, 0.001);
    if (p.actionTimer <= 0) p.action = (p.dashTimer > 0 || len > 0.05) ? 'run' : 'idle';

    if (input.attack && p.attackCd <= 0) playerNormalAttack(room, p);
    if (input.special && p.specialCd <= 0) playerSpecial(room, p);
    if (input.ultimate && p.ultimate >= 100) playerUltimate(room, p);
  }
}

function updateProjectiles(room, dt) {
  for (const pr of room.projectiles) {
    pr.ttl -= dt;
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    if (pr.x < -80 || pr.x > WORLD.w + 80 || pr.y < -80 || pr.y > WORLD.h + 80) pr.ttl = 0;

    if (pr.ttl <= 0) continue;

    if (pr.owner === 'player') {
      for (const e of room.enemies) {
        if (e.hp <= 0 || e.invisible) continue;
        if (Math.hypot(e.x - pr.x, e.y - pr.y) <= e.radius + pr.radius) {
          damageEnemy(room, e, pr.damage, pr.from, { color: pr.color });
          if (pr.slow) e.slow = Math.max(e.slow || 0, pr.slow);
          if (pr.stun) e.stun = Math.max(e.stun || 0, pr.stun);
          if (pr.mark) e.mark = Math.max(e.mark || 0, pr.mark);
          if (pr.knock) applyEnemyKnockback(room, e, pr.x - pr.vx * 0.03, pr.y - pr.vy * 0.03, pr.knock);
          if (pr.pierce > 0) pr.pierce--; else { pr.ttl = 0; break; }
        }
      }
    } else {
      for (const p of room.players.values()) {
        if (p.dead || p.hp <= 0) continue;
        if (Math.hypot(p.x - pr.x, p.y - pr.y) <= HEROES[p.hero].radius + pr.radius) {
          damagePlayer(room, p, pr.damage, ENEMIES[pr.enemyType]?.name || 'Inimigo', { slow: pr.slow });
          if (pr.pierce > 0) pr.pierce--; else { pr.ttl = 0; break; }
        }
      }
    }
  }
  room.projectiles = room.projectiles.filter(pr => pr.ttl > 0).slice(-70);
}

function enemyMelee(room, e, target, radius, damage, color) {
  setAction(e, 'melee', 0.45);
  addEffect(room, { type: 'ring', x: e.x, y: e.y, r: radius, color, ttl: 0.34, life: 0.34 });
  for (const p of room.players.values()) {
    if (p.dead || p.hp <= 0) continue;
    if (Math.hypot(p.x - e.x, p.y - e.y) <= radius + HEROES[p.hero].radius) {
      damagePlayer(room, p, damage, e.name);
    }
  }
}

function updateEnemies(room, dt) {
  const diff = DIFFICULTY[room.difficulty];

  for (const e of room.enemies) {
    if (e.hp <= 0) continue;
    e.hitFlash = Math.max(0, (e.hitFlash || 0) - dt);
    e.actionTimer = Math.max(0, (e.actionTimer || 0) - dt);
    e.stun = Math.max(0, (e.stun || 0) - dt);
    e.slow = Math.max(0, (e.slow || 0) - dt);
    e.mark = Math.max(0, (e.mark || 0) - dt);
    e.defenseTimer = Math.max(0, (e.defenseTimer || 0) - dt);
    e.pityTimer = Math.max(0, (e.pityTimer || 0) - dt);
    if (e.pityTimer <= 0) e.pityTarget = null;
    e.forcedTimer = Math.max(0, (e.forcedTimer || 0) - dt);
    if (e.forcedTimer <= 0) e.forcedTarget = null;
    e.attackCd = Math.max(0, (e.attackCd || 0) - dt);
    e.specialCd = Math.max(0, (e.specialCd || 0) - dt);

    // knockback aplicado (empurrão dos golpes)
    if ((e.knockTimer || 0) > 0) {
      e.knockTimer -= dt;
      const kx = e.kbx || 0, ky = e.kby || 0;
      const pbx = e.x, pby = e.y;
      e.x += kx * dt; e.y += ky * dt;
      clampEntity(e, ENEMY_BOUNDS);
      e.kbx = kx * Math.pow(0.0009, dt);
      e.kby = ky * Math.pow(0.0009, dt);
      if (e.knockTimer <= 0) { e.kbx = 0; e.kby = 0; }
      else { e.vx = (e.x - pbx) / Math.max(dt, 0.001); e.vy = (e.y - pby) / Math.max(dt, 0.001); }
    }

    if (e.type === 'silvanna') {
      e.rage = Math.min(26, (e.rage || 0) + dt); // Mamãe Má
      e.vanishCd = Math.max(0, (e.vanishCd || 0) - dt);
      if (e.invisible) {
        e.vanishTimer = Math.max(0, (e.vanishTimer || 0) - dt);
        if (e.vanishTimer <= 0) {
          const target = nearestPlayer(room, e);
          if (target) {
            e.x = target.x + rand(-150, 150);
            e.y = target.y + rand(-120, 120);
            clampEntity(e, ENEMY_BOUNDS);
          }
          e.invisible = false;
          setAction(e, 'special', 0.7);
          e.attackCd = 0.2;
          enemyMelee(room, e, target, 125, enemyDamage(e, e.dmg * 0.8), '#e83e8c');
          addMessage(room, 'Silvanna aplicou a MASSAGEM FINAL!', 'bad');
        }
        continue;
      }
    }

    if (e.type === 'napoleao') {
      const hpRatio = e.hp / Math.max(1, e.maxHp);
      e.phase = hpRatio < 0.34 ? 3 : hpRatio < 0.67 ? 2 : 1;
      e.foodTimer = Math.max(0, (e.foodTimer || 0) - dt);
      if (e.foodTimer <= 0) {
        e.foodTimer = 6.2;
        e.grow = Math.min(1.8, (e.grow || 1) + 0.08);
        e.radius = Math.min(76, e.radius + 3);
        e.dmg += 1.6 * diff.enemyDmg;
        e.hp = Math.min(e.maxHp, e.hp + Math.round(22 * diff.enemyHp));
        addEffect(room, { type: 'ring', x: e.x, y: e.y, r: e.radius + 42, color: '#ffcf72', ttl: 0.55, life: 0.55 });
        addFloatingText(room, e.x, e.y - e.radius - 18, 'FOME +', '#ffcf72');
      }
    }

    if (e.stun > 0) {
      e.vx = 0; e.vy = 0;
      if (e.actionTimer <= 0) e.action = 'stun';
      continue;
    }

    const prevX = e.x, prevY = e.y;
    let target = null;
    if (e.forcedTarget) {
      const forced = room.players.get(e.forcedTarget);
      if (forced && !forced.dead && forced.hp > 0) target = forced;
    }
    if (!target) target = nearestPlayer(room, e);
    if (!target) continue;

    const dx = target.x - e.x;
    const dy = target.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const slowFactor = e.slow > 0 ? 0.55 : 1;

    let desiredRange = 95;
    if (['anielle', 'mito'].includes(e.type)) desiredRange = 310;
    if (e.type === 'otavio') desiredRange = 130;
    if (e.type === 'napoleao') desiredRange = 120 + e.radius * 0.4;

    if (d > desiredRange) {
      e.x += (dx / d) * e.speed * slowFactor * dt;
      e.y += (dy / d) * e.speed * slowFactor * dt;
      clampEntity(e, ENEMY_BOUNDS);
    } else if (d < desiredRange * 0.55 && ['anielle', 'mito'].includes(e.type)) {
      e.x -= (dx / d) * e.speed * 0.45 * slowFactor * dt;
      e.y -= (dy / d) * e.speed * 0.45 * slowFactor * dt;
      clampEntity(e, ENEMY_BOUNDS);
    }

    e.vx = (e.x - prevX) / Math.max(dt, 0.001);
    e.vy = (e.y - prevY) / Math.max(dt, 0.001);
    if (e.actionTimer <= 0) e.action = Math.hypot(e.vx, e.vy) > 14 ? 'run' : 'idle';

    if (e.attackCd > 0) continue;

    if (e.type === 'otavio') {
      if (e.specialCd <= 0 && e.hp / e.maxHp < 0.67) {
        const heal = Math.round(26 * diff.enemyHp);
        e.hp = Math.min(e.maxHp, e.hp + heal);
        e.specialCd = 6.8;
        setAction(e, 'special', 0.65);
        addFloatingText(room, e.x, e.y - 50, `+${heal}`, '#83ffae');
        addEffect(room, { type: 'ring', x: e.x, y: e.y, r: 80, color: '#83ffae', ttl: 0.45, life: 0.45 });
      }
      if (d < 115) enemyMelee(room, e, target, 92, enemyDamage(e, e.dmg), '#ff9861');
      else spawnEnemyProjectile(room, e, target, { speed: 440, radius: 14, damage: enemyDamage(e, e.dmg * 0.78), slow: 1.0, color: '#ff9861', label: 'manipulação', shape: 'lure' });
      e.attackCd = 1.25;
    } else if (e.type === 'anielle') {
      // Língua Grande: golpe visual em cone/onda de fofoca, sem texto na tela.
      setAction(e, 'attack', 0.48);
      const tx = target.x, ty = target.y;
      addEffect(room, { type: 'gossipWave', x: e.x, y: e.y, x2: tx, y2: ty, r: 85, color: '#ba7cff', ttl: 0.42, life: 0.42 });
      damagePlayer(room, target, enemyDamage(e, e.dmg * 0.88), e.name, { slow: 0.9 });
      for (const p of room.players.values()) {
        if (p !== target && !p.dead && Math.hypot(p.x - tx, p.y - ty) < 95) damagePlayer(room, p, enemyDamage(e, e.dmg * 0.35), e.name, { slow: 0.5 });
      }
      if (e.specialCd <= 0) {
        // Falsidade: cria uma cópia ilusória que absorve parte do próximo golpe.
        setAction(e, 'special', 0.78);
        e.decoyHits = 1;
        for (const p of room.players.values()) if (!p.dead) p.slowTimer = Math.max(p.slowTimer || 0, 1.0);
        addEffect(room, { type: 'illusion', sprite: 'anielle', x: e.x + rand(-70, 70), y: e.y + rand(-35, 35), r: 90, color: '#ba7cff', ttl: 0.75, life: 0.75 });
        addEffect(room, { type: 'ring', x: e.x, y: e.y, r: 190, color: '#ba7cff', ttl: 0.5, life: 0.5 });
        e.specialCd = 5.5;
      }
      e.attackCd = 1.35;
    } else if (e.type === 'mito') {
      // Mito NÃO arremessa gloss. O ataque é Testa Astral: feixe da testa.
      setAction(e, 'attack', 0.52);
      if (d < 150) enemyMelee(room, e, target, 112, enemyDamage(e, e.dmg * 0.72), '#ff70df');
      else {
        addEffect(room, { type: 'beam', x: e.x, y: e.y - 34, x2: target.x, y2: target.y - 18, r: 18, color: '#ff70df', ttl: 0.35, life: 0.35 });
        damagePlayer(room, target, enemyDamage(e, e.dmg * 0.86), e.name, { slow: 0.8 });
      }
      if (e.specialCd <= 0) {
        // Gloss Caótico: o chão fica escorregadio em poças brilhantes, não é projétil.
        setAction(e, 'special', 0.75);
        const centers = [...room.players.values()].filter(p => !p.dead).slice(0, 3).map(p => ({ x: p.x + rand(-35, 35), y: p.y + rand(-25, 25) }));
        if (!centers.length) centers.push({ x: target.x, y: target.y });
        for (const c of centers) {
          addEffect(room, { type: 'puddle', x: c.x, y: c.y, r: 115, color: '#ff70df', ttl: 1.35, life: 1.35 });
          for (const p of room.players.values()) {
            if (!p.dead && Math.hypot(p.x - c.x, p.y - c.y) < 128) damagePlayer(room, p, enemyDamage(e, e.dmg * 0.35), e.name, { slow: 1.7 });
          }
        }
        addEffect(room, { type: 'ring', x: e.x, y: e.y, r: 220, color: '#ff70df', ttl: 0.58, life: 0.58 });
        e.specialCd = 4.8;
      }
      e.attackCd = 1.05;
    } else if (e.type === 'lenda') {
      if (e.specialCd <= 0 && e.hp / e.maxHp < 0.55) {
        e.defenseTimer = 2.6;
        setAction(e, 'special', 0.72);
        addEffect(room, { type: 'ring', x: e.x, y: e.y, r: 150, color: '#ffb12c', ttl: 0.62, life: 0.62 });
        e.specialCd = 5.4;
      } else if (e.specialCd <= 0 && d > 145) {
        const chargeX = dx / d, chargeY = dy / d;
        const cx = e.x + chargeX * 170, cy = e.y + chargeY * 170;
        e.x = cx; e.y = cy;
        clampEntity(e, ENEMY_BOUNDS);
        setAction(e, 'special', 0.62);
        enemyMelee(room, e, target, 145, enemyDamage(e, e.dmg * 1.05), '#ffb12c');
        addMessage(room, 'Lenda acelerou a Bros 2009 amarela!', 'bad');
        e.specialCd = 5.8;
      } else {
        enemyMelee(room, e, target, 118, enemyDamage(e, e.dmg), '#ffb12c');
      }
      e.attackCd = 1.35;
    } else if (e.type === 'silvanna') {
      if (e.vanishCd <= 0) {
        e.invisible = true;
        setAction(e, 'special', 0.72);
        e.vanishTimer = 1.1;
        e.vanishCd = 7.8;
        addEffect(room, { type: 'ring', x: e.x, y: e.y, r: 120, color: '#c7c7c7', ttl: 0.45, life: 0.45 });
        addMessage(room, 'Silvanna sumiu nas sombras... (Mamãe Má)', 'bad');
      } else {
        if (d < 140) enemyMelee(room, e, target, 125, enemyDamage(e, e.dmg), '#e83e8c');
        else spawnEnemyProjectile(room, e, target, { speed: 410, radius: 18, damage: enemyDamage(e, e.dmg * 0.82), color: '#e83e8c', label: 'maldade', shape: 'box' });
        e.attackCd = 1.45;
      }
    } else if (e.type === 'napoleao') {
      if (d < 140 + e.radius * 0.35) {
        enemyMelee(room, e, target, 115 + e.radius * 0.55, enemyDamage(e, e.dmg), '#ffc86d');
        e.hp = Math.min(e.maxHp, e.hp + Math.round(9 * diff.enemyHp));
        addFloatingText(room, e.x, e.y - e.radius - 18, '+lanche', '#ffd88a');
      } else {
        spawnEnemyProjectile(room, e, target, { speed: 450, radius: 16, damage: enemyDamage(e, e.dmg * 0.85), slow: 0.8, color: '#ffc86d', label: 'comida', shape: 'food' });
      }
      if (e.specialCd <= 0) {
        if ((e.phase || 1) < 2) {
          e.pityTarget = target.id;
          e.pityTimer = 3.0;
          setAction(e, 'special', 0.75);
          addEffect(room, { type: 'pity', x: target.x, y: target.y - 34, r: 85, color: '#ffd88a', ttl: 0.72, life: 0.72 });
          e.specialCd = 5.6;
        } else {
          const tx = target.x, ty = target.y;
          e.x = tx + rand(-65, 65);
          e.y = ty + rand(-65, 65);
          clampEntity(e, ENEMY_BOUNDS);
          setAction(e, 'special', 0.75);
          enemyMelee(room, e, target, 155 + e.radius * 0.45, enemyDamage(e, e.dmg * 1.05), '#ffcf72');
          e.specialCd = 6.3;
          addMessage(room, 'Napoleão entrou na Forma Garfield!', 'bad');
        }
      }
      e.attackCd = 1.15;
    }
  }
}

function updateEffects(room, dt) {
  for (const fx of room.effects) fx.ttl -= dt;
  room.effects = room.effects.filter(fx => fx.ttl > 0).slice(-45);
}

function handleStageAndGameOver(room, dt) {
  if (room.gameOver) return;
  const alivePlayers = [...room.players.values()].filter(p => !p.dead && p.hp > 0).length;
  if (alivePlayers === 0 && room.started) {
    room.gameOver = true;
    room.victory = false;
    addMessage(room, 'Todos caíram. A partida foi perdida.', 'bad');
    return;
  }

  const aliveEnemies = room.enemies.filter(e => e.hp > 0).length;
  if (aliveEnemies === 0 && !room.stageCleared) {
    room.stageCleared = true;
    room.stageTimer = 4.0;
    addMessage(room, `${STAGES[room.stageIndex].title} vencida!`, 'good');
  }
  if (room.stageCleared) {
    room.stageTimer -= dt;
    if (room.stageTimer <= 0) {
      if (room.stageIndex >= STAGES.length - 1) {
        room.gameOver = true;
        room.victory = true;
        addMessage(room, 'Agora que você venceu seus piores medos, apenas seja feliz.', 'ultimate');
      } else {
        room.stageIndex++;
        const healFactor = DIFFICULTY[room.difficulty].healBetween;
        for (const p of room.players.values()) {
          if (!p.hero) continue;
          p.dead = false;
          p.respawnTimer = 0;
          p.hp = Math.max(p.hp, Math.round(p.maxHp * healFactor));
          p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.22));
          p.shield = Math.max(p.shield, 20);
          p.attackCd = 0;
          p.specialCd = Math.max(0, p.specialCd - 3);
        }
        spawnStage(room);
      }
    }
  }
}

function updateRoom(room, dt) {
  if (!room.started || room.gameOver) return;
  if (room.stageStartTimer > 0) {
    room.stageStartTimer = Math.max(0, room.stageStartTimer - dt);
    updateEffects(room, dt);
    return;
  }
  updatePlayers(room, dt);
  updateEnemies(room, dt);
  updateProjectiles(room, dt);
  updatePickups(room, dt);
  updateEffects(room, dt);
  handleStageAndGameOver(room, dt);
}

function gameSnapshot(room) {
  const stage = STAGES[room.stageIndex] || STAGES[0];
  return {
    code: room.code,
    hostId: room.hostId,
    difficulty: room.difficulty,
    world: WORLD,
    started: room.started,
    gameOver: room.gameOver,
    victory: room.victory,
    stageIndex: room.stageIndex,
    stageLevel: stage.level || (room.stageIndex + 1),
    stageCount: STAGES.length,
    stageTitle: stage.title,
    stageVenue: stage.venue,
    stageSubtitle: stage.subtitle,
    stageBackground: stage.background,
    stageStartTimer: room.stageStartTimer || 0,
    stageCleared: room.stageCleared,
    stageTimer: room.stageTimer,
    players: [...room.players.values()].filter(p => p.hero).map(p => ({
      id: p.id, name: p.name, hero: p.hero, connected: p.connected,
      x: p.x, y: p.y, vx: Math.round(p.vx || 0), vy: Math.round(p.vy || 0), dirX: p.dirX, dirY: p.dirY,
      action: p.action || 'idle', actionTimer: p.actionTimer || 0, hitFlash: p.hitFlash || 0,
      hp: Math.round(p.hp), maxHp: p.maxHp, shield: Math.round(p.shield || 0),
      dead: p.dead, respawnTimer: p.respawnTimer,
      attackCd: p.attackCd, specialCd: p.specialCd,
      ultimate: Math.round(p.ultimate || 0), aura: Math.round(p.aura || 0), rivalry: Math.round(p.rivalry || 0),
      damageBoostTimer: p.damageBoostTimer || 0, dodgeTimer: p.dodgeTimer || 0, ego: p.ego || 0, kills: p.kills || 0
    })),
    enemies: room.enemies.map(e => ({
      id: e.id, type: e.type, name: e.name, x: e.x, y: e.y, vx: Math.round(e.vx || 0), vy: Math.round(e.vy || 0),
      action: e.action || 'idle', actionTimer: e.actionTimer || 0,
      hp: Math.round(e.hp), maxHp: e.maxHp, radius: e.radius, color: e.color,
      stun: e.stun, slow: e.slow, mark: e.mark, invisible: e.invisible, grow: e.grow || 1, decoyHits: e.decoyHits || 0,
      defenseTimer: e.defenseTimer || 0, rage: e.rage || 0, pityTimer: e.pityTimer || 0, phase: e.phase || 1, hitFlash: e.hitFlash || 0,
      attackCd: e.attackCd || 0, specialCd: e.specialCd || 0, vanishCd: e.vanishCd || 0, foodTimer: e.foodTimer || 0
    })),
    projectiles: room.projectiles.map(p => ({
      id: p.id, owner: p.owner, hero: p.hero, enemyType: p.enemyType, x: p.x, y: p.y, vx: Math.round(p.vx || 0), vy: Math.round(p.vy || 0),
      radius: p.radius, color: p.color, shape: p.shape || '', label: p.label || ''
    })),
    pickups: (room.pickups || []).map(k => ({
      id: k.id, kind: k.kind, x: Math.round(k.x), y: Math.round(k.y), born: k.born, ttl: Math.round(k.ttl * 10) / 10
    })),
    effects: room.effects.map(fx => ({
      id: fx.id, type: fx.type, x: fx.x, y: fx.y, x2: fx.x2, y2: fx.y2, r: fx.r, color: fx.color, ttl: fx.ttl, life: fx.life,
      shape: fx.shape, sprite: fx.sprite, angle: fx.angle, width: fx.width
    })),
    messages: room.messages
  };
}

io.on('connection', (socket) => {
  socket.emit('hello', { id: socket.id, heroes: HEROES, difficulties: DIFFICULTY, stages: STAGES, maxPlayers: MAX_PLAYERS });
  socket.emit('roomList', publicRoomsSnapshot());

  socket.on('listRooms', (cb = () => {}) => {
    cb({ ok: true, rooms: publicRoomsSnapshot() });
    socket.emit('roomList', publicRoomsSnapshot());
  });

  socket.on('createRoom', (payload = {}, cb = () => {}) => {
    detachSocketFromCurrentRoom(socket);
    const room = makeRoom(socket.id);
    rooms.set(room.code, room);
    addPlayer(room, socket, payload.name);
    cb({ ok: true, code: room.code, playerId: socket.id, lobby: lobbySnapshot(room) });
    emitLobby(room);
    emitRoomList();
  });

  socket.on('joinRoom', (payload = {}, cb = () => {}) => {
    const code = String(payload.code || '').trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) return cb({ ok: false, error: 'Sala não encontrada.' });
    const connectedCount = [...room.players.values()].filter(p => p.connected).length;
    if (!room.players.has(socket.id) && connectedCount >= MAX_PLAYERS) return cb({ ok: false, error: 'Sala cheia.' });
    if (room.started && !room.players.has(socket.id)) return cb({ ok: false, error: 'A partida já começou. Crie outra sala.' });
    detachSocketFromCurrentRoom(socket, code);
    if (!room.players.has(socket.id)) addPlayer(room, socket, payload.name);
    room.lastActive = nowMs();
    cb({ ok: true, code: room.code, playerId: socket.id, lobby: lobbySnapshot(room) });
    emitLobby(room);
    emitRoomList();
  });

  socket.on('selectHero', (heroKey, cb = () => {}) => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (!room || room.started) return cb({ ok: false, error: 'Não dá para trocar agora.' });
    const p = room.players.get(socket.id);
    if (!p) return cb({ ok: false, error: 'Jogador não encontrado.' });
    if (!HEROES[heroKey]) return cb({ ok: false, error: 'Herói inválido.' });
    const taken = [...room.players.values()].find(other => other.id !== socket.id && other.hero === heroKey);
    if (taken) return cb({ ok: false, error: 'Esse herói já foi escolhido.' });
    p.hero = heroKey;
    p.ready = false;
    room.lastActive = nowMs();
    cb({ ok: true });
    emitLobby(room);
    emitRoomList();
  });

  socket.on('setDifficulty', (difficulty, cb = () => {}) => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (!room || room.hostId !== socket.id || room.started) return cb({ ok: false });
    if (!DIFFICULTY[difficulty]) return cb({ ok: false });
    room.difficulty = difficulty;
    room.lastActive = nowMs();
    cb({ ok: true });
    emitLobby(room);
    emitRoomList();
  });

  socket.on('setReady', (ready, cb = () => {}) => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (!room || room.started) return cb({ ok: false });
    const p = room.players.get(socket.id);
    if (!p || !p.hero) return cb({ ok: false, error: 'Escolha um herói primeiro.' });
    p.ready = !!ready;
    room.lastActive = nowMs();
    cb({ ok: true });
    emitLobby(room);
    emitRoomList();
  });

  socket.on('startGame', (cb = () => {}) => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (!room || room.hostId !== socket.id) return cb({ ok: false, error: 'Só o host pode iniciar.' });
    if (room.started && !room.gameOver) return cb({ ok: false, error: 'Já começou.' });
    const players = [...room.players.values()].filter(p => p.connected);
    if (players.length < 1) return cb({ ok: false, error: 'Precisa de pelo menos 1 jogador.' });
    if (players.some(p => !p.hero)) return cb({ ok: false, error: 'Todos precisam escolher um herói.' });
    if (players.some(p => !p.ready)) return cb({ ok: false, error: 'Todos precisam estar prontos.' });
    startGame(room);
    room.lastActive = nowMs();
    cb({ ok: true });
    emitRoomList();
  });

  socket.on('restartLobby', (cb = () => {}) => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (!room || room.hostId !== socket.id) return cb({ ok: false });
    room.started = false;
    room.gameOver = false;
    room.victory = false;
    room.enemies = [];
    room.projectiles = [];
    room.pickups = [];
    room.effects = [];
    room.messages = [];
    for (const p of room.players.values()) {
      p.ready = false;
      p.input = defaultInput();
    }
    room.lastActive = nowMs();
    cb({ ok: true });
    emitLobby(room);
    emitRoomList();
  });

  socket.on('input', (input = {}) => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (!room || !room.started || room.gameOver) return;
    const p = room.players.get(socket.id);
    if (!p || !p.hero) return;
    p.input = {
      mx: clamp(Number(input.mx) || 0, -1, 1),
      my: clamp(Number(input.my) || 0, -1, 1),
      aimX: Number.isFinite(Number(input.aimX)) ? clamp(Number(input.aimX), 0, WORLD.w) : null,
      aimY: Number.isFinite(Number(input.aimY)) ? clamp(Number(input.aimY), 0, WORLD.h) : null,
      attack: !!input.attack,
      special: !!input.special,
      ultimate: !!input.ultimate
    };
    room.lastActive = nowMs();
  });

  socket.on('disconnect', () => removeOrDisconnectPlayer(socket.id));
});

setInterval(() => {
  const now = nowMs();
  for (const [code, room] of rooms) {
    const dt = clamp((now - room.lastTick) / 1000, 0, 0.05);
    room.lastTick = now;
    updateRoom(room, dt);
    room.tickCount++;
    if (room.started && room.tickCount % 3 === 0) io.to(code).emit('state', gameSnapshot(room));

    // cleanup salas antigas sem jogadores conectados
    const connected = [...room.players.values()].some(p => p.connected);
    if (!connected && now - room.lastActive > 10 * 60 * 1000) {
      rooms.delete(code);
      emitRoomList();
    }
  }
}, 1000 / 30);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Arena das Sete Chamas online em http://0.0.0.0:${PORT}`);
});
