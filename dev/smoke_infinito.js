const WebSocket = (function(){ try { return require('/tmp/wstest/node_modules/ws'); } catch (e) { return require('ws'); } })();
const ws = new WebSocket('ws://localhost:3000/?gz=0');
const send = o => ws.send(JSON.stringify(o));
let myId=null, last=null, code=null, started=false;
ws.on('open', () => send({t:'create', name:'Imortal'}));
ws.on('message', d => {
  let m; try { m = JSON.parse(d.toString()); } catch { return; }
  if (m.t === 'you' && m.you != null) myId = (m.you.id != null ? m.you.id : m.you);
  if (m.t === 'state') { last = m; if (m.code) code = m.code; }
});
ws.on('error', e => { console.log('WS ERRO:', e.message); process.exit(2); });
setTimeout(() => send({t:'fundar', name:'Império Eterno', flag:'🐯', color:59}), 700);
setTimeout(() => { send({t:'start'}); started = true; }, 1400);
const tick = setInterval(() => {
  if (!started || !last || last.phase !== 'game') return;
  send({t:'action', action:'investir'});
}, 400);
setTimeout(() => {
  clearInterval(tick);
  const me = last && last.players.find(p => p.id === myId);
  const marco = last && (last.log||[]).some(l => /MARCO/.test(l.msg||''));
  const over = last && last.phase === 'over';
  console.log('simbolo:', me && me.customFlag, '| eco:', me && me.eco, '| phase:', last && last.phase, '| MARCO no log:', !!marco);
  const ok = me && me.customFlag === '🐯' && me.eco >= 60 && !over && marco;
  console.log(ok ? '✅ INFINITO OK (eco 60+ sem fim de jogo, marco registrado)' : '❌ FALHOU');
  process.exit(ok ? 0 : 1);
}, 45000);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 60000);
