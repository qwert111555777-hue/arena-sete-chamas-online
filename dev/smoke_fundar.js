const WebSocket = require('/tmp/wstest/node_modules/ws');
const ws = new WebSocket('ws://localhost:3000/?gz=0');
let myId = null, lastLobby = null;
const send = o => ws.send(JSON.stringify(o));
ws.on('open', () => { send({t:'create', name:'Fundador'}); });
ws.on('message', d => {
  let m; try { m = JSON.parse(d.toString()); } catch { return; }
  if (m.t === 'you' && m.you != null) myId = m.you.id != null ? m.you.id : m.you;
  if (m.t === 'state' && m.phase === 'lobby') lastLobby = m;
});
ws.on('error', e => { console.log('WS ERRO:', e.message); process.exit(2); });
setTimeout(() => send({t:'fundar', name:'Nova Aurora', flag:'🐉', color:7}), 800);
setTimeout(() => send({t:'fundar', name:'Nova Aurora', flag:'🐉', color:99}), 1600);
setTimeout(() => {
  const me = lastLobby && lastLobby.players.find(p => p.id === myId);
  console.log('nome:', me && me.customName, '| simbolo:', me && me.customFlag, '| cor:', me && me.color);
  const ok = me && me.customName === 'Nova Aurora' && me.customFlag === '🐉' && me.color === 7;
  console.log(ok ? '✅ FUNDAR+ COR OK (99 invalido rejeitado)' : '❌ FALHOU');
  process.exit(ok ? 0 : 1);
}, 2500);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 8000);
