#!/usr/bin/env python3
'''FASE 30 (cliente) - botao calote + hint juros + botao tributo.'''
import io
P = '/home/user/presidente-online/public/index.html'
h = io.open(P, encoding='utf-8').read()
ok = []

a = "    bPag.onclick=()=>send({t:'action',action:'pagar'}); r1.appendChild(bPag);"
assert h.count(a) == 1, 'ai1 %d' % h.count(a)
h = h.replace(a, a + "\n    const bCal=document.createElement('button'); bCal.textContent='Calote'; bCal.title='Zerar dívida: -15 coracao, -15 relacoes, sem credito 8 sem';\n    bCal.disabled=p.debt<=0; bCal.onclick=()=>{ if (confirm('Dar CALOTE? -15 aprovacao, -15 relacoes, sem credito por 8 semanas.')) send({t:'action',action:'calote'}); }; r1.appendChild(bCal);")
ok.append('AI1 calote')

a = '    extra.appendChild(r1);'
assert h.count(a) == 1, 'ai2 %d' % h.count(a)
h = h.replace(a, "    const dj=document.createElement('div'); dj.style.cssText='font-size:11px;opacity:.8'; dj.textContent='Juros: +5%/semana - Teto de credito: $2000 em divida'; extra.appendChild(dj);\n" + a)
ok.append('AI2 hint juros')

a = "    acts.appendChild(mkBtn('🛐','Espalhar religião (1⚡, $300)', ()=>send({t:'action',action:'espalhar_religiao',target:p.id}), m.ap<1||m.money<300||!m.religion||m.religion==='laico'));"
assert h.count(a) == 1, 'ai3 %d' % h.count(a)
h = h.replace(a, a + "\n    acts.appendChild(mkBtn('💰','Exigir TRIBUTO (1⚡, mil 2x+)', ()=>send({t:'action',action:'tributo',target:p.id}), m.ap<1||m.allies.includes(p.id)));")
ok.append('AI3 tributo')

io.open(P, 'w', encoding='utf-8').write(h)
print('== CLIENTE ==')
for x in ok:
    print('  ok ' + x)
print('\nPATCH FASE30 OK')
