#  Auditoria Completa — Presidente Online vs MA3 (v2, executada)
**Data:** 2026-09-10 · **Método:** não é grep de palavra. Cada item foi verificado por
(a) âncora no `server.js`, (b) âncora no cliente, (c) **execução real** (`performAction`,
`montarExercito`, `vantagemUnidade`…) via `tools/audit_exec.js` + `tools/soak.js` + suíte node.
Fontes MA3: Google Play, Aptoide, AppBrain, Apple, Reddit r/AndroidGaming + 25 capturas do usuário.
**Sem decompile/leak/APK.**

## Resultado final
| | |
|---|---|
| Itens oficiais do MA3 verificados | **63** |
| ✅ Presentes e funcionando | **62** |
| ❌ Ausentes antes desta sessão | **1** → **Leis/Decretos de Produção** (tela 15 do MA3) → **agora implementado (FASE 396)** |
| Ações do cliente executadas sem crash | **693/693** (0 exceções, 0 botões mudos) |
| Testes node | 12/12 + 21/21 + 16/16 = **49/49** |
| Soak (partida longa, 196 nações) | **limpo** (0 violações de invariante) |

## O que é IGUAL ao MA3 (e confirmado funcionando)
**Economia:** impostos · emitir/pagar/calote de empréstimo · ministros e gabinete · produção de
comida/ouro/ferro/petróleo/urânio · usinas + alternativas · comércio com preço dinâmico · pesquisa
econômica · 7 setores financiáveis (educação, infraestrutura, ciência, cultura, esporte, habitação,
justiça) + 2 extras nossos (saúde, turismo) · especialistas · leis econômicas · mudar religião/ideologia ·
pedir ajuda · minas de gemas com teto · XP/missões · painel de população (avaliação, natalidade,
tolerância fiscal) · excedente/suprimento de energia.

**Militar:** treinar tropas · 9 tipos de unidade (agora **todos lutam** — ver FASE 397) · instalações
militares · Ministério da Defesa · serviço secreto/polícia/guarda nacional · programa nuclear + ICBM ·
batalha por turnos com composição (forte/fraco por tipo) · sabotagem · espiões.

**Diplomacia:** alianças/pactos · embaixadas · acordos comerciais · ONU (proibir guerras, proibir armas,
embargo de armas, **resolução de invasão** `autorizar` com suborno, conselho/veto) · apoiar/condenar ·
bloqueio naval · sanções · soft power · relações que decaem/recuperam · **vassalos** (independência +
tributo).

**Vitórias:** militar (última nação de pé + anexação) · religiosa (converter o mundo) · ideológica
(sociedade perfeita / doutrina dominante) · econômica (hegemonia de PIB = "dominância por ranking" do MA3)
· rankings semanais (renda, exército, população, indústria…) · SUPREMA (nossa, vai além).

**Mundo:** 195 países · multiplayer WS + chat · desastres · protestos/golpes · crises econômicas ·
pandemia · festas/esportes (concerto, carnaval, Davis, **rugby**, olimpíadas, FIFA) · árvore tech em abas ·
espaço/satélites · tutorial interativo.

## O que era DIFERENTE (falta) e foi CORRIGIDO nesta sessão
| # | Gap vs MA3 | Correção | Teste |
|---|---|---|---|
| 1 | **Leis de produção** (preço compra/venda, volume, velocidade, tempo de obra) — tela 15 do MA3; o jogo só tinha leis de aprovação/renda | **FASE 396**: 5 decretos novos com contrapartida visível, ligados a mercado, produção diária, insumo e obras; painel do cliente sincronizado | `test_fase396_398` 8 checks |
| 2 | **Fuzileiros Navais e Defesa Aérea** eram vendidas na loja mas **não lutavam** (fora de `BT`/`BT_VANTAGEM`) e **não tinham sprite** (imagem quebrada) | **FASE 397**: stats de batalha + vantagens (defesa aérea é o predador da aviação ×1,55) + 2 sprites 160×160 no estilo do jogo + bônus no cálculo de ataque/defesa da IA | 5 checks |
| 3 | **Infantaria passava do teto 3** (`comprar_tropas` +2 sem clamp; bots idem) → poder sem limite e barra de nível quebrada | **FASE 398**: `UNIT_MAX=3` aplicado em todos os caminhos (jogador, bots, mercenários) com mensagem clara | soak (era `infantaria=5`, agora limpo) |
| 4 | **3 tabelas de custo de unidade** divergentes; `UNIT_COSTS` sem fuzileiros/defesa_aerea (bot pagaria `NaN`) | **FASE 398**: `UNIT_COSTS` único (9 tipos) usado por jogador e bots | 2 checks |

## Bugs do próprio projeto encontrados e corrigidos (testes stale)
- `test_funcoes_362_372.js` afirmava 21/21 mas a siderúrgica mudou para consumir **energia** (testava minério) → ajustado;
- o evento "seca" muda **aprovação**, não pop/dinheiro → cheque agora inclui aprovação (como dizia o rótulo);
- o teste 368 era flaky (75% de chance) → agora repete até sortear;
- painel antigo de leis estava **sem** Zona Franca e Bolsa Família → sincronizado.

## Vantagens que o MA3 NÃO tem (mantidas)
Sem anúncios · sem pay-to-win (nukes não são pagas) · multiplayer real em tempo real (MA3 é single+chat) ·
ABM/defesa antimíssil · dissuasão nuclear · batalha tática com grade e vantagens por composição ·
vitória SUPREMA · 140 construções (MA3 ~40 nas capturas) · tutorial interativo.

## Fora de alcance por design
Offline single-player (o jogo é multiplayer WS por escolha) · "ponto de implantação de tropas" do MA3
(nosso modelo ataca da nação; mudar exigiria reescrever a guerra).
