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
