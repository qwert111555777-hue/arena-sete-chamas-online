# Publicar o jogo no Render + GitHub

Este projeto já está pronto para publicar no Render.

## Estrutura importante

Arquivos principais:

- `server.js` — servidor Node.js + Socket.IO multiplayer.
- `public/` — jogo do navegador.
- `public/assets/` — imagens, sprites e arena.
- `package.json` — dependências e comando de start.
- `render.yaml` — configuração automática do Render.
- `.gitignore` — evita subir `node_modules` e arquivos desnecessários.

## 1. Criar repositório no GitHub

No GitHub:

1. Clique em **New repository**.
2. Nome sugerido: `arena-sete-chamas-online`.
3. Pode deixar como **Public** ou **Private**.
4. Não precisa criar README pelo GitHub, porque este projeto já tem arquivos.
5. Clique em **Create repository**.

## 2. Enviar o projeto para o GitHub

No terminal do seu computador, dentro da pasta do projeto, rode:

```bash
git init
git add .
git commit -m "Primeira versão do jogo online"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/arena-sete-chamas-online.git
git push -u origin main
```

Troque `SEU_USUARIO` pelo seu usuário do GitHub.

> Importante: suba o conteúdo da pasta `rpg_online` como raiz do repositório. O arquivo `package.json` deve ficar na primeira tela do repositório.

## 3. Publicar no Render

No Render:

1. Clique em **New +**.
2. Escolha **Web Service**.
3. Conecte sua conta do GitHub, se ainda não conectou.
4. Escolha o repositório `arena-sete-chamas-online`.
5. Configure assim:

| Campo | Valor |
|---|---|
| Name | `arena-sete-chamas-online` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plan | Free ou Starter |

6. Clique em **Create Web Service**.
7. Espere o deploy terminar.
8. O Render vai gerar um link parecido com:

```txt
https://arena-sete-chamas-online.onrender.com
```

Esse será o link para mandar para seus amigos.

## 4. Como jogar depois de publicado

1. Um jogador abre o link do Render.
2. Clica em **Criar sala**.
3. Os outros jogadores abrem o mesmo link.
4. A sala aparece em **Salas abertas** dentro do jogo.
5. Cada jogador escolhe um herói diferente.
6. Todos clicam em **Estou pronto**.
7. O host inicia a partida.

## 5. Como mudar o jogo depois

Sempre que quiser alterar personagens, dano, vida, imagens, fases ou visual:

1. Edite os arquivos.
2. Rode:

```bash
git add .
git commit -m "Atualização do jogo"
git push
```

3. O Render vai fazer deploy automaticamente.

## Observações importantes

- No plano grátis do Render, o servidor pode dormir após um tempo sem uso. Na primeira vez que abrir, pode demorar um pouco para acordar.
- As salas ficam na memória do servidor. Se o Render reiniciar ou fizer novo deploy, as salas abertas somem. Isso é normal para esta versão.
- Para diversão com 5 amigos, essa estrutura está boa. Para jogo grande com conta, ranking e progresso salvo, depois precisaríamos adicionar banco de dados.
