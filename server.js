'use strict';
/* ============================================================
   PRESIDENTE ONLINE — Simulador de Geopolítica Multiplayer
   VERSÃO TOTAL: impostos, empréstimos, ministros, ideologias,
   religião de Estado, tecnologias, setores sociais, relações
   bilaterais, embaixadas, acordos comerciais, bloqueio naval,
   ONU com votações, programa espacial, nuclear, províncias,
   sanções, sabotagem, guerras/paz, 5+ vitórias.
   Servidor HTTP + WebSocket sem dependências externas.
   ============================================================ */
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const AP_PER_TURN = 4;
const PROV_INCOME = 6;
const NUKE_MIN_LEVEL = 3;
const NUKE_MAX_LEVEL = 5;

/* ---------------- Conteúdo (original) ---------------- */
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

const IDEOLOGIES = {
  democracia:    { name: 'Democracia',    desc: '+5% renda' },
  autoritarismo: { name: 'Autoritarismo', desc: '+15% ataque, -1 aprovação/turno' },
  comunismo:     { name: 'Comunismo',     desc: 'setores 50% mais baratos, -10% renda' },
  fascismo:      { name: 'Fascismo',      desc: 'recrutar 50% mais barato, relações decaem mais' },
  monarquia:     { name: 'Monarquia',     desc: 'diplomacia 50% mais barata, +1 aprovação/turno' },
  republica:     { name: 'República',     desc: 'tecnologias 25% mais baratas' },
};
const RELIGIONS = {
  laico:     { name: 'Estado Laico', desc: 'sem bônus de fé' },
  cristao:   { name: 'Cristã',       desc: '+1 fé/turno' },
  muculmano: { name: 'Islâmica',     desc: '+1 fé/turno' },
  budista:   { name: 'Budista',      desc: '+1 fé/turno' },
  hindu:     { name: 'Hindu',        desc: '+1 fé/turno' },
};
const MINISTERS = {
  eco: { tec: { name: 'Tecocrata', desc: '+10% renda' }, pop: { name: 'Populista', desc: '+1 aprovação/turno, -5% renda' } },
  def: { fal: { name: 'Falcão', desc: '+10% ataque' }, estr: { name: 'Estrategista', desc: '+10% defesa' } },
  dip: { neg: { name: 'Negociador', desc: 'diplomacia -50% custo' }, inf: { name: 'Influenciador', desc: '+1 influência/turno' } },
};
const TECHS = {
  livrecomercio: { name: 'Livre Comércio Global', cost: 500, desc: '+$20/turno' },
  automacao:     { name: 'Automação Industrial',  cost: 600, desc: '+2 economia' },
  exercito:      { name: 'Exército Profissional', cost: 600, desc: '+15% ataque' },
  antiaerea:     { name: 'Defesa Antiaérea',      cost: 600, desc: 'dano nuclear -50%' },
  bemestar:      { name: 'Estado de Bem-Estar',   cost: 500, desc: 'desgaste de aprovação pela metade' },
  midia:         { name: 'Mídia Global',          cost: 500, desc: '+1 influência/turno' },
};
const SECTORS = [
  ['educacao', 'Educação'], ['saude', 'Saúde'], ['cultura', 'Cultura'],
  ['esportes', 'Esportes'], ['habitacao', 'Habitação'], ['justica', 'Justiça'],
];
const SPACE_COSTS = [500, 800, 1200];
const UN_TYPES = [
  { id: 'proibir_guerra', desc: 'Proibição de novas declarações de guerra por 3 turnos' },
  { id: 'proibir_armas',  desc: 'Proibição de recrutamento militar por 3 turnos' },
  { id: 'embargo',        desc: 'Embargo econômico contra {T} por 3 turnos' },
  { id: 'condenar',       desc: 'Condenação internacional de {T} (-6 aprovação)' },
];

/* ---------------- WebSocket artesanal ---------------- */
function acceptKey(key) { return crypto.createHash('sha1').update(key + MAGIC).digest('base64'); }
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
    this.socket = socket; this.buffer = Buffer.alloc(0);
    this.onMessage = null; this.onClose = null; this.closed = false;
    socket.setNoDelay(true);
    socket.on('data', chunk => { this.buffer = Buffer.concat([this.buffer, chunk]); this.drain(); });
    socket.on('close', () => this._close());
    socket.on('error', () => this._close());
    socket.on('end', () => { try { socket.end(); } catch (e) {} this._close(); });
    this.pingTimer = setInterval(() => {
      try { if (!this.closed) socket.write(encodeFrame(Buffer.alloc(0), 0x9)); } catch (e) {}
    }, 25000);
  }
  _close() {
    if (this.closed) return;
    this.closed = true; clearInterval(this.pingTimer);
    try { this.socket.destroy(); } catch (e) {}
    if (this.onClose) this.onClose();
  }
  parseFrame() {
    const buf = this.buffer;
    if (buf.length < 2) return null;
    const opcode = buf[0] & 0x0f;
    const masked = (buf[1] & 0x80) !== 0;
    let len = buf[1] & 0x7f, off = 2;
    if (len === 126) { if (buf.length < 4) return null; len = buf.readUInt16BE(2); off = 4; }
    else if (len === 127) { if (buf.length < 10) return null; len = Number(buf.readBigUInt64BE(2)); off = 10; }
    let maskKey = null;
    if (masked) {
      if (buf.length < off + 4) return null;
      maskKey = buf.subarray(off, off + 4); off += 4;
    }
    if (buf.length < off + len) return null;
    let payload = buf.subarray(off, off + len);
    if (masked) { const out = Buffer.alloc(len); for (let i = 0; i < len; i++) out[i] = payload[i] ^ maskKey[i & 3]; payload = out; }
    this.buffer = buf.subarray(off + len);
    return { opcode, payload };
  }
  drain() {
    let frame;
    while ((frame = this.parseFrame())) {
      const { opcode, payload } = frame;
      if (opcode === 0x8) { try { this.socket.write(encodeFrame(Buffer.alloc(0), 0x8)); } catch (e) {} this._close(); return; }
      else if (opcode === 0x9) { try { this.socket.write(encodeFrame(payload, 0xA)); } catch (e) {} }
      else if (opcode === 0xA) {}
      else if (opcode === 0x1 || opcode === 0x0) { if (this.onMessage) this.onMessage(payload.toString('utf8')); }
    }
  }
  send(obj) { if (this.closed) return; try { this.socket.write(encodeFrame(JSON.stringify(obj))); } catch (e) { this._close(); } }
}

/* ---------------- Estado ---------------- */
const rooms = new Map();
let playerSeq = 1;
function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c;
  do { c = ''; for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)]; } while (rooms.has(c));
  return c;
}
function newRoom() {
  const room = {
    code: makeCode(), phase: 'lobby', turn: 0, timerEnd: 0, speed: 45,
    players: [], hostId: null, proposals: [], log: [], winner: null, timer: null,
    un: null, noWarUntil: 0, noArmsUntil: 0, embargo: null,
  };
  rooms.set(room.code, room);
  return room;
}
function log(room, msg) { room.log.unshift({ msg, turn: room.turn }); if (room.log.length > 120) room.log.length = 120; }
function ownProvinces(p) { return p.provinces.filter(pr => pr.owner === p.id); }
function sectorSum(p) { return SECTORS.reduce((s, [k]) => s + p.sectors[k], 0); }
function relBetween(a, b) { return a.relations[b.id] != null ? a.relations[b.id] : 50; }
function relBonus(p) {
  let n = 0;
  for (const id in p.relations) if (p.relations[id] >= 70) n++;
  return Math.min(3, n) * 10;
}
function dipCost(p, c) {
  return (p.ministers.dip === 'neg' || p.ideology === 'monarquia') ? Math.round(c / 2) : c;
}

function snapshot(room) {
  return {
    t: 'state', phase: room.phase, code: room.code, turn: room.turn,
    timerEnd: room.timerEnd, speed: room.speed, winner: room.winner,
    log: room.log.slice(0, 60), proposals: room.proposals,
    un: room.un, noWarUntil: room.noWarUntil, noArmsUntil: room.noArmsUntil, embargo: room.embargo,
    players: room.players.map(p => ({
      id: p.id, name: p.name, country: p.country, color: p.color,
      money: Math.round(p.money), eco: p.eco, mil: p.mil, aprov: p.aprov, ap: p.ap,
      alive: p.alive, allies: p.allies, connected: p.connected,
      isHost: p.id === room.hostId, reason: p.eliminatedReason,
      nuclear: p.nuclear, influencia: p.influencia, fe: p.fe, wars: p.wars,
      provinces: p.provinces, sanctioning: p.sanctioning, sanctionedBy: p.sanctionedBy,
      taxRate: p.taxRate, debt: p.debt, ideology: p.ideology, religion: p.religion,
      ministers: p.ministers, techs: p.techs, sectors: p.sectors, space: p.space,
      relations: p.relations, embassies: p.embassies, trades: p.trades,
      blockading: p.blockading, blockadedBy: p.blockadedBy,
    })),
  };
}
function broadcast(room) {
  const base = snapshot(room);
  for (const p of room.players) if (p.conn && p.connected) p.conn.send({ ...base, you: p.id });
}
function err(conn, msg) { if (conn) conn.send({ t: 'error', msg }); }
function info(conn, msg) { if (conn) conn.send({ t: 'info', msg }); }

function addPlayer(room, conn, name, isHost) {
  const p = {
    id: 'p' + (playerSeq++), conn, name, country: null, color: (playerSeq + 5) % 12,
    money: 0, eco: 0, mil: 0, aprov: 50, ap: AP_PER_TURN, alive: true,
    allies: [], connected: true, eliminatedReason: null,
    nuclear: 0, influencia: 0, fe: 0, provinces: [], wars: [],
    sanctioning: [], sanctionedBy: [],
    taxRate: 1, debt: 0, ideology: null, religion: 'laico',
    ministers: { eco: null, def: null, dip: null },
    techs: [], sectors: { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0 },
    space: 0, relations: {}, embassies: [], trades: [], blockading: [], blockadedBy: [],
  };
  conn.meta = { room, player: p };
  room.players.push(p);
  if (isHost) room.hostId = p.id;
  return p;
}

/* ---------------- Fluxo ---------------- */
function startGame(room) {
  const taken = new Set(room.players.map(p => p.country).filter(Boolean));
  const free = COUNTRIES.filter(c => !taken.has(c.id));
  for (const p of room.players) {
    if (!p.country) { const i = Math.floor(Math.random() * free.length); p.country = free.splice(i, 1)[0].id; }
    const c = COUNTRY_BY_ID[p.country];
    p.money = c.money; p.eco = c.eco; p.mil = c.mil;
    p.aprov = 50; p.ap = AP_PER_TURN; p.alive = true;
    p.allies = []; p.eliminatedReason = null; p.nuclear = 0; p.influencia = 0; p.fe = 0; p.wars = [];
    p.provinces = c.provs.map(([name, infra]) => ({ name, infra, owner: p.id }));
    p.sanctioning = []; p.sanctionedBy = [];
    p.taxRate = 1; p.debt = 0; p.ideology = null; p.religion = 'laico';
    p.ministers = { eco: null, def: null, dip: null };
    p.techs = []; p.sectors = { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0 };
    p.space = 0; p.relations = {}; p.embassies = []; p.trades = []; p.blockading = []; p.blockadedBy = [];
    for (const o of room.players) if (o !== p) { p.relations[o.id] = 50; o.relations[p.id] = 50; }
  }
  room.phase = 'game'; room.turn = 1; room.proposals = [];
  room.un = null; room.noWarUntil = 0; room.noArmsUntil = 0; room.embargo = null;
  room.timerEnd = Date.now() + room.speed * 1000;
  log(room, '🏛️ Mandato iniciado! Governem com sabedoria (ou não).');
  if (!room.timer) {
    room.timer = setInterval(() => {
      if (room.phase !== 'game') return;
      if (Date.now() >= room.timerEnd) resolveTurn(room);
      if (room.un && Date.now() >= room.un.deadline) resolveUN(room);
    }, 1000);
  }
  broadcast(room);
}

function checkEliminations(room) {
  for (const p of room.players) {
    if (!p.alive) continue;
    if (p.aprov <= 5) { p.alive = false; p.eliminatedReason = 'Deposto por revolta popular'; }
    else if (p.provinces.length && ownProvinces(p).length === 0) { p.alive = false; p.eliminatedReason = 'Conquista total do território'; }
    else continue;
    p.allies.forEach(aid => { const a = room.players.find(x => x.id === aid); if (a) a.allies = a.allies.filter(id => id !== p.id); });
    p.sanctioning.forEach(tid => { const t = room.players.find(x => x.id === tid); if (t) t.sanctionedBy = t.sanctionedBy.filter(id => id !== p.id); });
    p.sanctionedBy.forEach(sid => { const s = room.players.find(x => x.id === sid); if (s) s.sanctioning = s.sanctioning.filter(id => id !== p.id); });
    p.wars.forEach(wid => { const w = room.players.find(x => x.id === wid); if (w) w.wars = w.wars.filter(id => id !== p.id); });
    p.trades.forEach(tid => { const t = room.players.find(x => x.id === tid); if (t) t.trades = t.trades.filter(id => id !== p.id); });
    p.embassies.forEach(tid => { const t = room.players.find(x => x.id === tid); if (t) t.embassies = t.embassies.filter(id => id !== p.id); });
    p.blockading.forEach(tid => { const t = room.players.find(x => x.id === tid); if (t) t.blockadedBy = t.blockadedBy.filter(id => id !== p.id); });
    p.blockadedBy.forEach(sid => { const s2 = room.players.find(x => x.id === sid); if (s2) s2.blockading = s2.blockading.filter(id => id !== p.id); });
    p.allies = []; p.sanctioning = []; p.sanctionedBy = []; p.wars = []; p.trades = []; p.embassies = []; p.blockading = []; p.blockadedBy = [];
    log(room, `💥 ${cname(p)} (${p.name}) foi ELIMINADO: ${p.eliminatedReason}!`);
  }
}

function checkVictory(room) {
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
  }
  if (winner) {
    room.phase = 'over';
    room.winner = { id: winner.id, name: winner.name, country: winner.country, reason };
    log(room, `🏆 ${cname(winner)} (${winner.name}) VENCEU: ${reason}!`);
    if (room.timer) { clearInterval(room.timer); room.timer = null; }
  }
}

function incomeOf(room, p) {
  const prov = ownProvinces(p).reduce((s, pr) => s + pr.infra, 0) * PROV_INCOME;
  let base = p.eco * 10 + prov
    + p.allies.length * 25
    + p.trades.length * 20
    + (p.space >= 3 ? 30 : 0)
    + sectorSum(p) * 2
    + relBonus(p);
  if (p.techs.includes('livrecomercio')) base += 20;
  let mult = 1;
  if (p.ideology === 'democracia') mult += 0.05;
  if (p.ideology === 'comunismo') mult -= 0.10;
  if (p.ministers.eco === 'tec') mult += 0.10;
  if (p.ministers.eco === 'pop') mult -= 0.05;
  if (p.taxRate === 2) mult += 0.15;
  if (p.taxRate === 0) mult -= 0.10;
  if (room.embargo && room.embargo.target === p.id && room.turn < room.embargo.until) mult *= 0.7;
  if (p.blockadedBy.length) mult *= 0.75;
  base *= mult;
  const costs = Math.round(p.mil * 2)
    + p.sanctionedBy.length * 50
    + p.sanctioning.length * 20
    + p.blockading.length * 15
    + Math.round(p.debt * 0.05);
  return Math.round(base - costs);
}

function resolveUN(room) {
  if (!room.un) return;
  const u = room.un;
  const yes = Object.values(u.votes).filter(v => v).length;
  const no = Object.values(u.votes).filter(v => !v).length;
  const passed = yes > no;
  const tgt = u.target ? room.players.find(p => p.id === u.target) : null;
  if (passed) {
    if (u.type === 'proibir_guerra') { room.noWarUntil = room.turn + 3; log(room, '🇺 A ONU APROVOU: proibição de novas guerras por 3 turnos!'); }
    if (u.type === 'proibir_armas') { room.noArmsUntil = room.turn + 3; log(room, '🇺 A ONU APROVOU: proibição de recrutamento por 3 turnos!'); }
    if (u.type === 'embargo' && tgt) { room.embargo = { target: tgt.id, until: room.turn + 3 }; log(room, `🇺🇳 A ONU APROVOU embargo econômico contra ${cname(tgt)}!`); }
    if (u.type === 'condenar' && tgt) { tgt.aprov = Math.max(0, tgt.aprov - 6); log(room, `🇺🇳 A ONU CONDENOU ${cname(tgt)} (-6 aprovação)!`); }
  } else {
    log(room, '🇺🇳 A ONU REJEITOU a resolução.');
  }
  room.un = null;
  checkEliminations(room);
  broadcast(room);
}

function openUN(room) {
  const alive = room.players.filter(p => p.alive);
  if (alive.length < 2) return;
  const type = UN_TYPES[Math.floor(Math.random() * UN_TYPES.length)];
  let target = null;
  if (type.id === 'embargo' || type.id === 'condenar') target = alive[Math.floor(Math.random() * alive.length)];
  room.un = { type: type.id, desc: type.desc.replace('{T}', target ? cname(target) : ''), target: target ? target.id : null, votes: {}, deadline: Date.now() + 20000 };
  log(room, `🇺🇳 Sessão da ONU: ${room.un.desc}. Votação aberta!`);
}

function resolveTurn(room) {
  room.turn++;
  for (const p of room.players) {
    if (!p.alive) continue;
    p.money += incomeOf(room, p);
    if (p.money < 0) { p.money = 0; p.mil = Math.max(1, Math.round(p.mil * 0.9)); }
    // aprovação
    let dAprov = -1;
    if (p.techs.includes('bemestar')) dAprov = Math.ceil(dAprov / 2);
    dAprov += Math.min(1, Math.floor(sectorSum(p) / 3));
    if (p.ideology === 'autoritarismo') dAprov -= 1;
    if (p.ideology === 'monarquia') dAprov += 1;
    if (p.ministers.eco === 'pop') dAprov += 1;
    if (p.taxRate === 0) dAprov += 1;
    if (p.taxRate === 2) dAprov -= 2;
    p.aprov = Math.max(0, Math.min(100, p.aprov + dAprov));
    // fé / influência passivos
    if (p.religion && p.religion !== 'laico') p.fe += 1;
    if (p.ministers.dip === 'inf') p.influencia += 1;
    if (p.techs.includes('midia')) p.influencia += 1;
    p.ap = AP_PER_TURN;
  }
  // relações: decaimento + embaixadas
  const alive = room.players.filter(p => p.alive);
  for (let i = 0; i < alive.length; i++) for (let j = i + 1; j < alive.length; j++) {
    const a = alive[i], b = alive[j];
    let dec = 2;
    if (a.ideology === 'fascismo' || b.ideology === 'fascismo') dec = 3;
    let v = relBetween(a, b) - dec;
    if (a.embassies.includes(b.id)) v += 3;
    if (b.embassies.includes(a.id)) v += 3;
    if (a.allies.includes(b.id)) v = Math.max(v, 80);
    v = Math.max(0, Math.min(100, v));
    a.relations[b.id] = v; b.relations[a.id] = v;
  }
  randomEvent(room);
  if (room.turn % 4 === 0 && !room.un) openUN(room);
  checkEliminations(room);
  checkVictory(room);
  if (room.phase === 'game') room.timerEnd = Date.now() + room.speed * 1000;
  broadcast(room);
}

function randomEvent(room) {
  if (Math.random() > 0.45) return;
  const alive = room.players.filter(p => p.alive);
  if (!alive.length) return;
  const pick = alive[Math.floor(Math.random() * alive.length)];
  switch (Math.floor(Math.random() * 9)) {
    case 0: alive.forEach(p => p.money += 80); log(room, '📈 Boom das commodities: todas as nações recebem +$80.'); break;
    case 1: pick.money = Math.max(0, pick.money - 150); log(room, `📉 Crise financeira atinge ${cname(pick)}: -$150.`); break;
    case 2: alive.forEach(p => p.aprov = Math.min(100, p.aprov + 3)); log(room, '🕊️ Cúpula de paz global: aprovação +3 para todos.'); break;
    case 3: pick.mil = Math.max(1, pick.mil - 2); pick.aprov = Math.max(0, pick.aprov - 4); log(room, `🪖 Tentativa de golpe em ${cname(pick)}: -2 militar, -4 aprovação.`); break;
    case 4: pick.eco += 1; log(room, `🛢️ ${cname(pick)} descobre novas reservas: economia +1.`); break;
    case 5: pick.aprov = Math.min(100, pick.aprov + 5); log(room, `🎉 Festival nacional em ${cname(pick)}: aprovação +5.`); break;
    case 6: { const provs = ownProvinces(pick).filter(pr => pr.infra < 5); if (provs.length) { provs[0].infra += 1; log(room, `🏗️ Obra concluída em ${provs[0].name} (${cname(pick)}): infraestrutura +1.`); } break; }
    case 7: pick.influencia += 2; log(room, `🎬 Cultura de ${cname(pick)} conquista o mundo: influência +2.`); break;
    case 8: { const provs = ownProvinces(pick).filter(pr => pr.infra > 0); if (provs.length) { const pr = provs[0]; pr.infra -= 1; log(room, `🌪️ Desastre natural em ${pr.name} (${cname(pick)}): infraestrutura -1. O mundo pode enviar ajuda!`); } break; }
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
    /* --- internos --- */
    case 'investir': if (!spend(p, 1, 250)) return; p.eco += 2; log(room, `🏭 ${cname(p)} investiu na economia (+2).`); break;
    case 'militar': {
      if (room.turn < room.noArmsUntil) { err(p.conn, '🇺🇳 Recrutamento proibido por resolução da ONU.'); return; }
      const cost = p.ideology === 'fascismo' ? 150 : 300;
      if (!spend(p, 1, cost)) return; p.mil += 3; log(room, `🪖 ${cname(p)} recrutou tropas (+3 militar).`); break;
    }
    case 'propaganda': if (!spend(p, 1, 150)) return; p.aprov = Math.min(100, p.aprov + 7); log(room, `📺 ${cname(p)} lançou campanha de propaganda (+7 aprovação).`); break;
    case 'ideologia':
      if (!IDEOLOGIES[msg.value]) return;
      if (!spend(p, 1, 0)) return;
      p.ideology = msg.value; p.aprov = Math.max(0, p.aprov - 5);
      log(room, `⚖️ ${cname(p)} adota a ideologia ${IDEOLOGIES[msg.value].name} (-5 aprovação na transição).`);
      break;
    case 'religiao':
      if (!RELIGIONS[msg.value]) return;
      if (!spend(p, 1, 0)) return;
      p.religion = msg.value; p.aprov = Math.max(0, p.aprov - 5);
      log(room, `🛐 ${cname(p)} adota a religião de Estado ${RELIGIONS[msg.value].name}.`);
      break;
    case 'ministro':
      if (!MINISTERS[msg.post] || !MINISTERS[msg.post][msg.value]) return;
      if (!spend(p, 1, 100)) return;
      p.ministers[msg.post] = msg.value;
      log(room, `💼 ${cname(p)} nomeia ${MINISTERS[msg.post][msg.value].name} para a pasta ${msg.post === 'eco' ? 'Economia' : msg.post === 'def' ? 'Defesa' : 'Diplomacia'}.`);
      break;
    case 'tech': {
      const t = TECHS[msg.value]; if (!t || p.techs.includes(msg.value)) return;
      const cost = p.ideology === 'republica' ? Math.round(t.cost * 0.75) : t.cost;
      if (!spend(p, 1, cost)) return;
      p.techs.push(msg.value);
      if (msg.value === 'automacao') p.eco += 2;
      log(room, `🔬 ${cname(p)} pesquisa ${t.name}!`);
      break;
    }
    case 'setor': {
      const sec = SECTORS.find(s => s[0] === msg.value); if (!sec) return;
      if (p.sectors[sec[0]] >= 5) return;
      const cost = p.ideology === 'comunismo' ? 75 : 150;
      if (!spend(p, 1, cost)) return;
      p.sectors[sec[0]] += 1;
      log(room, `🏙️ ${cname(p)} investe em ${sec[1]} (nível ${p.sectors[sec[0]]}).`);
      break;
    }
    case 'espacial': {
      if (p.space >= 3) return;
      if (!spend(p, 2, SPACE_COSTS[p.space])) return;
      p.space += 1; p.aprov = Math.min(100, p.aprov + 2);
      log(room, p.space === 3 ? `🚀 ${cname(p)} conclui o PROGRAMA ESPACIAL! Dividendos de prestígio ativos.` : `🚀 ${cname(p)} avança no programa espacial (nível ${p.space}).`);
      break;
    }
    case 'imposto': p.taxRate = Math.max(0, Math.min(2, msg.value | 0)); log(room, `🧾 ${cname(p)} ajusta impostos para ${['baixa', 'média', 'alta'][p.taxRate]}.`); break;
    case 'emprestimo': p.money += 600; p.debt += 720; log(room, `🏦 ${cname(p)} contrai empréstimo de $600 (dívida $${p.debt}).`); break;
    case 'pagar': { const x = Math.min(p.debt, p.money); if (x <= 0) return; p.money -= x; p.debt -= x; log(room, `🏦 ${cname(p)} paga $${x} da dívida.`); break; }
    case 'infra': {
      const prov = p.provinces[msg.prov];
      if (!prov || prov.owner !== p.id || prov.infra >= 5) return;
      if (!spend(p, 1, 200)) return;
      prov.infra += 1; log(room, `🏗️ ${cname(p)} desenvolve ${prov.name} (infraestrutura ${prov.infra}).`);
      break;
    }
    case 'nuclear':
      if (p.nuclear >= NUKE_MAX_LEVEL) { err(p.conn, 'Programa nuclear no nível máximo.'); return; }
      if (!spend(p, 2, 600)) return;
      p.nuclear += 1;
      log(room, p.nuclear >= NUKE_MIN_LEVEL ? `☢️ ${cname(p)} atingiu o nível ${p.nuclear} — CAPAZ DE LANÇAR MÍSSEIS!` : `☢️ ${cname(p)} avança seu programa nuclear (nível ${p.nuclear}).`);
      break;

    /* --- externos --- */
    case 'espionar': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, dipCost(p, 100))) return;
      info(p.conn, `🕵️ Relatório sobre ${cname(target)} — Caixa $${Math.round(target.money)} | Eco ${target.eco} | Mil ${target.mil} | ❤️ ${target.aprov}% | ☢️ ${target.nuclear} | ⚖️ ${target.influencia} | 🕌 ${target.fe} | Dívida $${target.debt}`);
      break;
    }
    case 'sabotagem': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, dipCost(p, 150))) return;
      const r = Math.random();
      if (r < 0.5) {
        const provs = ownProvinces(target).filter(pr => pr.infra > 0);
        if (provs.length) { const pr = provs[Math.floor(Math.random() * provs.length)]; pr.infra -= 1; log(room, `🧨 Sabotagem de ${cname(p)} destrói infraestrutura em ${pr.name} (${cname(target)})!`); }
        else { target.mil = Math.max(1, target.mil - 3); log(room, `🧨 Sabotagem de ${cname(p)} danifica o arsenal de ${cname(target)} (-3 militar)!`); }
        bumpRel(p, target, -5);
      } else if (r < 0.8) { p.aprov = Math.max(0, p.aprov - 5); target.aprov = Math.min(100, target.aprov + 2); log(room, `🚨 ${cname(p)} foi EXPOSTO sabotando ${cname(target)}!`); bumpRel(p, target, -10); }
      else log(room, `🕵️ Agentes de ${cname(p)} falham silenciosamente em ${cname(target)}.`);
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
        p.sanctioning.push(target.id); target.sanctionedBy.push(p.id);
        bumpRel(p, target, -20);
        log(room, `🚫 ${cname(p)} impõe SANÇÕES econômicas a ${cname(target)}!`);
      }
      break;
    }
    case 'ajudar': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 200)) return;
      target.money += 200; p.aprov = Math.min(100, p.aprov + 2); target.aprov = Math.min(100, target.aprov + 2);
      bumpRel(p, target, 10);
      log(room, `🤝 ${cname(p)} enviou ajuda humanitária ($200) para ${cname(target)}.`);
      break;
    }
    case 'embaixada': {
      if (!target || target === p || !target.alive || p.embassies.includes(target.id)) return;
      if (!spend(p, 1, dipCost(p, 200))) return;
      p.embassies.push(target.id); target.embassies.push(p.id);
      bumpRel(p, target, 10);
      log(room, `🏛️ ${cname(p)} abre embaixada em ${cname(target)}.`);
      break;
    }
    case 'comercial': {
      if (!target || target === p || !target.alive || p.trades.includes(target.id)) return;
      if (p.wars.includes(target.id)) { err(p.conn, 'Em guerra não há comércio.'); return; }
      if (room.proposals.some(pr => pr.from === p.id && pr.to === target.id && pr.kind === 'comercial')) return;
      room.proposals.push({ from: p.id, to: target.id, kind: 'comercial' });
      info(target.conn, `💼 ${cname(p)} propôs um ACORDO COMERCIAL!`);
      break;
    }
    case 'alianca': {
      if (!target || target === p || !target.alive) return;
      if (p.wars.includes(target.id)) { err(p.conn, 'Assine a paz antes de propor aliança.'); return; }
      if (p.allies.includes(target.id)) { err(p.conn, 'Vocês já são aliados.'); return; }
      if (p.allies.length >= 3 || target.allies.length >= 3) { err(p.conn, 'Limite de 3 alianças.'); return; }
      if (room.proposals.some(pr => pr.from === p.id && pr.to === target.id && pr.kind === 'alianca')) return;
      room.proposals.push({ from: p.id, to: target.id, kind: 'alianca' });
      info(target.conn, `🤝 ${cname(p)} propôs uma ALIANÇA com você!`);
      break;
    }
    case 'guerra': {
      if (!target || target === p || !target.alive) return;
      if (room.turn < room.noWarUntil) { err(p.conn, '🇺🇳 A ONU proibiu novas guerras neste período.'); return; }
      if (p.wars.includes(target.id)) { err(p.conn, 'Vocês já estão em guerra.'); return; }
      if (p.allies.includes(target.id)) { err(p.conn, 'Você não pode declarar guerra a um aliado.'); return; }
      if (!spend(p, 1, 0)) return;
      p.wars.push(target.id); target.wars.push(p.id);
      p.trades = p.trades.filter(id => id !== target.id); target.trades = target.trades.filter(id => id !== p.id);
      p.relations[target.id] = 0; target.relations[p.id] = 0;
      p.aprov = Math.max(0, p.aprov - 2);
      log(room, `⚠️ ${cname(p)} declarou GUERRA a ${cname(target)}!`);
      break;
    }
    case 'paz': {
      if (!target || target === p || !target.alive || !p.wars.includes(target.id)) return;
      if (room.proposals.some(pr => pr.from === p.id && pr.to === target.id && pr.kind === 'paz')) return;
      room.proposals.push({ from: p.id, to: target.id, kind: 'paz' });
      info(target.conn, `🕊️ ${cname(p)} propôs um tratado de PAZ!`);
      break;
    }
    case 'bloqueio': {
      if (!target || target === p || !target.alive || !p.wars.includes(target.id)) { err(p.conn, 'Bloqueio naval exige guerra.'); return; }
      if (p.blockading.includes(target.id)) {
        p.blockading = p.blockading.filter(id => id !== target.id);
        target.blockadedBy = target.blockadedBy.filter(id => id !== p.id);
        log(room, `⛴️ ${cname(p)} suspende o bloqueio naval a ${cname(target)}.`);
      } else {
        if (!spend(p, 1, 0)) return;
        p.blockading.push(target.id); target.blockadedBy.push(p.id);
        log(room, `⛴️ ${cname(p)} impõe BLOQUEIO NAVAL a ${cname(target)} (-25% renda)!`);
      }
      break;
    }
    case 'atacar': {
      if (!target || target === p || !target.alive) return;
      if (p.allies.includes(target.id)) { err(p.conn, 'Você não pode atacar um aliado.'); return; }
      if (!p.wars.includes(target.id)) { err(p.conn, 'Declare GUERRA primeiro (⚠️, 1⚡).'); return; }
      if (p.ap < 2) { err(p.conn, 'Atacar custa 2 pontos de ação.'); return; }
      p.ap -= 2;
      let aM = 1, dM = 1;
      if (p.ideology === 'autoritarismo') aM += 0.15;
      if (p.techs.includes('exercito')) aM += 0.15;
      if (p.ministers.def === 'fal') aM += 0.10;
      if (target.ministers.def === 'estr') dM += 0.10;
      const aP = p.mil * aM * (0.85 + Math.random() * 0.45);
      const dP = target.mil * dM * (0.9 + Math.random() * 0.45) * 1.08;
      if (aP > dP) {
        const loot = Math.round(target.money * 0.25);
        target.money -= loot; p.money += loot;
        target.mil = Math.max(1, Math.round(target.mil * 0.8));
        p.mil = Math.max(1, Math.round(p.mil * 0.9));
        target.aprov = Math.max(0, target.aprov - 8);
        p.aprov = Math.max(0, p.aprov - 3);
        log(room, `⚔️ ${cname(p)} atacou ${cname(target)} e VENCEU! Saque: $${loot}.`);
        const provs = ownProvinces(target);
        if (provs.length) { const pr = provs[Math.floor(Math.random() * provs.length)]; pr.owner = p.id; log(room, `🏴 ${cname(p)} OCUPA a província de ${pr.name}!`); }
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
      if (!p.wars.includes(target.id)) { err(p.conn, 'Declare GUERRA primeiro (⚠️, 1⚡).'); return; }
      if (p.nuclear < NUKE_MIN_LEVEL) { err(p.conn, `Programa nuclear insuficiente (nível ${NUKE_MIN_LEVEL}+ necessário).`); return; }
      if (p.ap < 3) { err(p.conn, 'Lançar um míssil custa 3 pontos de ação.'); return; }
      p.ap -= 3; p.nuclear -= 1;
      const shield = target.techs.includes('antiaerea');
      target.mil = Math.max(1, Math.round(target.mil * (shield ? 0.7 : 0.4)));
      target.aprov = Math.max(0, target.aprov - (shield ? 10 : 20));
      p.aprov = Math.max(0, p.aprov - 10);
      const provs = ownProvinces(target);
      const hits = shield ? 1 : 2;
      for (let i = 0; i < hits && provs.length; i++) { const pr = provs[Math.floor(Math.random() * provs.length)]; pr.infra = Math.max(0, pr.infra - 2); }
      log(room, `☢️💥 ${cname(p)} LANÇOU UM MÍSSIL NUCLEAR em ${cname(target)}!${shield ? ' (Defesa Antiaérea reduziu os danos!)' : ' Devastação total.'}`);
      break;
    }
    default: return;
  }
  checkEliminations(room);
  checkVictory(room);
  broadcast(room);
}

function bumpRel(a, b, d) {
  const v = Math.max(0, Math.min(100, relBetween(a, b) + d));
  a.relations[b.id] = v; b.relations[a.id] = v;
}

function respondProposal(room, p, fromId, accept, kind) {
  const idx = room.proposals.findIndex(pr => pr.from === fromId && pr.to === p.id && (pr.kind || 'alianca') === kind);
  if (idx === -1) return;
  room.proposals.splice(idx, 1);
  const from = room.players.find(x => x.id === fromId);
  if (!from || !from.alive || !p.alive) { broadcast(room); return; }
  if (kind === 'alianca') {
    if (!accept) { log(room, `🚫 ${cname(p)} recusou a aliança de ${cname(from)}.`); broadcast(room); return; }
    if (from.allies.includes(p.id) || from.allies.length >= 3 || p.allies.length >= 3) { broadcast(room); return; }
    from.allies.push(p.id); p.allies.push(from.id);
    from.relations[p.id] = 100; p.relations[from.id] = 100;
    log(room, `🤝 ALIANÇA firmada entre ${cname(from)} e ${cname(p)}!`);
  } else if (kind === 'paz') {
    if (!accept) { log(room, `🚫 ${cname(p)} recusou a paz proposta por ${cname(from)}.`); broadcast(room); return; }
    from.wars = from.wars.filter(id => id !== p.id); p.wars = p.wars.filter(id => id !== from.id);
    from.blockading = from.blockading.filter(id => id !== p.id); p.blockadedBy = p.blockadedBy.filter(id => id !== from.id);
    p.blockading = p.blockading.filter(id => id !== from.id); from.blockadedBy = from.blockadedBy.filter(id => id !== p.id);
    from.aprov = Math.min(100, from.aprov + 2); p.aprov = Math.min(100, p.aprov + 2);
    bumpRel(from, p, 30);
    log(room, `🕊️ TRATADO DE PAZ assinado entre ${cname(from)} e ${cname(p)}!`);
  } else if (kind === 'comercial') {
    if (!accept) { log(room, `🚫 ${cname(p)} recusou o acordo comercial de ${cname(from)}.`); broadcast(room); return; }
    from.trades.push(p.id); p.trades.push(from.id);
    bumpRel(from, p, 15);
    log(room, `💼 ACORDO COMERCIAL entre ${cname(from)} e ${cname(p)} (+$20/turno para ambos)!`);
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
    if (!room.players.length) { if (room.timer) clearInterval(room.timer); rooms.delete(room.code); return; }
    if (room.hostId === player.id) room.hostId = room.players[0].id;
    broadcast(room);
  } else {
    player.connected = false; player.conn = null;
    log(room, `📴 ${player.name} perdeu a conexão.`);
    if (room.hostId === player.id) { const next = room.players.find(p => p.connected); if (next) room.hostId = next.id; }
    if (!room.players.some(p => p.connected)) { if (room.timer) clearInterval(room.timer); rooms.delete(room.code); return; }
    broadcast(room);
  }
}
function sanitizeName(n) { return String(n || '').replace(/[^\p{L}\p{N} _\-.]/gu, '').trim().slice(0, 18) || 'Presidente'; }

function route(conn, msg) {
  switch (msg.t) {
    case 'create': { if (conn.meta) return; const room = newRoom(); addPlayer(room, conn, sanitizeName(msg.name), true); log(room, `👋 ${sanitizeName(msg.name)} criou a sala.`); broadcast(room); break; }
    case 'join': {
      if (conn.meta) return;
      const room = rooms.get(String(msg.code || '').toUpperCase().trim());
      if (!room) return err(conn, 'Sala não encontrada. Confira o código.');
      if (room.phase !== 'lobby') return err(conn, 'Essa partida já começou. Crie sua própria sala!');
      if (room.players.length >= COUNTRIES.length) return err(conn, 'Sala cheia (12 jogadores).');
      addPlayer(room, conn, sanitizeName(msg.name), false);
      log(room, `👋 ${sanitizeName(msg.name)} entrou na sala.`);
      broadcast(room); break;
    }
    case 'pick': {
      const { room, player } = conn.meta || {};
      if (!room || room.phase !== 'lobby') return;
      const cid = String(msg.country || '');
      if (!COUNTRY_BY_ID[cid]) return;
      if (room.players.some(p => p.country === cid && p !== player)) return err(conn, 'Esse país já foi escolhido.');
      player.country = player.country === cid ? null : cid;
      broadcast(room); break;
    }
    case 'velocidade': { const { room, player } = conn.meta || {}; if (!room || room.phase !== 'lobby' || player.id !== room.hostId) return; room.speed = msg.speed === 15 ? 15 : 45; broadcast(room); break; }
    case 'start': { const { room, player } = conn.meta || {}; if (!room || room.phase !== 'lobby' || player.id !== room.hostId) return; startGame(room); break; }
    case 'action': { const { room, player } = conn.meta || {}; if (!room) return; performAction(room, player, msg); break; }
    case 'resp_alianca': { const { room, player } = conn.meta || {}; if (!room || room.phase !== 'game') return; respondProposal(room, player, msg.from, !!msg.accept, 'alianca'); break; }
    case 'resp_paz': { const { room, player } = conn.meta || {}; if (!room || room.phase !== 'game') return; respondProposal(room, player, msg.from, !!msg.accept, 'paz'); break; }
    case 'resp_comercial': { const { room, player } = conn.meta || {}; if (!room || room.phase !== 'game') return; respondProposal(room, player, msg.from, !!msg.accept, 'comercial'); break; }
    case 'voto_un': {
      const { room, player } = conn.meta || {};
      if (!room || room.phase !== 'game' || !room.un || !player.alive) return;
      if (room.un.votes[player.id] != null) return;
      room.un.votes[player.id] = !!msg.accept;
      log(room, `${cname(player)} votou ${msg.accept ? 'A FAVOR' : 'CONTRA'} na ONU.`);
      const alive = room.players.filter(p => p.alive);
      if (alive.every(p => room.un.votes[p.id] != null)) resolveUN(room); else broadcast(room);
      break;
    }
    case 'fim_turno': { const { room, player } = conn.meta || {}; if (!room || room.phase !== 'game' || player.id !== room.hostId) return; resolveTurn(room); break; }
    case 'chat': {
      const { room, player } = conn.meta || {};
      if (!room) return;
      const text = String(msg.text || '').slice(0, 200).trim();
      if (!text) return;
      const c = COUNTRY_BY_ID[player.country];
      for (const p of room.players) if (p.conn && p.connected) p.conn.send({ t: 'chat', from: player.name, flag: c ? c.flag : '🏳️', text });
      break;
    }
  }
}
function handleClient(conn) {
  conn.onMessage = text => {
    let msg; try { msg = JSON.parse(text); } catch (e) { return; }
    if (!msg || typeof msg !== 'object') return;
    try { route(conn, msg); } catch (e) { console.error('route error:', e); }
  };
  conn.onClose = () => handleDisconnect(conn);
}

/* ---------------- HTTP ---------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/healthz' || url.pathname === '/health') { res.writeHead(200); return res.end('ok'); }
  const fp = path.normalize(path.join(PUBLIC_DIR, url.pathname === '/' ? '/index.html' : url.pathname));
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
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acceptKey(key) + '\r\n\r\n');
  socket.resume();
  handleClient(new WSConn(socket));
});
server.listen(PORT, '0.0.0.0', () => console.log(`🏛️ Presidente Online (VERSÃO TOTAL) em http://0.0.0.0:${PORT}`));
