#!/usr/bin/env bash
set -euo pipefail

# Arena das Sete Chamas Online
# Script para publicar no GitHub e criar o Web Service no Render pelo terminal.
# Rode este script DENTRO da pasta rpg_online:
# bash DEPLOY_TUDO_TERMINAL.sh

cd "$(dirname "$0")"

APP_DEFAULT="arena-sete-chamas-online"
BRANCH="main"

print_title() {
  echo
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERRO: comando '$1' não encontrado."
    return 1
  fi
}

print_title "1) Conferindo arquivos do jogo"

if [ ! -f package.json ] || [ ! -f server.js ] || [ ! -d public ]; then
  echo "ERRO: rode este script dentro da pasta rpg_online."
  echo "A pasta precisa ter package.json, server.js e public/."
  exit 1
fi

if [ ! -f public/assets/sprites/albert.png ] || [ ! -f public/assets/arena_brawl_fantasy.png ]; then
  echo "ERRO: as imagens/sprites não foram encontrados."
  echo "Confira se a pasta public/assets foi subida junto."
  exit 1
fi

echo "Arquivos encontrados."

print_title "2) Conferindo programas necessários"

need_cmd git || {
  echo "Instale o Git: https://git-scm.com/downloads"
  exit 1
}

need_cmd gh || {
  echo "Instale o GitHub CLI antes de continuar."
  echo "Windows: winget install --id GitHub.cli"
  echo "Mac: brew install gh"
  echo "Linux Ubuntu/Debian: veja https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
  exit 1
}

need_cmd render || {
  echo "Instale o Render CLI antes de continuar."
  echo "Mac: brew update && brew install render"
  echo "Linux: veja a página oficial do Render CLI."
  echo "Depois rode este script de novo."
  exit 1
}

echo "Git, GitHub CLI e Render CLI encontrados."

print_title "3) Login no GitHub"

if ! gh auth status >/dev/null 2>&1; then
  echo "Você ainda não está logado no GitHub CLI."
  echo "Vai abrir o login pelo navegador."
  gh auth login -w
fi

GITHUB_OWNER="$(gh api user --jq .login)"
echo "GitHub conectado como: $GITHUB_OWNER"

print_title "4) Dados do repositório"

read -r -p "Nome do repositório [${APP_DEFAULT}]: " REPO_NAME
REPO_NAME="${REPO_NAME:-$APP_DEFAULT}"

read -r -p "Repositório público ou privado? [public/private] (padrão public): " VISIBILITY
VISIBILITY="${VISIBILITY:-public}"
if [ "$VISIBILITY" != "public" ] && [ "$VISIBILITY" != "private" ]; then
  echo "Valor inválido. Use public ou private."
  exit 1
fi

REPO_FULL="$GITHUB_OWNER/$REPO_NAME"
REPO_URL="https://github.com/$REPO_FULL.git"

echo "Repositório: $REPO_FULL"
echo "URL: $REPO_URL"

print_title "5) Preparando Git local"

if [ ! -d .git ]; then
  git init
fi

git add .
if git diff --cached --quiet; then
  echo "Nenhuma alteração nova para commit."
else
  git commit -m "Primeira versão do jogo online"
fi

git branch -M "$BRANCH"

print_title "6) Criando/enviando para o GitHub"

if gh repo view "$REPO_FULL" >/dev/null 2>&1; then
  echo "Repositório já existe no GitHub. Vou usar ele."
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$REPO_URL"
  else
    git remote add origin "$REPO_URL"
  fi
  git push -u origin "$BRANCH"
else
  echo "Criando repositório no GitHub..."
  if [ "$VISIBILITY" = "private" ]; then
    gh repo create "$REPO_FULL" --private --source=. --remote=origin --push
  else
    gh repo create "$REPO_FULL" --public --source=. --remote=origin --push
  fi
fi

echo "GitHub pronto: https://github.com/$REPO_FULL"

print_title "7) Login no Render"

if ! render whoami --output json --confirm >/dev/null 2>&1; then
  echo "Você ainda não está logado no Render CLI."
  echo "Vai abrir o login pelo navegador."
  echo "Se preferir API key, cancele e rode antes: export RENDER_API_KEY='SUA_CHAVE'"
  render login
fi

echo "Render conectado."

print_title "8) Criando Web Service no Render"

echo "Se sua conta Render tiver mais de um workspace/time, talvez o Render peça para escolher."
echo "Criando serviço Node.js com npm install + npm start..."

set +e
render services create \
  --name "$REPO_NAME" \
  --type web_service \
  --repo "https://github.com/$REPO_FULL" \
  --runtime node \
  --branch "$BRANCH" \
  --build-command "npm install" \
  --start-command "npm start" \
  --plan free \
  --health-check-path "/health" \
  --env-var "NODE_ENV=production" \
  --auto-deploy \
  --output json \
  --confirm | tee render-service-output.json
RENDER_EXIT=${PIPESTATUS[0]}
set -e

if [ "$RENDER_EXIT" -ne 0 ]; then
  echo
  echo "O comando do Render falhou. Possíveis motivos:"
  echo "1. O Render ainda não está conectado ao seu GitHub."
  echo "2. O repositório privado não foi liberado para o Render."
  echo "3. Já existe um serviço com esse nome."
  echo
  echo "Solução rápida: entre no Render, conecte o GitHub e rode o script de novo."
  echo "Ou crie o Web Service pelo painel usando o repositório: https://github.com/$REPO_FULL"
  exit 1
fi

print_title "9) Pronto"

echo "Deploy enviado para o Render."
echo "Procure no final do output acima o dashboardUrl ou abra o painel do Render."
echo "O link deve ficar parecido com:"
echo "https://${REPO_NAME}.onrender.com"
echo
echo "Depois que o deploy terminar, mande esse link para seus amigos."
echo
echo "Para atualizar o jogo depois:"
echo "git add ."
echo "git commit -m 'Atualização do jogo'"
echo "git push"
echo
echo "O Render fará o deploy automático."
