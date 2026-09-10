# -*- coding: utf-8 -*-
"""
BUGFIX — layout mobile: leftdock cobria o bottomnav.

Medido em 414x860 (Playwright):
  #leftdock  x 10-218   y 804-850   (4 botoes 46px + gaps  = 208px)
  #bottomnav x 28-386   y 808-854   (7 botoes 46px + gaps  = 358px)
  #transport x 180-404  y 796-850   (224px)
  -> os tres juntos precisam de ~790px numa tela de 414px.
  -> elementFromPoint no centro do #btn-build retornava #btn-menu:
     o botao CONSTRUIR ficava inutilizavel no celular.

Correcao: em telas estreitas o leftdock vira coluna vertical acima da barra,
e o transport sobe junto. Assim ninguem mais cobre ninguem.
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


# 1) refaz o breakpoint de 900px
cli = edita(cli,
"  @media (max-width:900px){ #bottomnav{gap:6px;bottom:6px;} #bottomnav button{width:46px!important;height:46px!important;font-size:19px!important;} .hud{gap:5px!important;} }",
"""  @media (max-width:900px){
    .hud{gap:5px!important;}
    #bottomnav{gap:5px;bottom:8px;}
    #bottomnav button{width:42px!important;height:42px!important;font-size:17px!important;}
    /* leftdock vira COLUNA acima da barra para nao cobrir o bottomnav */
    #leftdock{left:8px;bottom:60px;flex-direction:column;gap:6px;}
    #leftdock button{width:40px!important;height:40px!important;font-size:17px!important;}
    /* transport sobe junto, compacto */
    #transport{right:8px;bottom:60px;gap:5px;padding:4px 6px;}
    #transport .date-badge{font-size:11px;padding:4px 6px;}
    #transport button{width:36px!important;height:32px!important;font-size:14px!important;}
  }""",
'breakpoint 900px')

# 2) breakpoint extra para celulares pequenos
cli = edita(cli,
"  @media (max-width:560px){.techgrid{grid-template-columns:1fr;}}",
"""  @media (max-width:560px){
    .techgrid{grid-template-columns:1fr;}
    #bottomnav{gap:4px;bottom:6px;}
    #bottomnav button{width:38px!important;height:38px!important;font-size:15px!important;}
    #leftdock{left:6px;bottom:56px;gap:5px;}
    #leftdock button{width:36px!important;height:36px!important;font-size:15px!important;}
    #transport{right:6px;bottom:56px;gap:4px;padding:3px 5px;}
    #transport .date-badge{font-size:10px;padding:3px 5px;}
    #transport button{width:32px!important;height:30px!important;font-size:13px!important;}
  }""",
'breakpoint 560px')

if cli == c0:
    print('NADA MUDOU'); sys.exit(1)
io.open(CLI, 'w', encoding='utf-8').write(cli)
print('\nBUGFIX mobile aplicado.')
