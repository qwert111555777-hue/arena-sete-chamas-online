const WebSocket = (function(){ try { return require('/tmp/wstest/node_modules/ws'); } catch (e) { return require('ws'); } })();
const ws = new WebSocket('ws://localhost:3000/?gz=0');
let myId = null, lastState = null, errs = [];
const send = o => ws.send(JSON.stringify(o));
ws.on('open', () => { send({t:'create', name:'Eco'}); });
ws.on('message', d => {
  let m; try { m = JSON.parse(d.toString()); } catch { return; }
  if (m.t === 'you' && m.you != null) myId = m.you.id != null ? m.you.id : m.you;
  if (m.t === 'state' && m.phase === 'game') lastState = m;
  if (m.t === 'err') errs.push(m.msg);
});
ws.on('error', e => { console.log('WS ERRO:', e.message); process.exit(2); });
setTimeout(() => send({t:'fundar', name:'Verdelândia', flag:'🌳', color:3}), 700);
setTimeout(() => send({t:'start'}), 1400);
setTimeout(() => { send({t:'action', action:'espacial'}); send({t:'action', action:'reflorestar'}); }, 2500);
setTimeout(() => {
  const me = lastState && lastState.players.find(p => p.id === myId);
  console.log('pollution:', me && me.pollution, '| space:', me && me.space, '| errs:', errs.length, '| dia:', lastState && lastState.day);
  const ok = me && me.pollution != null && (me.space === 0) && lastState.day >= 1;
  console.log(ok ? '✅ FASE16 OK (pollution no snapshot, ações sem crash)' : '❌ FALHOU');
  process.exit(ok ? 0 : 1);
}, 6000);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 12000);
