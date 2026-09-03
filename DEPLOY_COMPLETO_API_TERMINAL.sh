#!/usr/bin/env bash
set -euo pipefail

# Arena das Sete Chamas Online
# Deploy completo por terminal usando GitHub API + Render API.
# Não precisa GitHub CLI nem Render CLI. Precisa só: git, curl, python3.
# Rode dentro da pasta rpg_online:
# bash DEPLOY_COMPLETO_API_TERMINAL.sh

cd "$(dirname "$0")"

APP_DEFAULT="arena-sete-chamas-online"
BRANCH="main"
API_RENDER="https://api.render.com/v1"
API_GITHUB="https://api.github.com"

print_title() {
  echo
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERRO: comando '$1' não encontrado."
    exit 1
  fi
}

json_get() {
  python3 -c "import json,sys; data=json.load(sys.stdin); print($1)"
}

print_title "1) Conferindo ferramentas"
need_cmd git
need_cmd curl
need_cmd python3

echo "OK: git, curl e python3 encontrados."

print_title "2) Conferindo arquivos do jogo"
if [ ! -f package.json ] || [ ! -f server.js ] || [ ! -d public ]; then
  echo "ERRO: rode este script dentro da pasta rpg_online."
  exit 1
fi
if [ ! -f public/assets/sprites/albert.png ] || [ ! -f public/assets/arena_brawl_fantasy.png ]; then
  echo "ERRO: imagens/sprites não encontrados em public/assets."
  exit 1
fi
echo "OK: arquivos do jogo encontrados."

print_title "3) Nome do projeto"
read -r -p "Nome do repositório/serviço [${APP_DEFAULT}]: " REPO_NAME
REPO_NAME="${REPO_NAME:-$APP_DEFAULT}"
read -r -p "Repositório privado? [s/N]: " PRIVATE_ANSWER
PRIVATE=false
if [[ "${PRIVATE_ANSWER,,}" == "s" || "${PRIVATE_ANSWER,,}" == "sim" || "${PRIVATE_ANSWER,,}" == "y" || "${PRIVATE_ANSWER,,}" == "yes" ]]; then
  PRIVATE=true
fi

print_title "4) Tokens de acesso"
echo "Você precisa de DOIS tokens/chaves:"
echo "1. GitHub token com permissão de criar repo e enviar código."
echo "   Crie em: https://github.com/settings/tokens"
echo "   Permissões recomendadas: repo."
echo "2. Render API key."
echo "   Crie em: https://dashboard.render.com/u/settings#api-keys"
echo
if [ -z "${GITHUB_TOKEN:-}" ]; then
  read -r -s -p "Cole seu GITHUB_TOKEN aqui (não aparece na tela): " GITHUB_TOKEN
  echo
fi
if [ -z "${RENDER_API_KEY:-}" ]; then
  read -r -s -p "Cole sua RENDER_API_KEY aqui (não aparece na tela): " RENDER_API_KEY
  echo
fi

if [ -z "$GITHUB_TOKEN" ] || [ -z "$RENDER_API_KEY" ]; then
  echo "ERRO: tokens vazios."
  exit 1
fi

print_title "5) Validando GitHub"
GH_USER_JSON="$(curl -fsS -H "Authorization: Bearer ${GITHUB_TOKEN}" -H "Accept: application/vnd.github+json" "${API_GITHUB}/user")"
GH_USER="$(printf '%s' "$GH_USER_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["login"])')"
REPO_FULL="${GH_USER}/${REPO_NAME}"
REPO_API="${API_GITHUB}/repos/${REPO_FULL}"
REPO_HTTPS="https://github.com/${REPO_FULL}.git"
REPO_PUBLIC_URL="https://github.com/${REPO_FULL}"
echo "GitHub OK: ${GH_USER}"
echo "Repositório alvo: ${REPO_FULL}"

print_title "6) Criando repositório no GitHub"
HTTP_CODE="$(curl -sS -o /tmp/github_repo_check.json -w "%{http_code}" -H "Authorization: Bearer ${GITHUB_TOKEN}" -H "Accept: application/vnd.github+json" "$REPO_API")"
if [ "$HTTP_CODE" = "200" ]; then
  echo "Repositório já existe. Vou usar ele."
elif [ "$HTTP_CODE" = "404" ]; then
  echo "Criando repositório..."
  CREATE_BODY="$(python3 - <<PY
import json
private = True if "$PRIVATE" == "true" else False
print(json.dumps({"name":"$REPO_NAME", "private": private, "auto_init": False}))
PY
)"
  curl -fsS -X POST \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    -d "$CREATE_BODY" \
    "${API_GITHUB}/user/repos" >/tmp/github_create_repo.json
  echo "Repositório criado."
else
  echo "ERRO ao verificar repositório no GitHub. HTTP ${HTTP_CODE}"
  cat /tmp/github_repo_check.json || true
  exit 1
fi

print_title "7) Commit e push para o GitHub"
if [ ! -d .git ]; then
  git init
fi

git branch -M "$BRANCH"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_HTTPS"
else
  git remote add origin "$REPO_HTTPS"
fi

if ! git config user.name >/dev/null 2>&1; then
  git config user.name "$GH_USER"
fi
if ! git config user.email >/dev/null 2>&1; then
  git config user.email "${GH_USER}@users.noreply.github.com"
fi

git add .
if git diff --cached --quiet; then
  echo "Sem alterações novas para commit."
else
  git commit -m "Primeira versão do jogo online"
fi

ASKPASS="/tmp/git-askpass-arena-$$.sh"
cat > "$ASKPASS" <<EOF2
#!/usr/bin/env bash
case "\$1" in
  *Username*) echo "${GH_USER}" ;;
  *Password*) echo "${GITHUB_TOKEN}" ;;
  *) echo "${GITHUB_TOKEN}" ;;
esac
EOF2
chmod 700 "$ASKPASS"
trap 'rm -f "$ASKPASS" /tmp/github_repo_check.json /tmp/github_create_repo.json /tmp/render_owners.json /tmp/render_service.json /tmp/render_service_body.json' EXIT

GIT_ASKPASS="$ASKPASS" GIT_TERMINAL_PROMPT=0 git push -u origin "$BRANCH"

echo "Código enviado para: ${REPO_PUBLIC_URL}"

print_title "8) Validando Render e escolhendo workspace"
curl -fsS -H "Authorization: Bearer ${RENDER_API_KEY}" -H "Accept: application/json" "${API_RENDER}/owners?limit=100" > /tmp/render_owners.json
python3 - <<'PY'
import json
owners=json.load(open('/tmp/render_owners.json'))
if not owners:
    raise SystemExit('Nenhum workspace encontrado para essa Render API key.')
print('Workspaces encontrados:')
for i,item in enumerate(owners,1):
    o=item.get('owner', item)
    print(f"{i}. {o.get('name')} | {o.get('email','')} | {o.get('type')} | {o.get('id')}")
PY
OWNER_COUNT="$(python3 - <<'PY'
import json
print(len(json.load(open('/tmp/render_owners.json'))))
PY
)"
if [ "$OWNER_COUNT" = "1" ]; then
  OWNER_INDEX=1
else
  read -r -p "Escolha o número do workspace Render [1]: " OWNER_INDEX
  OWNER_INDEX="${OWNER_INDEX:-1}"
fi
OWNER_ID="$(python3 - <<PY
import json
idx=int('$OWNER_INDEX')-1
owners=json.load(open('/tmp/render_owners.json'))
o=owners[idx].get('owner', owners[idx])
print(o['id'])
PY
)"
echo "Workspace escolhido: ${OWNER_ID}"

print_title "9) Criando Web Service no Render"
SERVICE_NAME="$REPO_NAME"

python3 - <<PY > /tmp/render_service_body.json
import json
body = {
  "type": "web_service",
  "name": "$SERVICE_NAME",
  "ownerId": "$OWNER_ID",
  "repo": "$REPO_PUBLIC_URL",
  "branch": "$BRANCH",
  "autoDeploy": "yes",
  "envVars": [
    {"key": "NODE_ENV", "value": "production"},
    {"key": "NODE_VERSION", "value": "20"}
  ],
  "serviceDetails": {
    "runtime": "node",
    "plan": "free",
    "region": "oregon",
    "healthCheckPath": "/health",
    "numInstances": 1,
    "envSpecificDetails": {
      "buildCommand": "npm install",
      "startCommand": "npm start"
    }
  }
}
print(json.dumps(body))
PY

HTTP_CODE="$(curl -sS -o /tmp/render_service.json -w "%{http_code}" -X POST \
  -H "Authorization: Bearer ${RENDER_API_KEY}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d @/tmp/render_service_body.json \
  "${API_RENDER}/services")"

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "202" ]; then
  python3 - <<'PY'
import json
res=json.load(open('/tmp/render_service.json'))
svc=res.get('service', res)
print('Serviço criado!')
print('ID:', svc.get('id'))
print('Dashboard:', svc.get('dashboardUrl'))
details=svc.get('serviceDetails') or {}
url=details.get('url') or f"https://{svc.get('slug')}.onrender.com"
print('URL provável do jogo:', url)
print('Deploy ID:', res.get('deployId'))
PY
else
  echo "ERRO ao criar serviço no Render. HTTP ${HTTP_CODE}"
  cat /tmp/render_service.json || true
  echo
  echo "Se o erro falar de repositório privado, conecte seu GitHub no Render ou use repositório público."
  echo "Se o erro falar de nome repetido, rode o script de novo com outro nome."
  exit 1
fi

print_title "10) Finalizado"
echo "Agora espere o deploy terminar no Render."
echo "Depois abra a URL do Render e teste o jogo."
echo
echo "Para atualizar depois:"
echo "git add ."
echo "git commit -m 'Atualização do jogo'"
echo "git push"
echo
echo "O Render vai atualizar automaticamente."
