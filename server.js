'use strict';
/* ============================================================
   PRESIDENTE ONLINE — Simulador de Geopolítica Multiplayer
   Versão COMPLETA: nuclear, ideologia, religião, províncias,
   sanções, sabotagem, conquistas.
   Servidor HTTP + WebSocket (sem dependências externas)
   ============================================================ */
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const TURN_SECONDS = 45;
const AP_PER_TURN = 4;
const PROV_INCOME = 6;         // $ por ponto de infraestrutura/turno
const NUKE_MIN_LEVEL = 3;      // nível nuclear p/ lançar míssil
const NUKE_MAX_LEVEL = 5;

/* ---------------- Dados dos países ---------------- */
const COUNTRIES = [
  { id:'br', name:'Brasil',         flag:'🇧🇷', eco:11, mil:9,  money:1100, provs:[['Amazônia',1],['São Paulo',2],['Nordeste',1]] },
  { id:'us', name:'Estados Unidos', flag:'🇺🇸', eco:14, mil:14, money:1400, provs:[['Califórnia',2],['Texas',2],['Nova York',2]] },
  { id:'ru', name:'Rússia',         flag:'🇷🇺', eco:10, mil:13, money:1000, provs:[['Moscou',2],['Sibéria',1],['Extremo Oriente',1]] },
  { id:'cn', name:'China',          flag:'🇨🇳', eco:13, mil:12, money:1200, provs:[['Pequim',2],['Guangdong',2],['Xinjiang',1]] },
  { id:'de', name:'Alemanha',       flag:'🇩🇪', eco:12, mil:8,  money:1200, provs:[['Baviera',2],['Renânia',2],['Saxônia',1]] },
  { id:'fr', name:'França',         flag:'🇫🇷', eco:11, mil:9,  money:1100, provs:[['Île-de-France',2],['Provença',1],['Bretanha',1]] },
  { id:'gb', name:'Reino Unido',    flag:'🇬🇧', eco:11, mil:10, money:1100, provs:[['Londres',2],['Escócia',1],['País de Gales',1]] },
  { id:'in', name:'Índia',          flag:'🇮🇳', eco:9,  mil:10, money:900,  provs:[['Délhi',2],['Maharashtra',1],['Tamil Nadu',1]] },
  { id:'jp', name:'Japão',          flag:'🇯🇵', eco:12, mil:7,  money:1200, provs:[['Tóquio',2],['Osaka',2],['Hokkaido',1]] },
  { id:'mx', name:'México',         flag:'🇲🇽', eco:9,  mil:7,  money:900,  provs:[['Cidade do México',2],['Jalisco',1],['Yucatán',1]] },
  { id:'ng', name:'Nigéria',        flag:'🇳🇬', eco:7,  mil:8,  money:800,  provs:[['Lagos',1],['Kano',1],['Delta do Níger',1]] },
  { id:'au', name:'Austrália',      flag:'🇦🇺', eco:9,  mil:6,  money:1000, provs:[['Nova Gales do Sul',2],['Queensland',1],['Vitória',1]] },
];
const COUNTRY_BY_ID = Object.fromEntries(COUNTRIES.map(c => [c.id, c]));
const cname = p => { const c = COUNTRY_BY_ID[p.country]; return c ? c.flag + ' ' + c.name : p.name; };

/* ---------------- WebSocket artesanal ---------------- */
function acceptKey(key) {
  return crypto.createHash('sha1').update(key + MAGIC).digest('base64');
}
function encodeFrame(data, opcode = 0x1) {
  const payload = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) { header = Buffer.alloc(2); header[1] = len; }
  else if (len < 65536) { header = Buffer.alloc(4); header[1] = 126; header.writeUInt16BE(len, 2); }
  else { header = Buffer.alloc(10); header[1] = 127; header.writeBigUInt64BE(BigInt(len), 2); }
  header[0] = 0x80 | opcode;
  return Buffer.concat([header, payload]);
}

class WSConn {
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.onMessage = null;
    this.onClose = null;
    this.closed = false;
    socket.setNoDelay(true);
    socket.on('data', chunk => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.drain();
    });
    socket.on('close', () => this._close());
    socket.on('error', () => this._close());
    socket.on('end', () => {
      try { socket.end(); } catch (e) {}
      this._close();
    });
    this.pingTimer = setInterval(() => {
      try { if (!this.closed) socket.write(encodeFrame(Buffer.alloc(0), 0x9)); } catch (e) {}
    }, 25000);
  }
  _close() {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.pingTimer);
    try { this.socket.destroy(); } catch (e) {}
    if (this.onClose) this.onClose();
  }
  parseFrame() {
    const buf = this.buffer;
    if (buf.length < 2) return null;
    const opcode = buf[0] & 0x0f;
    const masked = (buf[1] & 0x80) !== 0;
    let len = buf[1] & 0x7f;
    let off = 2;
    if (len === 126) {
      if (buf.length < 4) return null;
      len = buf.readUInt16BE(2); off = 4;
    } else if (len === 127) {
      if (buf.length < 10) return null;
      len = Number(buf.readBigUInt64BE(2)); off = 10;
    }
    let maskKey = null;
    if (masked) {
      if (buf.length < off + 4) return null;
      maskKey = buf.subarray(off, off + 4); off += 4;
    }
    if (buf.length < off + len) return null;
    let payload = buf.subarray(off, off + len);
    if (masked) {
      const out = Buffer.alloc(len);
      for (let i = 0; i < len; i++) out[i] = payload[i] ^ maskKey[i & 3];
      payload = out;
    }
    this.buffer = buf.subarray(off + len);
    return { opcode, payload };
  }
  drain() {
    let frame;
    while ((frame = this.parseFrame())) {
      const { opcode, payload } = frame;
      if (opcode === 0x8) {
        try { this.socket.write(encodeFrame(Buffer.alloc(0), 0x8)); } catch (e) {}
        this._close(); return;
      } else if (opcode === 0x9) {
        try { this.socket.write(encodeFrame(payload, 0xA)); } catch (e) {}
      } else if (opcode === 0xA) {
      } else if (opcode === 0x1 || opcode === 0x0) {
        if (this.onMessage) this.onMessage(payload.toString('utf8'));
      }
    }
  }
  send(obj) {
    if (this.closed) return;
    try { this.socket.write(encodeFrame(JSON.stringify(obj))); } catch (e) { this._close(); }
  }
}

/* ---------------- Estado do jogo ---------------- */
const rooms = new Map();
let playerSeq = 1;

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c;
  do {
    c = '';
    for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  } while (rooms.has(c));
  return c;
}

function newRoom() {
  const room = {
    code: makeCode(),
    phase: 'lobby',       // lobby | game | over
    turn: 0,
    timerEnd: 0,
    players: [],
    hostId: null,
    proposals: [],
    log: [],
    winner: null,
    timer: null,
  };
  rooms.set(room.code, room);
  return room;
}

function log(room, msg) {
  room.log.unshift({ msg, turn: room.turn });
  if (room.log.length > 100) room.log.length = 100;
}

function ownProvinces(p) { return p.provinces.filter(pr => pr.owner === p.id); }

function snapshot(room) {
  return {
    t: 'state',
    phase: room.phase,
    code: room.code,
    turn: room.turn,
    timerEnd: room.timerEnd,
    winner: room.winner,
    log: room.log.slice(0, 60),
    proposals: room.proposals,
    players: room.players.map(p => ({
      id: p.id, name: p.name, country: p.country,
      money: Math.round(p.money), eco: p.eco, mil: p.mil,
      aprov: p.aprov, ap: p.ap, alive: p.alive,
      allies: p.allies, connected: p.connected,
      isHost: p.id === room.hostId, reason: p.eliminatedReason,
      nuclear: p.nuclear, influencia: p.influencia, fe: p.fe,
      provinces: p.provinces, sanctioning: p.sanctioning, sanctionedBy: p.sanctionedBy,
    })),
  };
}

function broadcast(room) {
  const base = snapshot(room);
  for (const p of room.players) {
    if (p.conn && p.connected) p.conn.send({ ...base, you: p.id });
  }
}

function err(conn, msg) { if (conn) conn.send({ t: 'error', msg }); }
function info(conn, msg) { if (conn) conn.send({ t: 'info', msg }); }

function addPlayer(room, conn, name, isHost) {
  const p = {
    id: 'p' + (playerSeq++),
    conn, name, country: null,
    money: 0, eco: 0, mil: 0, aprov: 50, ap: AP_PER_TURN,
    alive: true, allies: [], connected: true,
    eliminatedReason: null,
    nuclear: 0, influencia: 0, fe: 0,
    provinces: [], sanctioning: [], sanctionedBy: [],
  };
  conn.meta = { room, player: p };
  room.players.push(p);
  if (isHost) room.hostId = p.id;
  return p;
}

/* ---------------- Fluxo da partida ---------------- */
function startGame(room) {
  const taken = new Set(room.players.map(p => p.country).filter(Boolean));
  const free = COUNTRIES.filter(c => !taken.has(c.id));
  for (const p of room.players) {
    if (!p.country) {
      const i = Math.floor(Math.random() * free.length);
      p.country = free.splice(i, 1)[0].id;
    }
    const c = COUNTRY_BY_ID[p.country];
    p.money = c.money; p.eco = c.eco; p.mil = c.mil;
    p.aprov = 50; p.ap = AP_PER_TURN; p.alive = true;
    p.allies = []; p.eliminatedReason = null;
    p.nuclear = 0; p.influencia = 0; p.fe = 0;
    p.provinces = c.provs.map(([name, infra]) => ({ name, infra, owner: p.id }));
    p.sanctioning = []; p.sanctionedBy = [];
  }
  room.phase = 'game';
  room.turn = 1;
  room.proposals = [];
  room.timerEnd = Date.now() + TURN_SECONDS * 1000;
  log(room, '🏛️ Mandato iniciado! Governem com sabedoria (ou não).');
  if (!room.timer) {
    room.timer = setInterval(() => {
      if (room.phase === 'game' && Date.now() >= room.timerEnd) resolveTurn(room);
    }, 1000);
  }
  broadcast(room);
}

function checkEliminations(room) {
  for (const p of room.players) {
    if (!p.alive) continue;
    if (p.aprov <= 5) {
      p.alive = false;
      p.eliminatedReason = 'Deposto por revolta popular';
    } else if (p.provinces.length && ownProvinces(p).length === 0) {
      p.alive = false;
      p.eliminatedReason = 'Conquista total do território';
    } else continue;
    // limpa alianças e sanções
    p.allies.forEach(aid => {
      const a = room.players.find(x => x.id === aid);
      if (a) a.allies = a.allies.filter(id => id !== p.id);
    });
    p.sanctioning.forEach(tid => {
      const t = room.players.find(x => x.id === tid);
      if (t) t.sanctionedBy = t.sanctionedBy.filter(id => id !== p.id);
    });
    p.sanctionedBy.forEach(sid => {
      const s = room.players.find(x => x.id === sid);
      if (s) s.sanctioning = s.sanctioning.filter(id => id !== p.id);
    });
    p.allies = []; p.sanctioning = []; p.sanctionedBy = [];
    log(room, `💥 ${cname(p)} (${p.name}) foi ELIMINADO: ${p.eliminatedReason}!`);
  }
}

function checkVictory(room) {
  if (room.phase !== 'game') return;
  const alive = room.players.filter(p => p.alive);
  let winner = null, reason = '';
  if (room.players.length > 1 && alive.length === 1) {
    winner = alive[0]; reason = 'Domínio global — última nação de pé';
  } else {
    const ecoW = alive.find(p => p.eco >= 60);
    if (ecoW) { winner = ecoW; reason = 'Hegemonia econômica (economia 60+)'; }
    const ideoW = alive.find(p => p.influencia >= 60);
    if (!winner && ideoW) { winner = ideoW; reason = 'Hegemonia ideológica — sua doutrina dominou o mundo'; }
    const feW = alive.find(p => p.fe >= 60);
    if (!winner && feW) { winner = feW; reason = 'Hegemonia religiosa — sua fé unificou o mundo'; }
  }
  if (winner) {
    room.phase = 'over';
    room.winner = { id: winner.id, name: winner.name, country: winner.country, reason };
    log(room, `🏆 ${cname(winner)} (${winner.name}) VENCEU: ${reason}!`);
    if (room.timer) { clearInterval(room.timer); room.timer = null; }
  }
}

function incomeOf(p) {
  const prov = ownProvinces(p).reduce((s, pr) => s + pr.infra, 0) * PROV_INCOME;
  const allyB = p.allies.length * 25;
  const sancIn = p.sanctionedBy.length * 50;   // sofre sanções
  const sancOut = p.sanctioning.length * 20;   // custo de manter sanções
  return p.eco * 10 + prov + allyB - sancIn - sancOut - Math.round(p.mil * 2);
}

function resolveTurn(room) {
  room.turn++;
  for (const p of room.players) {
    if (!p.alive) continue;
    p.money += incomeOf(p);
    if (p.money < 0) {
      p.money = 0;
      p.mil = Math.max(1, Math.round(p.mil * 0.9));
    }
    p.aprov = Math.max(0, p.aprov - 1);
    p.ap = AP_PER_TURN;
  }
  randomEvent(room);
  checkEliminations(room);
  checkVictory(room);
  if (room.phase === 'game') room.timerEnd = Date.now() + TURN_SECONDS * 1000;
  broadcast(room);
}

function randomEvent(room) {
  if (Math.random() > 0.45) return;
  const alive = room.players.filter(p => p.alive);
  if (!alive.length) return;
  const pick = alive[Math.floor(Math.random() * alive.length)];
  switch (Math.floor(Math.random() * 8)) {
    case 0:
      alive.forEach(p => p.money += 80);
      log(room, '📈 Boom das commodities: todas as nações recebem +$80.');
      break;
    case 1:
      pick.money = Math.max(0, pick.money - 150);
      log(room, `📉 Crise financeira atinge ${cname(pick)}: -$150.`);
      break;
    case 2:
      alive.forEach(p => p.aprov = Math.min(100, p.aprov + 3));
      log(room, '🕊️ Cúpula de paz global: aprovação +3 para todos.');
      break;
    case 3:
      pick.mil = Math.max(1, pick.mil - 2);
      pick.aprov = Math.max(0, pick.aprov - 4);
      log(room, `🪖 Tentativa de golpe em ${cname(pick)}: -2 militar, -4 aprovação.`);
      break;
    case 4:
      pick.eco += 1;
      log(room, `🛢️ ${cname(pick)} descobre novas reservas: economia +1.`);
      break;
    case 5:
      pick.aprov = Math.min(100, pick.aprov + 5);
      log(room, `🎉 Festival nacional em ${cname(pick)}: aprovação +5.`);
      break;
    case 6: {
      const provs = ownProvinces(pick).filter(pr => pr.infra < 5);
      if (provs.length) { provs[0].infra += 1; log(room, `🏗️ Obra concluída em ${provs[0].name} (${cname(pick)}): infraestrutura +1.`); }
      break;
    }
    case 7:
      pick.influencia += 2;
      log(room, `🎬 Cultura de ${cname(pick)} conquista o mundo: influência +2.`);
      break;
  }
}

/* ---------------- Ações ---------------- */
function spend(p, ap, cost) {
  if (p.ap < ap) { err(p.conn, 'Pontos de ação insuficientes neste turno.'); return false; }
  if (p.money < cost) { err(p.conn, 'Dinheiro insuficiente no caixa.'); return false; }
  p.ap -= ap; p.money -= cost;
  return true;
}

function performAction(room, p, msg) {
  if (room.phase !== 'game' || !p.alive) return;
  const target = msg.target ? room.players.find(x => x.id === msg.target) : null;

  switch (msg.action) {
    case 'investir':
      if (!spend(p, 1, 250)) return;
      p.eco += 2;
      log(room, `🏭 ${cname(p)} investiu na economia (+2).`);
      break;

    case 'militar':
      if (!spend(p, 1, 300)) return;
      p.mil += 3;
      log(room, `🪖 ${cname(p)} recrutou tropas (+3 militar).`);
      break;

    case 'propaganda':
      if (!spend(p, 1, 150)) return;
      p.aprov = Math.min(100, p.aprov + 7);
      log(room, `📺 ${cname(p)} lançou campanha de propaganda (+7 aprovação).`);
      break;

    case 'ideologia':
      if (!spend(p, 1, 200)) return;
      p.influencia += 2;
      log(room, `⚖️ ${cname(p)} expande sua doutrina pelo mundo (+2 influência).`);
      break;

    case 'fe':
      if (!spend(p, 1, 200)) return;
      p.fe += 2;
      log(room, `🕌 ${cname(p)} envia missionários aos quatro cantos (+2 fé).`);
      break;

    case 'nuclear':
      if (p.nuclear >= NUKE_MAX_LEVEL) { err(p.conn, 'Programa nuclear no nível máximo.'); return; }
      if (!spend(p, 2, 600)) return;
      p.nuclear += 1;
      log(room, p.nuclear >= NUKE_MIN_LEVEL
        ? `☢️ ${cname(p)} atingiu o nível ${p.nuclear} do programa nuclear — CAPAZ DE LANÇAR MÍSSEIS!`
        : `☢️ ${cname(p)} avança seu programa nuclear (nível ${p.nuclear}).`);
      break;

    case 'infra': {
      const prov = p.provinces[msg.prov];
      if (!prov || prov.owner !== p.id) return;
      if (prov.infra >= 5) { err(p.conn, 'Infraestrutura no máximo nesta província.'); return; }
      if (!spend(p, 1, 200)) return;
      prov.infra += 1;
      log(room, `🏗️ ${cname(p)} desenvolve ${prov.name} (infraestrutura ${prov.infra}).`);
      break;
    }

    case 'espionar': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 100)) return;
      info(p.conn, `🕵️ Relatório sobre ${cname(target)} — Caixa: $${Math.round(target.money)} | Eco: ${target.eco} | Mil: ${target.mil} | ❤️ ${target.aprov}% | ☢️ ${target.nuclear} | ⚖️ ${target.influencia} | 🕌 ${target.fe} | Províncias: ${ownProvinces(target).length}`);
      break;
    }

    case 'sabotagem': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 150)) return;
      const r = Math.random();
      if (r < 0.5) {
        const provs = ownProvinces(target).filter(pr => pr.infra > 0);
        if (provs.length) {
          const pr = provs[Math.floor(Math.random() * provs.length)];
          pr.infra -= 1;
          log(room, `🧨 Sabotagem de ${cname(p)} destrói infraestrutura em ${pr.name} (${cname(target)})!`);
        } else {
          target.mil = Math.max(1, target.mil - 3);
          log(room, `🧨 Sabotagem de ${cname(p)} danifica o arsenal de ${cname(target)} (-3 militar)!`);
        }
      } else if (r < 0.8) {
        p.aprov = Math.max(0, p.aprov - 5);
        target.aprov = Math.min(100, target.aprov + 2);
        log(room, `🚨 ${cname(p)} foi EXPOSTO sabotando ${cname(target)}! O mundo condena (-5 aprovação).`);
      } else {
        log(room, `🕵️ Agentes de ${cname(p)} falham silenciosamente em ${cname(target)}.`);
      }
      break;
    }

    case 'sancao': {
      if (!target || target === p || !target.alive) return;
      if (p.sanctioning.includes(target.id)) {
        p.sanctioning = p.sanctioning.filter(id => id !== target.id);
        target.sanctionedBy = target.sanctionedBy.filter(id => id !== p.id);
        log(room, `🕊️ ${cname(p)} suspende as sanções contra ${cname(target)}.`);
      } else {
        if (p.sanctioning.length >= 3) { err(p.conn, 'Máximo de 3 sanções ativas.'); return; }
        if (!spend(p, 1, 0)) return;
        p.sanctioning.push(target.id);
        target.sanctionedBy.push(p.id);
        log(room, `🚫 ${cname(p)} impõe SANÇÕES econômicas a ${cname(target)}!`);
      }
      break;
    }

    case 'ajudar': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 200)) return;
      target.money += 200;
      p.aprov = Math.min(100, p.aprov + 2);
      target.aprov = Math.min(100, target.aprov + 2);
      log(room, `🤝 ${cname(p)} enviou ajuda humanitária ($200) para ${cname(target)}.`);
      break;
    }

    case 'alianca': {
      if (!target || target === p || !target.alive) return;
      if (p.allies.includes(target.id)) { err(p.conn, 'Vocês já são aliados.'); return; }
      if (p.allies.length >= 3) { err(p.conn, 'Limite de 3 alianças atingido.'); return; }
      if (target.allies.length >= 3) { err(p.conn, 'O outro país já tem 3 alianças.'); return; }
      if (room.proposals.some(pr => pr.from === p.id && pr.to === target.id)) return;
      room.proposals.push({ from: p.id, to: target.id });
      info(target.conn, `🤝 ${cname(p)} propôs uma ALIANÇA com você!`);
      break;
    }

    case 'atacar': {
      if (!target || target === p || !target.alive) return;
      if (p.allies.includes(target.id)) { err(p.conn, 'Você não pode atacar um aliado.'); return; }
      if (p.ap < 2) { err(p.conn, 'Atacar custa 2 pontos de ação.'); return; }
      p.ap -= 2;
      const aP = p.mil * (0.85 + Math.random() * 0.45);
      const dP = target.mil * (0.9 + Math.random() * 0.45) * 1.08;
      if (aP > dP) {
        const loot = Math.round(target.money * 0.25);
        target.money -= loot; p.money += loot;
        target.mil = Math.max(1, Math.round(target.mil * 0.8));
        p.mil = Math.max(1, Math.round(p.mil * 0.9));
        target.aprov = Math.max(0, target.aprov - 8);
        p.aprov = Math.max(0, p.aprov - 3);
        log(room, `⚔️ ${cname(p)} atacou ${cname(target)} e VENCEU! Saque: $${loot}.`);
        const provs = ownProvinces(target);
        if (provs.length) {
          const pr = provs[Math.floor(Math.random() * provs.length)];
          pr.owner = p.id;
          log(room, `🏴 ${cname(p)} OCUPA a província de ${pr.name}!`);
        }
      } else {
        p.mil = Math.max(1, Math.round(p.mil * 0.7));
        target.mil = Math.max(1, Math.round(target.mil * 0.92));
        p.aprov = Math.max(0, p.aprov - 6);
        target.aprov = Math.min(100, target.aprov + 4);
        log(room, `🛡️ ${cname(target)} REPELIU o ataque de ${cname(p)}!`);
      }
      break;
    }

    case 'nuke': {
      if (!target || target === p || !target.alive) return;
      if (p.allies.includes(target.id)) { err(p.conn, 'Você não pode atacar um aliado.'); return; }
      if (p.nuclear < NUKE_MIN_LEVEL) { err(p.conn, `Programa nuclear insuficiente (nível ${NUKE_MIN_LEVEL}+ necessário).`); return; }
      if (p.ap < 3) { err(p.conn, 'Lançar um míssil custa 3 pontos de ação.'); return; }
      p.ap -= 3;
      p.nuclear -= 1;
      target.mil = Math.max(1, Math.round(target.mil * 0.4));
      target.aprov = Math.max(0, target.aprov - 20);
      p.aprov = Math.max(0, p.aprov - 10);
      const provs = ownProvinces(target);
      for (let i = 0; i < 2 && provs.length; i++) {
        const pr = provs[Math.floor(Math.random() * provs.length)];
        pr.infra = Math.max(0, pr.infra - 2);
      }
      log(room, `☢️💥 ${cname(p)} LANÇOU UM MÍSSIL NUCLEAR em ${cname(target)}! Devastação total. O mundo condena (-10 aprovação).`);
      break;
    }
    default: return;
  }

  checkEliminations(room);
  checkVictory(room);
  broadcast(room);
}

function respondProposal(room, p, fromId, accept) {
  const idx = room.proposals.findIndex(pr => pr.from === fromId && pr.to === p.id);
  if (idx === -1) return;
  room.proposals.splice(idx, 1);
  const from = room.players.find(x => x.id === fromId);
  if (!from || !from.alive || !p.alive) { broadcast(room); return; }
  if (accept) {
    if (from.allies.includes(p.id)) { broadcast(room); return; }
    if (from.allies.length >= 3 || p.allies.length >= 3) { err(p.conn, 'Limite de alianças atingido.'); broadcast(room); return; }
    from.allies.push(p.id);
    p.allies.push(from.id);
    log(room, `🤝 ALIANÇA firmada entre ${cname(from)} e ${cname(p)}!`);
  } else {
    log(room, `🚫 ${cname(p)} recusou a proposta de aliança de ${cname(from)}.`);
  }
  broadcast(room);
}

/* ---------------- Conexões ---------------- */
function handleDisconnect(conn) {
  const meta = conn.meta;
  if (!meta) return;
  const { room, player } = meta;
  conn.meta = null;

  if (room.phase === 'lobby') {
    room.players = room.players.filter(p => p !== player);
    if (!room.players.length) {
      if (room.timer) clearInterval(room.timer);
      rooms.delete(room.code);
      return;
    }
    if (room.hostId === player.id) room.hostId = room.players[0].id;
    broadcast(room);
  } else {
    player.connected = false;
    player.conn = null;
    log(room, `📴 ${player.name} perdeu a conexão.`);
    if (room.hostId === player.id) {
      const next = room.players.find(p => p.connected);
      if (next) room.hostId = next.id;
    }
    const anyConnected = room.players.some(p => p.connected);
    if (!anyConnected) {
      if (room.timer) clearInterval(room.timer);
      rooms.delete(room.code);
      return;
    }
    broadcast(room);
  }
}

function sanitizeName(n) {
  return String(n || '').replace(/[^\p{L}\p{N} _\-.]/gu, '').trim().slice(0, 18) || 'Presidente';
}

function route(conn, msg) {
  switch (msg.t) {
    case 'create': {
      if (conn.meta) return;
      const name = sanitizeName(msg.name);
      const room = newRoom();
      addPlayer(room, conn, name, true);
      log(room, `👋 ${name} criou a sala.`);
      broadcast(room);
      break;
    }
    case 'join': {
      if (conn.meta) return;
      const code = String(msg.code || '').toUpperCase().trim();
      const room = rooms.get(code);
      if (!room) return err(conn, 'Sala não encontrada. Confira o código.');
      if (room.phase !== 'lobby') return err(conn, 'Essa partida já começou. Crie sua própria sala!');
      if (room.players.length >= COUNTRIES.length) return err(conn, 'Sala cheia (12 jogadores).');
      const name = sanitizeName(msg.name);
      addPlayer(room, conn, name, false);
      log(room, `👋 ${name} entrou na sala.`);
      broadcast(room);
      break;
    }
    case 'pick': {
      const { room, player } = conn.meta || {};
      if (!room || room.phase !== 'lobby') return;
      const cid = String(msg.country || '');
      if (!COUNTRY_BY_ID[cid]) return;
      if (room.players.some(p => p.country === cid && p !== player)) return err(conn, 'Esse país já foi escolhido.');
      player.country = player.country === cid ? null : cid;
      broadcast(room);
      break;
    }
    case 'start': {
      const { room, player } = conn.meta || {};
      if (!room || room.phase !== 'lobby' || player.id !== room.hostId) return;
      startGame(room);
      break;
    }
    case 'action': {
      const { room, player } = conn.meta || {};
      if (!room) return;
      performAction(room, player, msg);
      break;
    }
    case 'resp_alianca': {
      const { room, player } = conn.meta || {};
      if (!room || room.phase !== 'game') return;
      respondProposal(room, player, msg.from, !!msg.accept);
      break;
    }
    case 'fim_turno': {
      const { room, player } = conn.meta || {};
      if (!room || room.phase !== 'game' || player.id !== room.hostId) return;
      resolveTurn(room);
      break;
    }
    case 'chat': {
      const { room, player } = conn.meta || {};
      if (!room) return;
      const text = String(msg.text || '').slice(0, 200).trim();
      if (!text) return;
      const c = COUNTRY_BY_ID[player.country];
      for (const p of room.players) {
        if (p.conn && p.connected) p.conn.send({ t: 'chat', from: player.name, flag: c ? c.flag : '🏳️', text });
      }
      break;
    }
  }
}

function handleClient(conn) {
  conn.onMessage = text => {
    let msg;
    try { msg = JSON.parse(text); } catch (e) { return; }
    if (!msg || typeof msg !== 'object') return;
    try { route(conn, msg); } catch (e) { console.error('route error:', e); }
  };
  conn.onClose = () => handleDisconnect(conn);
}

/* ---------------- HTTP ---------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/healthz' || url.pathname === '/health') { res.writeHead(200); return res.end('ok'); }
  let rel = url.pathname === '/' ? '/index.html' : url.pathname;
  const fp = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!fp.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('403'); }
  fs.readFile(fp, (e, data) => {
    if (e) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + acceptKey(key) + '\r\n\r\n'
  );
  socket.resume();
  handleClient(new WSConn(socket));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🏛️ Presidente Online (COMPLETO) rodando em http://0.0.0.0:${PORT}`);
});
