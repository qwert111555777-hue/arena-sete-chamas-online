/* Smoke test: cria sala, inicia, constroi predio NOVO, forca turno, confere.
   Uso: cd /home/user/dev-tools && npm i ws && node smoke_construir.js (servidor em localhost:3000)
   Envelope correto: {t:'action', action:'construir', kind} — {t:'construir'} NAO existe no top-level! */
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/?gz=0');
let myId = null, lastState = null;
const send = o => ws.send(JSON.stringify(o));
ws.on('open', () => { console.log('WS conectado'); send({t:'create', name:'Smoke'}); });
ws.on('message', d => {
  let m; try { m = JSON.parse(d.toString()); } catch { return; }
  if (m.t === 'you' && m.you != null) myId = (m.you.id != null ? m.you.id : m.you);
  if (m.t === 'state' && m.phase === 'game') lastState = m;
});
ws.on('error', e => { console.log('WS ERRO:', e.message); process.exit(2); });
setTimeout(() => send({t:'pick', country:'br Brasil'}), 800);
setTimeout(() => send({t:'start'}), 1500);
setTimeout(() => { send({t:'action', action:'construir', kind:'mina_cobre'}); send({t:'action', action:'construir', kind:'porto_espacial'}); console.log('>> 2 construcoes enviadas (mina_cobre + porto_espacial)'); }, 2500);
setTimeout(() => { console.log('>> fim_turno (forca conclusao)'); send({t:'fim_turno'}); }, 3500);
setTimeout(() => {
  if (!lastState) { console.log('FALHA: sem state do jogo'); process.exit(1); }
  const me = lastState.players.find(p => p.id === myId) || lastState.players.find(p => p.name === 'Smoke');
  if (!me) { console.log('FALHA: jogador nao achado no state'); process.exit(1); }
  const b = me.buildings || {};
  console.log('turno:', lastState.turn, '| mina_cobre:', b.mina_cobre || 0, '| porto_espacial:', b.porto_espacial || 0, '| dinheiro:', me.money);
  const logs = (lastState.log || []).map(e => e.msg || e).join(' | ');
  console.log('log menciona Cobre:', logs.includes('Cobre') ? 'SIM ✅' : 'NAO');
  console.log('log menciona Espacial:', logs.includes('Espacial') ? 'SIM ✅' : 'NAO');
  const ok = (b.mina_cobre || 0) >= 1 && (b.porto_espacial || 0) >= 1;
  console.log(ok ? '✅ TESTE PASSOU: predios novos constroem de verdade' : '❌ TESTE FALHOU');
  process.exit(ok ? 0 : 1);
}, 7000);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 15000);
