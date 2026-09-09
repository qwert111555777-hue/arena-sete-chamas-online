# Presidente Online — Contexto completo para continuar o trabalho

> Salvo no workspace em 2026-09-08 a pedido do usuário ("salve isso nos seus arquivos para não se perder").
> Fonte original: https://rentry.co/un3gqfyv (documento escrito em 2026-09-07).
> ⚠️ Chaves/PATs foram REDIGIDOS aqui de propósito (nunca gravar segredos em arquivo — ver §7).
> ⚠️ Em 2026-09-08 o workspace estava VAZIO (sem /presidente-online, sem /dev-tools). Ver §11.

---

## 0. ESTADO ATUAL — LEIA ISTO PRIMEIRO

### Branch / commits

```
8f270a5 FASE 8: telas tech + guerra MA3   ← PRODUÇÃO (dep-dafp3tad0e5s73dcdu8g LIVE ✅, pág 181475B verificada)
421d3ad FASE 7: topo MA3 + stats secoes + ministerios   ← (era a produção)
aca3806 FASE 6: mapa satelite Leaflet MA3 + fallback   ← (era a produção)
351b451 FASE 5: sem assessor/multi-mundos/TEMA MA3/fix CSS   ← (era a produção)
d9018a5 FASE 4: cores/sair/mapa/notif/sem-sidebar/compra-venda/dificil/3s   ← (era a produção)
27b42bd FASE 3: infinito/IA cautelosa/fundar ao vivo/mapa limpo/widgets X   ← (era a produção)
de00ec9 FASE 2: quadradas/minimos/cor/ranking/builds lentos/load+build   ← (era a produção)
372fd77 Corrige index.html + dias refeitos   ← (era a produção)
a62b9f3 Dias/tempo real (index.html QUEBRADO pelo regex C9 — supersedido pelo 372fd77)
d2d6318 Atualiza contexto dev
4905085 140 construcoes (47->140) cliente+servidor + pasta dev/   ← (era a produção)
8041ed1 Bandeiras oficiais dos 195 paises + fix np-flag   ← validado, no GitHub
7b648b0 Sair salva automatico + velocidade 1x-5x   ← era a PRODUÇÃO (cliente quebrado!)
56682b3 (NUNCA chegou no GitHub — perdido com workspace antigo; refeito como 8041ed1)
371566c HUD cinza-oliva #67655f
d47c0f7 125 tecnologias (5 arvores x 25)
e1cc9f1 47 construcoes / 6 abas / 5 niveis + borracha
```

- Repositório: `/home/user/presidente-online`, branch `main`
- Produção (Render): `https://arena-sete-chamas-online.onrender.com` — LIVE em `8f270a5` (verificado: pág 181475B + btn-tech/btn-war + PESQUISAS + EXÉRCITO E GUERRAS + data-tres/rec/atk + /flags 200).
- git status (na sessão antiga): `public/index.html` modificado (não commitado) — continha as 140 construções.

### ✅ BUG CRÍTICO DO np-flag (CORRIGIDO em 8041ed1)

CORREÇÃO DE REGISTRO: o bug NÃO veio do `patch_bandeiras.py`. `git blame` prova que o double-else já estava no commit empurrado 7b648b0 (linha 1415 por `7b648b07` + linha 1416 de `15ede949`). O CLIENTE EM PRODUÇÃO estava quebrado. Sintoma original (referência):

```
/tmp/all.js:890
else $('np-flag').textContent = c.flag;
^^^^
SyntaxError: Unexpected token 'else'
```

- Sintoma: o bloco de script inteiro do index.html não compila → página em branco/não funciona.
- Causa provável: o patch substituiu a linha do if (onde mostrava a bandeira) por uma versão que já termina com `;` ou por um bloco, deixando o `else` órfão.
- Onde olhar: `grep -n "np-flag" public/index.html` — a região é por volta da linha 1424.
- Como corrigir: ver o if/else completo ao redor de np-flag e restaurar a estrutura, mantendo a nova chamada flagHTML. Algo assim:

```javascript
if (temBandeira) $('np-flag').innerHTML = flagHTML(p.country, 'flagwrap-lg');
else $('np-flag').textContent = c.flag;
```

Como validar (sempre faça isso ANTES de commitar):

```bash
cd /home/user/presidente-online/public
python3 -c "
import re,io
h=io.open('index.html',encoding='utf-8').read()
s=re.findall(r'<script[^>]*>(.*?)</script>',h,re.S)
io.open('/tmp/all.js','w',encoding='utf-8').write('\n;\n'.join(s))
"
node --check /tmp/all.js && echo 'SINTAXE OK'
```

- Backup do arquivo antes do patch das bandeiras: `/tmp/idx.preband.html` (PERDIDO — /tmp não persiste)
- Backup antes do patch das construções: `/tmp/idx.preconstr.html` (PERDIDO — /tmp não persiste)

### Servidor local (sessão antiga — referência)

- Processo: presidente-online-8466c6e9, pid 3915, PORT=3000 node server.js
- Havia 2 processos node server.js no ar — possível duplicata, valia limpar e religar um só
- `curl http://localhost:3000/` retornou 000 na última verificação (pode ser efeito do JS quebrado ou do processo duplicado)
- **Nunca mate o servidor com kill/pkill a partir do bash — use start_process / stop_process**

### Arquivos

- `public/flags/` — 195 SVGs, 2.8 MB, um por código ISO (br.svg, us.svg...). Fonte: https://flagcdn.com/\<iso\>.svg. Devem ser commitados.
- `saves/` — está no `.gitignore`, saves não vão para o git (são voláteis)
- `public/portraits/` — 12 jpgs obsoletos, superados pelas bandeiras

---

## 1. O QUE É O PROJETO

Jogo de estratégia multiplayer "Presidente Online" (antigo serviço arena sete chamas). O usuário não quer reconstruir nada — só administrar e melhorar o que já existe.

- Servidor: `server.js` (Node + WebSocket), ~1900 linhas
- Cliente: `public/index.html` — um arquivo só, HTML + CSS + JS inline, ~160 KB
- `rooms` é um Map (`rooms.get/set/delete`), não objeto
- Estrutura de dados das construções (linhas 882–886 do index.html). Cinco tabelas paralelas, todas chaveadas pelo mesmo id:

| Tabela | Conteúdo |
|---|---|
| PROD_BUILDS | custo em dinheiro |
| CONCRETE_NEED | concreto necessário |
| PROD_NAMES | emoji + nome (é a "foto 2D" de hoje) |
| BUILD_TAB | aba: rec ene ali ind mil inf |
| BUILD_OUT | produção: {res:'minerio',qtd:4} ou {money:20} ou {} |

Para adicionar uma construção, tem que entrar nas 5 tabelas. Se esquecer uma, quebra.

---

## 2. O QUE JÁ ESTÁ PRONTO

- **MA3 parity** — 125 tecnologias (5 árvores × 25, 5 níveis, custos 50/99/198/396/797); HUD cinza-oliva #67655f.
- **Salvar/sair/velocidade** — commit 7b648b0, deploy dep-dafje9ad0e5s73cln130, live.
  - TICK_BASE = 45s; speedMul ∈ {1,2,3,5} → ciclo 45/23/15/9 s; inválido → 1x; só o host
  - saves/\<CODE\>.json; ao carregar volta pausado
  - case 'sair': host salva, avisa, fecha todos após 250 ms, remove sala
  - Cliente: #btn-sair → confirma → {t:'sair'}; sair_ok → location.reload()
- **Bandeiras** — 195 SVGs baixados e servidos (HTTP 200 verificado em br/us/jp/ng/au). Helpers `isoOf(id)` e `flagHTML(id, cls)` criados antes de `const PORTRAITS = {`. Mas o commit está com bug de sintaxe (§0).
- **140 construções** — patch `patch_construcoes3.py` rodou com sucesso. Verificado com node:

```
PROD_BUILDS 140 / CONCRETE_NEED 140 / PROD_NAMES 140 / BUILD_TAB 140 / BUILD_OUT 140
por aba: rec 20, ene 14, ali 22, ind 27, mil 19, inf 38
OK - todas iguais, total 140
```

Ainda não commitado e não testado no navegador (o bug de sintaxe impede).

Novas construções incluem: minas de carvão/cobre/bauxita/prata/lítio/níquel/zinco/diamante/estanho/manganês, plataforma de gás, pedreira, usina a carvão/geotérmica/maremotriz/biomassa/ondas, reator de tório, dessalinização, frota pesqueira, aquicultura, trigo, arroz, milho, soja, café, cacau, cítricos, vinícola, cervejaria, laticínios, frigorífico, óleo vegetal, refinaria, petroquímica, plástico, vidro, papel, cimento, tecelagem, couro, móveis, eletrônicos, semicondutores, montadora, caminhões, aeronaves, fertilizantes, farmacêutica, química, baterias, painéis solares, base aérea/naval, academia militar, inteligência, drones, silo de mísseis, antimísseis, radar, hospital militar, centro logístico, escola, universidade, instituto técnico, hospital, clínica, habitação, saneamento, rede de água, reciclagem, aterro, incineradora, barragem, canal, ponte, túnel, data center, telecom, banco, bolsa de valores, estádio, teatro, museu, biblioteca, parque, hotel, shopping, zona franca, porto seco, observatório, porto espacial.

**Decisão técnica importante:** todas as 93 novas construções produzem apenas recursos que já existem no jogo (madeira, minério, concreto, borracha, terras_raras, urânio, energia, comida, money) ou nada. Nenhum tipo de recurso novo foi criado — assim a economia continua funcionando sem mudar o núcleo.

---

## 3. O QUE FALTA (ordem acordada com o usuário)

1. Corrigir o bug de sintaxe do np-flag e commitar as 140 construções — FEITO (8041ed1 + 4905085)
2. Dados oficiais reais dos 195 países — capital, população, área, PIB, forças armadas, recursos
3. Núcleo em tempo real — não por turno: cada segundo entra dinheiro da economia/capital e cada segundo se produzem minérios — FEITO (1 dia/s em 1x, semanas estratégicas, deploy 372fd77)
4. Construções custam minérios; dinheiro (por segundo) compra minérios, não construções; dinheiro vai para melhorias e investimentos
5. Mercado onde a IA vende de forma inteligente — você oferece seu preço, ela aceita o dela
6. Exército para ataque, contratar outros países para atacar, e corrupção
7. Gráficos melhores, mapa-múndi real; países customizados nascem no meio do mar, lugar aleatório
8. Cada país evolui sozinho e interage com jogadores e entre si

Itens já resolvidos na lista original:

- Remover "4 de poder de compra por turno" e dinheiro embaixo de ECONOMIA/TROPAS — FEITO
- Foto do país no lugar do nome — FEITO (bandeiras)
- Pausa + 1x–5x — FEITO
- Save só pelo criador da sala; fechar a sala ejeta todos — FEITO
- Sem chat; notícias só dentro de um jornal clicável, sem toast — FEITO
- Velocidade escolhida durante o jogo e sair salva automático — FEITOS
- Mapa só bandeiras QUADRADAS (sem território); home mínima (criar/entrar/código/carregar); lobby mínimo (fundar = nome+cor+símbolo, sem velocidade); ranking destaca país próprio sem 🤖/💀; obras lentas por prédio (6–27 dias); botões Carregar 📂 e Construir 🏗️ — FEITOS (Fase 2, deploy de00ec9)
- Jogo INFINITO (vitórias→marcos, humanos nunca caem: reforma/exílio); IA cautelosa (só ataca muito superior, sem gang, trégua 20d); saques 25%→12%; conquista só com aniquilação/superioridade; fundar ao vivo (preview, 60 cores, 48 símbolos, sem botão); load sem código (sala salva); mapa sem bordas + anticolisão + sidebar 240px; widgets quadrados com categorias MUNDO/PAÍS e ✕ em tudo — FEITOS (Fase 3, deploy 27b42bd)
- 60 cores em ordem (arco-íris, sem repetir); sair funciona + confirma; mapa não foge da tela (trava em 1x, limites no zoom); notificações só na central 🔔 com badge; sidebar/feed removidos (mapa full); ajuda em 6 linhas; mercado virou 💰 Compras e vendas; conquista dura (defesa 1.3x, margem 15%, saque 8%, guerra só 8+mil/1.75x/8%); 1x = 3s/dia (5x=0.6s); missão do HUD removida; painéis escuros+dourados padronizados — FEITOS (Fase 4, deploy d9018a5)
- Assessor removido (zero recomendação); Carregar mostra MEUS MUNDOS (nome+sala+dia+data, até 8, sem entrar direto); TEMA MA3: papéis bege + seções teal + ouro, toolbar esquerda com 12 widgets, pausa/velocidade na barra inferior, topo navy só recursos; fix ordem CSS (blocos no fim do style) — FEITOS (Fase 5, deploy 351b451)

---

## 4. REGRAS E RESTRIÇÕES DO USUÁRIO (não violar)

- "não quero que você construa nada, apenas administre e melhore o que eu tenho" / "nada de reconstruir, só melhorar o que eu já tenho" — nunca reconstruir do zero
- Trabalhar só no serviço arena sete chamas (pode se chamar "Presidente Online")
- Não é por turno: "roda por segundos, contando, cada segundo você recebe uma quantia de dinheiro da economia, a capital, e em cada segundo os minérios são produzidos"
- Construções custam minérios; dinheiro por segundo compra minérios, não construções
- Sem chat
- Jogando presencialmente com amigos (contexto local importa)
- "quero tudo, mãos a obra" / "faça tudo isso, é o resto se eu quiser eu te peço" — fazer a lista inteira
- Resposta às três perguntas, textual: "Eu quero o teto máximo de construções, só os dados oficiais, vai o real o máximo o possível, quero as fotos de todos os países que existem."
  - → sem teto de construções; só dados oficiais; omitir ou sinalizar o que não tiver fonte, nunca inventar; imagens reais para todos os países
- Ressalva já combinada sobre "dados oficiais": Capital, população, área, PIB e tamanho das forças armadas existem de verdade e dá para colocar por país. Mas "quantas siderúrgicas o Brasil tem" não é dado oficial de lugar nenhum — isso teria que ser modelado. Proposta aceita: oficial onde existe dado real, modelado onde não existe, e entregar uma tabela com a origem de cada campo para o usuário saber o que é real e o que é estimativa.

---

## 5. ARMADILHAS JÁ DESCOBERTAS (não repetir)

- `rooms` é Map. `rooms[code]`, `rooms[code] = x`, `delete rooms[code]` são no-ops silenciosos. Use `rooms.get/set/delete`.
- Ao remover HTML, sempre dar grep nos ids antes — o chat foi removido e o JS órfão (sendChat, listener, if (m.t==='chat')) ficou largado.
- `sair_ok` não chegava porque o mesmo loop fazia `conn.send()` e `conn.close()` em seguida — o frame morria com o socket. Correção: enviar para todos, fechar em setTimeout(…, 250).
- wsclient.js entrega às vezes uma string JSON crua, não objeto. Todo teste novo precisa do guard:

```javascript
if (typeof o === 'string') { try { o = JSON.parse(o); } catch { return; } }
```

- `cmd | tail` mascara o exit code — tail sai com 0 mesmo quando o comando falha. Capture `exit=$?` antes do pipe.
- `node --check` não prova que um identificador existe — só valida sintaxe.
- teste_batalha.js é instável sob carga (12/13 em lote); reconnect2 também deu falso negativo uma vez e passou 3/3 ao rodar isolado.
- Guard de tamanho mínimo de 200 bytes em SVGs de bandeira gera 30 falsos negativos — Mônaco 155 B, Peru 156 B, Benin 197 B são legítimos. Use 100 bytes.
- restcountries.com retorna 301 — não usar. flagcdn.com/\<iso\>.svg funciona.
- Render (plano grátis) apaga o disco em restart/deploy — saves não sobrevivem sem disco persistente pago. Já avisado ao usuário.
- Nunca matar o servidor local por bash (kill/pkill mata a própria ferramenta bash).
- Servidor tem CÓPIA PRÓPRIA das 5 tabelas de construções (server.js ~935-939) e REJEITA kind desconhecido (`if (!PROD_BUILDS[msg.kind]) return`). Patch de construções tem que ir em index.html E server.js, idênticos.
- Cliente constrói via envelope `{t:'action', action:'construir', kind}` — `{t:'construir'}` no top-level NÃO existe e é ignorado em silêncio.
- `construir` com sucesso NÃO faz broadcast (silêncio é normal). Para validar: `fim_turno` (host) → novo state → conferir `buildings[kind]`.
- Log da sala tem teto de 120 entradas e 195 bots floodam — ausência de 'inicia X' no log NÃO prova que não construiu; confira `buildings`.
- NUNCA edit_file em paralelo no MESMO arquivo (race read-modify-write: só 1 edição sobrevive). Faça sequencial ou via script único.
- Render com autoDeploy=yes NEM SEMPRE dispara no push (pushes 8041ed1/4905085 não dispararam) — confira deploys via API e dispare manual se preciso.
- regex `^.*X.*$` com DOTALL casa o ARQUIVO TODO (apagou o index.html 2x!) — para 1 linha use `[^^\n]*`... (correto: `[ ^\n ]` sem espaço) ou splitlines; desconfie de diff com milhares de deletions.
- Após todo patch: conferir TAMANHO do arquivo + marcadores positivos (não só ausência do texto antigo) antes de commitar.
- No loop diário, escalar FLUXOS e LIMIARES juntos (need de comida ÷7 foi esquecido e zerou a comida — o smoke pegou).
- Dias de semana chegam via full state, não via msg 'day' — smoke de dias deve ouvir os dois.
- Service ID correto: `srv-da95mkpf2nfc73eccqjg` (`srv-d43ek5er433s73co2mno` NÃO existe — era ID errado; dá 404 not found).
- Trigger de deploy: body `-d '{}'` (201). Body `{"clearCache":false}` dá 400 invalid JSON.
- GET de deploy único retorna o objeto FLAT (`d['status']`), sem wrapper 'deploy' (só a lista usa wrapper).
- URL de produção: `arena-sete-chamas-online.onrender.com` (presidente-online.onrender.com dá 404).
- id HTML duplicado = widget morto ($ pega só o 1º): btn-rank existia 2x (HUD + side-tools); side virou btn-rank2.
- Painel com innerHTML= apaga botão X injetado — o X tem que nascer DENTRO do render (rank/market) ou no HTML estático (np/help/overlay); fechamento via listener delegado em .px.
- Handler com variável de outro escopo quebra em silêncio: btn-sair usava `m` do renderGame (ReferenceError → botão morto); fix: const meS = me().
- sed encadeado sem pensar: s/13000/22000/ seguido de s/22000/30000/ come o que acabou de criar — confira linhas após sed.
- Smoke com gate de estado (ap/eco) morre em ritmo lento (full state é semanal): spam cego deixa o servidor arbitrar (aceita/rejeita).
- CSS: mesma especificidade, o ÚLTIMO vence — blocos de tema grudados no topo do <style> PERDEM para as regras base (foi por isso que a Fase 4 'não mudou nada' visualmente). Tema SEMPRE no fim do style (ver fix_css_order.py: base<Q3<M1</style>).
- Prova de ordem CSS não pode supor props na linha do seletor (regras base são multi-linha); compare nº da linha do seletor puro.
- CSS/JS de mapa novo vai no FIM do style (cascata) e sync no fim do renderMap; guards __leaf desligam pan/zoom antigos.

---

## 6. FERRAMENTAS EM /home/user/dev-tools/ (RECRIADAS em 2026-09-08 + COPIADAS p/ presidente-online/dev/ no repo, p/ sobreviver entre chats)

| Arquivo | Estado | O que faz |
|---|---|---|
| baixar_bandeiras.py | RODADO | baixou as 195 bandeiras (guard 100 bytes) |
| patch_bandeiras.py | RODADO — GEROU O BUG | troca emoji/nome por bandeira; helpers isoOf/flagHTML; painel da nação |
| patch_construcoes3.py | RODADO, OK | expandiu 47 → 140 construções nas 5 tabelas |
| patch_ui.py, patch_ui2.py | rodados | HUD e limpeza de turno |
| patch_salvar.py | rodado | módulo de save |
| teste_salvar.js | 16/16 | save/sair/velocidade |
| teste_onu_energia.js | 33/0 | ONU e energia |
| teste_batalha.js | 13/0 | batalha (instável sob carga) |
| teste_acoes.js | 16/0 | ações |
| teste_alianca.js | 10/0 | aliança |
| teste_tecnologias.js | 35/0 | tecnologias |
| teste_construcoes.js | 37/0 | construções |
| reconnect2.js, wsclient.js | — | reconexão e cliente WS de teste |
| patch_construcoes.py | NOVO 2026-09-08 | expande 47 → 140 em index.html E server.js (idênticos) |
| verificar_construcoes.js | NOVO 2026-09-08 | conta 140, distribuição por aba, client==server, outputs |
| smoke_construir.js | REMOVIDO | usava fim_turno (não existe mais); supersedido por smoke_day.js |
| patch_dias.py | NOVO 2026-09-08 | converte turnos→dias+semanas (server+client); C9 extraído p/ patch_c9.py |
| patch_c9.py | NOVO 2026-09-08 | reescreve linha produção/dia (line-based, SEM regex) |
| smoke_day.js | NOVO 2026-09-08 | dias consecutivos 1x/5x + obra conclui em dias (precisa `npm i ws`) |
| patch_fase2.py | NOVO 2026-09-08 | FASE 2: quadradas, home/lobby mínimos, fundar+cor, ranking, builds lentos, btn-load/btn-build |
| smoke_fundar.js | NOVO 2026-09-08 | fundar nome+símbolo+cor; cor inválida rejeitada (precisa `npm i ws`) |
| patch_fase3.py | NOVO 2026-09-08 | FASE 3: infinito, IA cautelosa, fundar ao vivo, mapa limpo, widgets quadrados+X, load sem código |
| smoke_infinito.js | NOVO 2026-09-08 | símbolo novo 🐯 + eco 60+ sem fim de jogo + MARCO no log (precisa `npm i ws`) |
| patch_fase4.py | NOVO 2026-09-08 | FASE 4: cores, sair, mapa, notif, sem-sidebar, ajuda, compra/venda, difícil, 3s, tema |
| smoke_day.js | RETIMADO Fase 4 | 1x=3s/dia: 5x aos 10s, check final 22s, timeout 30s |
| patch_fase5.py | NOVO 2026-09-08 | FASE 5: sem assessor, multi-mundos, TEMA MA3 (só cliente) |
| fix_css_order.py | NOVO 2026-09-08 | move blocos Q3+M1 p/ fim do style (cascata correta); idempotente via asserts |
| patch_fase6.py | NOVO 2026-09-08 | FASE 6: Leaflet satélite + fallback SVG (só cliente, +61/-0) |
| patch_fase7.py | NOVO 2026-09-08 | FASE 7: topo MA3, stats seções, ministérios MA3 (só cliente) |
| patch_fase8.py | NOVO 2026-09-08 | FASE 8: telas tech + guerra MA3 na toolbar (só cliente) |

Regressão verde: 160 verificações / 0 falhas. Esse é o baseline a proteger.

---

## 7. SEGURANÇA

- 2026-09-08 o usuário ORDENOU guardar as chaves: estão em `/home/user/.chaves` (chmod 600, FORA do repo — nunca commitar, repo é PÚBLICO). Uso: `export $(cat /home/user/.chaves | xargs)` ou `export RENDER_API_KEY=$(grep RENDER_API_KEY /home/user/.chaves | cut -d= -f2)`.
- NESTE arquivo vai só o PONTEIRO do caminho, nunca os valores (este arquivo é commitado no repo público).
- Se o próximo chat abrir workspace VAZIO (como em §11), as chaves se perderam — pedir as 2 de novo UMA vez e regravar.
- Avisar o usuário para revogar as duas quando o trabalho terminar.
- Remotes do git não persistem — recuperar de .git/FETCH_HEAD; push funcionou sem PAT (auth do sandbox); se quebrar, usar GH_TOKEN de /home/user/.chaves.

---

## 8. COMO COMMITAR

```bash
cd /home/user/presidente-online
git add -A
git -c user.name="Arena Agent" -c user.email="agent@arena.ai" commit -m "mensagem"
```

---

## 9. COMO DEPLOYAR (Render)

- Serviço: `srv-da95mkpf2nfc73eccqjg` (único correto; srv-d43... não existe)
- Último deploy: `dep-dafp3tad0e5s73dcdu8g` (commit 8f270a5, live)
- `POST /v1/services/srv-da95mkpf2nfc73eccqjg/deploys` body: `{}` (qualquer clearCache dá 400)
- Chave: `export RENDER_API_KEY=$(grep RENDER_API_KEY /home/user/.chaves | cut -d= -f2)` (nunca gravar valor em arquivo commitado).
- Não deployar enquanto houver bug de sintaxe.

---

## 10. CONTATO COM O USUÁRIO

- Fala português (BR), região de Sergipe
- É direto e quer ver execução, não planejamento
- Quando algo dá errado, ele prefere honestidade a disfarce
- Ele responde curto ("faça isso", "segue") e confia no critério técnico

---

## 11. RECUPERAÇÃO — sessão de 2026-09-08

- Workspace encontrado VAZIO: sem `/home/user/presidente-online`, sem `/dev-tools`, sem `/tmp/*.html`.
- Este arquivo foi recriado a partir de https://rentry.co/un3gqfyv a pedido do usuário.
- 2026-09-08: usuário enviou PAT GitHub + chave Render — em uso INLINE nesta sessão (nunca gravar segredo em arquivo, §7). Próxima sessão: pedir os 2 de novo (arquivos não atravessam chats).
- Pendente: clonar repo (nome a confirmar via API) ou URL do Render como plano B.
- Plano após recuperar: clonar → corrigir bug np-flag → refazer 140 construções (lista em §2) → validar sintaxe + regressão → commitar → só então deployar.
- 2026-09-08: repo = `qwert111555777-hue/arena-sete-chamas-online` (público) — clonado OK. Fix limpo em `8041ed1` (push OK: 195 flags, sintaxe OK, HTTP 200 em / e /flags/*). Próximo: refazer 140 construções.
- 2026-09-08 (140 construções): 93 novos refeitos do zero (lista §2 + `hidrogenio` extra p/ fechar ene=14, pois a lista somava 92). Distribuição exata: rec 20, ene 14, ali 22, ind 27, mil 19, inf 38. Cliente E servidor idênticos. Validado: 140/140, outputs só recursos existentes, node --check OK x2, smoke WS end-to-end OK (mina_cobre:1, porto_espacial:1). Pasta `dev/` (contexto+scripts) commitada no repo p/ não se perder entre chats.
- 2026-09-08 (deploy): Render NÃO auto-disparou nos pushes; deploy manual dep-dafn2bn40ujc73c0tjd0 (4905085) via API.
- 2026-09-08 (FASE 1 — dias em tempo real, LIVE dep-dafnillg1s2s73faids0/372fd77): dayTick (1 dia = 1000/speedMul ms), economia diária ÷7, semana = 7 dias (mercado, relações, missões, ONU 28d, IA/eventos 14d), obras em dias (buildDays por custo; infra 2, espacial 4, nuclear 5), broadcastDay leve + full semanal, fim_turno removido, velocidade recria timer, pausa congela dia, saves migram until→untilDay. Cliente: HUD DIA + data real, countdown removido, btn-speed cicla 1/2/3/5, mapa só bandeiras circulares (nomes + losangos removidos), ranking top8 + customs com posição, produção/dia genérica (140 prédios). Smoke: dias consecutivos 1x/5x (200ms/dia), mina_cobre:1, comida 21. MA3 identificado: MA 3 President Simulator (Oxiwyle/Android) — ref. p/ widgets da fase 4. Incidente: regex C9 apagou index.html (commitado/deployado quebrado a62b9f3); restaurado de 62c68a1, refeito e republicado verificado.
- 2026-09-08 (FASE 2 — LIVE dep-dafo3mv40ujc73c543tg/de00ec9): mapa só QUADRADOS 26x18 (image real ou PALETTE+emoji, sem território/foreignObject), home mínima (nome+criar+código+entrar+carregar via tem_save/same-browser), lobby mínimo (fundar nome+12 cores+24 símbolos, btn-speed removido, hint não-host), fundar aceita cor 0–59, ranking destaca próprio em dourado sem 🤖/💀, builds lentos buildDays=min(30,max(4,3+round(custo/40))) 6–27d + infra 6/espacial 12/nuclear 18, HUD btn-build abre Construções. Smoke: dias OK (mina 12d conclui) + fundar/cor OK (99 rejeitado). Deploy: autoDeploy=yes NÃO disparou; manual via API. Correções de registro: service ID srv-da95... (não srv-d43...), body '{}', GET flat, URL arena-sete-chamas-online.
- 2026-09-08 (FASE 3 — LIVE dep-dafoen0n74is73au68cg/27b42bd): checkVictory→marcos 1x/nação (phase 'over' nunca mais; dinheiro/pop/poder já eram ilimitados — confirmado sem tetos); humanos imortais (aprov 0=reforma -50% caixa; 0 províncias=exílio, reconquista); bots caem (mundo evolui); IA: guerra só dia 20+, mil 6+, freq 0.12, rel<45, sup 1.5x, sem gang (alvo <2 guerras), alvo com +1 prov e $500+, ataque imediato 25%; bot saque 12%/aprov-4/ocupa só com sup 1.3x; batalha: saque 12%, captura só se vivosD=0 (retirada salva terra); noWarUntil=20 inicial; fundar live (preview bandeira 52x36, 60 cores 22px, 48 símbolos, nome debounce 600ms + rascunho, sem botão); load usa po_room salvo no g-code; mapa: fb/csq/halo removidos, seleção=brilho drop-shadow, declutter 30x22 10it; sidebar 240px só Notícias; HUD MUNDO/PAÍS; tudo quadrado (flimg/pchip/ap-dock/round-btn); ✕ em np/rank/market/help/overlay; btn-rank2. Smoke: dias+fundar verdes, infinito (🐯, eco 71, phase game, MARCO) OK.
- 2026-09-08 (FASE 4 — LIVE dep-dafon3ad0e5s73dal4r0/d9018a5): PALETTE=hsl(i*6,72%,58/44%) arco-íris ordenado, swatches usam PALETTE[ci]; sair: ReferenceError `m` corrigido + confirm nativo (host: salvar+encerrar; guest: sair); applyView trava (1x=zera, zoom=clamp 100/60px); toast→central 🔔 (NOTIFS 60, badge 9+, renderNotifs; flutuante só pré-jogo); sidebar+feed removidos (mapa largura total); jornal sem filtro (60); ajuda em 6 linhas; mercado=💰Compras e vendas (Comprar/Vender 10 já existiam); conquista: defesa bot 1.3x, vitória exige 15% margem, sup 1.5x, saque 8%, guerra mil8+/1.75x/8%freq, captura exige atk.mil>=def.mil; dayMsFor 3000/mul (1x=3s,5x=0.6s); m-mission+advisor-missão removidos; tema: paper !important deletado, painéis navy #101830+ouro, np esquerda / rank direita, scrollbars ouro, btn-sair quadrado. Smoke: dias (3s/dia, 601ms 5x) + fundar + infinito (spam cego, eco 91) OK.
- 2026-09-08 (FASE 5 — LIVE dep-daforbn40ujc73c8cii0/351b451, SÓ CLIENTE): assessor deletado (html+js, css morto); po_worlds (até 8: code+nome+dia+data, atualiza por state) + modal MEUS MUNDOS (papel, data-w, tem_save; código digitado pula modal); MA3 (referência: screenshots apk.dog/apkaward): toolbar .ma3-tools esquerda (9 HUD + market/help/snd, 46px papel, !important p/ vencer ids), pausa/velocidade prepend no bottom-bar, topo navy só chips+ sair, hcat removidos, painéis papel #f3ead1 + h3 vermelho #7a2e1f + seções .np-sub teal + botões teal #145a6b + ✕ vermelho + Fechar verde #2e7d32 + textos escuros (help/market/notif), side-tools display:none. F5b: usuário pediu MA3 idêntico/original no site — RECUSADO c/ explicação (app fechado Oxiwyle, sem fonte; copiar arte = pirataria); caminho = recriação fiel c/ código próprio. INCIDENTE: blocos Q3/M1 no topo perdiam cascata (Fase 4 sem efeito visual!) — fix_css_order.py moveu p/ fim (base=206<Q3=294<M1=310). Smoke: dias+fundar verdes (server intocado).
- 2026-09-08 (FASE 6 — LIVE dep-dafougqd0e5s73dblq0g/aca3806, SÓ CLIENTE +61/-0): mapa satélite Leaflet 1.9.4 (unpkg css+js) + Esri World_Imagery (atribuição ok); #leafmap z1, body.leaf-on esconde SVG; flags 30x21 divIcon (real=img, custom=PALETTE+emoji, sel=brilho, morto=opaco); lat/lon via cbid (state.world tem customs); zoom 2-7, maxBounds, zoom bottomright; linhas aliança = polyline ouro; navios animados SÓ no SVG (perdidos no satélite); pan/zoom antigos desligam c/ __leaf; fallback automático p/ SVG se CDN falhar. Smoke: dias+fundar verdes.
- 2026-09-08 (FASE 7 — LIVE dep-dafp1t8n74is73b0rq90/421d3ad, SÓ CLIENTE): topo MA3 completo — chips renda/dia (dailyIncome), AP, doutrina (IDEOLOGIES nome), religião curta; updates em renderGame E applyDay (2 blocos atualizam mesmos chips); stats 📈 em seções teal NAÇÃO/POVO (pseudo-row ['H',..]); ministérios 🏛️ viraram cards MA3 (header teal + barra ouro 4 segs + stepper −/+ atualiza barra); serif Georgia nos h3; .seg/.segs/.stat-h no fim do style. Smoke: dias+fundar verdes.
- 2026-09-08 (FASE 8 — LIVE dep-dafp3tad0e5s73dcdu8g/8f270a5, SÓ CLIENTE): 🔬 PESQUISAS (modal papel: 5 abas TECH_TREES, 125 techs c/ nome+efeito+5 segs ouro, botão Nv+Custo, otimista m.techLv) + ⚔️ EXÉRCITO E GUERRAS (poder, 7 unidades c/ 3 segs + recrutar 1⚡+4⚙️+$custo, guerras ativas c/ poder + Atacar 2⚡/Paz); botoes na toolbar (14, scroll); techLv(pl,k)=pl.techLv[k]||0; recruit action=próprio key da unidade. Refs MA3: telas oxiwyle oficial + memuplay. Smoke: dias+fundar verdes.
- 2026-09-08 (FASE 9 — LIVE dep-dafpbj740ujc73carj70/91995ea, SÓ CLIENTE): 📜 LEIS NACIONAIS (6 cards c/ custo, ativa otimista ✓, contrato LEIS) + 🤝 DIPLOMACIA (filtro TODOS/ALIADOS/GUERRAS/COMÉRCIO, barra 0–100 colorida, status, 🎁 $100/+8, 🕊️/🤝 otimista); 16 botões toolbar; Refs MA3: memuplay UK–Londres card grid + modcombo 5-card guerra (7 telas mapeadas). Incidentes: (1) .chaves agora rotulado (RENDER_API_KEY=...) — extrair após '='; (2) URL prod = arena-sete-chamas-online (presidente-online dá 404). Smoke: dias+fundar verdes.
- 2026-09-08 (RAIO-X MA3 — pesquisa legal, sem código vazado): MA3 = Unity/C# c/ ~95% certeza (SDK Unity3d Ads dentro do APK segundo análise estática pública Exodus v1.0.69; APK 277MB; mesmo jogo no Android+iOS+Steam — marca do Unity; time começou solo). Processo: fundador Serhii Shpirna começou SOZINHO (Ukraine Simulator: programa+arte+design+marketing) → time de 30 no MA3, remoto, 40M+ downloads (entrevista PocketGamer). Stack: mediação de ads (AppLovin MAX, ironSource, AdMob), Firebase/Crashlytics, IAP + versão PRO paga. Review pede multiplayer online — NOSSO diferencial (já temos). Adotado ("trabalhar igual"): base de código única (nossa web = celular+PC sem instalar), tudo em tabelas de dados, simulação em tempo real c/ velocidade, telas em módulos, fases pequenas contínuas. NÃO adotável: o Unity em si (trocar o motor = jogar fora o jogo; regra: nunca recomeçar do zero) + fonte deles é fechado.
- 2026-09-08 (FASE 10 — LIVE dep-dafpegid0e5s73dds0pg/fe809e9, SÓ CLIENTE/CSS): skin MA3 na batalha tática (papel .bt-wrap, barra teal + título ouro serif, status chip papel, Recuar vermelho, grid moldura ouro, painéis/unidade/log papel, botões mover teal; lógica btRender/btClique intocada) + IMPOSTOS verificado completo (btn-tax, 4 sliders corp/rend/prod/amb, envia 'impostos' — sem mudança). Smoke: dias+fundar verdes.
- 2026-09-08 (INVENTÁRIO MA3 × NOSSO — estudo completo p/ "melhorar, não copiar"): MA3 tem: economia (impostos/empréstimos/comércio/ministros/recursos), militar (recruta/treino/bases/nuclear/espionagem/sabotagem/batalhas por turno/bloqueio), diplomacia (alianças/pactos/embaixadas/ONU/sanções/vassalos), 4 vitórias (conquista/religiosa/ideológica/econômica), desastres. DESCOBERTA: nosso server.js JÁ TINHA TUDO (espionar/sabotagem/nuclear/nuke/emprestimo/pagar/sancao/bloqueio/embaixada/treinar/pacto/propor_resolucao/subornar/espalhar_*/anexar + ONU com 5 resoluções + 6 marcos) — faltava TELA (tudo espremido no popup da nação; sabotagem e treinar SEM botão nenhum). Fases 11–14 = telas dedicadas, MELHOR que o MA3 (multiplayer tempo-real + progresso ao vivo).
- 2026-09-08 (FASE 11 — LIVE dep-dafph5on74is73b2u400/250bb95, SÓ CLIENTE): 🕵️ OPERAÇÕES SECRETAS (toolbar): card Serviço Secreto Nv/3 + chance + upgrade [350,800,1600]; por nação 🔍 Espionar (relatório via info) + 🧨 Sabotar. Smoke: dias+fundar verdes.
- 2026-09-08 (FASE 12 — LIVE dep-dafpi7ou01pc73be4uqg/7cafa3d, SÓ CLIENTE): ☢️ PROGRAMA NUCLEAR (toolbar): Nv 0–5 segs, obras em andamento, estoque urânio, Nova etapa (2⚡+$600+10U, 18d); lançamentos por guerra com confirm (3⚡, Nv3+, consome 1Nv). Smoke: dias+fundar verdes.
- 2026-09-08 (FASE 13 — LIVE dep-dafpiqht0dsc73f5t420/aed4eb3, SÓ CLIENTE): 🇺🇳 ONU (toolbar: sessão + votos + A favor/Contra via voto_un + subornar $200; propor 5 tipos + alvo, 1⚡+$300) + 🏆 CAMINHOS DA VITÓRIA (6 marcos c/ barra de progresso ao vivo: única/eco60/ideo60/fe60/convR/convI). Smoke: dias+fundar verdes.
- 2026-09-08 (FASE 14 — LIVE dep-dafpjnht0dsc73f612m0/7a102b4, SÓ CLIENTE): dip += 🏛️ abrir/fechar embaixada + 🚫 sanções toggle + ✍️ pacto por nação; war += 🏋️ treinar (1⚡+$150, mil+1 max25) + ⛴️ bloqueio por guerra (frota1+, −25% renda alvo). Smoke: dias+fundar verdes.
- 2026-09-08 (FASE 15 — LIVE dep-dafpn5gu01pc73beqf1g/9b53316, ARTE+CLIENTE): 10 retratos IA originais estilo pintura presidencial (ar/ca/es/it/tr/sa/ir/eg/za/id, ~120-180KB cada) → PORTRAITS 12→22 nações. Deploy lento (10 polls). Prod 200 + 10/10 portraits 200. LIMITE PLATAFORMA: máx 10 imagens/turno — restantes p/ próximos turnos: 21 retratos (kr pk pl ua se co cl pt nl be no fi dk gr ie cz ro hu at ch il) + headers telas (spy/nuke/onu/win/home). Smoke: dias+fundar verdes.
- 2026-09-08 (ESTUDO MA3 aprof. — MWM iOS screens + FAQ): gaps achados: (1) colonização espacial c/ custos/tempo (Marte) — nosso 'espacial' existia mas enterrado; (2) gestão ambiental (esgoto/contaminação/água/lixo) — NÃO tínhamos; (3) ranks (receita/exército/pop/indústria) como metas. Vitórias MA3: militar 180/conversão/sociedade perfeita.
- 2026-09-08 (FASE 16 — LIVE dep-dafpsuid0e5s73dfqltg/8e1dc81, SERVER+CLIENTE): 🌍 ECOLOGIA inédita (server: p.pollution init 10 + snapshot + drift no dayTick +0.3 prédio/sem, −2 imposto amb12+, −1.5 orçamento amb2+, clamp −4/+6; >=70 aprov−1, >=90 aprov−2+multa, alerta 1x; ação 'reflorestar' 1AP+$250 −15/+1aprov) + 🚀 ESPAÇO (toolbar: 3 etapas Satélite/Estação/Marte [500,800,1200], 2AP, 12d, +2aprov, +$30/sem Nv3) + 🌍 tela eco (medidor + status + reflorestar + dicas) + 🏆 ranks #X de N (receita/militar/pop/eco) + 10 retratos (kr pk pl ua se co cl pt nl be → 32 nações). Incidente: J6 quebrou string JS (newline) — fix collapse. Smoke16 novo: pollution 10→0 (ação executada!) errs 0. Servidor teste local reiniciado (start_process 'Teste', pid novo). Smoke: dias+fundar+16 verdes.
- 2026-09-08 (FASE 17 — LIVE dep-dafpu8u7bikc73d7c06g/8f4382f, ARTE): +10 retratos IA (no fi dk gr ie cz ro hu at ch → 42 nações). Prod 200 + 10/10 portraits 200. Resta: 1 retrato (il) + 5 headers (spy/nuke/onu/win/home). Smoke: dias+fundar+16 verdes.
- 2026-09-08 (ESTUDO: reviews MA2 Steam inúteis ("nice"/"good game" só); reviews MA3 AppBrain valem ouro: "fácil demais, IA não cresce/ataca", "queria multiplayer", "travou na tela", pedidos: reservas/treino conjunto/peacekeeping ONU. Nossos bots ATACAM (guerra dia20+) e temos multiplayer = já superiores nesses pontos.
- 2026-09-08 (FASE 18 — LIVE dep-dafq01lg1s2s73fl3r6g/c31b464, SERVER+CLIENTE+ARTE): 6 artes (il → 43/43 retratos! + headers spy/nuke/onu/win/home ~1.3MB) ligadas nos 4 modais + hero home; ação inédita 'treino_conjunto' (aliado, 1AP+$200, +1mil cada/+5rel) + botão 🏋️ no dip (só aliado). Servidor teste reiniciado (teste-78b78044). Smoke: dias+fundar+16 verdes.
- 2026-09-08 (FASE 19 — LIVE dep-dafq2ftg1s2s73flemb0/c04e282, SERVER+CLIENTE+ARTE): 🕊️ 'manter_paz' 6º tipo ONU (UN_TYPES+resolve+openUN+propor: encerra TODAS as guerras do alvo + limpa bloqueios) + 🛡️ 'convocar_reservas' (1AP+$300, +3mil max25, −2aprov, cooldown 14d lastReserve) + 6 headers (tech/war/laws/dip/space/eco → 11/11 telas com arte!) + tipo no modal ONU + botão reservas no war. Incidente: L4 comeu aspa do treino (fix direto). Servidor teste teste-5888d609. Smoke: dias+fundar+16 verdes.
- 2026-09-08 (ESTUDO: 20 conquistas MA2 Steam mapeadas — Nuclear/Conqueror/Well-Fed/UN Council/Government/Capitalist/Patron/Liberator/Merchant/Colonel100/Investor/FirstScience/Tourist/Propagandist/Prosperous/Missionary/Magnate/Geopole/Pirates/General500. Server TECHS=124 keys.)
- 2026-09-08 (FASE 20 — LIVE dep-dafq4dqd0e5s73dgq8kg/21ea49e, SERVER+CLIENTE+ARTE): 🏅 CONQUISTAS (toolbar, 20 c/ barra ao vivo, contador X/20, header med.jpg) + server: vitorias defensivas contam (bug: só atk contava) + stats.anexacoes/ajuda + BOTS CRESCEM (eco investe, mil cap 12→18, pesquisam tech Nv3, aprovam leis). Servidor teste teste-fddfe94e. Smoke: dias+fundar+16 verdes.
- 2026-09-08 (ESTUDO governo MA3: 50+ ministérios/depts (moddroid), posse+MANDATOS+reeleição (androidprog), setores edu/ciencia/cultura/esporte/moradia/justiça (bluestacks — iguais aos nossos 7!), crises: epidemias/desastres/protestos/golpes (modfyp).)
- 2026-09-08 (FASE 21 — LIVE dep-dafq6h0n74is73b5li70/8fea40a, SERVER+CLIENTE+ARTE): 🏛️ GOVERNO (toolbar: ministros 3 pastas c/ 3 opções + orçamento 5 steppers + 7 setores + countdown eleição + mandatos, header gov.jpg) + 3 novos ministros (Industrialista +20% prédios / Pacifista +2❤️−10% / Mestre-Espião +10% sab + hooks) + 🗳️ ELEIÇÕES 56d (50%+ reeleito +$300+3❤️+mandato; 35–49 aperto; <35 derrota+emergência) + stats.mandatos x2. Servidor teste teste-bb32b925. Smoke: dias+fundar+16 verdes.
- 2026-09-08 (ESTUDO crises MA3: sistema de DECISÕES c/ escolhas (ipaomtk), desastres (terremotos/enchentes) + protestos/golpes/revoluções + recessão/inflação (modfyp/modroid), decay anual por ideologia/religião + terremotos destroem prédios (reddit), review reclama de crise aleatória injusta repetida (AppStore) = LIÇÃO: crises justas c/ contrajogada.)
- 2026-09-08 (FASE 22 — LIVE dep-dafq882d0e5s73dhaim0/f20fa77, SERVER+CLIENTE+ARTE): 🚨 CRISES interativas (server: novaCrise+resolverCrise, 4 tipos terremoto/pandemia/seca/enchente c/ dano imediato + 3 escolhas cada, cooldown 21d anti-spam, action 'crise', snapshot, bots auto-resolvem) + tela toolbar (crise ativa c/ opções ou "tudo calmo", header crise.jpg). Servidor teste teste-fd473044. Smoke: dias+fundar+16 verdes.
- 2026-09-08 (ESTUDO vitórias MA3: militar 180 nações, RELIGIOSA espalhar fé pelo mundo, IDEOLÓGICA sociedade perfeita em todo país, rankings receita/exército/pop/indústria (aptoide/play). ACHADO: missionários já existiam aqui (espalhar_religiao 1AP+$300) — expandi em volta.)
- 2026-09-08 (FASE 23 — LIVE dep-dafqa6ad0e5s73dhj1pg/82c8e3f, SERVER+CLIENTE+ARTE): 🛕 templo (1AP+$200 +4 fé+2❤️) + stats.conversoes x2 + contagem no spread + bots missionários (25%/aiTurn, $$>500) + modal FÉ: labels server-key FIX, SUA FÉ (barra /60, conversões, botão templo), MISSÕES por nação c/ botão Enviar, header templo.jpg. Servidor teste teste-8301d609. Smoke: dias+fundar+16 verdes.
- 2026-09-08 (INFRA: handover/ criado (site 11 seções + files) + repo PRIVADO qwert111555777-hue/handover-presidente-online (18 arquivos) como BANCO DE DADOS permanente c/ chaves (ordem explícita, conta reserva); protocolo: todo fim de fase atualizar o banco. Link sandbox e2b não roteia p/ fora — GitHub é o canal permanente.)
- 2026-09-08 (FASE 24 — LIVE dep-dafqid9t0dsc73faaqgg/d621da5, SERVER+CLIENTE+ARTE): 🗽 DOUTRINA (toolbar: sua doutrina barra /60 + doutrinações + centro cultural 1AP+$200 +4/+2❤️, SOCIEDADE PERFEITA 7 setores c/ pips + X/7 Nv4+, DOUTRINAR por nação, header doutrina.jpg) + server: centro_cultural, stats.doutrinacoes x2 + contagem no spread, marco 'sociedade' (7 setores Nv4+), bots ideológicos 25%/aiTurn. Servidor teste teste-6ec5f96d. Smoke: dias+fundar+16 verdes.
- 2026-09-08 (ESTUDO ONU MA3: invasion resolution c/ suborno (reddit), proibição guerras/armas/embargo/invasão (aptoide/sharebie), sanction power fatores, UNSC bloqueios totais, guerra zera diplomacia (reddit).)
- 2026-09-08 (FASE 25 — LIVE dep-dafqkbn40ujc73cgnopg/b9aadde, SERVER+CLIENTE): 🇺🇳 ONU expandida: BLOQUEIO TOTAL (renda −50%/3 sem, 6º tipo, auto-sessões+atalho) + suborno em QUALQUER proposta sua + soft power (doutrina 40+ = +1 voto) + bots propõem condenar/embargo vs inimigos. Servidor teste teste-dbb402bc. Smoke: dias+fundar+16 verdes.
- 2026-09-08 (ESTUDO espionagem: covert ops intel+sabotagem (apkpure), espiões sabotam infra p/ preemptar ataques (gamekiller), atribuição oculta + relações evitam sabotagem (reddit), safety levels/counter-spies/roubo (P&W fandom).)
- 2026-09-08 (FASE 26 — LIVE dep-dafqljpt0dsc73fanof0/ed124a3, SERVER+CLIENTE): 🕵️ rede de espiões (p.espioes 1, recrutar 1AP+$150, máx 3+secreto×2, snapshot) + sabotagem sinergia (+5%/agente, captura −1) + 📡 ROUBO de tech (copia 1 Nv, risco captura) + 🔍 CAÇA-espiões (mata 1–2 agentes) + bots recrutam/sabotam. Modal spy: barra rede + recrutar + Roubar/Caçar por nação. Servidor teste teste-d1e80f9a. Smoke: dias+fundar+16 verdes.
- 2026-09-08 (ESTUDO nuclear MA3: psicologia da dissuasão — arsenal desencoraja agressão, melhor uso é não usar (modcombo), strikes devastadores c/ consequências (aptoide), deterrence-or-last-resort (bluestacks).)
- 2026-09-08 (FASE 27 — LIVE dep-dafqn3on74is73b7o8bg/72d9a0c, SERVER+CLIENTE): ☢️ dissuasão (atacar Nv3+ = −3❤️ extra) + 🧪 TESTE nuclear (Nv2+, 1AP+$300, +3❤️/−2 rel, cd 4 sem) + 🛡️ ABRIGOS (1AP+$250, absorve 1 ataque) + ❄️ INVERNO nuclear (3+ ogivas = renda global −10%/6 sem) + bots retaliam se perdendo. Modal nuke: painel dissuasão/teste/abrigo + banner inverno. Servidor teste teste-7675f364. Smoke: dias+fundar+16 verdes.
- 2026-09-08 (ESTUDO rankings MA3: vitória por ranking receita/exército/pop/indústria (aptoide/play) — aqui rankings viram PRÊMIOS recorrentes, não só vitrine.)
- 2026-09-08 (FASE 28 — LIVE dep-dafqo82d0e5s73djgd0g/3619671, SERVER+CLIENTE): 👑 PRÊMIOS SEMANAIS (6 cats: renda +$150, militar +1mil, pop +2❤️, indústria +$100, fé +2❤️, doutrina +2 + stats.titulos x2, anúncio global) + rank: cats fé/doutrina + 👑 no #1 + hint. Servidor teste teste-cc3fafcd. Smoke: dias+fundar+16 verdes.
- 2026-09-08 (AUDITORIA TOTAL pós-28: prod 200 232920 + 15 markers + 8 assets 200 + sintaxe dupla OK + 16 blocos server OK + 4 smokes verdes (novo smoke_audit.js: templo/centro/recrutar/abrigo OK, erros esperados sem crash). ACHOU 2 BUGS: (1) reset do fundar sobrescrevia stats c/ objeto antigo 5 chaves (vivia zerando anexacoes/ajuda/mandatos/conversoes/doutrinacoes/titulos p/ humanos) — FIX 11 chaves; (2) crise/lastCrisis/lastTeste vazavam entre fundações — FIX limpa no reset. Leituras cliente todas c/ ||0. Cliente sem mudanças.)
- 2026-09-08 (HOTFIX — LIVE dep-dafqqolg1s2s73foqe10/d02ed42, SERVER): stats reset 11 chaves + limpa crise/lastTeste no fundar. Servidor teste teste-d581636e. Smoke: dias+fundar+16+audit verdes.
- 2026-09-08 (ESTUDO campanhas MA3: historical campaign modes + cenários de crise travados no PRO (moddroid); eras alternativas noutro sim (fantasypresident). Nossa resposta multiplayer: ERAS + timeline persistente.)
- 2026-09-08 (FASE 29 — LIVE dep-dag8gi95efls73fij6o0/73c4011, SERVER+CLIENTE+ARTE): 📜 HISTÓRIA (toolbar: era atual X/4 + countdown + bônus, LINHA DO TEMPO 30 eventos, historia.jpg) + server: ERAS Fundação/Expansão/Potência/Lenda (56d, +$100+2❤️ p/ todos na virada, checarEra) + record() + hooks marco/eleições3/nuke2/inverno2 + era/timeline no snapshot. BUGS DO TURNO: else-if quebrado (fix imediato), AF9 fw fora de escopo derrubou teste (smoke pegou ANTES do deploy!), sandbox reiniciou (/tmp zerado, git config sumiu — smokes ganharam require c/ fallback + resilientes em dev/). Servidor teste teste-ae8e953b. Smoke: 4/4 verdes.
- 2026-09-08 (ESTUDO economia MA3: empréstimos (apkpure), set interest rates + inflation (moddroid PRO), war debts/tributos pós-guerra (gamedva).)
- 2026-09-08 (FASE 30 — LIVE dep-dag8hi95efls73fin4i0/48170f4, SERVER+CLIENTE): 🏦 crédito c/ teto ($2000 dívida, nome sujo pós-calote) + 💸 CALOTE (zera dívida: −15❤️ −15 rel, sem crédito 8 sem) + 💰 TRIBUTO (mil 2x+ extorque $300, senão −8 rel) + juros +5%/sem (teto $5000) + bots pagam dívida. Cliente: botão Calote + hint juros + botão Tributo na diplomacia. Servidor teste teste-cedb1b26. Smoke: 4/4 verdes.
- 2026-09-08 (ESTUDO dev MA3: dicas oficiais p/ ouro/recursos — pesquisas eco, especialistas, minas, leis, religião, trade, impostos, ajuda, ideologia (play PRO) — tudo existe aqui; vitória militar/ideológica/religiosa (playmods).)
- 2026-09-08 (FASE 31 — LIVE dep-dag8j0ajnfac73dselq0/afb3504, SERVER+CLIENTE): 🎯 MISSÕES 2.0: +8 (fé/doc 15, rede 3, nuke 2, abrigo, aliados 2, tech 5, título) = 18 + bots cumprem + recompensa ×era + timeline + missionIdx no snapshot + painel: 18 cards + progresso N/18 ×era. Servidor teste teste-cc5648ef. Smoke: 4/4 verdes.
- 2026-09-08 (ESTUDO espaço MA3: NADA encontrado — MA3 não tem programa espacial (busca sharebie/apple: só economia/guerra/diplomacia) — território 100% superação; aqui já havia Nv1-3, estendido p/ Nv5.
- 2026-09-08 (FASE 32 — LIVE dep-dag8msjl550s73a91910/ccab3c0, SERVER+CLIENTE): 🚀 ESPAÇO PROFUNDO: Nv4 🌙 Base Lunar ($2000) + Nv5 🌌 Escudo Planetário SDI ($3500) + renda tiers (+$30/80/130/sem) + Nv5 BLOQUEIA nukes (player+bot) + bots sobem até Nv3.
- 2026-09-08 (ESTUDO espionagem MA3 x2: serviço secreto/polícia/guarda + sabotagem/espiões (apkpure/sharebie/apple/play); modelo P&W: caçar espiões, sabotar mísseis/nukes, níveis de segurança, falhas punidas — base da Fase 33.
- 2026-09-08 (FASE 33 — LIVE dep-dag8plrl550s73a9iftg/cf5ac7c, SERVER+CLIENTE): 🕵️ ESPIONAGEM 2.0: ☢️ STUXNET sabota programa nuclear (2⚡+$400, 2+ agentes, −10 rel) + 🛡️ CONTRA-ESPIONAGEM (14 dias −25% ops inimigas: sabotagem/roubo/nuke) + bots usam ambos.
- 2026-09-08 (ESTUDO religião MA3 x2: vitória religiosa (espalhar fé pelo mundo), change religion, religião oficial (aptoide/steam/play); MA1: laws and religion — base da Fase 34.
- 2026-09-08 (FASE 34 — LIVE dep-dag8qnmk1f9s73899aug/f3d43a3, SERVER+CLIENTE): 🛐 RELIGIÃO 2.0: ⛪ DÍZIMO (fé 5+: +$fé×8, −3❤️) + 🕌 GUERRA SANTA (fé 15+, alvo outra fé: +12 mil voluntários, −15 rel alvo, +5 fiéis) + bots fiéis.
- 2026-09-08 (ESTUDO soft power MA3 x2: support/condemn states, sanções/bloqueios/ONU p/ isolar rivais sem guerra, vitória ideológica = sociedade perfeita + campanhas culturais (play/gamekiller/sharebie) — base da Fase 35.
- 2026-09-08 (FASE 35 — LIVE dep-dag8rkeq1p3s73c3p9v0/643f15c, SERVER+CLIENTE): 🗽 SOFT POWER: 📢 CONDENAR estado (−4❤️ alvo, +2 doutrina, −6 rel) + 🤝 APOIAR (+4❤️, +6 rel) + 🎪 FESTIVAL (+5 doutrina, +4❤️, +$100) + bots condenam/festejam.
- 2026-09-08 (ESTUDO saúde MA3 x2: healthcare/education = estabilidade pop + crescimento eco (modfyp), setores sociais educação/pesquisa/cultura/esportes/habitação/justiça (bluestacks/apple/play) — base da Fase 36.
- 2026-09-08 (FASE 36 — LIVE dep-dag8st8u01pc73fg01h0/5f7769b, SERVER+CLIENTE): 🏥 SAÚDE 2.0: Saúde Nv puxa natalidade (+1 pop/sem por Nv) + 💉 VACINAÇÃO (+3 pop, +6❤️, cura pandemia) + 🏥 HOSPITAL (2⚡+$500: +8 pop, +5❤️, +1 Saúde) + bots vacinam.
- 2026-09-08 (ESTUDO ciência MA3 x2: research contracts + Science/Research dept (mwm.ai), eco-tech primeiro p/ trade/produção, ministros aceleram pesquisa, especialistas (gamekiller/apkpure) — base da Fase 37.
- 2026-09-08 (FASE 37 — LIVE dep-dag8tpuq1p3s73c447b0/448ca17, SERVER+CLIENTE): 🔬 CIÊNCIA 2.0: Educação dá −4%/Nv nas techs + 🎓 UNIVERSIDADE (2⚡+$700: +1 Educação) + 7º prêmio semanal MAIOR CIÊNCIA (+15xp +$100) + bots fundam.
- 2026-09-08 (ESTUDO segurança MA3 x2: polícia/guarda/Defesa = segurança interna (apple/play), aprovação/protestos decidem tudo, cada decreto vira drama (prodroid) — base da Fase 38.
- 2026-09-08 (FASE 38 — LIVE dep-dag8uje7bikc738befug/1049e1e, SERVER+CLIENTE): 🚔 LEI & ORDEM: OPERAÇÃO POLICIAL (polícia 1+: +$150+50/Nv, +3❤️) + 🌙 TOQUE DE RECOLHER (guarda 1+: +8❤️, −2 doutrina) + Defesa −5%/Nv na sabotagem inimiga + bots policiais.
- 2026-09-08 (ESTUDO comércio MA3 x2: negociar acordos p/ melhores preços, vender excedente/comprar falta, embargos forçam paz (apkpure/reddit/play); trade p/ better prices + eco-tech (memu/apt) — base da Fase 39.
- 2026-09-08 (FASE 39 — LIVE dep-dag8vdmq1p3s73c4c9d0/0e9cb5b, SERVER+CLIENTE): 💼 COMÉRCIO 2.0: pactos dão −3%/compra e +3%/venda (máx 20%) + sancionado paga +10%/sanção + bots vendem excedente (20un) + nota no mercado.
- 2026-09-08 (ESTUDO energia MA3 x2: power plants + alternative sources, oil rigs/uranium, produção comida/ouro/ferro/óleo/urânio (sharebie/aptoide/bluestacks/mwm) — base da Fase 40.
- 2026-09-08 (FASE 40 — LIVE dep-dag904u7bikc738bktvg/ec67989, SERVER+CLIENTE): ⚡ ENERGIA 2.0: TERMELÉTRICA (1⚡+$300: +40⚡, +2 poluição) + ☀️ SOLAR (2⚡+$500: +2⚡/dia p/ sempre) + ☢️ USINA CIVIL (2⚡+$800: +60⚡, jazida/5 urânio) + bots + painel eco.
- 2026-09-08 (ESTUDO impostos MA3 x2: imposto alto = natalidade cai + povo infeliz + rating cai; baixo = pop cresce + consumo; overtax = protestos (reddit/modfyp/moddroid) — base da Fase 41.
- 2026-09-08 (FASE 41 — LIVE dep-dag910e7bikc738bohbg/31b13e7, SERVER+CLIENTE): 🧾 FISCO 2.0: imposto alto ×0.7 / baixo ×1.2 natalidade + AUDITORIA (1⚡+$200: +$100+30/eco) + INCENTIVO (1⚡+$400: +1 eco, +2❤️) + bots + botões fisco.
- 2026-09-08 (ESTUDO ministros MA3 x2: ministros defesa/finanças/interior com bônus passivos, cabinet = tax/research (puremods/gamekiller/aptoide); ministérios educação/infra com trackers (mwm) — base da Fase 42.
- 2026-09-08 (FASE 42 — LIVE dep-dag91qm7bikc738brfqg/f108275, SERVER+CLIENTE): 💼 GABINETE 2.0: Falcão +10% ataque / Estrategista +10% defesa AGORA funcionam em batalha + 4º ministro CULTURALISTA (festival −50%, +1 doutrina/sem) + bots contratam gabinete.
- 2026-09-08 (ESTUDO eventos MA3 x2: sediar Copa/Olimpíadas/festivais = moral + prestígio global, Ministério Turismo + marcos famosos = visitantes + receita (mumuplayer MA2/updatestar); investir em setores sociais (apkpure) — base da Fase 43.
- 2026-09-08 (FASE 43 — LIVE dep-dag92hf40ujc73a36ibg/0a4c318, SERVER+CLIENTE): 🏟️ EVENTOS & TURISMO: OLIMPÍADA (esportes 2+, 2⚡+$1000: +10❤️, +5 doutrina, +$300) + MARCO TURÍSTICO (2⚡+$700: +1 Turismo) + Turismo rende +$15/Nv/sem + bots anfitriões.
- 2026-09-08 (MEGA-ESTUDO 100x: 5 frentes — housing/justice/crises/elections/provinces: MA1 separatismo/anexação, crises = riots/desastres/colapsos/escândalos (moddroid/ipaomtk), eleições = opinião pública (modfyp), bem-estar = reeleição (androidprog) — base das Fases 44+.
- 2026-09-08 (FASE 44 — LIVE dep-dag965rl550s73abgvdg/146fb53, SERVER+CLIENTE): 🏠 HABITAÇÃO: Nv3+ dá +1❤️/sem + CONJUNTO (2⚡+$600: +1 Hab, +5 pop, +4❤️) + ALUGUEL SOCIAL (Hab 1+, 1⚡+$200: +2 pop, +5❤️) + bots constroem.
- 2026-09-08 (ESTUDO justiça 100x: monitor rating p/ evitar riots/protests/revolutions, Ministry Justice+Police = ordem, FACE pirate/terror/disasters/epidemics/protests (MA2 play/mumu); courts+roads matter (bluestacks) — base da Fase 45.
- 2026-09-08 (FASE 45 — LIVE dep-dag96qgu01pc73fhjiu0/c07314d, SERVER+CLIENTE): ⚖️ JUSTIÇA: Nv2+ barra golpes (15%/Nv) + TRIBUNAL (2⚡+$600: +1 Just, +$150, +3❤️) + LAVA JATO (Just 2+, 1⚡+$250: +$200+50/Nv, +4❤️) + bots juízes.
- 2026-09-08 (ESTUDO crises 100x: cenários travados riots/desastres/colapsos (moddroid), escândalos/políticos (ipaomtk), piratas/terror/epidemias/recessões (mumu MA2), protestos/manifestações (MA2 play) — base da Fase 46.
- 2026-09-08 (FASE 46 — LIVE dep-dag97lrl550s73abo04g/c5bb8c0, SERVER+CLIENTE): 🚨 CRISES 2.0: +🔥 MOTIM (negociar/reprimir/ignorar) +🤬 ESCÂNDALO (pronunciamento/CPI/ignorar) = 6 crises + bots RESOLVEM crises sozinhos (antes travavam).
- 2026-09-08 (ESTUDO eleições 100x: election cycles = opinião pública + partido vence (moddroid), bem-estar = reeleição 2º mandato (androidprog), campanhas/doações/votos (hiddenlake President) — base da Fase 47.
- 2026-09-08 (FASE 47 — LIVE dep-dag98nqd0e5s73agi2pg/cbf8b40, SERVER+CLIENTE): 🗳️ ELEIÇÕES 2.0: bots TAMBÉM sofrem eleição (+mandatos/recompensas/derrotas) + COMÍCIO (1⚡+$100: +4❤️, +$50) + DEBATE (2⚡: 50% +10❤️ / −5❤️) + bots campanham.
- 2026-09-08 (ESTUDO províncias 100x: MA1 — lutar contra o separatismo nos territórios conquistados (moddroid); MA3 — migração, direitos de cidadania, anexação de outros países (senior-game-leader); MA2 — administrar países anexados: libertar/matar líderes/baixar impostos (reddit) — base da Fase 48.
- 2026-09-08 (FASE 48 — LIVE dep-dag99j8u01pc73fi2ft0/1fb8d42, SERVER+CLIENTE): 🗺️ PROVÍNCIAS 2.0: PACIFICAR (1⚡+$200: +1 infra instantânea na mais fraca +2❤️) + CENSO (1⚡+$100: +2 pop +$50) + bots ANEXAM bots (rel≥85) + bots pacificam.
- 2026-09-08 (ESTUDO militar 100x: MA3 — serviço militar obrigatório, organizações paramilitares, drones, campos minados, força aérea/mísseis/defesa (senior-game-leader); MA1 — desenvolver exército (moddroid) — base da Fase 49.
- 2026-09-08 (FASE 49 — LIVE dep-dag9ageq1p3s73c60og0/b7264e9, SERVER+CLIENTE): 🪖 MILITAR 2.0: ALISTAMENTO (1⚡+$0: +2 militar, −6❤️) + MILÍCIA (1⚡+$200: +2 militar, −2❤️) + bots militarizam. FIX: gate pop<5 removido (pop inicial=0 bloqueava).
- 2026-09-08 (ESTUDO economia 100x: MA3 — emitir títulos do governo, privatizar/nacionalizar, empréstimos, FMI/austeridade, bolsa de valores (senior-game-leader/reddit); MA2 — recessões econômicas (mumuplayer) — base da Fase 50.
- 2026-09-08 (FASE 50 — LIVE dep-dag9b3jl550s73ac6ac0/3be4c13, SERVER+CLIENTE): 💰 ECONOMIA 2.0: EMPRÉSTIMO FMI (1⚡+$0: +$1500, +1 eco, −8❤️) + PRIVATIZAR (1⚡+$0: +$800, +1 eco, −3❤️) + bots em apuros pegam bailout.
- 2026-09-08 (ESTUDO religião 100x: MA3 — religiões oficiais, teocracia, turismo religioso, feriados religiosos, líderes religiosos (senior-game-leader/reddit); MA1 — templos/ordens (moddroid) — base da Fase 51.
- 2026-09-08 (FASE 51 — LIVE dep-dag9boeq1p3s73c665vg/667c088, SERVER+CLIENTE): ⛪ RELIGIÃO 2.0: PEREGRINAÇÃO (1⚡+$150: +3 fé, +$150, +2❤️) + CONCORDATA (1⚡+$300: +2 fé, +8❤️ teocracia/+3❤️ laico) + bots teocráticos erguem templos.
- 2026-09-08 (ESTUDO diplomacia 100x: MA3 — visitas de estado, intercâmbios culturais/estudantis, cúpulas, embaixadas, presentes diplomáticos (senior-game-leader/reddit); MA1 — melhorar relações bilaterais (moddroid) — base da Fase 52.
- 2026-09-08 (FASE 52 — LIVE dep-dag9cbid0e5s73ah2b0g/8dbc425, SERVER+CLIENTE): 🤝 DIPLOMACIA 2.0: VISITA DE ESTADO (1⚡+$300 alvo: +15 rel, +2❤️) + INTERCÂMBIO (1⚡+$200 alvo: +10 rel, +1 eco) + bots presentiam melhor amigo.
- 2026-09-08 (ESTUDO esporte/mídia 100x: MA3 — sediar olimpíadas/copas, TV estatal, propaganda midiática, turismo esportivo (senior-game-leader/reddit); MA2 — festivais nacionais (mumuplayer) — base da Fase 53.
- 2026-09-08 (FASE 53 — LIVE dep-dag9dbuq1p3s73c6dfng/6469626, SERVER+CLIENTE): 🏟️ ESPORTE & MÍDIA: COPA NACIONAL (Esp1+, 2⚡+$600: +8❤️, +$300, +3 doutrina) + TV ESTATAL (1⚡+$400: +5❤️, +3 doutrina) + bots festejam.
- 2026-09-08 (ESTUDO leis/governo 100x real: MA2 Steam — aprovar novas leis, ideologia, religião, empréstimos banco central, ministérios (play.google.com); MA3 Steam — contratar ministros, formar governo, ONU: proibição de guerras/embargos/resoluções; Democracy 3 — capital político de ministros leais, dilemas/eventos (fandom) — base da Fase 54.
- 2026-09-08 (FASE 54 — LIVE dep-dag9f115efls73a0gtk0/9d45aa4, SERVER+CLIENTE): 📜 LEIS 2.0: ENSINO OBRIGATÓRIO ($200: +2❤️+1 ciência) + SAÚDE UNIVERSAL ($250: +3❤️+2 pop) + CÓDIGO FLORESTAL ($150: +1 eco) + bots legislam.
- 2026-09-08 (ESTUDO guerra 100x real: MA2 Steam/Play — infantaria, artilharia, blindados, tanques, helicópteros, bombardeiros, submarinos, navios; treinar soldados, experiência em batalhas, quartéis/arsenais/aeródromos/hangares/estaleiros; MA3 Steam — treinar tropas, instalações militares — base da Fase 55.
- 2026-09-08 (FASE 55 — LIVE dep-dag9foh5efls73a0jd40/d7afc45, SERVER+CLIENTE): 🎖️ RAMOS 2.0: FUZILEIROS NAVAIS ($350) + DEFESA AÉREA ($450), 9 ramos total + bots constroem unidades + fix init units.
- 2026-09-08 (ESTUDO ONU 100x real: MA3 Steam — votos ONU: proibição de guerras, produção de armas, embargo de armas, resoluções de invasão, bloqueios navais, sanções; MA2 Play — embargo de armas/proibições/bloqueios/invasões — base da Fase 56.
- 2026-09-08 (FASE 56 — LIVE dep-dag9hj6q1p3s73c6vrrg/a08e4a0, SERVER+CLIENTE): 🇺🇳 ONU 2.0: EMBARGO DE ARMAS (alvo sem unidades 3 turnos) + AJUDA HUMANITÁRIA (alvo +$500+5❤️), 8 resoluções + FIX: bots votam SIM em resoluções positivas (antes sempre NÃO).
- 2026-09-08 (ESTUDO comércio 100x real: MA3 Steam — negociar com países por melhores preços, corredores comerciais, acordos comerciais, pesquisar tecnologias econômicas; MA2 Play — emprestar com juros, negociar bens/recursos — base da Fase 57.
- 2026-09-08 (FASE 57 — LIVE dep-dag9iduq1p3s73c73fn0/9d0034f, SERVER+CLIENTE): 🚢 COMÉRCIO 2.0: FEIRA INTERNACIONAL (1⚡+$200: +$100+75/acordo) + SUBSÍDIO EXPORTAÇÃO (1⚡+$300: +25% vendas 3 turnos) + bots feiram.
- 2026-09-08 (ESTUDO turismo 100x real: MA2 AppStore/mumuplayer/amazon — Ministério do Turismo, maravilhas (Torre Eiffel, Coliseu, Big Ben, Estátua da Liberdade), Copa do Mundo FIFA, festivais de cinema; organizações internacionais (Interpol/FMI/OMC); subornar votos ONU — base da Fase 58.
- 2026-09-08 (FASE 58 — LIVE dep-dag9j88u01pc73fjkvug/daeefe5, SERVER+CLIENTE): 🗽 TURISMO 2.0: 4 MARAVILHAS (Tur Nv2+, 2⚡+$1200: +$400+5❤️+5 doutrina+$50/sem cada) + FESTIVAL DE CINEMA (1⚡+$250) + bots turísticos.
- 2026-09-08 (ESTUDO saúde 100x real: MA2 AppStore — saúde dos cidadãos: policlínicas, hospitais, vacinas, combate ao câncer; superar epidemias/pandemias; MA2 mumu — Ministério da Saúde resiliente a surtos — base da Fase 59. NOTA: "subornar votos ONU" do estudo JÁ existia (subornar vira metade dos NÃO).
- 2026-09-08 (FASE 59 — LIVE dep-dag9k4qjnfac73fehfm0/a0854c6, SERVER+CLIENTE): 🏥 SAÚDE 2.0: POLICLÍNICA (1⚡+$300: +4 pop+3❤️) + COMBATE AO CÂNCER (2⚡+$600: +5 pop+6❤️+1 ciência) + bots curam pandemia.
- 2026-09-08 (ESTUDO organizações 100x real: MA2 AppStore — liderar organizações internacionais: Interpol, FMI, OMC; MA2 reviews — custo de entrar em organizações; nomear comandantes (marinha/polícia/esporte/cultura/defesa) — base da Fase 60.
- 2026-09-08 (FASE 60 — LIVE dep-dag9kqmq1p3s73c7dt80/b128d5f, SERVER+CLIENTE): 🌐 ORGANIZAÇÕES: INTERPOL (1⚡+$400: sabotagem contra você −15%) + FMI (+$500 no empréstimo) + OMC (+10% vendas) + bots aderem.
- 2026-09-08 (ESTUDO piratas/terror 100x real: MA2 amazon/mumu — "traga disciplina ao mundo; resolva piratas e terroristas de uma vez"; ataques piratas/terroristas, desastres, crises imprevisíveis; MA2 AppStore — derrote piratas/terroristas — base da Fase 61.
- 2026-09-08 (FASE 61 — LIVE dep-dag9lq2jnfac73fenv4g/a709d93, SERVER+CLIENTE): 🏴‍☠️ CRISES 3.0: PIRATAS (resgate/operação naval/ignorar) + TERRORISTAS (op. especial/negociar/ignorar), 8 crises, switch 18, bots resolvem.
- 2026-09-08 (ESTUDO empréstimos 100x real: MA3 soft112 — "issue and repay loans" (emitir e quitar empréstimos); MA2 Play — emprestar com juros, banco central, pedir ajuda; MA1 AppStore — ministérios/polícia/segurança — base da Fase 62.
- 2026-09-08 (FASE 62 — LIVE dep-dag9mgajnfac73feq480/7a7768a, SERVER+CLIENTE): 💸 EMPRÉSTIMOS: EMPRESTAR (1⚡+$1000 alvo: volta $1200 em 28d, cobrança automática, CALOTE −10 rel) + PERDOAR (1⚡: +15 rel) + bots emprestam a amigos pobres.
- 2026-09-08 (ESTUDO doações/soberania 100x real: MA2 Play — "donate territories" (doar territórios), "support sovereignty" (apoiar soberania), pedir/oferecer ajuda; ajuda humanitária em desastres — base da Fase 63.
- 2026-09-08 (FASE 63 — LIVE dep-dag9n7rl550s73adq070/4df571e, SERVER+CLIENTE): 🎁 DIPLOMACIA 3.0: DOAR PROVÍNCIA (1⚡: +20 rel, req 2+) + AJUDA CRISE (1⚡+$300 alvo em crise) + APOIAR SOBERANIA (1⚡+$200) + bots ajudam amigos em crise.
- 2026-09-08 (ESTUDO veteranos 100x real: MA2 mumu/Steam — soldados ganham experiência em combate, condecorações, paradas militares, prestígio nacional; veteranos de guerra — base da Fase 64.
- 2026-09-08 (FASE 64 — LIVE dep-dag9ntijnfac73feufrg/2cd87a9, SERVER+CLIENTE): 🎖️ VETERANOS: CONDECORAR (req 1 vitória, 1⚡+$200: +1 mil+3❤️) + PARADA MILITAR (1⚡+$300: +5❤️+2 doutrina+3XP) + bots condecoram.
- 2026-09-08 (ESTUDO pesquisa 100x real: MA2 amazon/Steam — "trade and research agreements" (acordos comerciais e de pesquisa), pesquisar tecnologias econômicas/militares, Ministério da Educação impulsiona progresso tecnológico — base da Fase 65.
- 2026-09-08 (FASE 65 — LIVE dep-dag9ogeq1p3s73c7tok0/e116a03, SERVER+CLIENTE): 🔬 PESQUISA: ACORDO (1⚡+$300 alvo: +1 ciência cada, +8 rel) + BOLSAS (1⚡+$400: +2 ciência+1 eco) + bots pesquisam.
- 2026-09-08 (ESTUDO achievements/vitórias 100x real: MA2 exophase — Polo Geopolítico (todas as orgs), Capitalista ($15M), Coronel (100 batalhas), Missionário/Propagandista (mundo); MA3 mwm/aptoide — vitórias militar/religiosa/ideológica + rankings #1 receita/exército/pop/indústria — base da Fase 66.
- 2026-09-08 (FASE 66 — LIVE dep-dag9quuq1p3s73c888p0/27925be, SERVER+CLIENTE): 🏆 MISSÕES 2.0: POLO GEOPOLÍTICO (3 orgs, $800) + MARAVILHA ($700) + CORONEL (5 vitórias, $1000) + CAPITALISTA ($15k, $800). 22 missões no pool.
- 2026-09-08 (ESTUDO comandantes 100x real: MA2 updatestar — "appoint ministers and commanders: navy, police, sports, culture, defense"; MA2 AppStore — comandantes + ministros; Strong Hierarchy (todos os assentos) — base da Fase 67.
- 2026-09-08 (FASE 67 — LIVE dep-dag9rheq1p3s73c8b6ng/d6dc1fc, SERVER+CLIENTE): 🎖️ COMANDANTES: 5 postos (1⚡+$300 cada: Marinha +1 frota, Polícia escudo 7d, Esportes +4❤️, Cultura +4 doutrina, Defesa +1 mil) + bots nomeiam.
- 2026-09-08 (ESTUDO crises energia/trabalho 100x real: MA2 mumu — crises imprevisíveis, desastres naturais, agitação civil; MA2 Play — protestos, manifestações, recessões; energia (nuclear/hidro/alternativa) — base da Fase 68.
- 2026-09-08 (FASE 68 — LIVE dep-dag9s8ek1f9s738cifng/f3ca2a3, SERVER+CLIENTE): 🚨 CRISES 4.0: APAGÃO (importar/racionar/ignorar) + GREVE GERAL (negociar/cortar/ignorar), 10 crises, switch 20, bots resolvem.
- 2026-09-08 (ESTUDO comida 100x real: MA2 updatestar/Play — bens (carne/frutas/legumes/pão/doces/fast-food), Well-Fed Society (superávit alimentar), Merchant (comprar bens); fazendas/padarias/estufas — base da Fase 69.
- 2026-09-08 (FASE 69 — LIVE dep-dag9t2740ujc73a6d6ng/48ae5d8, SERVER+CLIENTE): 🌾 COMIDA 2.0: FEIRAS LIVRES (1⚡+$150: +2 pop+2❤️+$50) + CESTAS BÁSICAS (1⚡+$200: +3 pop+4❤️) + bots importam comida.
- 2026-09-08 (ESTUDO Conselho Segurança 100x real: MA2 exophase — "Strong Position: Become a permanent member of the UN Security Council"; MA2 updatestar — propor resoluções na ONU E no Conselho de Segurança, subornar votos — base da Fase 70.
- 2026-09-08 (FASE 70 — LIVE dep-dag9tvek1f9s738cntu0/ba35570, SERVER+CLIENTE): 🛡️ CONSELHO DE SEGURANÇA: ENTRAR (2⚡+$800, máx 5: +1 voto ONU) + VETAR (1⚡: derruba resolução) + bots entram.
- 2026-09-08 (ESTUDO espaço 100x real: MA3 mwm — colonização espacial, colonizar Marte (custos, treino, viagem, exploração); departamento Ciência e Pesquisa; gestão de vassalos — base da Fase 71.
- 2026-09-08 (FASE 71 — LIVE dep-dag9uluq1p3s73c8nf5g/ac8c78d, SERVER+CLIENTE): 🚀 ESPAÇO 2.0: SATÉLITE (2⚡+$600: +2 ciência+3 doutrina+2❤️) + MISSÃO A MARTE (req 3 ciência, 1⚡+$1500: +8❤️+8 doutrina+3 ciência+10XP) + bots lançam.
- 2026-09-08 (ESTUDO segurança interna 100x real: MA3 lifesimulator/soft112 — Ministério da Defesa, serviço secreto, polícia, Guarda Nacional; segurança e proteção interna; MA2 — financiar polícia/guarda/defesa — base da Fase 72.
- 2026-09-08 (FASE 72 — LIVE dep-dag9v9740ujc73a6kqsg/e70c141, SERVER+CLIENTE): 🚔 POLÍCIA 2.0: PATRULHAS (Pol Nv1+, 1⚡+$200: +3❤️+1 pop) + OPERAÇÃO POLICIAL (2⚡+$400: +$300+$2❤️) + bots patrulham.
- 2026-09-08 (ESTUDO rankings 100x real: MA3 mwm/aptoide/moddroid — "take first places in the world by revenue, army power, population, industrial development"; MA3 lifesimulator — vitória suprema por rankings — base da Fase 73.
- 2026-09-08 (FASE 73 — LIVE dep-daga07uq1p3s73c8t4ug/cbbdced, SERVER): 🏆 RANKINGS 2.0: +3 categorias semanais: MAIOR RIQUEZA (+$150) + MAIS PROVÍNCIAS (+1 infra) + MELHOR DIPLOMACIA (+2❤️). 10 categorias.
- 2026-09-08 (ESTUDO cultura 100x real: MA3 — cultura/esportes/qualidade de vida/prestígio nacional; MA2 mumu — Ministério da Cultura e Esportes, programas culturais, marcos culturais locais; MA2 — festivais de cinema — base da Fase 74.
- 2026-09-08 (FASE 74 — LIVE dep-daga0qmq1p3s73c92130/35030e4, SERVER+CLIENTE): 🎭 CULTURA 2.0: MUSEU (1⚡+$300: +3 doutrina+$100+2❤️) + BIBLIOTECA (1⚡+$250: +1 ciência+2❤️) + bots culturam.
- 2026-09-08 (ESTUDO províncias 100x real: MA3/aptoide — expandir território, anexar estados, conceder independência; MA2 mumu — desenvolvimento de províncias — base da Fase 75.
- 2026-09-08 (FASE 75 — LIVE dep-daga21m1egvs739rf3h0/12506e6, SERVER+CLIENTE): 🏘️ PROVÍNCIAS 2.0: FUNDAR (2⚡+$1000: +1 província, máx 6) + VENDER (1⚡: +$300+100×infra da mais fraca, req 2+) + bots vendem se pobres. Cadeia 3AP validada.
- 2026-09-08 (ESTUDO esportes 100x real: MA2 oficial Play Store — "hold concerts, film festivals, carnivals, the Davis Cup, FIFA World Cup, Olympic Games" + Ministério do Turismo; MA3 aptoide — vitórias por rankings — base da Fase 76.
- 2026-09-08 (FASE 76 — LIVE dep-dagabl6k1f9s73dgau6g/d0ca555, SERVER+CLIENTE): ⚽🎾 ESPORTES 2.0: DAVIS (1⚡+$400: +3❤️+$200+2 doutrina) + COPA DO MUNDO FIFA (Esp2, 2⚡+$1200: +6❤️+$800+6 doutrina) + bots sediam Davis. 2 smokes verdes.
- 2026-09-08 (ESTUDO festas 100x real: MA1 pgyer — "hold concerts, carnivals, host the FIFA World Cup"; MA2 Steam/mumu — "concerts, film festivals, carnivals", Ministério da Cultura e Esportes/prestígio — base da Fase 77.
- 2026-09-08 (FASE 77 — LIVE dep-dagaca61egvs739t0fng/15215b9, SERVER+CLIENTE): 🎪 FESTAS 2.0: CONCERTO (1⚡+$300: +6❤️+$150, 1/turno) + CARNAVAL (2⚡+$700: +10❤️+$400+2 doutrina) + bots festejam.
- 2026-09-08 (ESTUDO finanças 100x real: MA3 oficial Play Store — "impose taxes, issue and repay loans"; MA2 ZA — "take loans at the central bank and lend money with interest"; MA3 modfyp — crises econômicas/inflação — base da Fase 78.
- 2026-09-08 (FASE 78 — LIVE dep-dagad52jnfac73ajifjg/d1d7ce9, SERVER+CLIENTE): 🏦 BANCO 2.0: `emprestimo_banco` resgatado de dead code (0⚡: +$600, +$720 dívida, travas) + linha Banco no governo (mostra dívida, Pagar 0⚡) + bots tomam crédito se pobres.
- 2026-09-08 (ESTUDO turismo 100x real: MA2 mumu/Steam — Ministério do Turismo "world tourism hub, attracting millions of tourists", maravilhas Eiffel/Coliseu/Big Ben/Liberdade; MA2 ZA — hotéis/turismo — base da Fase 79.
- 2026-09-08 (FASE 79 — LIVE dep-dagae0gu01pc738oru40/0caaac5, SERVER+CLIENTE): 🏖️ TURISMO 2.0: HOTEL (1⚡+$400: +$250+2❤️) + RESORT (Tur1, 2⚡+$800: +$500+4❤️+1 Turismo) + bots hoteleiros. Cadeia 4AP validada.
- 2026-09-08 (ESTUDO ministros 100x real: MA2 Apple/pgyer/mwm — "Appoint ministers and commanders: navy, police, sports, culture, defense"; MA3 Apple/Play — poderes da ONU (proibir guerras/embargo armas/invasão/apoiar/condenar/bloqueio) — base da Fase 80.
- 2026-09-08 (FASE 80 MILESTONE — LIVE dep-dagaf83l550s73am9jd0/69672f3, SERVER+CLIENTE): 💼 REFORMA MINISTERIAL: 4ª pasta CULTURA/ESPORTES (Artista +1❤️/turno, Atleta +5% renda, Mecenas +1⚖️/dia) + 3 hooks + bots nomeiam + conquista Governo Completo 3→4 pastas.
- 2026-09-08 (ESTUDO leis 100x real: MA2 dev-resposta Apple — "pass Economic laws, hire specialists"; MA2 Apple US — banco central/emprestar com juros/bens; MA3 Apple/aptoide — ministérios/economia/tecnologias — base da Fase 81.
- 2026-09-08 (FASE 81 — LIVE dep-dagag33l550s73amfbc0/be121c1, SERVER+CLIENTE): 📜 LEIS 2.0: ZONA FRANCA ($300: +$20/sem) + BOLSA FAMÍLIA ($250: +4❤️+1 pop) + hooks. Bots aprovam genericamente.
- 2026-09-08 (ESTUDO especialistas 100x real: MA2 dev-resposta Apple US — "hire specialists, build gold mines"; MA3 Apple/aptoide — economia/ministérios/recursos — base da Fase 82.
- 2026-09-08 (FASE 82 — LIVE dep-dagagpou01pc738patrg/5ff6af0, SERVER+CLIENTE): 🧑‍💼 ESPECIALISTAS: ECO (1⚡+$500: +2 eco+1❤️) + MIL (1⚡+$500: +2 mil+1❤️) + bots contratam.
- 2026-09-08 (ESTUDO bens 100x real: MA2 oficial PRO/gplay — "Trade goods and resources: meat, fruits, vegetables, bread, sweets, fast food"; energia hidro/verde já saturada no jogo — base da Fase 83.
- 2026-09-08 (FASE 83 — LIVE dep-dagaiauk1f9s73dh72o0/a782eb0, SERVER+CLIENTE): 🍖 CARNE (9º bem, $11): market+rec+floorRec+gado produz+nomes/ícones. Bots negociam genericamente.
- 2026-09-08 (ESTUDO orgs 100x real: MA2 updatestar — "Take leadership in Interpol/IMF/WTO"; MA3 aptoide/Apple/gplay — vitórias militar/religiosa/ideológica/rankings — base da Fase 84.
- 2026-09-08 (FASE 84 — LIVE dep-dagaj6e1egvs739u29r0/38bde19, SERVER+CLIENTE): 🏛️ LIDERANÇA EM ORGS: liderar_org (2⚡+$800, score por org, contestável) + $150/sem ao líder + bots disputam + orgs no state.
- 2026-09-08 (ESTUDO energia 100x real: MA3 mwm — vassalos/envio de tropas/contratos; MA2/MA3 — energia/apagões; enviar_tropas e acordos já existem no jogo — base da Fase 85.
- 2026-09-08 (FASE 85 — LIVE dep-dagajvpt0dsc73cbdbqg/eb5ede6, SERVER+CLIENTE): ⚡ ENERGIA EMERGENCIAL: GERADOR (1⚡+$300: +40⚡) + RACIONAMENTO (1⚡: −50% consumo 7d, −2❤️) + hook needEn. Bots já se salvam (L1172).
- 2026-09-08 (ESTUDO educação 100x real: Reddit Age of Modernity — "fully fund ministry of education then research and science"; MA3 soft112 — educação/infraestrutura/ciência; natalidade fiscal já existia — base da Fase 86.
- 2026-09-08 (FASE 86 — LIVE dep-dagaknnqj5pc738a1dg0/0ae2b4d, SERVER+CLIENTE): 🎓 EDUCAÇÃO 2.0: ESCOLA TÉCNICA (1⚡+$350: +1 ciência+3❤️+1 eco) + ALFABETIZAÇÃO (1⚡+$250: +5❤️+2 pop) + bots educam.
- 2026-09-08 (ESTUDO militar 100x real: MA1 oficial gplay/Apple — campanhas militares, frotas/unidades, enviar tropas; enviar_tropas e parada já existiam — base da Fase 87.
- 2026-09-08 (FASE 87 — LIVE dep-dagaljuq1p3s73b84go0/f618c76, SERVER+CLIENTE): 🪖 EXERCÍCIOS: NAVAL (1⚡+$400: +1 mil+2❤️+3 XP) + CONJUNTO (2⚡+$600: +2 mil+4 XP+5 rel aliados) + bots treinam.
- 2026-09-08 (ESTUDO crises 100x real: MA2 playmods/updatestar — eventos internos (comícios/manifestações/passeatas), downturns econômicos, soft-vs-ditador; MA1 oficial — campanhas/frotas — base da Fase 88.
- 2026-09-08 (FASE 88 — LIVE dep-dagavbtbedkc73fqecf0/e39d414, SERVER+CLIENTE): 🚨 CRISES 2.0: MANIFESTAÇÃO (negociar/dispersar/ignorar) + RECESSÃO (pacote/austeridade/ignorar). 12 crises, switch 22. Bots ajudam genericamente.
- 2026-09-08 (INFRA entre turnos): snapshots excluem .git/config+remotes, identity, node_modules e processos — restaurados via Render API + GH_TOKEN (dep-dagauu3l550s73bb7v00 foi deploy falso de código antigo, ignorar).
- 2026-09-08 (ESTUDO pós-conquista 100x real: MA2 mwm UX — "Post-Conquest Policies: Plunder Province, Intimidate"; MA3 soft112 — vitórias/desenvolvimento — base da Fase 89.
- 2026-09-08 (FASE 89 — LIVE dep-dagb0a1t0dsc73cdh7i0/cd835b2, SERVER+CLIENTE): 🏴 PÓS-CONQUISTA: SAQUEAR (1⚡: +$150+50×infra, −1 infra, −3❤️, req 2 prov) + INTIMIDAR (1⚡+$100: +3❤️+$100, −3 rel) + bots intimidam. Cadeia 4AP validada.
- 2026-09-08 (ESTUDO leis 100x real: gplay MA2 — "Enact new laws / Issue laws"; apkpure — maravilhas/eventos globais; memu/sharebie MA3 diplomacia/ONU — base da Fase 90.
- 2026-09-08 (FASE 90 — LIVE dep-dagb10tbedkc73fqnimg/17812b6, SERVER+CLIENTE): ⚖️ LEIS: ECONÔMICA (1⚡+$200: +1eco+$250−2❤️) + SOCIAL (1⚡+$200: +5❤️) + bots sociais. Cadeia 2AP validada.
- 2026-09-08 (ESTUDO seguranca 100x real: MA2 — "Defend against pirate and terrorist attacks / Manage Pirates and Terrorists" (mumuplayer/modcombo/happymod); MA3 — crises + ministerios (memu/prodroid) — base da Fase 91.
- 2026-09-08 (FASE 91 — LIVE dep-dagb1kht0dsc73cdmlv0/528d5f0, SERVER+CLIENTE): ☠️ SEGURANÇA: CAÇAR PIRATAS (1⚡+$150: +$200+2❤️) + ANTITERROR (1⚡+$250: +4❤️+$100) + bots caçam. Cadeia 2AP validada.
- 2026-09-08 (ESTUDO lote1 100x real: Steam MA2 — "Davis Cup, FIFA, Olympics, concerts, carnivals"; mumuplayer — ministérios/impostos/empréstimos; modcombo — banco central/ministros; gplay MA3 — "impose taxes, issue and repay loans", polícia/Guarda Nacional — base das Fases 92-98.
- 2026-09-08 (FASES 92-98 — LIVE dep-dagbnr8u01pc73drhg10/632be82, SERVER+CLIENTE): 92 🏟️ Olimpíadas+vila | 93 🗳️ Campanha+eleições | 94 🛡️ Guarda+PF | 95 💸 Impostos ± | 96 🕊️ Desarmamento+ONU | 97 🏦 Banco+juros | 98 🤝 Separatistas (acordo/força) + 7 bots. Smoke lote1 7/7 + regressão verdes.
- 2026-09-08 (ESTUDO lote2 100x real: Apple MA2 — "catch enemy spies", "Appoint ministers and commanders", maravilhas Eiffel/Colosseu/BigBen/Estatua; apkpure — sanções/tratados; aptoide/mwm MA3 — vitórias religiosa/ideológica; gplay MA3 full — base das Fases 99-105.
- 2026-09-08 (FASES 99-105 — LIVE dep-dagbp0ht0dsc73ch4prg/bff780b, SERVER+CLIENTE): 99 🛃 Sanções+tarifas | 100 🕵️ Espiões (fundos/prisão) | 101 🦠 Quarentena+auxílio | 102 ⭐ General+almirante | 103 🏛️ Ministros saúde/educação | 104 🗼 Eiffel+BigBen | 105 🏟️ Colosseu+Estátua + 7 bots. Smoke lote2 7/7 + regressão verdes.
- 2026-09-08 (ESTUDO lote3 100x real: modyster/oxiwyle MA2 — "Choose the official religion and ideology of your state"; aptoide MA3 — economia/governança/ministros/vitórias; lifesim MA3 — ratings+iOS; gplay MA3 — base das Fases 106-112.
- 2026-09-08 (FASES 106-112 — LIVE dep-dagbpu9t0dsc73chddb0/1007c67, SERVER+CLIENTE): 106 ⛪ Missão+santuário | 107 🌍 Defesa civil+ajuda humanitária | 108 ✈️ Turismo+vistos | 109 📰 Censura+jornal | 110 🤝 Tratado+DMZ | 111 🗳️ Plebiscito+referendo | 112 🧱 Fronteiras (fechar+patrulha) + 7 bots. Smoke lote3 7/7 + regressão verdes.
- 2026-09-08 (ESTUDO PROFUNDO lote4: gplay PC MA2 MAIN FEATURES — "tanks, helicopters, bombers, submarines", "stage coups", "artillery and aviation strikes"; Apple MA2 — hidroelétricas/energia alternativa, vacinas, suborno de votos ONU; oxiwyle oficial; aptoide MA3 — ouro/ferro/óleo/urânio; updatestar/softonic — base das Fases 113-119.
- 2026-09-08 (FASES 113-119 — LIVE dep-dagbs1qjnfac739i3nj0/0c603bd, SERVER+CLIENTE): 113 🚁 Helis+tanques | 114 ⚖️ Lei marcial+antigolpe | 115 ⚡ Hidro+eólica | 116 ⛏️ Ouro+urânio | 117 🚂 Ferrovia+porto | 118 🤝 Greves (acordo/força) | 119 📡 Radar+escudo + 7 bots. Smoke lote4 7/7 + regressão verdes.
- 2026-09-08 (ESTUDO lote5: mwm MA2 — "bribing votes"; reddit UNSC — "Invasion Resolution", "total blockades"; gplay MA2 — "bribe votes during voting"; gamekiller MA3 — ministros/sabotagem; getmodsapk — "Create a constitution", aeroportos/portos; updatestar PRO — base das Fases 120-126.
- 2026-09-08 (FASES 120-126 — LIVE dep-dagbtjlbedkc73bj3aqg/d461e25, SERVER+CLIENTE): 120 💵 Doar+influência | 121 🇺🇳 Veto+resolução ONU | 122 🛢️ Poço+refinaria | 123 🧱 Muro+alfândega | 124 💥 Artilharia+bombardeiros | 125 ✂️ Corte+congelar | 126 🚢 Fragata+embargo + 7 bots. Smoke lote5 7/7 + regressão verdes.
- 2026-09-08 (ESTUDO lote6: modyster MA2 — "Impose your religion and ideology"; MA1 soft112 — ideologias/religiões, "airfields, arsenals, barracks, shipyards", padarias/minas; modyolo — qualidade de vida/produção; memu MA3; Steam MA3; gamekiller MA3 tips — base das Fases 127-133.
- 2026-09-08 (FASES 127-133 — LIVE dep-dagbusmk1f9s73aoan6g/4ee8d03, SERVER+CLIENTE): 127 📜 Constituição+emenda | 128 ✈️ Aeroporto+arsenal | 129 💡 Impor+exportar ideologia | 130 💊 Drogas+reabilitação | 131 🏟️ Estádio+ginásio | 132 🪓 Serraria+madeireira | 133 🚇 Metrô+trem-bala + 7 bots. Smoke lote6 7/7 + regressão verdes.
- 2026-09-08 (ESTUDO lote7: modyolo MA2 full — governo forte/qualidade de vida/tratados/produção de alimentos; memu+soft112 MA3 — recursos/moradia/justiça; getmodsapk — aeroportos/portos/constituição; Steam MA3 — base das Fases 134-140.
- 2026-09-08 (FASES 134-140 — LIVE dep-dagc0ap5efls73aakbug/e36c833, SERVER+CLIENTE): 134 🌉 Ponte+túnel | 135 ⛏️ Ferro+siderúrgica | 136 🛸 Drones+mísseis | 137 🎣 Pesca+porto | 138 ☕ Café+cacau | 139 💧 Barragem+saneamento | 140 ♻️ Reciclagem+coleta + 7 bots. Smoke lote7 7/7 + regressão verdes.
- 2026-09-08 (ESTUDO lote8: uptodown MA1 — departamentos/orçamento/alianças; oxiwyle MA1 oficial; MA1 soft112 — ministérios/meio-ambiente/ONU; liteapks MA2 — unidades militares, "famine, inflation, epidemic, protests"; modyolo MA3 — tech tree/impostos/preços — base das Fases 141-147.
- 2026-09-08 (FASES 141-147 — LIVE dep-dagc1o61egvs73f8eea0/498c28d, SERVER+CLIENTE): 141 ⚖️ Anistia+indulto | 142 🚒 Bombeiros+guarda | 143 💰 Salário+moeda | 144 🛢️ Plataforma+garimpo | 145 🛣️ Rodovia+pedágio | 146 🔭 Observatório+farol | 147 🏛️ UNESCO+patrimônio + 7 bots. Smoke lote8 7/7 + regressão verdes.
