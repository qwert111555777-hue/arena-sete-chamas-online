#!/usr/bin/env python3
'''FASE 27 (cliente) - painel dissuasao/teste/abrigo + banner inverno no modal nuclear.'''
import io
P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = '''<button id="nk-x" style="padding:6px 18px;cursor:pointer">Fechar</button></div></div>';'''
assert h.count(a) == 1, 'ac1 %d' % h.count(a)
ok.append('AC1 ancora existe')

panel = '''  const inv = (state.inverno||0) > state.turn;
  s += inv ? '<div style="background:#e3f2fd;border:2px solid #1565c0;border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:13px">INVERNO NUCLEAR ativo! Renda global -10%.</div>' : '';
  s += '<div class="stat-h">DISSUASAO & DEFESA</div><div style="background:#fff8e6;border:1px solid #c9b98b;border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:12px">Seu arsenal Nv <b>'+nv+'</b>' + (nv>=3?' - <b>dissuasao ATIVA</b> (atacar voce custa -3 coracao extra ao agressor)':' - chegue ao Nv3 p/ dissuadir ataques') + '<br>Abrigos: ' + (m.abrigo?'<b style="color:#2e7d32">PRONTOS</b>':'nao construidos') + '</div>';
  s += '<div style="display:flex;gap:8px;margin-bottom:6px"><button data-nuketest style="flex:1;padding:8px 12px;cursor:pointer" '+((nv>=2&&m.ap>=1&&m.money>=300)?'':'disabled')+'>Teste nuclear (1AP+$300)</button><button data-nukeshel style="flex:1;padding:8px 12px;cursor:pointer" '+((!m.abrigo&&m.ap>=1&&m.money>=250)?'':'disabled')+'>Abrigos (1AP+$250)</button></div>';
'''
a2 = '''  s += '<div style="text-align:center;margin-top:10px"><button id="nk-x"'''
assert h.count(a2) == 1, 'ac1b %d' % h.count(a2)
h = h.replace(a2, panel + a2)
ok.append('AC1 painel')

i = h.index("ov.querySelectorAll('[data-nukefire]')")
assert h.count("ov.querySelectorAll('[data-nukefire]')") == 1, 'ac2'
j = h.index('\n', i)
wire = '''
  const nt = ov.querySelector('[data-nuketest]'); if (nt) nt.onclick=()=>{ send({t:'action',action:'teste_nuclear'}); ov.remove(); };
  const ns = ov.querySelector('[data-nukeshel]'); if (ns) ns.onclick=()=>{ send({t:'action',action:'abrigo'}); ov.remove(); };'''
h = h[:j] + wire + h[j:]
ok.append('AC2 fios')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE27 OK')
