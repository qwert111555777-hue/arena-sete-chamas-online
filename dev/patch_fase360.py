# -*- coding: utf-8 -*-
"""
FASE 360 — COPA DO MUNDO DE RUGBY (gap real encontrado nas capturas do MA3).

Fonte: imgur a/ECpKSFy, tela 13 (eventos). Ordem de custo no MA3:
  Concerto 10k < Feira 25k < Festival de Cinema 50k < Carnaval 80k
  < Copa Davis 100k < COPA DO MUNDO DE RUGBY 200k < Olimpiadas 500k < FIFA 1000k

No nosso jogo a escala e: Copa Nacional $600 · Davis $400 · Olimpiada $1000 · FIFA $1200.
Rugby entra ENTRE Davis e FIFA -> 2AP + $900, exigindo Esportes Nv 2+ (como a FIFA).
"""
import io, sys

SRV = '/home/user/presidente-online/server.js'
CLI = '/home/user/presidente-online/public/index.html'
srv = io.open(SRV, encoding='utf-8').read()
cli = io.open(CLI, encoding='utf-8').read()
s0, c0 = srv, cli


def edita(txt, antigo, novo, nome, esperado=1):
    n = txt.count(antigo)
    if n != esperado:
        print('ERRO [%s]: esperado %d, achado %d' % (nome, esperado, n))
        sys.exit(1)
    print('  ok: %s (%dx)' % (nome, n))
    return txt.replace(antigo, novo)


# ------------------------------------------- 1. SERVER: case 'rugby'
srv = edita(srv,
"""    case 'copa_mundo': {
      if (((p.sectors && p.sectors.esportes) || 0) < 2) { err(p.conn, '⚽ Precisa de Esportes Nv 2+ para sediar a Copa do Mundo.'); return; }""",
"""    case 'rugby': {
      if (((p.sectors && p.sectors.esportes) || 0) < 2) { err(p.conn, '🏉 Precisa de Esportes Nv 2+ para sediar a Copa do Mundo de Rugby.'); return; }
      if (!spend(p, 2, 900)) return;
      p.aprov = Math.min(100, p.aprov + 5); p.money += 600;
      p.influencia = Math.min(100, (p.influencia || 0) + 5);
      log(room, `🏉 ${cname(p)} sediou a COPA DO MUNDO DE RUGBY! (+5❤️, +$600, +5 doutrina).`);
      break;
    }
    case 'copa_mundo': {
      if (((p.sectors && p.sectors.esportes) || 0) < 2) { err(p.conn, '⚽ Precisa de Esportes Nv 2+ para sediar a Copa do Mundo.'); return; }""",
"case 'rugby' (server)")

# ----------------------------- 2. CLIENTE: botao no painel de esportes
cli = edita(cli,
">Esporte: copa + davis + FIFA + TV</div>",
">Esporte: copa + davis + rugby + FIFA + TV</div>",
'label da linha de esporte')

cli = edita(cli,
"""<button data-fifa style="padding:6px 10px;cursor:pointer" '+((m.ap>=2&&m.money>=1200&&(m.sectors&&m.sectors.esportes>=2))?'':'disabled')+'>FIFA (2AP+$1200)</button>""",
"""<button data-rug style="padding:6px 10px;cursor:pointer" '+((m.ap>=2&&m.money>=900&&(m.sectors&&m.sectors.esportes>=2))?'':'disabled')+'>Rugby (2AP+$900)</button><button data-fifa style="padding:6px 10px;cursor:pointer" '+((m.ap>=2&&m.money>=1200&&(m.sectors&&m.sectors.esportes>=2))?'':'disabled')+'>FIFA (2AP+$1200)</button>""",
'botao Rugby')

# ----------------------------- 3. CLIENTE: handler do clique
cli = edita(cli,
"""  const fw = ov.querySelector('[data-fifa]'); if (fw) fw.onclick=()=>{ send({t:'action',action:'copa_mundo'}); ov.remove(); };""",
"""  const rg = ov.querySelector('[data-rug]'); if (rg) rg.onclick=()=>{ send({t:'action',action:'rugby'}); ov.remove(); };
  const fw = ov.querySelector('[data-fifa]'); if (fw) fw.onclick=()=>{ send({t:'action',action:'copa_mundo'}); ov.remove(); };""",
'handler Rugby')

if srv == s0 and cli == c0:
    print('NADA MUDOU'); sys.exit(1)
io.open(SRV, 'w', encoding='utf-8').write(srv)
io.open(CLI, 'w', encoding='utf-8').write(cli)
print('\nFASE 360 aplicada.')
