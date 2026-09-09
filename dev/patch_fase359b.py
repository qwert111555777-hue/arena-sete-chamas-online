# -*- coding: utf-8 -*-
"""
FASE 359b — corrige a lista DUPLICADA de setores no painel GOVERNO.

Problema (licao dura classica): existem 3 listas de setores no cliente.
A Fase 359 atualizou `SECTORS_UI` (fonte oficial), mas o painel Governo
usava uma copia hardcoded local -> os 2 setores novos nao apareciam.

Correcao: fazer o Governo usar SECTORS_UI (fonte unica de verdade), de modo
que futuros setores aparecam automaticamente.

Mantido de proposito:
  - `btn-doc` (Doutrina) continua contando os 7 setores da vitoria
    "sociedade perfeita" — nao mudamos a condicao de vitoria para nao
    endurecer conquistas ja existentes.
  - server.js:750 (marco 'sociedade') tambem fica nos 7 originais.
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


# Governo: usar SECTORS_UI em vez da copia local
cli = edita(cli,
"  const SECS = [['educacao','🎓 Educação'],['saude','🏥 Saúde'],['cultura','🎭 Cultura'],['esportes','⚽ Esportes'],['habitacao','🏠 Habitação'],['justica','⚖️ Justiça'],['turismo','🧳 Turismo']];",
"  const SECS = SECTORS_UI.map(sc => [sc[0], sc[1]]);",
'SECS do Governo -> SECTORS_UI')

if cli == c0:
    print('NADA MUDOU'); sys.exit(1)

io.open(CLI, 'w', encoding='utf-8').write(cli)
print('\nFASE 359b aplicada.')
