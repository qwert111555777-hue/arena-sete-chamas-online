const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/?gz=0');
let myId = null, lastState = null;
const seq1x = [], seq5x = [];
let phase5x = false;
const send = o => ws.send(JSON.stringify(o));
ws.on('open', () => { console.log('WS conectado'); send({t:'create', name:'SmokeDay'}); });
ws.on('message', d => {
  let m; try { m = JSON.parse(d.toString()); } catch { return; }
  if (m.t === 'you' && m.you != null) myId = m.you.id != null ? m.you.id : m.you;
  if (m.t === 'state' && m.phase === 'game') { lastState = m; (phase5x ? seq5x : seq1x).push({day: m.day, t: Date.now(), via:'state'}); }
  if (m.t === 'day') { (phase5x ? seq5x : seq1x).push({day: m.day, t: Date.now(), via:'day'}); }
});
ws.on('error', e => { console.log('WS ERRO:', e.message); process.exit(2); });
function audit(seq){
  const days = seq.map(s => s.day);
  const dedup = days.filter((d,i) => i === 0 || d !== days[i-1]);
  for (let i=1;i<dedup.length;i++) if (dedup[i] !== dedup[i-1]+1) return `PULOU/VOLTOU ${dedup[i-1]}->${dedup[i]}`;
  return 'OK';
}
setTimeout(() => send({t:'start'}), 1200);
setTimeout(() => send({t:'action', action:'construir', kind:'mina_cobre'}), 2500);
setTimeout(() => {
  const d = seq1x.map(s=>s.day);
  console.log('--- 1x: msgs=', seq1x.length, '| dias', d[0], '->', d[d.length-1], '| ordem:', audit(seq1x));
  send({t:'velocidade', speed:5}); phase5x = true; console.log('>> 5x ativado');
}, 7000);
setTimeout(() => {
  const d = seq5x.map(s=>s.day);
  const span = seq5x.length > 1 ? (seq5x[seq5x.length-1].t - seq5x[0].t) / Math.max(1, (d[d.length-1]-d[0])) : 0;
  console.log('--- 5x: msgs=', seq5x.length, '| dias', d[0], '->', d[d.length-1], '| ordem:', audit(seq5x), '| ms/dia ~=', Math.round(span));
  const me = lastState && (lastState.players.find(p => p.id === myId) || lastState.players.find(p => p.name === 'SmokeDay'));
  const cobre = me ? ((me.buildings||{}).mina_cobre || 0) : 0;
  if (me) console.log('--- semana:', lastState.turn, '| dia:', lastState.day, '| mina_cobre:', cobre, '| dinheiro:', me.money, '| comida:', me.rec.comida, '| pop:', me.pop);
  const ok = audit(seq1x) === 'OK' && audit(seq5x) === 'OK' && cobre >= 1 && me && me.rec.comida > 0;
  console.log(ok ? '✅ TESTE DIAS PASSOU' : '❌ TESTE DIAS FALHOU');
  process.exit(ok ? 0 : 1);
}, 13000);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 22000);
