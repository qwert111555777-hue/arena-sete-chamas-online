# Presidente Online — Contexto completo para continuar o trabalho

> Salvo no workspace em 2026-09-08 a pedido do usuário ("salve isso nos seus arquivos para não se perder").
> Fonte original: https://rentry.co/un3gqfyv (documento escrito em 2026-09-07).
> ⚠️ Chaves/PATs foram REDIGIDOS aqui de propósito (nunca gravar segredos em arquivo — ver §7).
> ⚠️ Em 2026-09-08 o workspace estava VAZIO (sem /presidente-online, sem /dev-tools). Ver §11.

---

## 0. ESTADO ATUAL — LEIA ISTO PRIMEIRO

### Branch / commits

```
56682b3 Bandeiras oficiais dos 195 paises   ← COMMITTED MAS COM BUG (ver §0 bug)
7b648b0 Sair salva automatico + velocidade 1x-5x   ← PRODUÇÃO ESTÁ AQUI
371566c HUD cinza-oliva #67655f
d47c0f7 125 tecnologias (5 arvores x 25)
e1cc9f1 47 construcoes / 6 abas / 5 niveis + borracha
```

- Repositório: `/home/user/presidente-online`, branch `main`
- Produção (Render) está em `7b648b0` e está FUNCIONANDO. O commit das bandeiras (`56682b3`) não foi deployado, então o bug não chegou no ar.
- git status (na sessão antiga): `public/index.html` modificado (não commitado) — continha as 140 construções.

### ⚠️ BUG CRÍTICO A CORRIGIR ANTES DE QUALQUER OUTRA COISA

O `patch_bandeiras.py` quebrou um if/else no cliente.

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

1. Corrigir o bug de sintaxe do np-flag e commitar as 140 construções ← PRÓXIMO PASSO
2. Dados oficiais reais dos 195 países — capital, população, área, PIB, forças armadas, recursos
3. Núcleo em tempo real — não por turno: cada segundo entra dinheiro da economia/capital e cada segundo se produzem minérios
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

---

## 6. FERRAMENTAS EM /home/user/dev-tools/ (PERDIDAS — workspace vazio em 2026-09-08, recriar se preciso)

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

Regressão verde: 160 verificações / 0 falhas. Esse é o baseline a proteger.

---

## 7. SEGURANÇA

- GitHub PAT e chave Render foram usadas só inline, nunca gravadas em arquivo do workspace. (Chaves redigidas neste arquivo.)
- Avisar o usuário para revogar os dois quando o trabalho terminar.
- Remotes do git não persistem — recuperar de .git/FETCH_HEAD; o PAT precisa ser colado de novo pelo usuário.

---

## 8. COMO COMMITAR

```bash
cd /home/user/presidente-online
git add -A
git -c user.name="Arena Agent" -c user.email="agent@arena.ai" commit -m "mensagem"
```

---

## 9. COMO DEPLOYAR (Render)

- Serviço: `srv-da95mkpf2nfc73eccqjg`
- Último deploy conhecido: `dep-dafje9ad0e5s73cln130` (commit 7b648b0, live)
- `POST /v1/services/srv-da95mkpf2nfc73eccqjg/deploys` body: `{"clearCache":"clear"}`
- Usar a chave Render inline (pedir ao usuário — nunca gravar em arquivo).
- Não deployar enquanto o bug de sintaxe existir.

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
