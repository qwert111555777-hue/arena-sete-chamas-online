#!/usr/bin/env python3
"""FASE 13 — telas 🇺🇳 ONU + 🏆 VITÓRIAS (toolbar). SÓ CLIENTE.
Contratos (server intocado): state.un {type,desc,target,proposer,votes};
voto {t:'voto_un',accept}; propor {t:'action',action:'propor_resolucao',tipo,target} 1AP+$300
tipos: autorizar(T), proibir_guerra, proibir_armas, embargo(T), condenar(T);
subornar $200 (propria 'autorizar' em votacao). Marcos = checkVictory."""
import io

P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = '<button id="btn-nuke" title="Programa nuclear">☢️</button>'
assert h.count(a) == 1
h = h.replace(a, a + '\n    <button id="btn-onu" title="ONU">🇺🇳</button>\n    <button id="btn-win" title="Caminhos da vitória">🏆</button>')
ok.append('H1 botoes hud')

a = ',#btn-nuke'
assert h.count(a) == 1, 'css %d' % h.count(a)
h = h.replace(a, a + ',#btn-onu,#btn-win')
ok.append('H2 estilo')

a = "'btn-spy','btn-nuke']"
assert h.count(a) == 1, 'move %d' % h.count(a)
h = h.replace(a, "'btn-spy','btn-nuke','btn-onu','btn-win']")
ok.append('H3 move toolbar')

MOD = """$('btn-onu').onclick = () => {
  const m = me(); if (!m || !state) return;
  const ov = document.createElement('div'); ov.id='newspaper';
  const esc = s => String(s==null?'':s).replace(/[<>&]/g,'');
  const un = state.un;
  let s = '<div class="paper" style="width:min(600px,94vw)"><h1 style="font-size:20px">🇺🇳 ORGANIZAÇÃO DAS NAÇÕES</h1>';
  if (un) {
    const vs = Object.values(un.votes||{});
    const fav = vs.filter(v=>v===true).length, con = vs.filter(v=>v===false).length;
    const meuVoto = un.votes ? un.votes[myId] : null;
    const pro = state.players.find(p=>p.id===un.proposer);
    s += '<div style="background:#fff8e6;border:2px solid #145a6b;border-radius:8px;padding:8px 10px;margin-bottom:8px"><b style="font-size:13px">🗳️ EM VOTAÇÃO</b><div style="font-size:13px;margin:4px 0">'+esc(un.desc)+'</div><div style="font-size:11px;color:#6b5a33">Proposta por '+(pro?esc(pro.country):'?')+' · 👍 '+fav+' a favor · 👎 '+con+' contra'+(meuVoto==null?' · <b>você ainda não votou</b>':' · seu voto: <b>'+(meuVoto?'A FAVOR':'CONTRA')+'</b>')+'</div>';
    if (meuVoto==null && m.alive) s += '<div style="margin-top:6px"><button data-vsim style="padding:8px 16px;cursor:pointer;background:#2e7d32;color:#fff;font-weight:800">👍 A FAVOR</button> <button data-vnao style="padding:8px 16px;cursor:pointer;background:#a33;color:#fff;font-weight:800">👎 CONTRA</button></div>';
    if (un.proposer===myId && un.type==='autorizar') s += '<div style="margin-top:6px"><button data-sub style="padding:6px 12px;cursor:pointer" '+(m.money>=200?'':'disabled')+'>💰 Comprar apoio ($200, vira metade dos NÃO)</button></div>';
    s += '</div>';
  } else {
    const TIPOS = [['autorizar','⚔️ Autorizar minha intervenção militar (precisa de alvo)'],['proibir_guerra','🕊️ Proibir novas guerras (3 turnos)'],['proibir_armas','🔫 Proibir recrutamento (3 turnos)'],['embargo','📦 Embargo econômico (alvo, 3 turnos)'],['condenar','📢 Condenar nação (alvo, −6 aprovação dele)']];
    const others = state.players.filter(p=>p.alive && p.id!==myId && p.country);
    s += '<div style="background:#fff8e6;border:2px solid #c9b98b;border-radius:8px;padding:8px 10px;margin-bottom:8px"><b style="font-size:13px">📝 Propor resolução (1⚡ + $300)</b>';
    s += '<div style="margin:6px 0"><select id="un-tipo" style="width:100%;padding:6px">'+TIPOS.map(t=>'<option value="'+t[0]+'">'+t[1]+'</option>').join('')+'</select></div>';
    s += '<div style="margin:6px 0"><select id="un-alvo" style="width:100%;padding:6px">'+others.map(p=>'<option value="'+p.id+'">🎯 '+esc(p.country)+'</option>').join('')+'</select><div style="font-size:11px;color:#6b5a33">Alvo usado em: autorizar, embargo e condenar.</div></div>';
    const podeP = m.ap>=1 && m.money>=300;
    s += '<button data-unprop style="padding:8px 16px;cursor:pointer" '+(podeP?'':'disabled')+'>🇺🇳 Propor e abrir votação</button></div>';
  }
  s += '<div style="text-align:center;margin-top:6px"><button id="un-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
  ov.innerHTML = s;
  document.body.appendChild(ov);
  ov.querySelector('#un-x').onclick=()=>ov.remove();
  ov.onclick = e => { if (e.target===ov) ov.remove(); };
  const vs = ov.querySelector('[data-vsim]'); if (vs) vs.onclick=()=>{ send({t:'voto_un',accept:true}); ov.remove(); };
  const vn = ov.querySelector('[data-vnao]'); if (vn) vn.onclick=()=>{ send({t:'voto_un',accept:false}); ov.remove(); };
  const sb = ov.querySelector('[data-sub]'); if (sb) sb.onclick=()=>{ send({t:'action',action:'subornar'}); ov.remove(); };
  const pr = ov.querySelector('[data-unprop]');
  if (pr) pr.onclick=()=>{ const tp=ov.querySelector('#un-tipo').value, al=ov.querySelector('#un-alvo').value; send({t:'action',action:'propor_resolucao',tipo:tp,target:al}); ov.remove(); };
};
$('btn-win').onclick = () => {
  const m = me(); if (!m || !state) return;
  const ov = document.createElement('div'); ov.id='newspaper';
  const alive = state.players.filter(p=>p.alive);
  const bar = (pct,ok) => '<div style="background:#d8cba0;border:1px solid #8a6a1f;border-radius:4px;height:12px;margin-top:3px"><div style="height:100%;width:'+Math.min(100,Math.round(pct))+'%;background:'+(ok?'#2e7d32':'#c9a227')+';border-radius:3px"></div></div>';
  const row = (ic,nm,desc,pct,ok) => '<div style="background:#fff8e6;border:2px solid '+(ok?'#2e7d32':'#c9b98b')+';border-radius:8px;padding:8px 10px;margin-bottom:6px"><b style="font-size:13px">'+ic+' '+nm+(ok?' ✓':'')+'</b><div style="font-size:11px;color:#6b5a33">'+desc+'</div>'+bar(pct,ok)+'</div>';
  const shareR = (m.religion && m.religion!=='laico') ? alive.filter(o=>o.religion===m.religion).length/Math.max(1,alive.length)*100 : 0;
  const shareI = m.ideology ? alive.filter(o=>o.ideology===m.ideology).length/Math.max(1,alive.length)*100 : 0;
  let s = '<div class="paper" style="width:min(600px,94vw)"><h1 style="font-size:20px">🏆 CAMINHOS DA VITÓRIA</h1>';
  s += '<div style="font-size:11px;color:#6b5a33;margin-bottom:8px">O jogo é infinito: cada caminho vira um MARCO comemorativo. Espalhe religião/doutrina pela diplomacia, cresça a economia e vença guerras.</div>';
  s += row('🌍','Última nação de pé','Elimine ou anexe todas as outras ('+alive.length+' vivas)', state.players.length>1&&alive.length===1?100:Math.max(0,100-alive.length*10), state.players.length>1&&alive.length===1);
  s += row('💰','Hegemonia econômica','Economia 60+ (atual '+(m.eco||0)+')', (m.eco||0)/60*100, (m.eco||0)>=60);
  s += row('⚖️','Hegemonia ideológica','Doutrina 60+ (atual '+(m.influencia||0)+')', (m.influencia||0)/60*100, (m.influencia||0)>=60);
  s += row('🕌','Hegemonia religiosa','Fé 60+ (atual '+(m.fe||0)+')', (m.fe||0)/60*100, (m.fe||0)>=60);
  s += row('🛐','Conversão religiosa','Sua religião em +50% das nações vivas ('+Math.round(shareR)+'%)', shareR/50*100, shareR>50);
  s += row('📣','Conversão ideológica','Sua doutrina em +50% das nações vivas ('+Math.round(shareI)+'%)', shareI/50*100, shareI>50);
  s += '<div style="text-align:center;margin-top:6px"><button id="wn-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
  ov.innerHTML = s;
  document.body.appendChild(ov);
  ov.querySelector('#wn-x').onclick=()=>ov.remove();
  ov.onclick = e => { if (e.target===ov) ov.remove(); };
};
"""
a = "$('btn-nuke').onclick = () => {"
assert h.count(a) == 1
h = h.replace(a, MOD + a)
ok.append('H4 modais onu+win')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE13 OK (server.js intocado)')
