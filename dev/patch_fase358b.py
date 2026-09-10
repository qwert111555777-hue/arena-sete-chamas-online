# -*- coding: utf-8 -*-
"""
BUGFIX FASE 358b — tutorial reabria sozinho.

Causa: `tutAutoOnce()` era chamado em TODO state broadcast (bloco showScreen('scr-game')),
e só gravava localStorage se o jogador marcasse "nao mostrar novamente".
Resultado: quem fechava sem marcar via o tutorial reabrir a cada tick de estado.

Correcao: flag de sessao `tutAutoDone` — autoabre NO MAXIMO 1x por carregamento
de pagina, independente da checkbox. A checkbox continua valendo para as
PROXIMAS partidas (localStorage).
"""
import io, sys

CLI = '/home/user/presidente-online/public/index.html'
cli = io.open(CLI, encoding='utf-8').read()
c0 = cli


def edita(txt, antigo, novo, nome, esperado=1):
    n = txt.count(antigo)
    if n != esperado:
        print('ERRO [%s]: esperado %d, achado %d' % (nome, esperado, n))
        sys.exit(1)
    print('  ok: %s (%dx)' % (nome, n))
    return txt.replace(antigo, novo)


# 1) declarar a flag junto das outras variaveis do tutorial
cli = edita(cli,
"let tutIdx = 0;",
"let tutIdx = 0;\nlet tutAutoDone = false;",
'declara tutAutoDone')

# 2) fecharTutorial marca a flag (qualquer fechamento encerra o auto-open)
cli = edita(cli,
"""function fecharTutorial(){
  $('tut').classList.add('hidden');""",
"""function fecharTutorial(){
  tutAutoDone = true;
  $('tut').classList.add('hidden');""",
'fecharTutorial marca flag')

# 3) tutAutoOnce respeita a flag
cli = edita(cli,
"""function tutAutoOnce(){
  let visto = '0';""",
"""function tutAutoOnce(){
  if (tutAutoDone) return;
  tutAutoDone = true;
  let visto = '0';""",
'tutAutoOnce respeita flag')

# 4) abrir manualmente pelo botao tambem conta como "ja visto nesta sessao"
cli = edita(cli,
"""function abrirTutorial(){
  tutIdx = 0; tutRender();""",
"""function abrirTutorial(){
  tutAutoDone = true;
  tutIdx = 0; tutRender();""",
'abrirTutorial marca flag')

if cli == c0:
    print('NADA MUDOU'); sys.exit(1)
io.open(CLI, 'w', encoding='utf-8').write(cli)
print('\nBUGFIX 358b aplicado.')
