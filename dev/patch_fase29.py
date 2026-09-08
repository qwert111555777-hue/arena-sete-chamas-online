#!/usr/bin/env python3
'''FASE 29 (cliente) - botao HISTORIA + modal eras + linha do tempo.'''
import io
P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = '<button id="btn-doc" title="Doutrina">🗽</button>'
assert h.count(a) == 1
h = h.replace(a, a + '\n    <button id="btn-hist" title="História">📜</button>')
ok.append('AG1 botao hud')

a = ',#btn-doc'
assert h.count(a) == 1, 'css %d' % h.count(a)
h = h.replace(a, a + ',#btn-hist')
ok.append('AG2 estilo')

a = "'btn-crise','btn-doc']"
assert h.count(a) == 1, 'move %d' % h.count(a)
h = h.replace(a, "'btn-crise','btn-doc','btn-hist']")
ok.append('AG3 move toolbar')

MOD = '''$('btn-hist').onclick = () => {
  if (!state) return;
  const ov = document.createElement('div'); ov.id='newspaper';
  const esc = s => String(s==null?'':s).replace(/[<>&]/g,'');
  const ERAS_UI = ['Fundação','Expansão','Potência','Lenda'];
  const era = Math.min(4, Math.max(1, state.era||1));
  const prox = era*56+1;
  const falta = era>=4 ? 0 : Math.max(0, prox - state.day);
  const tl = state.timeline||[];
  let s = '<div class="paper" style="width:min(600px,94vw)"><h1 style="font-size:20px">📜 HISTÓRIA DO MUNDO</h1><img src="headers/historia.jpg" style="width:100%;height:100px;object-fit:cover;border-radius:8px;border:2px solid #8a6a1f;margin-bottom:8px">';
  s += '<div style="background:#fff8e6;border:2px solid #7b1fa2;border-radius:8px;padding:8px 10px;margin-bottom:8px;font-size:13px">🌍 Era atual: <b>'+ERAS_UI[era-1]+' ('+era+'/4)</b>' + (era>=4?'<br>Era final — faça história!':'<br>Próxima era: dia '+prox+' (faltam '+falta+' dias). Nova era = +$100 e +2 coracoes p/ todos.') + '</div>';
  s += '<div class="stat-h">LINHA DO TEMPO (últimos '+tl.length+')</div>';
  s += tl.length ? tl.map(e=>'<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:6px 10px;margin-bottom:4px;font-size:12px"><b>Dia '+e.day+'</b> — '+esc(e.txt)+'</div>').join('') : '<div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:10px;text-align:center;font-size:12px">Nada épico ainda — conquiste marcos, vença eleições, faça história!</div>';
  s += '<div style="text-align:center;margin-top:6px"><button id="hi-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';
  ov.innerHTML = s;
  document.body.appendChild(ov);
  ov.querySelector('#hi-x').onclick=()=>ov.remove();
  ov.onclick = e => { if (e.target===ov) ov.remove(); };
};
'''
a = "$('btn-doc').onclick = () => {"
assert h.count(a) == 1, 'ag4 %d' % h.count(a)
h = h.replace(a, MOD + a)
ok.append('AG4 modal historia')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE29 OK')
