# AUDITORIA DE COMPLETUDE — FASE 404 (2026-09-12)

Auditoria recursiva contra o checklist da ESPECIFICAÇÃO DEFINITIVA. Método:
leitura real do código (`server.js` 7.2k linhas + `public/index.html` 5.2k +
`lib/data/*`), reconciliação de wire (ações do cliente × cases do servidor) e
testes (unitários + regressão + smoke).

**Resultado do wire:** 692 ações referenciadas no cliente, 697 cases no servidor,
**0 botões mortos**, **0 stub/placeholder/TODO/FIXME**. Todos os `case` têm efeito.

**STATUS legend:** ✅ completo · 🔧 era lacuna, fechado nesta fase · ⚖️ coberto por
outro sistema (decisão de design) · — não aplicável.

## Matriz

| SISTEMA | SUBSISTEMA | MECÂNICA | ESTADO | IA | MP | PERSIST. | UI | TESTE | STATUS |
|---|---|---|---|---|---|---|---|---|---|
| Identidade | criação | nome/bandeira/região/ideologia/religião | país custom `n<pId>` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Território | províncias | fundar/anexar/ocupar/doar/vender/independência | `provinces[] owner/origem/infra` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Território | neutras | 30 newlands + 195 países | `world[]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| População | crescimento | comida+infra+saúde+imposto; fome | `pop` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Governo | ministros | 4 pastas × perfis com efeitos multi-sistema | `ministers` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Governo | eleições | 56d: reeleição/derrota/emergência | `mandatos` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Governo | aprovação | deposto ≤5% (bot) / reforma (humano) | `aprov` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Governo | estabilidade | via aprov+coalizões+pressão+crises | — | — | — | — | — | ⚖️ |
| Governo | crises | 12 tipos com 3 respostas cada | `crise.tipo` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Governo | grupos políticos | 5 grupos + 11 leis que pesam | `gruposPoliticos` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Governo | leis | 16 leis com custo/efeito/grupo | `leis[]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Governo | segurança interna | 4 aparatos (defesa/secreto/polícia/guarda) Nv0–3 | `seguranca` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Governo | protestos/greves/separatismo/golpes | risco + aplicar + resposta | `protestoUntil` etc. | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Economia | PIB/per capita | `pibOf`/`pibDetalhe` com fatores explicados | `pib` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Economia | renda | `incomeOf` = base × mult − custos | `dailyIncome` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Economia | impostos | 4 alíquotas + taxRate 0/1/2 | `taxes` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Economia | orçamento | 5 pastas (exe/int/tra/edu/ambm) | `budget` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Economia | dívida/juros | empréstimo/calote/amortiza/perdoa; juros 5%/sem | `debt` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Economia | inflação | determinística (sinais reais, converge [-5,40]) | `inflacao` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Economia | produção/consumo/produtividade | cadeia insumo→indústria→emprego→PIB | `rec`/`taxaSuprimento` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚖️ produtividade = eco+upgrades+leis |
| Economia | preços | mercado oferta×demanda + guerra/sanção | `market` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Recursos | estoque/rotas/suprimento | 9 recursos, depósitos, comércio | `rec`/`trades` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Construções | 140 tipos, níveis, tempo | custo/concreto/dias/inflação | `buildings`/`builds` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Construções | manutenção | custo semanal por prédio/upgrade | `buildingMaint` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔧 |
| Construções | upgrades | Nv1–5, +50% produção, manutenção | `upgrades` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tecnologia | 125 techs, 5 árvores, 5 níveis | custos [50..797], requisitos, desbloqueios | `techs`/`techLv` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tecnologia | filas | obra em fila (`builds`); pesquisa é instantânea | `builds[]` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚖️ |
| Militar | unidades | 9 tipos Nv1–3, terras raras, embargo | `units` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Militar | oficiais | comandante/promoções (bônus 1×) | `comandantes` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Militar | recrutamento/mobilização | militar/treinar/convocar reservas/alistamento | `mil` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Guerra | fluxo completo | declara→valida→mobiliza→batalha→ocupação→paz | `wars` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Guerra | batalha tática | grid 7×6, mover/atacar/recuar, vantagem por tipo | `batalha` | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| Guerra | dano/perdas/saque/ocupação | atrito permanente, loot 8%, captura | `btFinalizar` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Diplomacia | relações/memória | rel 0–100, `histRel` com motivo/rancor | `relations` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Diplomacia | alianças/pactos/tratados | limite 3, não-agressão, comerciais | `allies`/`pacts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Diplomacia | sanções/embargos/bloqueios | 3 sanções máx, armas, naval | `sanctioning` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ONU | propostas/votação/resoluções | 8 tipos + autorização, veto | `un` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ONU | peso dos votos | pop + influência + soft power | `resolveUN` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔧 |
| Espionagem | agentes/sabotagem/roubo/descoberta | risco, serviço secreto, STUXNET | `espioes` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nuclear | programa/teste/míssil/defesa | Nv0–5, urânio, retaliação, inverno nuclear | `nuclear` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Espaço | foguetes/satélites/estação/Lua/Marte | 5 etapas [500..3500] | `space` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Espaço | colônias + desenvolvimento | Marte/Lua/Europa, pop/infra, manutenção | `colonias` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Espaço | recursos espaciais | mineração de asteroides → terras raras | `colonias` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔧 |
| Eventos | aleatórios/sistêmicos/encadeados/únicos | cadeias, desdobramentos agendados | `eventosPendentes` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Jornal | feed + histórico | 10 categorias, timeline 30 | `feed`/`timeline` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Missões | 37 missões + recompensas | catálogo, verificação servidor | `MISSIONS` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| IA | 7 personalidades | pesos guerra/mil/eco/def | `PERSONAS` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| IA | decisões (eco/mil/dip/guerra/pesq/comércio/espionagem) | caixa determinístico, sem recurso infinito | `aiTurn` | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| Calendário | ticks/semanas/eras | 3s/dia, 7d/semana, 4 eras (56d) | `day`/`era` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Calendário | meses/anos | data civil 01/07/2024, 30d/mês, 360d/ano | `dataDe` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔧 |
| Vitória | marcos + suprema | 11 marcos, suprema militar/religiosa/ideológica | `marcos` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rankings | dados reais | receita/mil/pop/indústria + posição | `snapshot` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multiplayer | salas/entrada/saída/reconexão/sincronização | server-authoritative, token, 12 players | `rooms` | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Persistência | manual+autosave+crítico | `saves/CODE.json`, reconnect | `salvarJogo` | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Segurança | validação/rate-limit/payload/anti-cheat/anti-spam | 2KB, 30msg/3s, sanitização | `handleClient` | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chat | interface + input + entrega | textContent (anti-XSS), 200 chars, echo a todos | `case 'chat'` + `abrirChat`/`onChat` | — | ✅ | — (efêmero) | ✅ | ✅ | 🔧 |
| UI | painéis/mapa/HUD/batalha | conectado ao backend, HUD leve | `index.html` | — | ✅ | ✅ | ✅ | ✅ | ✅ |

## Lacunas fechadas nesta fase (FASE 404)

1. **Manutenção de construções** — `buildingMaint()`.
2. **Calendário civil (meses/anos)** — `dataDe()` + `MESES`, servidor-autoritativo.
3. **Recursos espaciais** — colônias rendem terras raras.
4. **Peso dos votos na ONU** — voto ponderado por população/influência.

## FASE 406 — Chat reativado

`case 'chat'` já existia no servidor mas o cliente tinha o handler apagado
(`/* chat removido a pedido */`). Reativado: botão `btn-chat` no HUD → `abrirChat()`
(overlay com lista + input), `onChat()` guarda em `state.chatLog` e anexa no painel
aberto; renderização com `textContent`/`createTextNode` (anti-XSS). Servidor com
strip de caracteres de controle + normalização + truncamento 200 chars. Testado:
2 jogadores, entrega, eco, truncamento, vazias rejeitadas, spammer desconectado
(rate limit), reconexão, e em produção.

## Decisões de design (cobertas, não são lacunas)

- **Estabilidade** → `aprov` + coalizões + pressão política + crises (sistema integrado).
- **Cidades/regiões** → províncias (fundar/anexar/ocupar/independência).
- **Produtividade** → eco + upgrades + leis de produção (`leiProd`) + `taxaSuprimento`.
- **Fila de pesquisa** → pesquisa é instantânea (1 AP); a fila de OBRAS existe (`builds`).
- **Oficiais** → bônus de nomeação (1×) + vagas limitadas (não são cosméticos).
