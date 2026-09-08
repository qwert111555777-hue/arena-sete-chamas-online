/* Smoke AUDITORIA (Fases 20-28): dispara ações novas + confere campos no snapshot. */
let WebSocket;
try { WebSocket = (function(){ try { return require('/tmp/wstest/node_modules/ws'); } catch (e) { return require('ws'); } })(); } catch { WebSocket = require('ws'); }
const ws = new WebSocket('ws://localhost:3000/?gz=0');
let myId = null, lastState = null;
const errs = [], logs = [];
const send = o => ws.send(JSON.stringify(o));
ws.on('open', () => { send({ t: 'create', name: 'Audit' }); });
ws.on('message', d => {
  let m; try { m = JSON.parse(d.toString()); } catch { return; }
  if (m.t === 'you' && m.you != null) myId = m.you.id != null ? m.you.id : m.you;
  if (m.t === 'state' && m.phase === 'game') lastState = m;
  if (m.t === 'err') errs.push(m.msg);
  if (m.t === 'state' && m.log) logs.push(...m.log.slice(0, 3));
});
ws.on('error', e => { console.log('WS ERRO:', e.message); process.exit(2); });
setTimeout(() => send({ t: 'fundar', name: 'Auditoria', flag: '🔍', color: 1 }), 700);
setTimeout(() => send({ t: 'start' }), 1400);
setTimeout(() => {
  send({ t: 'action', action: 'templo' });
  send({ t: 'action', action: 'centro_cultural' });
  send({ t: 'action', action: 'recrutar_espiao' });
}, 2500);
setTimeout(() => {
  send({ t: 'action', action: 'abrigo' });
  send({ t: 'action', action: 'teste_nuclear' }); // deve dar ERRO (Nv0) sem crash
  send({ t: 'action', action: 'crise' });         // deve dar ERRO (sem crise) sem crash
  send({ t: 'action', action: 'roubar_tech' });   // sem alvo: ignora sem crash
}, 4000);
setTimeout(() => {
  const me = lastState && lastState.players.find(p => p.id === myId);
  const st = me && me.stats;
  const r = {
    dia: lastState && lastState.day,
    inverno: lastState && lastState.inverno,
    espioes: me && me.espioes,
    abrigo: me && me.abrigo,
    fe: me && me.fe,
    influencia: me && me.influencia,
    titulos: st && st.titulos,
    doutrinacoes: st && st.doutrinacoes,
    conversoes: st && st.conversoes,
    mandatos: st && st.mandatos,
    crise: me && 'crise' in me,
    errs: errs.length,
  };
  console.log(JSON.stringify(r));
  const ok = me && lastState.day >= 1
    && r.inverno != null && r.espioes != null && r.abrigo != null
    && r.titulos != null && r.doutrinacoes != null && r.conversoes != null && r.mandatos != null
    && r.crise === true;
  console.log(ok ? '✅ AUDITORIA OK (snap completo, ações sem crash)' : '❌ AUDITORIA FALHOU');
  process.exit(ok ? 0 : 1);
}, 8000);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 15000);
